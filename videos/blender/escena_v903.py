"""Prueba de Blender (Cycles): 6 s del V9-03 "Plata encerrada" — el depósito-cárcel.

Mismo tramo que el video en three.js (segundos 2,58 a 8,58): la cámara sube del pasillo a la estantería principal,
el contador "$360.000" queda arriba de la columna presa y la reja cae con rebote (y una luz fría encierra la columna).
Todo sale de la cuenta de cada cuadro (determinista), así cada máquina renderiza su parte sin depender de las otras.

Coordenadas: las mismas del video en three.js (x, y arriba, z hacia la cámara) pasadas a Blender: (x, -z, y).
Uso: blender -b -P escena_v903.py -- <assets_dir> <salida_dir> <cuadro_desde> <cuadro_hasta> [--rapido]
"""
import json
import math
import os
import random
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
ASSETS, SALIDA, DESDE, HASTA = argv[0], argv[1], int(argv[2]), int(argv[3])
RAPIDO = "--rapido" in argv
FUENTE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "fuentes", "SpaceGrotesk-Bold.ttf")
A = json.load(open(os.path.join(ASSETS, "assets.json")))
FPS, CUADROS = 30, 180
T0 = 2.58  # segundo del video en three.js donde empieza este tramo

FONDO_Y = 8.0          # estantería principal (three z = -8)
CELDA_X = 0.8          # columna presa
REJA_Y = FONDO_Y - 0.33
T_MOVERSE = 4.9 - T0   # la reja cae en "moverse"


def entra(p):
    return 1.0 if p >= 1 else 1 - 2 ** (-10 * max(0.0, min(1.0, p)))


def tres(x, y, z):
    """three.js → Blender."""
    return Vector((x, -z, y))


# ---------- escena limpia ----------
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "CYCLES"
sc.cycles.device = "CPU"
sc.cycles.samples = 16 if RAPIDO else 64
sc.cycles.use_adaptive_sampling = True
sc.cycles.adaptive_threshold = 0.03
sc.cycles.use_denoising = True
sc.cycles.denoiser = "OPENIMAGEDENOISE"
sc.cycles.max_bounces = 6
sc.cycles.diffuse_bounces = 3
sc.cycles.glossy_bounces = 3
sc.cycles.transmission_bounces = 2
sc.cycles.caustics_reflective = False
sc.cycles.caustics_refractive = False
sc.cycles.blur_glossy = 1.0
sc.render.use_motion_blur = True
sc.render.motion_blur_shutter = 0.5
sc.render.use_persistent_data = True
sc.render.resolution_x, sc.render.resolution_y = 1080, 1920
sc.render.resolution_percentage = 50 if RAPIDO else 100
sc.render.fps = FPS
sc.render.image_settings.file_format = "PNG"
sc.render.image_settings.color_mode = "RGB"
sc.frame_start, sc.frame_end = 1, CUADROS
try:
    sc.view_settings.view_transform = "AgX"
    sc.view_settings.look = "AgX - Medium High Contrast"
except Exception:
    try:
        sc.view_settings.look = "Medium High Contrast"
    except Exception:
        pass
sc.view_settings.exposure = 0.2

rnd = random.Random(903)


# ---------- materiales ----------
def img(nodos, ruta, color=True):
    n = nodos.new("ShaderNodeTexImage")
    n.image = bpy.data.images.load(ruta)
    if not color:
        n.image.colorspace_settings.name = "Non-Color"
    n.projection = "BOX"
    n.projection_blend = 0.25
    return n


