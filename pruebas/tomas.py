"""Busca fotos reales con licencia de uso comercial en Wikimedia Commons (sin clave) para el V8-01 y arma una hoja de contacto."""
import json, os, re, urllib.parse, urllib.request
from PIL import Image, ImageDraw, ImageOps

SAL = "salida/tomas"; os.makedirs(SAL, exist_ok=True)
UA = {"User-Agent": "EnClaroVideos/1.0 (https://enclaroar.netlify.app; videos de ejemplo)"}
BUSQUEDAS = {
    "1-kiosco": ["kiosco Buenos Aires", "kiosco golosinas", "kiosk Argentina", "kiosco Argentina"],
    "2-almacen": ["almacén de barrio", "almacén Argentina", "despensa Argentina", "grocery store shelves Argentina"],
    "3-persiana": ["persiana metálica", "cortina metálica local", "rolling shutter shop closed"],
    "4-cuaderno": ["cuaderno manuscrito", "handwritten notebook ledger", "libreta de fiado"],
    "5-plata": ["billetes pesos argentinos", "pesos argentinos", "cash register"],
    "6-qr": ["código QR pago", "QR code payment shop"],
}
OK_LIC = re.compile(r"^(cc0|public domain|pd|cc by(-sa)? ?[0-9.]*)", re.I)
creditos, elegidas = [], []

def api(params):
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({**params, "format": "json"})
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        return json.load(r)

for grupo, consultas in BUSQUEDAS.items():
    n = 0; vistos = set()
    for q in consultas:
        if n >= 4: break
        d = api({"action": "query", "generator": "search", "gsrsearch": f"{q} filetype:bitmap", "gsrnamespace": 6,
                 "gsrlimit": 15, "prop": "imageinfo", "iiprop": "url|extmetadata|size", "iiurlwidth": 1080})
        for p in sorted(d.get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 0)):
            if n >= 4: break
            ii = (p.get("imageinfo") or [{}])[0]; md = ii.get("extmetadata", {})
            lic = re.sub("<[^>]+>", "", md.get("LicenseShortName", {}).get("value", "")).strip()
            if p["title"] in vistos or not OK_LIC.match(lic) or "nc" in lic.lower() or "nd" in lic.lower(): continue
            if ii.get("width", 0) < 800: continue
            vistos.add(p["title"])
            autor = re.sub("<[^>]+>", "", md.get("Artist", {}).get("value", "")).strip()[:80]
            n += 1; nombre = f"{grupo}-{n}.jpg"
            try:
                req = urllib.request.Request(ii.get("thumburl") or ii["url"], headers=UA)
                open(f"{SAL}/{nombre}", "wb").write(urllib.request.urlopen(req, timeout=60).read())
                Image.open(f"{SAL}/{nombre}").convert("RGB").save(f"{SAL}/{nombre}", quality=90)
            except Exception as e:
                n -= 1; print("no bajó", p["title"], e); continue
            creditos.append(f"{nombre}: {p['title'][5:]} · {autor} · {lic} · {ii.get('descriptionurl','')}")
            elegidas.append((nombre, grupo))

open(f"{SAL}/creditos.txt", "w").write("\n".join(creditos) + "\n")
# Hoja de contacto: 4 columnas
W, H, C = 360, 270, 4
filas = (len(elegidas) + C - 1) // C or 1
hoja = Image.new("RGB", (W * C, (H + 24) * filas), "white"); dib = ImageDraw.Draw(hoja)
for i, (nombre, g) in enumerate(elegidas):
    im = ImageOps.fit(Image.open(f"{SAL}/{nombre}"), (W, H)); x, y = (i % C) * W, (i // C) * (H + 24)
    hoja.paste(im, (x, y)); dib.text((x + 6, y + H + 4), nombre, fill="black")
hoja.save(f"{SAL}/hoja-de-contacto.jpg", quality=85)
print(len(elegidas), "fotos")
