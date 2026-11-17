"""Pruebas de voz para el V8-01: varias voces de Gemini TTS (plan gratis) + Tomás de respaldo, sin acelerar."""
import base64, json, os, subprocess, sys, urllib.request, urllib.error, asyncio

SAL = "salida/voces"; os.makedirs(SAL, exist_ok=True)
TEXTO = ("Este kiosco vende ciento cincuenta mil por día. ¿Cuánto le queda? Decilo en los comentarios antes del final. "
         "... Le quedan veintitrés mil quinientos. Y él cree que gana cincuenta.")
ACTUACION = ("Hablá en español rioplatense de Argentina, con voseo y acento porteño bien marcado, como un kiosquero de cincuenta años "
             "charlando con otro colega: un poco indignado, cercano, ritmo natural, sin apurarte. Leé exactamente esto: ")
VOCES = ["Algenib", "Charon", "Fenrir", "Orus", "Iapetus"]
MODELOS = ["gemini-2.5-flash-preview-tts", "gemini-2.5-pro-preview-tts", "gemini-3.1-flash-tts-preview"]
KEY = os.environ.get("GEMINI_API_KEY", "")
log = []

def gemini(modelo, voz):
    cuerpo = {"contents": [{"parts": [{"text": ACTUACION + TEXTO}]}],
              "generationConfig": {"responseModalities": ["AUDIO"],
                                   "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voz}}}}}
    req = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent",
        data=json.dumps(cuerpo).encode(), headers={"Content-Type": "application/json", "x-goog-api-key": KEY})
    with urllib.request.urlopen(req, timeout=180) as r:
        d = json.load(r)
    return base64.b64decode(d["candidates"][0]["content"]["parts"][0]["inlineData"]["data"])

if not KEY:
    log.append("FALTA GEMINI_API_KEY en los secretos de GitHub.")
else:
    modelo_ok = None
    for i, voz in enumerate(VOCES, 1):
        for modelo in ([modelo_ok] if modelo_ok else MODELOS):
            try:
                pcm = gemini(modelo, voz)
                raw = f"/tmp/{voz}.pcm"; open(raw, "wb").write(pcm)
                subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", raw,
                                "-b:a", "128k", f"{SAL}/voz-{i}-gemini-{voz.lower()}.mp3"], check=True)
                modelo_ok = modelo; log.append(f"OK voz {i}: {voz} ({modelo})"); break
            except urllib.error.HTTPError as e:
                log.append(f"Error {voz} {modelo}: {e.code} {e.read()[:300]!r}")
            except Exception as e:
                log.append(f"Error {voz} {modelo}: {e}")

async def tomas():
    import edge_tts
    await edge_tts.Communicate(TEXTO.replace("... ", ""), "es-AR-TomasNeural").save(f"{SAL}/voz-0-tomas-respaldo.mp3")
try:
    asyncio.run(tomas()); log.append("OK Tomás (respaldo, sin acelerar)")
except Exception as e:
    log.append(f"Error Tomás: {e}")
open(f"{SAL}/registro.txt", "w").write("\n".join(log) + "\n"); print("\n".join(log))