def mat_textura(nombre, rol, escala=1.0, tinte=None, rug=0.8, metal=0.0):
    m = bpy.data.materials.new(nombre)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = rug
    bsdf.inputs["Metallic"].default_value = metal
    d = A.get(rol)
    if tinte:
        bsdf.inputs["Base Color"].default_value = (*tinte, 1)
    if not d:
        return m
    coord = nt.nodes.new("ShaderNodeTexCoord")
    mapa = nt.nodes.new("ShaderNodeMapping")
    mapa.inputs["Scale"].default_value = (escala, escala, escala)
    nt.links.new(coord.outputs["Object"], mapa.inputs["Vector"])
    if "color" in d:
        c = img(nt.nodes, d["color"])
        nt.links.new(mapa.outputs["Vector"], c.inputs["Vector"])
        if tinte:
            mx = nt.nodes.new("ShaderNodeMix")
            mx.data_type = "RGBA"
            mx.blend_type = "MULTIPLY"
            mx.inputs[0].default_value = 0.6
            nt.links.new(c.outputs["Color"], mx.inputs[6])
            mx.inputs[7].default_value = (*tinte, 1)
            nt.links.new(mx.outputs[2], bsdf.inputs["Base Color"])
        else:
            nt.links.new(c.outputs["Color"], bsdf.inputs["Base Color"])
    if "rugosidad" in d:
        r = img(nt.nodes, d["rugosidad"], False)
        nt.links.new(mapa.outputs["Vector"], r.inputs["Vector"])
        nt.links.new(r.outputs["Color"], bsdf.inputs["Roughness"])
    if "metal" in d:
        mm = img(nt.nodes, d["metal"], False)
        nt.links.new(mapa.outputs["Vector"], mm.inputs["Vector"])
        nt.links.new(mm.outputs["Color"], bsdf.inputs["Metallic"])
    if "normal" in d:
        nn = img(nt.nodes, d["normal"], False)
        nm = nt.nodes.new("ShaderNodeNormalMap")
        nt.links.new(mapa.outputs["Vector"], nn.inputs["Vector"])
        nt.links.new(nn.outputs["Color"], nm.inputs["Color"])
        nt.links.new(nm.outputs["Normal"], bsdf.inputs["Normal"])
    return m


def mat_simple(nombre, color, rug=0.6, metal=0.0, emision=0.0):
    m = bpy.data.materials.new(nombre)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rug
    b.inputs["Metallic"].default_value = metal
    if emision:
        b.inputs["Emission Color"].default_value = (*color, 1)
        b.inputs["Emission Strength"].default_value = emision
    return m


def mat_billete():
    """Billete genérico (sin diseño de ninguna moneda real): papel verde con bandas y un borde claro."""
    m = bpy.data.materials.new("billete")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Roughness"].default_value = 0.65
    coord = nt.nodes.new("ShaderNodeTexCoord")
    ola = nt.nodes.new("ShaderNodeTexWave")
    ola.inputs["Scale"].default_value = 6
    ola.inputs["Distortion"].default_value = 3
    nt.links.new(coord.outputs["UV"], ola.inputs["Vector"])
    rampa = nt.nodes.new("ShaderNodeValToRGB")
    rampa.color_ramp.elements[0].color = (0.12, 0.33, 0.2, 1)
    rampa.color_ramp.elements[1].color = (0.45, 0.68, 0.48, 1)
    nt.links.new(ola.outputs["Fac"], rampa.inputs["Fac"])
    # borde claro: distancia al centro de la UV
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(coord.outputs["UV"], sep.inputs["Vector"])
    bx = nt.nodes.new("ShaderNodeMath"); bx.operation = "PINGPONG"; bx.inputs[1].default_value = 0.5
    by = nt.nodes.new("ShaderNodeMath"); by.operation = "PINGPONG"; by.inputs[1].default_value = 0.5
    nt.links.new(sep.outputs["X"], bx.inputs[0]); nt.links.new(sep.outputs["Y"], by.inputs[0])
    mn = nt.nodes.new("ShaderNodeMath"); mn.operation = "MINIMUM"
    nt.links.new(bx.outputs[0], mn.inputs[0]); nt.links.new(by.outputs[0], mn.inputs[1])
    lt = nt.nodes.new("ShaderNodeMath"); lt.operation = "LESS_THAN"; lt.inputs[1].default_value = 0.06
    nt.links.new(mn.outputs[0], lt.inputs[0])
    mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"
    nt.links.new(lt.outputs[0], mx.inputs[0])
    nt.links.new(rampa.outputs["Color"], mx.inputs[6])
    mx.inputs[7].default_value = (0.85, 0.9, 0.8, 1)
    nt.links.new(mx.outputs[2], b.inputs["Base Color"])
    return m


