"""Baja de Poly Haven (CC0) los modelos, texturas y el fondo de luz (HDRI) de la prueba de Blender.

Elige cada asset por nombre con una lista de preferencias (si el primero no existe, prueba el siguiente),
guarda todo en <salida>/ y escribe <salida>/assets.json + <salida>/creditos.txt.
Uso: python bajar_assets.py <salida>
"""
import json
import os
import sys
import urllib.request

API = "https://api.polyhaven.com"
UA = {"User-Agent": "enclaro-render-prueba/1.0"}

# rol → (tipo, preferencias por nombre exacto, palabras para buscar si no está ninguno)
PEDIDO = {
    "caja": ("models", ["cardboard_box_01", "cardboard_box_02", "cardboard_box"], ["cardboard_box", "cardboard"]),
    "cajon": ("models", ["wooden_crate_01", "wooden_crate_02"], ["crate"]),
    "fondo": ("hdris", ["empty_warehouse_01", "warehouse"], ["warehouse", "industrial", "garage"]),
    "piso": ("textures", ["concrete_floor_worn_001", "concrete_floor_02", "concrete_floor_03"], ["concrete_floor", "concrete"]),
    "pared": ("textures", ["painted_concrete", "concrete_wall_003", "concrete_wall_004"], ["concrete_wall", "plaster", "painted_concrete"]),
    "metal": ("textures", ["rusty_metal_02", "rusty_metal_03", "metal_plate"], ["rusty_metal", "metal_plate", "painted_metal", "metal"]),
    "estante": ("textures", ["plywood", "wood_planks", "wood_table_001"], ["plywood", "wood_planks", "wood"]),
}


def traer(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
        return r.read()


def json_de(url):
    return json.loads(traer(url))


def guardar(url, ruta):
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    if not os.path.exists(ruta):
        with open(ruta, "wb") as f:
            f.write(traer(url))
    return ruta


def elegir(lista, pref, palabras):
    for p in pref:
        if p in lista:
            return p
    for w in palabras:
        hay = sorted(k for k in lista if w in k)
        if hay:
            return hay[0]
    return None


def main():
    sal = os.path.abspath(sys.argv[1])
    os.makedirs(sal, exist_ok=True)
    catalogo = {t: json_de(f"{API}/assets?t={t}") for t in ("models", "hdris", "textures")}
    for t, d in catalogo.items():
        print(f"Poly Haven: {len(d)} {t}")
    elegido, creditos = {}, []
    for rol, (tipo, pref, palabras) in PEDIDO.items():
        aid = elegir(catalogo[tipo], pref, palabras)
        if not aid:
            print(f"[{rol}] no encontré nada; se usa material propio")
            continue
        info = catalogo[tipo][aid]
        files = json_de(f"{API}/files/{aid}")
        base = os.path.join(sal, rol)
        dato = {"id": aid, "tipo": tipo}
        if tipo == "models":
            g = files["gltf"]["1k"]["gltf"]
            dato["gltf"] = guardar(g["url"], os.path.join(base, os.path.basename(g["url"])))
            for rel, inc in g.get("include", {}).items():
                guardar(inc["url"], os.path.join(base, rel))
        elif tipo == "hdris":
            h = files["hdri"]["2k"]["hdr"]
            dato["hdr"] = guardar(h["url"], os.path.join(base, os.path.basename(h["url"])))
        else:
            for clave, nombre in (("Diffuse", "color"), ("Rough", "rugosidad"), ("nor_gl", "normal"), ("Metal", "metal")):
                if clave in files and "1k" in files[clave]:
                    u = files[clave]["1k"]["jpg"]["url"] if "jpg" in files[clave]["1k"] else files[clave]["1k"]["png"]["url"]
                    dato[nombre] = guardar(u, os.path.join(base, os.path.basename(u)))
        elegido[rol] = dato
        autores = ", ".join(info.get("authors", {}).keys()) or "Poly Haven"
        creditos.append(f"- {rol}: «{info.get('name', aid)}» ({aid}) de {autores} · https://polyhaven.com/a/{aid} · CC0")
        print(f"[{rol}] {aid}")
    with open(os.path.join(sal, "assets.json"), "w") as f:
        json.dump(elegido, f, indent=1)
    with open(os.path.join(sal, "creditos.txt"), "w") as f:
        f.write("\n".join(creditos) + "\n")


if __name__ == "__main__":
    main()
