"""Voces de diálogo con Gemini TTS: varios personajes, frases cortas sueltas (formato POV).

Uso: python scripts/voces_dialogo.py guiones/dialogos/tt-03.json

- UNA sola toma por personaje (cuida la cuota gratis: ~10 voces por día): todas sus frases juntas, con silencios largos entre medio.
- La toma se corta en frases por los silencios del audio real. Si salen más pedazos que frases, se juntan los más cercanos;
  si salen menos, se pide cada frase por separado (gasta más cuota, solo como respaldo).
- Sale public/voces/<id>/<frase>.mp3 (con 40 ms de aire) y public/voces/<id>/dialogo.json con la duración de cada frase.
- Solo pide de nuevo lo que cambió (firma por personaje). Velocidad natural: prohibido acelerar.
"""
import hashlib
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from voz_gemini import SR, pedir_voz  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent


def firma(personaje, frases):
    datos = json.dumps([personaje, [f["texto"] for f in frases]], ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(datos.encode()).hexdigest()[:16]


def tramos_con_voz(pcm, min_sil=0.32, umbral_db=-38):
    """Tramos [inicio, fin] en segundos donde hay voz (ventanas de 20 ms)."""
    v = pcm.astype(np.float32) / 32768
    paso = int(SR * 0.02)
    n = len(v) // paso
    rms = np.sqrt(np.mean(v[: n * paso].reshape(n, paso) ** 2, axis=1) + 1e-12)
    voz = 20 * np.log10(rms) > umbral_db
    tramos, ini, sil = [], None, 0
    for i, x in enumerate(voz):
        if x:
            if ini is None:
                ini = i
            sil = 0
        elif ini is not None:
            sil += 1
            if sil * 0.02 >= min_sil:
                tramos.append([ini * 0.02, (i - sil + 1) * 0.02])
                ini, sil = None, 0
    if ini is not None:
        tramos.append([ini * 0.02, n * 0.02])
    return [t for t in tramos if t[1] - t[0] > 0.12]


def a_mp3(pcm, ruta):
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", "-b:a", "128k", str(ruta)],
                   input=np.clip(pcm, -32768, 32767).astype(np.int16).tobytes(), check=True)


def main():
    ruta = Path(sys.argv[1])
    d = json.loads(ruta.read_text())
    salida = RAIZ / "public" / "voces" / d["id"]
    salida.mkdir(parents=True, exist_ok=True)
    meta_ruta = salida / "dialogo.json"
    meta = json.loads(meta_ruta.read_text()) if meta_ruta.exists() else {"firmas": {}, "frases": {}}
    aire = int(SR * 0.04)
    for quien, voz in d["personajes"].items():
        frases = [f for f in d["frases"] if f["quien"] == quien]
        fi = firma(voz, frases)
        if meta["firmas"].get(quien) == fi and all((salida / f"{f['id']}.mp3").exists() for f in frases):
            print(f"{quien}: sin cambios")
            continue
        voz_g = {"modelo": d["modelo"], "nombre": voz["nombre"], "actuacion": voz["actuacion"]}
        texto = "\n\n…\n\n".join(f["texto"] for f in frases)
        print(f"Pidiendo a Gemini la toma de {quien} ({voz['nombre']}): {len(frases)} frases")
        pcm = np.frombuffer(pedir_voz(texto, voz_g), dtype=np.int16).astype(np.int32)
        tr = tramos_con_voz(pcm)
        while len(tr) > len(frases):  # sobran pedazos: juntar los dos más cercanos
            j = min(range(len(tr) - 1), key=lambda k: tr[k + 1][0] - tr[k][1])
            tr[j] = [tr[j][0], tr[j + 1][1]]
            del tr[j + 1]
        if len(tr) == len(frases):
            cortes = [pcm[max(0, int(a * SR) - aire): int(b * SR) + aire] for a, b in tr]
        else:
            print(f"{quien}: la toma salió con {len(tr)} pedazos para {len(frases)} frases; pido cada frase por separado")
            cortes = []
            for f in frases:
                p = np.frombuffer(pedir_voz(f["texto"], voz_g), dtype=np.int16).astype(np.int32)
                t = tramos_con_voz(p)
                cortes.append(p[max(0, int(t[0][0] * SR) - aire): int(t[-1][1] * SR) + aire] if t else p)
        for f, c in zip(frases, cortes):
            a_mp3(c, salida / f"{f['id']}.mp3")
            meta["frases"][f["id"]] = {"quien": quien, "texto": f["texto"], "dur": round(len(c) / SR, 3)}
            print(f"  {f['id']}: {len(c) / SR:.2f} s · {f['texto']}")
        meta["firmas"][quien] = fi
    meta_ruta.write_text(json.dumps(meta, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