M_PISO = mat_textura("piso", "piso", 0.5, rug=0.85)
M_PARED = mat_textura("pared", "pared", 0.4, tinte=(0.75, 0.7, 0.62), rug=0.95)
M_METAL = mat_textura("metal", "metal", 2.0, tinte=(0.35, 0.36, 0.38), rug=0.55, metal=0.8)
M_REJA = mat_textura("reja", "metal", 3.0, tinte=(0.22, 0.22, 0.24), rug=0.45, metal=0.9)
M_ESTANTE = mat_textura("estante", "estante", 1.5, rug=0.8)
M_CARTON = mat_simple("carton", (0.5, 0.33, 0.18), 0.85)
M_BILLETE = mat_billete()
M_FAJA = mat_simple("faja", (0.9, 0.85, 0.7), 0.6)
M_ROJO = mat_simple("contador", (1.0, 0.13, 0.09), 0.3, emision=6.0)
M_TUBO = mat_simple("tubo", (1.0, 0.85, 0.65), 0.3, emision=12.0)


# ---------- ayudas de geometría ----------
def cubo(nombre, tam, pos, mat, padre=None, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos, rotation=rot)
    o = bpy.context.object
    o.name = nombre
    o.scale = tam
    o.data.materials.append(mat)
    if padre:
        o.parent = padre
    return o


def vacio(nombre, pos=(0, 0, 0), rot=(0, 0, 0)):
    o = bpy.data.objects.new(nombre, None)
    o.location, o.rotation_euler = pos, rot
    bpy.context.collection.objects.link(o)
    return o


def importar_modelo(rol, alto_max):
    """Importa el glTF de Poly Haven, lo une en un objeto con el origen abajo al centro y lo escala a `alto_max` (lado mayor)."""
    d = A.get(rol)
    if not d:
        return None
    antes = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=d["gltf"])
    nuevos = [o for o in bpy.data.objects if o not in antes]
    mallas = [o for o in nuevos if o.type == "MESH"]
    if not mallas:
        return None
    nombres = [x.name for x in nuevos]
    bpy.ops.object.select_all(action="DESELECT")
    for o in mallas:
        o.select_set(True)
    bpy.context.view_layer.objects.active = mallas[0]
    bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
    if len(mallas) > 1:
        bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for n in nombres:
        x = bpy.data.objects.get(n)
        if x is not None and x != o:
            bpy.data.objects.remove(x, do_unlink=True)
    vs = [v.co for v in o.data.vertices]
    mn = Vector((min(v.x for v in vs), min(v.y for v in vs), min(v.z for v in vs)))
    mx = Vector((max(v.x for v in vs), max(v.y for v in vs), max(v.z for v in vs)))
    centro = Vector(((mn.x + mx.x) / 2, (mn.y + mx.y) / 2, mn.z))
    k = alto_max / max(mx - mn)
    for v in o.data.vertices:
        v.co = (v.co - centro) * k
    o.name = f"modelo_{rol}"
    o.hide_render = True
    o.hide_viewport = True
    return o


CAJA = importar_modelo("caja", 0.42)
CAJON = importar_modelo("cajon", 0.45)


def poner(modelo, pos, escala, rot_z, padre):
    if modelo is None:
        lado = 0.4 * escala
        return cubo("caja", (lado, lado * 0.9, lado * 0.8), (pos[0], pos[1], pos[2] + lado * 0.4), M_CARTON, padre, (0, 0, rot_z))
    o = modelo.copy()  # comparte la malla (instancia liviana)
    o.hide_render = o.hide_viewport = False
    bpy.context.collection.objects.link(o)
    o.location, o.rotation_euler, o.scale = pos, (0, 0, rot_z), (escala, escala, escala)
    o.parent = padre
    return o


def billete(pos, rot, padre=None):
    bpy.ops.mesh.primitive_plane_add(size=1, location=pos, rotation=rot)
    o = bpy.context.object
    o.scale = (0.16, 0.075, 1)
    o.data.materials.append(M_BILLETE)
    if padre:
        o.parent = padre
    return o


