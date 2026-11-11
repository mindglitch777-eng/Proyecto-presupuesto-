"""Fabrica los efectos de sonido de En Claro (sin licencias de terceros).

Uso: python scripts/sfx.py   → escribe public/sfx/*.wav

Son versiones mejoradas de los sonidos que el animatic sintetiza con WebAudio:
capas, cola de reverb corta y estéreo leve. Todo determinista (semilla fija).
"""
import wave
from pathlib import Path

import numpy as np

SR = 48000
OUT = Path(__file__).resolve().parent.parent / "public" / "sfx"
rng = np.random.default_rng(7)


def t(d):
    return np.arange(int(SR * d)) / SR


def env(d, a=0.003, decay=8.0):
    x = t(d)
    e = np.exp(-decay * x)
    att = np.clip(x / a, 0, 1)
    return e * att


def noise(d):
    return rng.uniform(-1, 1, int(SR * d))


def lp(x, cut):
    # pasa bajos de un polo
    a = np.exp(-2 * np.pi * cut / SR)
    y = np.zeros_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def bp(x, f, q=4.0):
    # biquad pasa banda (RBJ)
    w = 2 * np.pi * f / SR
    al = np.sin(w) / (2 * q)
    b0, b1, b2 = al, 0, -al
    a0, a1, a2 = 1 + al, -2 * np.cos(w), 1 - al
    y = np.zeros_like(x)
    x1 = x2 = y1 = y2 = 0.0
    for i, v in enumerate(x):
        o = (b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0
        x2, x1, y2, y1 = x1, v, y1, o
        y[i] = o
    return y


def hp(x, cut):
    return x - lp(x, cut)


def sweep(f0, f1, d, kind="sin"):
    x = t(d)
    f = f0 * (f1 / f0) ** (x / d)
    ph = 2 * np.pi * np.cumsum(f) / SR
    if kind == "sq":
        return np.sign(np.sin(ph))
    if kind == "tri":
        return 2 / np.pi * np.arcsin(np.sin(ph))
    return np.sin(ph)


def tone(f, d, kind="sin"):
    return sweep(f, f * 1.0001, d, kind)


def mix(*parts):
    n = max(len(p[1]) + int(p[0] * SR) for p in parts)
    y = np.zeros(n)
    for off, s in parts:
        i = int(off * SR)
        y[i:i + len(s)] += s
    return y


def reverb(x, amt=0.25, d=0.35):
    ir = noise(d) * np.exp(-t(d) * 12)
    ir = lp(ir, 5000)
    wet = np.convolve(x, ir)[: len(x) + len(ir) - 1]
    dry = np.concatenate([x, np.zeros(len(ir) - 1)])
    return dry + amt * wet / (np.max(np.abs(wet)) + 1e-9) * np.max(np.abs(x))


def kick(d=0.4, f0=150, f1=40, g=1.0):
    return g * sweep(f0, f1, d) * env(d, 0.002, 9)


def metal_hit(d=0.6, g=1.0):
    # chapa de persiana: varios modos inarmónicos + ruido filtrado
    x = t(d)
    modes = [(420, 1.0, 7), (713, 0.7, 9), (1187, 0.5, 11), (1730, 0.35, 14), (2610, 0.25, 18)]
    s = sum(a * np.sin(2 * np.pi * f * x + i) * np.exp(-k * x) for i, (f, a, k) in enumerate(modes))
    n = bp(noise(d), 900, 3) * env(d, 0.001, 10) * 1.6
    return g * (0.5 * s + n)


def save(name, y, gain_db=-1.0, stereo=0.0):
    y = np.asarray(y, dtype=np.float64)
    fade = min(len(y), int(0.01 * SR))
    y[-fade:] *= np.linspace(1, 0, fade)
    peak = np.max(np.abs(y)) + 1e-9
    y = y / peak * (10 ** (gain_db / 20))
    left = y
    right = np.concatenate([np.zeros(int(stereo * SR)), y])[: len(y)] if stereo else y
    st = np.stack([left, right], axis=1)
    pcm = (np.clip(st, -1, 1) * 32767).astype(np.int16)
    OUT.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUT / f"{name}.wav"), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def main():
    # persiana que cae de golpe: chapa + kick + ruido grave + rebote
    slam = mix(
        (0, metal_hit(0.7)),
        (0, kick(0.45, 160, 38, 1.2)),
        (0, lp(noise(0.3), 500) * env(0.3, 0.001, 12) * 2.5),
        (0.09, metal_hit(0.4, 0.35)),
        (0.16, metal_hit(0.3, 0.15)),
    )
    save("slam", reverb(slam, 0.3), -0.5, 0.004)

    metal = mix((0, metal_hit(0.55, 0.9)), (0, kick(0.35, 140, 45, 0.7)), (0.1, metal_hit(0.3, 0.3)))
    save("metal", reverb(metal, 0.25), -2, 0.003)

    save("thump", kick(0.45, 150, 40) + 0.15 * lp(noise(0.45), 300) * env(0.45, 0.001, 14), -1)

    wh = bp(noise(0.4), 1200, 0.8)
    wh = wh * np.sin(np.pi * t(0.4) / 0.4) ** 2
    hiss = hp(noise(0.4), 3000) * np.sin(np.pi * t(0.4) / 0.4) ** 3 * 0.3
    save("whoosh", wh + hiss, -4, 0.006)

    save("tic", tone(2400, 0.03) * env(0.03, 0.0005, 120) + 0.4 * hp(noise(0.03), 4000) * env(0.03, 0.0005, 200), -10)

    save("click", hp(noise(0.05), 1500) * env(0.05, 0.0005, 90) + 0.6 * tone(90, 0.05, "sq") * env(0.05, 0.0005, 60), -9)

    gl = noise(0.3)
    gate = (np.floor(t(0.3) * 40) % 3 != 0).astype(float)
    gl = hp(gl, 1800) * gate + 0.4 * tone(60, 0.3, "sq") * gate
    save("glitch", gl * env(0.3, 0.001, 4), -7)

    r = bp(noise(0.7), 600, 3) * (t(0.7) / 0.7) ** 2
    r = r + 0.4 * sweep(200, 1800, 0.7, "tri") * (t(0.7) / 0.7) ** 3
    save("riser", r, -5)

    beep = lambda: tone(1500, 0.07, "sq") * env(0.07, 0.001, 30) * 0.5 + tone(3000, 0.07) * env(0.07, 0.001, 40) * 0.3
    save("lock", mix((0, beep()), (0.09, beep())), -8)

    hb = lambda g: g * (sweep(75, 35, 0.22) * env(0.22, 0.004, 14))
    save("heart", mix((0, hb(1.0)), (0.18, hb(0.65))), -1.5)

    bz = tone(100, 0.32, "sq") * 0.5 + tone(200, 0.32, "sq") * 0.25
    gate = ((t(0.32) < 0.05) | (t(0.32) > 0.1)).astype(float)
    save("buzz", lp(bz, 2500) * gate * env(0.32, 0.002, 6), -14)

    coins = mix(*[(i * 0.045 + 0.01 * (i % 2), tone(2300 + (i * 397) % 1300, 0.18, "tri") * env(0.18, 0.001, 22)) for i in range(7)])
    save("coins", reverb(coins, 0.3), -8, 0.008)

    bell = sum(tone(f, 0.9) * env(0.9, 0.002, 4 + i) * a for i, (f, a) in enumerate([(1318, 1), (2637, 0.5), (3951, 0.25)]))
    drawer = mix((0, metal_hit(0.25, 0.4)), (0.05, kick(0.2, 120, 60, 0.4)))
    caja = mix((0, drawer), (0.08, bell), (0.14, 0.6 * tone(1760, 0.6) * env(0.6, 0.002, 5)))
    save("caja", reverb(caja, 0.2), -4, 0.005)

    rat = mix(*[(i * 0.055, bp(noise(0.05), 1100 + (i % 3) * 300, 5) * env(0.05, 0.001, 50)) for i in range(16)])
    save("rattle", reverb(rat, 0.2), -4, 0.004)

    sp = bp(noise(0.5), 5000, 1.2) * np.clip(t(0.5) / 0.03, 0, 1) * np.exp(-t(0.5) * 3)
    save("spray", sp, -8, 0.002)

    print("sonidos listos en", OUT)


if __name__ == "__main__":
    main()
