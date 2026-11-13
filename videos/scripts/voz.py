"""Genera la voz del aviso con la voz argentina es-AR-TomasNeural (edge-tts).

Uso:
    python scripts/voz.py guiones/01-la-persiana.json            # los 4 ganchos
    python scripts/voz.py guiones/01-la-persiana.json --gancho 0

Para cada gancho escribe en public/voces/:
    <id>.gancho-N.mp3   la voz completa, cada línea en su segundo exacto, normalizada a −14 LUFS
    <id>.gancho-N.json  el tiempo de cada palabra (para los subtítulos)

Reglas (sección 11 del brief):
- gancho y remates con más fuerza (rate/pitch/volume del JSON), el resto más rápido;
- si una línea dura más que su lugar, se acelera hasta 1,25×; si aun así no entra, falla y dice qué línea acortar.

edge-tts es un servicio no oficial: sirve para pruebas. Para publicar, usar Azure AI Speech con la misma voz.
"""
import argparse
import hashlib
import asyncio
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import edge_tts

RAIZ = Path(__file__).resolve().parent.parent
SR = 48000
MAX_TEMPO = 1.25
HOLGURA = 0.15  # segundos que una línea puede pisar a la siguiente pausa


def sh(*args):
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode:
        sys.exit(f"Falló: {' '.join(args)}\n{r.stderr[-2000:]}")
    return r.stdout


def a_video(guion, a):
    """Segundos del animatic → segundos del video (mismos tramos estirados que src/lib/guion.ts)."""
    v = a
    for d, h, f in guion.get("tramos", []):
        v += (min(max(a, d), h) - d) * (f - 1)
    return v