def fajo(pos, rot_z, padre, n=24):
    g = vacio("fajo", pos, (0, 0, rot_z))
    g.parent = padre
    for i in range(n):
        b = cubo("b", (0.16, 0.075, 0.0012), (rnd.uniform(-0.004, 0.004), rnd.uniform(-0.003, 0.003), 0.0008 + i * 0.0014), M_BILLETE, g, (0, 0, rnd.uniform(-0.03, 0.03)))
    cubo("faja", (0.03, 0.078, n * 0.0014 + 0.002), (0, 0, n * 0.0007), M_FAJA, g)
    return g


def estanteria(nombre, pos, rot_z, ancho, alto, fondo, cols, pisos, semilla, presa=False):
    r = random.Random(semilla)
    raiz = vacio(nombre, pos, (0, 0, rot_z))
    # parantes (perfil metálico) y travesaños
    for x in (-ancho / 2, -ancho / 6, ancho / 6, ancho / 2) if cols == 3 else (-ancho / 2, ancho / 2):
        for y in (-fondo / 2, fondo / 2):
            cubo("parante", (0.04, 0.04, alto), (x, y, alto / 2), M_METAL, raiz)
    paso = (alto - 0.1) / pisos
    for p in range(pisos + 1):
        z = 0.08 + p * paso
        cubo("tabla", (ancho + 0.04, fondo, 0.025), (0, 0, z), M_ESTANTE, raiz)
        cubo("viga", (ancho + 0.04, 0.03, 0.06), (0, -fondo / 2, z - 0.03), M_METAL, raiz)
    # cajas en cada hueco
    w = ancho / cols
    for p in range(pisos):
        z = 0.08 + p * paso + 0.013
        for c in range(cols):
            x0 = -ancho / 2 + w * (c + 0.5)
            n = 2 if r.random() < 0.6 else 1
            for i in range(n):
                dx = (i - (n - 1) / 2) * w * 0.48
                modelo = CAJON if r.random() < 0.18 else CAJA
                esc = r.uniform(0.75, 1.0) if n == 2 else r.uniform(0.95, 1.2)
                poner(modelo, (x0 + dx, r.uniform(-0.04, 0.04), z), esc * min(1.0, (paso - 0.06) / 0.42), r.uniform(-0.25, 0.25), raiz)
            if presa and c == cols - 1:
                # la plata encerrada: fajos arriba de las cajas y billetes que asoman
                fajo((x0 - 0.12, -fondo / 2 + 0.12, z), r.uniform(-0.3, 0.3), raiz)
                fajo((x0 + 0.14, -fondo / 2 + 0.1, z), r.uniform(-0.3, 0.3), raiz, 16)
                for k in range(3):
                    billete((x0 - 0.18 + k * 0.17, -fondo / 2 - 0.02, z + 0.25 + (k % 2) * 0.05), (1.2 + k * 0.1, 0.2 * k, 0.3 - k * 0.2), raiz)
    return raiz


# ---------- el depósito ----------
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 4, 0))
piso = bpy.context.object
piso.scale = (12, 24, 1)
piso.data.materials.append(M_PISO)
cubo("pared", (8, 0.1, 3.6), (0, FONDO_Y + 0.5, 1.8), M_PARED)
cubo("pared_izq", (0.1, 12, 3.6), (-2.6, 4, 1.8), M_PARED)
cubo("pared_der", (0.1, 12, 3.6), (2.6, 4, 1.8), M_PARED)

for i, zt in enumerate((-1.0, -3.4, -5.8)):
    y = -zt
    estanteria(f"izq{i}", (-1.45, y, 0), math.pi / 2, 2.3, 2.5, 0.5, 3, 4, i * 13)
    estanteria(f"der{i}", (1.45, y, 0), -math.pi / 2, 2.3, 2.5, 0.5, 3, 4, i * 13 + 6)
principal = estanteria("principal", (0, FONDO_Y, 0), 0, 2.4, 2.4, 0.55, 3, 4, 41, presa=True)

