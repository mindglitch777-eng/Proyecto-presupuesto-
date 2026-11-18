"""Prueba si la clave gratis de Google genera imágenes realistas para los videos (kiosco argentino a pedido)."""
import base64, json, os, urllib.request, urllib.error
SAL = "salida/imagenes"; os.makedirs(SAL, exist_ok=True)
KEY = os.environ.get("GEMINI_API_KEY", ""); log = []
PROMPTS = {
  "kiosco": "Foto vertical realista, tomada con celular, de la fachada de un kiosco de barrio en Argentina al atardecer: vidriera llena de golosinas y alfajores, reja, heladera de bebidas, cartel pintado a mano que dice KIOSCO, vereda de baldosas. Sin marcas legibles, sin personas.",
  "manos": "Foto vertical realista de primer plano: manos de un kiosquero argentino de 55 años contando billetes de pesos argentinos sobre un mostrador de madera gastado, luz cálida de tubo fluorescente, góndola de golosinas desenfocada atrás. Sin caras.",
  "cuaderno": "Foto vertical realista de un cuaderno Rivadavia abierto sobre el mostrador de un almacén argentino, con anotaciones de fiado escritas a mano en birome azul (nombres de pila y montos en pesos), una birome encima. Luz natural.",
}
def gen(modelo, prompt):
    if modelo.startswith("imagen"):
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{modelo}:predict"
        cuerpo = {"instances": [{"prompt": prompt}], "parameters": {"sampleCount": 1, "aspectRatio": "9:16"}}
    else:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent"
        cuerpo = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "9:16"}}}
    req = urllib.request.Request(url, data=json.dumps(cuerpo).encode(), headers={"Content-Type": "application/json", "x-goog-api-key": KEY})
    d = json.load(urllib.request.urlopen(req, timeout=180))
    if modelo.startswith("imagen"):
        return base64.b64decode(d["predictions"][0]["bytesBase64Encoded"])
    for p in d["candidates"][0]["content"]["parts"]:
        if "inlineData" in p: return base64.b64decode(p["inlineData"]["data"])
    raise RuntimeError("sin imagen: " + json.dumps(d)[:300])
for modelo in ["gemini-2.5-flash-image", "gemini-3.1-flash-image-preview", "gemini-2.5-flash-image-preview", "imagen-4.0-generate-001"]:
    ok = 0
    for nombre, prompt in PROMPTS.items():
        try:
            open(f"{SAL}/{modelo}-{nombre}.png", "wb").write(gen(modelo, prompt)); ok += 1; log.append(f"OK {modelo} {nombre}")
        except urllib.error.HTTPError as e:
            log.append(f"Error {modelo} {nombre}: {e.code} {e.read()[:250]!r}"); break
        except Exception as e:
            log.append(f"Error {modelo} {nombre}: {e}"); break
    if ok == len(PROMPTS): break
open(f"{SAL}/registro.txt", "w").write("\n".join(log) + "\n"); print("\n".join(log))