def duracion(path):
    return float(sh("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)).strip())


async def tts(texto, voz, estilo, destino):
    proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
    for intento in range(4):
        try:
            com = edge_tts.Communicate(
                texto, voz, rate=estilo.get("rate", "+0%"), pitch=estilo.get("pitch", "+0Hz"),
                volume=estilo.get("volume", "+0%"), boundary="WordBoundary", proxy=proxy,
            )
            palabras = []
            with open(destino, "wb") as f:
                async for c in com.stream():
                    if c["type"] == "audio":
                        f.write(c["data"])
                    elif c["type"] == "WordBoundary":
                        palabras.append({"texto": c["text"], "desde": c["offset"] / 1e7, "hasta": (c["offset"] + c["duration"]) / 1e7})
            if palabras:
                return palabras
        except Exception as e:  # red inestable: reintenta
            print(f"  reintento {intento + 1}: {e}")
            await asyncio.sleep(2 ** intento)
    sys.exit(f"No se pudo generar la voz para: {texto}")


def palabras_de_subtitulo(texto, habladas):
    """Reparte las palabras del subtítulo (con números: "70", "$350.000") en el tiempo que ocupa la voz."""
    ws = texto.split()
    a, b = habladas[0]["desde"], habladas[-1]["hasta"]
    pesos = [len(w) + 2 for w in ws]
    tot, acc, out = sum(pesos), 0, []
    for w, p in zip(ws, pesos):
        d0 = a + (b - a) * acc / tot
        acc += p
        out.append({"texto": w, "desde": d0, "hasta": a + (b - a) * acc / tot})
    return out


async def generar_encadenado(guion, n, tmp):
    """Modo para voces con ritmo propio (personajes): cada línea empieza cuando termina la anterior,
    más una pausa (`antes`, 0,35 s por defecto). La duración del video la da la voz, no el guion.
    Cada línea puede traer su propio `estilo` (rate/pitch/volume)."""
    voz = guion["voz"]
    pistas, palabras, tiempos_linea = [], [], []
    cursor = 0.0
    for i, l in enumerate(guion["lineas"]):
        texto = guion["ganchos"][n]["voz"] if l["texto"] == "GANCHO" else l["texto"]
        estilo = l.get("estilo") or (voz["gancho"] if l.get("gancho") else voz["resto"])
        crudo = tmp / f"l{i}.mp3"
        habladas = await tts(texto, voz["nombre"], estilo, crudo)
        if guion.get("encadenar") == "recortar":
            # saca el silencio del final de cada línea (la voz de Microsoft deja ~0,7 s) para que el ritmo sea más ágil
            rec = tmp / f"l{i}r.mp3"
            sh("ffmpeg", "-y", "-v", "error", "-i", str(crudo), "-af", "areverse,silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.12,areverse", str(rec))
            crudo = rec
        dur = duracion(crudo)
        inicio = cursor + (l.get("antes", 0.35) if i else 0.0)
        wav = tmp / f"l{i}.wav"
        sh("ffmpeg", "-y", "-v", "error", "-i", str(crudo), "-af", f"aresample={SR},adelay={int(inicio * 1000)}:all=1", "-ac", "2", str(wav))
        pistas.append(wav)
        cursor = inicio + dur
        habladas = [{"texto": p["texto"], "desde": inicio + p["desde"], "hasta": inicio + p["hasta"]} for p in habladas]
        visibles = l.get("subtitulo") or texto
        if l.get("subtitulo") or len(visibles.split()) != len(habladas):
            habladas = palabras_de_subtitulo(visibles, habladas)
        else:
            habladas = [dict(p, texto=w) for p, w in zip(habladas, visibles.split())]
        palabras += [dict(p, linea=i, desde=round(p["desde"], 3), hasta=round(p["hasta"], 3)) for p in habladas]
        tiempos_linea.append([round(inicio, 3), round(cursor, 3)])
        print(f"  línea {i + 1}: empieza {inicio:.2f} s, dura {dur:.2f} s ({estilo.get('rate')}, {estilo.get('pitch', '+0Hz')})")
    total = round(cursor + (1.7 if guion.get("encadenar") == "recortar" else 2.2), 3)
    destino = RAIZ / "public" / "voces"
    destino.mkdir(parents=True, exist_ok=True)
    base = destino / f"{guion['id']}.gancho-{n}"
    entradas = sum((["-i", str(p)] for p in pistas), [])
    mezcla = f"amix=inputs={len(pistas)}:normalize=0,apad=whole_dur={total},loudnorm=I=-14:TP=-1.5:LRA=11,aresample={SR}"
    sh("ffmpeg", "-y", "-v", "error", *entradas, "-filter_complex", mezcla, "-t", str(total), "-c:a", "libmp3lame", "-b:a", "192k", f"{base}.mp3")
    Path(f"{base}.json").write_text(json.dumps({"voz": voz["nombre"], "firma": firma(guion, n), "duracionSeg": total, "lineas": tiempos_linea, "palabras": palabras}, ensure_ascii=False, indent=1))
    print(f"  listo: {base}.mp3 ({total} s)")


async def generar(guion, n, tmp):
    if guion.get("encadenar"):
        return await generar_encadenado(guion, n, tmp)
    voz = guion["voz"]
    pistas, palabras, problemas = [], [], []
    total = a_video(guion, guion["duracionSeg"])
    lineas = [dict(l, desde=round(a_video(guion, l["desde"]), 3), hasta=round(a_video(guion, l["hasta"]), 3)) for l in guion["lineas"]]
    for i, l in enumerate(lineas):
        texto = guion["ganchos"][n]["voz"] if l["texto"] == "GANCHO" else l["texto"]
        estilo = voz["gancho"] if l.get("gancho") else voz["resto"]
        crudo = tmp / f"l{i}.mp3"
        # lugar disponible: hasta que empieza la línea siguiente (o el final del video)
        fin = lineas[i + 1]["desde"] - 0.05 if i + 1 < len(lineas) else total - 0.1
        lugar = max(l["hasta"] - l["desde"] + HOLGURA, fin - l["desde"])
        # si no entra, primero le pide a la voz que hable más rápido (suena más natural que acelerar el audio)
        base_rate = int(estilo.get("rate", "+0%").strip("%"))
        for extra in (0, 10, 20):
            est = dict(estilo, rate=f"{base_rate + extra:+d}%")
            habladas = await tts(texto, voz["nombre"], est, crudo)
            dur = duracion(crudo)
            tempo = max(1.0, dur / lugar)
            if tempo <= MAX_TEMPO:
                break
        if tempo > MAX_TEMPO:
            problemas.append(f'  línea {i + 1} ({l["desde"]}–{l["hasta"]} s) dura {dur:.2f} s y entran {lugar:.2f} s: acortá "{texto}"')
            continue
        wav = tmp / f"l{i}.wav"
        filtros = [f"aresample={SR}"]
        if tempo > 1.0:
            filtros.append(f"atempo={tempo:.4f}")
        filtros.append(f"adelay={int(l['desde'] * 1000)}:all=1")
        sh("ffmpeg", "-y", "-v", "error", "-i", str(crudo), "-af", ",".join(filtros), "-ac", "2", str(wav))
        pistas.append(wav)
        habladas = [{"texto": p["texto"], "desde": l["desde"] + p["desde"] / tempo, "hasta": l["desde"] + p["hasta"] / tempo} for p in habladas]
        visibles = l.get("subtitulo") or texto
        if l.get("subtitulo") or len(visibles.split()) != len(habladas):
            habladas = palabras_de_subtitulo(visibles, habladas)
        else:
            habladas = [dict(p, texto=w) for p, w in zip(habladas, visibles.split())]
        palabras += [dict(p, linea=i, desde=round(p["desde"], 3), hasta=round(p["hasta"], 3)) for p in habladas]
        print(f"  línea {i + 1}: {dur:.2f} s, velocidad {est['rate']}" + (f" → {tempo:.2f}×" if tempo > 1 else ""))
    if problemas:
        sys.exit("Estas líneas no entran en su escena ni acelerando 1,25×:\n" + "\n".join(problemas))

    destino = RAIZ / "public" / "voces"
    destino.mkdir(parents=True, exist_ok=True)
    base = destino / f"{guion['id']}.gancho-{n}"
    entradas = sum((["-i", str(p)] for p in pistas), [])
    mezcla = f"amix=inputs={len(pistas)}:normalize=0,apad=whole_dur={total},loudnorm=I=-14:TP=-1.5:LRA=11,aresample={SR}"
    sh("ffmpeg", "-y", "-v", "error", *entradas, "-filter_complex", mezcla, "-t", str(total), "-c:a", "libmp3lame", "-b:a", "192k", f"{base}.mp3")
    Path(f"{base}.json").write_text(json.dumps({"voz": voz["nombre"], "firma": firma(guion, n), "palabras": palabras}, ensure_ascii=False, indent=1))
    print(f"  listo: {base}.mp3")


def firma(guion, n):
    """Huella del texto y la configuración: si no cambió, no hace falta regenerar la voz."""
    datos = json.dumps([guion["voz"], guion["lineas"], guion["ganchos"][n], guion["duracionSeg"], guion.get("tramos"), guion.get("encadenar")], ensure_ascii=False, sort_keys=True)
    codigo = Path(__file__).read_bytes()
    return hashlib.sha256(datos.encode() + codigo).hexdigest()[:16]


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("guion")
    ap.add_argument("--gancho", type=int, default=None)
    ap.add_argument("--si-cambio", action="store_true", help="solo regenera los ganchos cuyo texto cambió")
    a = ap.parse_args()
    guion = json.loads((RAIZ / a.guion).read_text() if not Path(a.guion).is_absolute() else Path(a.guion).read_text())
    ganchos = [a.gancho] if a.gancho is not None else range(len(guion["ganchos"]))
    for n in ganchos:
        previo = RAIZ / "public" / "voces" / f"{guion['id']}.gancho-{n}.json"
        if a.si_cambio and previo.exists() and json.loads(previo.read_text()).get("firma") == firma(guion, n):
            print(f"Gancho {n}: sin cambios, se deja la voz que ya estaba")
            continue
        print(f"Gancho {n}: {guion['ganchos'][n]['voz']}")
        with tempfile.TemporaryDirectory() as d:
            await generar(guion, n, Path(d))


if __name__ == "__main__":
    asyncio.run(main())