# billetes tirados en el piso de la celda
for k in range(7):
    billete((CELDA_X + rnd.uniform(-0.3, 0.3), REJA_Y + rnd.uniform(0.02, 0.25), 0.003 + k * 0.0004), (0, 0, rnd.uniform(0, 3.1)))

# tubos fluorescentes (con su luz de área)
for y in (2.5, 6.6):
    cubo("tubo", (0.05, 1.2, 0.05), (0, y, 2.95), M_TUBO)
    l = bpy.data.lights.new(f"tubo{y}", "AREA")
    l.shape, l.size, l.size_y = "RECTANGLE", 0.15, 1.3
    l.energy, l.color = 260, (1.0, 0.86, 0.68)
    o = bpy.data.objects.new(f"tubo{y}", l)
    o.location = (0, y, 2.9)
    bpy.context.collection.objects.link(o)

# luz de relleno cálida sobre la estantería principal
l = bpy.data.lights.new("frente", "AREA")
l.shape, l.size, l.size_y, l.energy, l.color = "RECTANGLE", 2.0, 0.6, 120, (1.0, 0.82, 0.6)
o = bpy.data.objects.new("frente", l)
o.location, o.rotation_euler = (0, FONDO_Y - 2.0, 2.8), (math.radians(-40), 0, 0)
bpy.context.collection.objects.link(o)

# luz fría que encierra la columna presa (se prende cuando cae la reja)
lf = bpy.data.lights.new("frio", "AREA")
lf.shape, lf.size, lf.size_y, lf.color = "RECTANGLE", 0.6, 2.4, (0.55, 0.78, 1.0)
fr = bpy.data.objects.new("frio", lf)
fr.location, fr.rotation_euler = (CELDA_X, REJA_Y - 0.6, 1.3), (math.radians(-90), 0, 0)
bpy.context.collection.objects.link(fr)

