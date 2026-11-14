// Lee el texto de una factura de proveedor (sacado de la foto en el celular) y lo cruza con la lista de productos.
// Sin servicios externos: todo con reglas y comparación de nombres.

export type LineaFactura = { descripcion: string; cantidad: number | null; costo: number };
export type Cruce = LineaFactura & { productoId: string | null; parecido: number };

const sinTildes = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const NO_ES_PRODUCTO = /\b(total|subtotal|iva|cuit|factura|fecha|remito|condicion|domicilio|telefono|ingresos brutos|percepcion|descuento|bonificacion|cliente|vendedor|hoja|pagina|cae|vto|importe|precio|cantidad|descripcion|codigo)\b/;

/** "1.890,00" → 1890 · "820,5" → 820.5 · "31500" → 31500 */
export function numeroAr(t: string): number | null {
  const s = t.replace(/[^\d.,]/g, "");
  if (!s || !/\d/.test(s)) return null;
  if (/,\d{1,2}$/.test(s)) return Number(s.replace(/\./g, "").replace(",", "."));
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) return Number(s.replace(/\./g, ""));
  if (/^\d+\.\d{1,2}$/.test(s)) return Number(s);
  return Number(s.replace(/[.,]/g, ""));
}

const TOKEN_NUM = /\$?\s?\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\$?\s?\d+(?:[.,]\d{1,2})?/g;
const parecido = (a: number, b: number) => Math.abs(a - b) <= Math.max(2, Math.abs(b) * 0.02);

/** Saca de cada renglón: descripción, cantidad (si está) y costo por unidad. */
export function leerLineas(texto: string): LineaFactura[] {
  const out: LineaFactura[] = [];
  for (const crudo of texto.split(/\r?\n/)) {
    const linea = crudo.replace(/[|_]/g, " ").replace(/\s+/g, " ").trim();
    if (linea.length < 6 || NO_ES_PRODUCTO.test(sinTildes(linea))) continue;
    const pegadoALetra = (i: number, largo: number) => /[a-zñ]/i.test(linea[i + largo] ?? "") || /[a-zñ]/i.test(linea[i - 1] ?? "");
    // "1KG", "500ML" o "X6" son parte del nombre, no montos
    const toks = [...linea.matchAll(TOKEN_NUM)]
      .map((m) => { const d = m[0].search(/\d/); return { txt: m[0].slice(d), i: (m.index ?? 0) + d, v: numeroAr(m[0]) }; })
      .filter((t) => !pegadoALetra(t.i, t.txt.length));
    if (toks.length < 1) continue;
    const n = toks.length;
    const v = (k: number) => toks[n - k]?.v ?? null;
    let cantidad: number | null = null, costo: number | null = null, corte = toks[n - 1].i;
    const q3 = v(3), u3 = v(2), t3 = v(1);
    if (n >= 3 && q3 !== null && u3 !== null && t3 !== null && Number.isInteger(q3) && q3 > 0 && q3 < 1000 && parecido(q3 * u3, t3)) {
      cantidad = q3; costo = u3; corte = toks[n - 3].i;
    } else if (n >= 2 && v(2) !== null && v(1) !== null && Number.isInteger(v(2)!) && v(2)! > 0 && v(2)! < 1000 && v(1)! / v(2)! >= 10 && !/,\d{1,2}$/.test(toks[n - 2].txt)) {
      cantidad = v(2); costo = v(1)! / v(2)!; corte = toks[n - 2].i;
    } else if (n >= 2 && v(2) !== null && v(1) !== null && v(1)! >= v(2)!) {
      costo = v(2); corte = toks[n - 2].i;
    } else {
      costo = v(1);
    }
    const descripcion = linea.slice(0, corte).replace(/^\s*\d{3,}\s+/, "").replace(/[\s$:.-]+$/, "").trim();
    if (!costo || costo < 1 || descripcion.replace(/[^a-záéíóúñ]/gi, "").length < 3) continue;
    out.push({ descripcion, cantidad, costo: Math.round(costo) });
  }
  return out;
}

const COMUNES = new Set(["x", "de", "la", "el", "con", "sin", "un", "u", "unidad", "unidades", "uni", "un.", "pack", "caja", "bulto", "por"]);
function normalizar(s: string) {
  return sinTildes(s)
    .replace(/(\d)\s*(lts?|litros?|l)\b/g, "$1l")
    .replace(/(\d)\s*(kgs?|kilos?|k)\b/g, "$1kg")
    .replace(/(\d)\s*(grs?|gramos?|g)\b/g, "$1g")
    .replace(/(\d)[.,](\d)/g, "$1$2")
    .replace(/[^a-z0-9ñ ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w && !COMUNES.has(w));
}
function bigramas(s: string) {
  const t = ` ${s} `;
  const m = new Map<string, number>();
  for (let i = 0; i < t.length - 1; i++) m.set(t.slice(i, i + 2), (m.get(t.slice(i, i + 2)) ?? 0) + 1);
  return m;
}
/** Qué tan parecidos son dos nombres de producto (0 a 1). */
export function parecidoNombres(a: string, b: string) {
  const ta = normalizar(a), tb = normalizar(b);
  if (!ta.length || !tb.length) return 0;
  const ba = bigramas(ta.join(" ")), bb = bigramas(tb.join(" "));
  let comun = 0, totA = 0, totB = 0;
  for (const [k, n] of ba) { totA += n; comun += Math.min(n, bb.get(k) ?? 0); }
  for (const n of bb.values()) totB += n;
  const dice = (2 * comun) / (totA + totB);
  const sa = new Set(ta), sb = new Set(tb);
  const palabras = [...sa].filter((w) => sb.has(w)).length / Math.min(sa.size, sb.size);
  return Math.min(1, 0.6 * dice + 0.4 * palabras);
}

/** Cruza cada renglón con el producto más parecido (cada producto se usa una sola vez). */
export function cruzar(lineas: LineaFactura[], productos: { id: string; nombre: string }[], minimo = 0.42): Cruce[] {
  const pares: { li: number; pid: string; s: number }[] = [];
  lineas.forEach((l, li) => productos.forEach((p) => {
    const s = parecidoNombres(l.descripcion, p.nombre);
    if (s >= minimo) pares.push({ li, pid: p.id, s });
  }));
  pares.sort((a, b) => b.s - a.s);
  const usadoL = new Map<number, { pid: string; s: number }>(), usadoP = new Set<string>();
  for (const x of pares) {
    if (usadoL.has(x.li) || usadoP.has(x.pid)) continue;
    usadoL.set(x.li, { pid: x.pid, s: x.s });
    usadoP.add(x.pid);
  }
  return lineas.map((l, li) => ({ ...l, productoId: usadoL.get(li)?.pid ?? null, parecido: usadoL.get(li)?.s ?? 0 }));
}

/** "El proveedor aumentó 8%": costo nuevo redondeado al peso. */
export const conAumento = (costo: number, pct: number) => Math.round(costo * (1 + pct / 100));
