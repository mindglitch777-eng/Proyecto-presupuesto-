"""Voz con Gemini TTS (plan gratis de Google AI Studio, clave GEMINI_API_KEY) para los guiones con "motor": "gemini".

Uso: python scripts/voz_gemini.py guiones/v8-01-cuanto-le-queda.json [--si-cambio]

- Todo el guion se pide en UNA sola toma (actuación pareja y una sola consulta a la cuota gratis), a velocidad natural:
  prohibido acelerar (ESTANDAR-CALIDAD.md, sección 4).
- Gemini no devuelve tiempos por palabra: se sacan del audio real con faster-whisper (en la CPU de GitHub Actions) y se
  alinean con las palabras del guion (las del guion son las que se muestran en los subtítulos).
- `silencio` en una línea = silencio mínimo garantizado antes de esa línea (se agregan ceros si la voz no lo hizo).
- Sale igual que scripts/voz.py: public/voces/<id>.gancho-0.{mp3,json} con duracionSeg, lineas y palabras.
"""
import argparse
import base64
import difflib
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
SR = 24000  # Gemini devuelve PCM 16 bits mono a 24 kHz


def texto_linea(guion, l):
    return guion["ganchos"][0]["voz"] if l["texto"] == "GANCHO" else l["texto"]


def firma(guion):
    datos = json.dumps([guion["voz"], [texto_linea(guion, l) for l in guion["lineas"]], [l.get("silencio") for l in guion["lineas"]]], ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(datos.encode()).hexdigest()[:16]


def pedir_voz(texto, voz):
    key = os.environ.get("GEMINI_API_KEY", "")
    if not key:
        sys.exit("FALTA GEMINI_API_KEY: cargala en GitHub → Settings → Secrets and variables → Actions.")
    cuerpo = {
        "contents": [{"parts": [{"text": voz["actuacion"] + "\n\n" + texto}]}],
        "generationConfig": {"responseModalities": ["AUDIO"], "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voz["nombre"]}}}},
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{voz['modelo']}:generateContent"
    ultimo = None
    for intento in range(5):
        req = urllib.request.Request(url, data=json.dumps(cuerpo).encode(), headers={"Content-Type": "application/json", "x-goog-api-key": key})
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                d = json.load(r)
            return base64.b64decode(d["candidates"][0]["content"]["parts"][0]["inlineData"]["data"])
        except urllib.error.HTTPError as e:
            ultimo = f"{e.code} {e.read()[:400]!r}"
        except Exception as e:  # corte de red, respuesta sin audio
            ultimo = repr(e)
        espera = 20 * (intento + 1)
        print(f"Gemini falló ({ultimo}); reintento en {espera} s")
        time.sleep(espera)
    sys.exit(f"Gemini no devolvió la voz: {ultimo}")


def norm(w):
    w = unicodedata.normalize("NFD", w.lower())
    w = "".join(c for c in w if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", w)


def palabras_whisper(pcm):
    """Recibe el audio ya decodificado (24 kHz) y lo pasa a 16 kHz en memoria: así whisper no depende de PyAV para leer archivos."""
    from faster_whisper import WhisperModel

    crudo = subprocess.run(["ffmpeg", "-loglevel", "error", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", "-f", "f32le", "-ar", "16000", "-ac", "1", "-"],
                           input=np.clip(pcm, -32768, 32767).astype(np.int16).tobytes(), capture_output=True, check=True).stdout
    audio = np.frombuffer(crudo, dtype=np.float32)
    modelo = WhisperModel("small", device="cpu", compute_type="int8")
    segs, _ = modelo.transcribe(audio, language="es", word_timestamps=True, vad_filter=False, beam_size=5)
    out = []
    for s in segs:
        for w in s.words or []:
            out.append((w.word.strip(), float(w.start), float(w.end)))
    return out


def alinear(guion_pal, oidas, total):
    """A cada palabra del guion le pone el tiempo de la palabra oída que coincide; las que no coinciden se reparten entre vecinas."""
    a = [norm(p["texto"]) for p in guion_pal]
    b = [norm(w[0]) for w in oidas]
    t = [None] * len(a)
    for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(blk.size):
            t[blk.a + k] = (oidas[blk.b + k][1], oidas[blk.b + k][2])
    # huecos (números dichos que whisper escribe en cifras, etc.): interpolar por largo de texto entre anclas
    i = 0
    while i < len(a):
        if t[i] is not None:
            i += 1
            continue
        j = i
        while j < len(a) and t[j] is None:
            j += 1
        ini = t[i - 1][1] if i > 0 else 0.0
        fin = t[j][0] if j < len(a) else total
        pesos = [max(1, len(a[k])) for k in range(i, j)]
        tot = sum(pesos)
        acc = ini
        for k, p in zip(range(i, j), pesos):
            d = (fin - ini) * p / tot
            t[k] = (acc, acc + d)
            acc += d
        i = j
    for p, (d, h) in zip(guion_pal, t):
        p["desde"], p["hasta"] = round(d, 3), round(max(h, d + 0.05), 3)
    return guion_pal


def ajustar_pausas(pcm, guion_pal, guion):
    marco = int(0.01 * SR)
    energia = np.sqrt(np.convolve(pcm.astype(np.float64) ** 2, np.ones(marco) / marco, mode="same"))
    umbral = energia.max() * 10 ** (-38 / 20)
    pausa_max = guion.get("pausa_max", 0.6)
    for n, l in enumerate(guion["lineas"]):
        if n == 0:
            continue
        prev = [p for p in guion_pal if p["linea"] == n - 1]
        este = [p for p in guion_pal if p["linea"] == n]
        if not prev or not este:
            continue
        a, b = int(prev[-1]["desde"] * SR), int(este[0]["hasta"] * SR)
        callado = energia[a:b] < umbral
        # el tramo callado más largo entre la última palabra de una línea y la primera de la siguiente
        mejor, ini, k = (0, 0, 0), None, 0
        for k, c in enumerate(callado):
            if c and ini is None:
                ini = k
            if (not c or k == len(callado) - 1) and ini is not None:
                fin = k if not c else k + 1
                if fin - ini > mejor[0]:
                    mejor = (fin - ini, ini, fin)
                ini = None
        if mejor[0] == 0:
            continue
        s0, s1 = (a + mejor[1]) / SR, (a + mejor[2]) / SR
        real = s1 - s0
        objetivo = l["silencio"] if l.get("silencio") else min(real, pausa_max)
        delta = objetivo - real
        if abs(delta) < 0.03:
            continue
        medio = int((s0 + real / 2) * SR)
        if delta > 0:
            pcm = np.concatenate([pcm[:medio], np.zeros(int(delta * SR), dtype=np.float32), pcm[medio:]])
        else:
            quitar = int(-delta * SR)
            pcm = np.concatenate([pcm[: medio - quitar // 2], pcm[medio - quitar // 2 + quitar :]])
            energia = np.concatenate([energia[: medio - quitar // 2], energia[medio - quitar // 2 + quitar :]])
        if delta > 0:
            energia = np.concatenate([energia[:medio], np.zeros(int(delta * SR)), energia[medio:]])
        prev[-1]["hasta"] = round(min(prev[-1]["hasta"], s0 + 0.02), 3)
        for p in guion_pal:
            if p["desde"] >= s0 + real / 2:
                p["desde"] = round(p["desde"] + delta, 3)
                p["hasta"] = round(p["hasta"] + delta, 3)
        print(f"Línea {n}: pausa de {real:.2f} s → {objetivo:.2f} s")
    return pcm


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("guion")
    ap.add_argument("--si-cambio", action="store_true")
    a = ap.parse_args()
    ruta = Path(a.guion) if Path(a.guion).is_absolute() else RAIZ / a.guion
    guion = json.loads(ruta.read_text())
    if guion["voz"].get("motor") != "gemini":
        return
    destino = RAIZ / "public" / "voces" / f"{guion['id']}.gancho-0"
    previo = json.loads(Path(f"{destino}.json").read_text()) if Path(f"{destino}.json").exists() else {}
    misma_toma = previo.get("firma") == firma(guion) and Path(f"{destino}.mp3").exists()
    if a.si_cambio and misma_toma and previo.get("alineado"):
        print(f"{guion['id']}: sin cambios, se deja la voz que ya estaba")
        return
    lineas = [texto_linea(guion, l) for l in guion["lineas"]]
    if misma_toma:
        # misma toma de Gemini: solo se vuelven a sacar los tiempos (no se gasta otra consulta)
        print("Misma toma: se recalculan los tiempos sobre la voz que ya estaba")
        crudo = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", f"{destino}.mp3", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-"], capture_output=True, check=True).stdout
        pcm = np.frombuffer(crudo, dtype=np.int16).astype(np.float32)
    else:
        # los silencios pedidos se marcan con "…" para que la actuación también pause
        texto = " ".join(("… " if l.get("silencio") else "") + t for l, t in zip(guion["lineas"], lineas))
        print("Pidiendo la voz a Gemini:", guion["voz"]["nombre"], guion["voz"]["modelo"])
        pcm = np.frombuffer(pedir_voz(texto, guion["voz"]), dtype=np.int16).astype(np.float32)
        # recortar el silencio del principio (el cuadro 0 arranca con la voz) y dejar el del final en 0,3 s
        nivel = np.abs(pcm) > 600
        if nivel.any():
            ini = max(0, int(np.argmax(nivel)) - int(0.04 * SR))
            fin = min(len(pcm), len(pcm) - int(np.argmax(nivel[::-1])) + int(0.3 * SR))
            pcm = pcm[ini:fin]

    with tempfile.TemporaryDirectory() as d:
        wav = Path(d) / "voz.wav"
        def guardar_wav(x, p):
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", str(p)], input=np.clip(x, -32768, 32767).astype(np.int16).tobytes(), check=True)
        guardar_wav(pcm, wav)
        guion_pal = [{"texto": w, "linea": n} for n, t in enumerate(lineas) for w in t.split()]
        try:
            oidas = palabras_whisper(pcm)
            alineado = len(oidas) > 0
            print(f"whisper oyó {len(oidas)} palabras (el guion tiene {len(guion_pal)}): " + " ".join(w[0] for w in oidas))
        except Exception as e:
            print("No se pudo usar whisper, se reparten los tiempos por largo de texto:", e)
            oidas, alineado = [], False
        alinear(guion_pal, oidas, len(pcm) / SR)

        # pausas entre líneas medidas en el audio real (no en los tiempos de whisper, que estiran el final de las palabras):
        # antes de una línea con `silencio` queda exactamente ese silencio; las demás, como mucho `pausa_max` (ritmo sin baches)
        if alineado:
            pcm = ajustar_pausas(pcm, guion_pal, guion)

        guardar_wav(pcm, wav)
        destino.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-ar", "48000", "-ac", "2", "-b:a", "192k", f"{destino}.mp3"], check=True)

    habla = len(pcm) / SR
    tiempos_linea = []
    for n in range(len(lineas)):
        ps = [p for p in guion_pal if p["linea"] == n]
        tiempos_linea.append([ps[0]["desde"], ps[-1]["hasta"]] if ps else [0, 0])
    total = round(habla + guion.get("cola", 1.2), 3)
    Path(f"{destino}.json").write_text(json.dumps({"voz": f"gemini {guion['voz']['nombre']}", "firma": firma(guion), "duracionSeg": total, "alineado": alineado, "lineas": tiempos_linea, "palabras": guion_pal}, ensure_ascii=False, indent=1))
    print(f"Listo: {destino}.mp3 · voz {habla:.1f} s · video {total:.1f} s")
    for n, (d, h) in enumerate(tiempos_linea):
        print(f"  línea {n}: {d:6.2f} → {h:6.2f}  {lineas[n]}")


if __name__ == "__main__":
    main()
