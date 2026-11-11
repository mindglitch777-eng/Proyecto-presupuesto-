// Funciones de tiempo portadas 1:1 de videos/referencia/animatic.html.
// Todo se calcula desde t (segundos) = frame / fps, igual que render(t) del animatic.

export const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
export type Ease = (p: number) => number;
export const lin: Ease = (p) => p;
export const eOut: Ease = (p) => 1 - Math.pow(1 - p, 3);
export const eIn: Ease = (p) => p * p * p;
export const eIO: Ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
export const bounce: Ease = (p) => {
  const n = 7.5625, d = 2.75;
  if (p < 1 / d) return n * p * p;
  if (p < 2 / d) return n * (p -= 1.5 / d) * p + 0.75;
  if (p < 2.5 / d) return n * (p -= 2.25 / d) * p + 0.9375;
  return n * (p -= 2.625 / d) * p + 0.984375;
};

/** Interpola de c a d entre los segundos a y b. */
export function I(t: number, a: number, b: number, c: number, d: number, e: Ease = eOut) {
  const p = clamp((t - a) / (b - a), 0, 1);
  return c + (d - c) * e(p);
}

/** Resorte amortiguado con leve pasado (mismo que el animatic). */
export function spring(dt: number, w = 14, z = 0.45) {
  if (dt <= 0) return 0;
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + ((z * w) / wd) * Math.sin(wd * dt));
}

/** Ventana de visibilidad: sube en fi segundos desde a, baja en fo segundos hasta b. */
export function win(t: number, a: number, b: number, fi = 0.2, fo = 0.2) {
  return Math.min(I(t, a, a + fi, 0, 1, lin), I(t, b - fo, b, 1, 0, lin));
}

/** Pseudoaleatorio determinista (nada de Math.random en el render). */
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
