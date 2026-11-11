import { I, bounce, eIO, eOut, clamp } from "./anim";
import type { Guion } from "./guion";

export const SLAM = [0.05, 0.4, 0.75, 1.15];

/** Altura de la persiana del kiosco principal (0 a 1) en el segundo t. Arco de toda la serie. */
export function persAt(t: number, g: Guion) {
  let p = I(t, 1.6, 2.4, 0, 0.14, bounce);
  g.cuenta.gastos.forEach((h) => (p += I(t, h[0], h[0] + 0.45, 0, 0.17, bounce)));
  p += I(t, 9.6, 10, 0, 0.08, bounce);
  p -= I(t, 16, 28, 0, 0.38, eIO);
  p -= I(t, 29.6, 30.6, 0, p, eOut);
  return clamp(p, 0, 1);
}

/** Todo lo que comparten varias capas en un cuadro. */
export function estado(t: number, g: Guion) {
  const hits = g.cuenta.gastos;
  let red = 0;
  hits.forEach((h) => { if (t >= h[0]) red += Math.max(0, 1 - (t - h[0]) / 0.35); });
  if (t >= 9.6 && t < 10) red += 0.6;
  if (t >= 26.35) red += Math.max(0, 1 - (t - 26.35) / 0.35) * 0.8;

  let shake = 0;
  hits.forEach((h) => { const d = t - h[0]; if (d > 0) shake += 10 * Math.exp(-12 * d) * Math.sin(60 * d); });
  { const d = t - 9.6; if (d > 0) shake += 8 * Math.exp(-10 * d) * Math.sin(55 * d); }
  { const d = t - 13.2; if (d > 0) shake += 6 * Math.exp(-12 * d) * Math.sin(60 * d); }

  // golpes del gancho: temblor de 18 px y destello blanco
  let hs = 0, wf = 0;
  SLAM.forEach((a, i) => {
    const d = t - a;
    if (d > 0) { hs += (i === 3 ? 14 : 18) * Math.exp(-14 * d) * Math.sin(70 * d); wf += Math.max(0, 1 - d / 0.15) * (i === 3 ? 0.3 : 0.55); }
  });
  // cuadro 0: ya está entrando el primer golpe
  if (t < 0.05) wf += 0.35;

  const lights = 1 - 0.65 * I(t, 5, 10, 0, 1) + 0.65 * I(t, 29.7, 30.2, 0, 1);
  return { p: persAt(t, g), red, shake, hs, wf, lights };
}