# fondo de luz (HDRI)
w = bpy.data.worlds.new("mundo")
sc.world = w
w.use_nodes = True
nt = w.node_tree
bg = nt.nodes["Background"]
if "fondo" in A:
    env = nt.nodes.new("ShaderNodeTexEnvironment")
    env.image = bpy.data.images.load(A["fondo"]["hdr"])
    nt.links.new(env.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = 0.35
else:
    bg.inputs["Color"].default_value = (0.05, 0.045, 0.04, 1)

# la reja
reja = vacio("reja", (CELDA_X, REJA_Y, 0))
for i in range(7):
    x = -0.42 + i * 0.14
    bpy.ops.mesh.primitive_cylinder_add(radius=0.018, depth=3.0, location=(x, 0, 1.5), vertices=20)
    b = bpy.context.object
    b.data.materials.append(M_REJA)
    b.parent = reja
    bpy.ops.object.shade_smooth()
for z in (0.06, 1.0, 2.0, 2.94):
    cubo("travesano", (0.9, 0.025, 0.05), (0, 0, z), M_REJA, reja)

# el contador "$360.000" arriba de la columna presa
def texto(body, tam, pos, mat, extr=0.03):
    cu = bpy.data.curves.new("t", "FONT")
    cu.body = body
    if os.path.exists(FUENTE):
        cu.font = bpy.data.fonts.load(FUENTE)
    cu.size, cu.extrude, cu.align_x, cu.align_y = tam, extr, "CENTER", "CENTER"
    cu.bevel_depth = extr * 0.15
    o = bpy.data.objects.new("t", cu)
    o.location, o.rotation_euler = pos, (math.radians(90), 0, 0)
    o.data.materials.append(mat)
    bpy.context.collection.objects.link(o)
    return o

contador = vacio("contador", (CELDA_X, REJA_Y - 0.08, 2.78))
cartel = cubo("cartel", (0.88, 0.04, 0.36), (0, 0.04, 0.0), mat_simple("cartel", (0.03, 0.03, 0.035), 0.4), contador)
n1 = texto("$360.000", 0.17, (0, -0.01, 0.04), M_ROJO); n1.parent = contador
n2 = texto("SIN MOVERSE · EJEMPLO", 0.05, (0, -0.01, -0.11), mat_simple("sub", (1, 0.85, 0.8), 0.4, emision=2.0), 0.005); n2.parent = contador

# ---------- cámara ----------
cam_d = bpy.data.cameras.new("cam")
cam_d.sensor_fit, cam_d.sensor_height = "VERTICAL", 24
cam_d.dof.use_dof, cam_d.dof.aperture_fstop = True, 2.4
cam = bpy.data.objects.new("cam", cam_d)
bpy.context.collection.objects.link(cam)
sc.camera = cam
mira = vacio("mira")
tr = cam.constraints.new("TRACK_TO")
tr.target, tr.track_axis, tr.up_axis = mira, "TRACK_NEGATIVE_Z", "UP_Y"
cam_d.dof.focus_object = mira


def mezcla(a, b, k):
    return [a[i] + (b[i] - a[i]) * k for i in range(len(a))]


def camara(tg):
    """Misma cuenta que camara() del video en three.js, con el tiempo del video (tg)."""
    l1, l2 = 2.58, 5.96
    A_ = ([0.3, 0.75, -1.8], [0, 0.6, -5.4], 46)
    B = ([0.5 + math.sin(tg * 0.7) * 0.15, 1.7, -3.7], [0.45, 1.6, -8.0], 44)
    C = ([CELDA_X + math.sin(tg * 0.8) * 0.1, 1.8, -5.2], [CELDA_X, 1.75, -8.0], 42)
    if tg < l2 - 0.05:
        k = entra((tg - l1) / 0.8)
        a, b = A_, B
    else:
        k = entra((tg - l2) / 0.6)
        a, b = ([0.5, 1.7, -3.7], [0.45, 1.6, -8.0], 44), C
    return mezcla(a[0], b[0], k), mezcla(a[1], b[1], k), a[2] + (b[2] - a[2]) * k


for f in range(1, CUADROS + 1):
    t = (f - 1) / FPS
    tg = T0 + t
    pos, obj, fov = camara(tg)
    # aire de cámara en mano + golpe cuando cae la reja
    golpe = math.exp(-(t - T_MOVERSE) * 7) * 0.025 if t > T_MOVERSE else 0
    pos = [pos[0] + math.sin(t * 1.7) * 0.01 + math.sin(t * 40) * golpe, pos[1] + math.sin(t * 1.3) * 0.008 + math.cos(t * 37) * golpe, pos[2]]
    cam.location = tres(*pos)
    mira.location = tres(*obj)
    cam_d.angle = math.radians(fov)
    cam.keyframe_insert("location", frame=f)
    mira.keyframe_insert("location", frame=f)
    cam_d.keyframe_insert("lens", frame=f)
    # la reja: arriba amenazando, cae en "moverse" y rebota
    if t < T_MOVERSE:
        zr = 3.2 * (1 - entra((t - (T_MOVERSE - 0.25)) / 0.25))
    else:
        zr = abs(math.sin((t - T_MOVERSE) * 24)) * math.exp(-(t - T_MOVERSE) * 9) * 0.05
    reja.location = (CELDA_X, REJA_Y, zr)
    reja.keyframe_insert("location", frame=f)
    # luz fría y contador
    lf.energy = 0 if t < T_MOVERSE else 90 * entra((t - T_MOVERSE) / 0.8)
    lf.keyframe_insert("energy", frame=f)
    s = entra((t - 0.15) / 0.5)
    contador.scale = (max(0.001, s),) * 3
    contador.keyframe_insert("scale", frame=f)

for o in list(bpy.data.objects) + list(bpy.data.cameras) + list(bpy.data.lights):
    if o.animation_data and o.animation_data.action:
        for fc in o.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"

# ---------- render de esta parte ----------
os.makedirs(SALIDA, exist_ok=True)
sc.frame_start, sc.frame_end = DESDE, HASTA
sc.render.filepath = os.path.join(SALIDA, "c")
print(f"Render cuadros {DESDE}-{HASTA} ({'rápido' if RAPIDO else 'final'})", flush=True)
bpy.ops.render.render(animation=True)
