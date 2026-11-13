// Entiende un cierre dicho de palabra ("vendí ciento veinte mil, le pagué sesenta al proveedor…").
// Funciona sin internet ni servicios externos: números en castellano (con "lucas" y "palo"), dígitos y palabras clave.

export type Categoria = "proveedor" | "flete" | "vuelto" | "otros";
export type CierreEntendido = { ventas: number; tarjeta: number; gastos: { categoria: Categoria; monto: number }[]; productos: string[] };

const sinTildes = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const UNIDADES: Record<string, number> = {
  cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13,
  catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20, veintiun: 21, veintiuno: 21, veintiuna: 21,
  veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
};
const DECENAS: Record<string, number> = { treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90 };
const CENTENAS: Record<string, number> = {
  cien: 100, ciento: 100, doscientos: 200, doscientas: 200, trescientos: 300, trescientas: 300, cuatrocientos: 400, cuatrocientas: 400, quinientos: 500, quinientas: 500,
  seiscientos: 600, seiscientas: 600, setecientos: 700, setecientas: 700, ochocientos: 800, ochocientas: 800, novecientos: 900, novecientas: 900,
};
const MIL = new Set(["mil", "luca", "lucas"]);
const MILLON = new Set(["millon", "millones", "palo", "palos"]);
const FIN_DE_MONTO = new Set(["pesos", "peso", "mangos"]);

const valorPalabra = (t: string) => UNIDADES[t] ?? DECENAS[t] ?? CENTENAS[t];
function valorDigitos(t: string): number | null {
  const k = /^(\d+(?:[.,]\d+)?)k$/.exec(t);
  if (k) return Math.round(Number(k[1].replace(",", ".")) * 1000);
  if (/^\d{1,3}(\.\d{3})+$/.test(t)) return Number(t.replace(/\./g, ""));
  if (/^\d+,\d{1,2}$/.test(t)) return Number(t.replace(",", "."));
  if (/^\d+$/.test(t)) return Number(t);
  return null;
}
const esNumero = (t: string) => valorPalabra(t) !== undefined || valorDigitos(t) !== null;

type Monto = { valor: number; desde: number; hasta: number };

/** Encuentra los montos dentro de una lista de palabras. */
export function montos(tokens: string[]): Monto[] {
  const out: Monto[] = [];
  let i = 0;
  while (i < tokens.length) {
    if (!esNumero(tokens[i]) && !MILLON.has(tokens[i]) && tokens[i] !== "mil") { i++; continue; }
    const desde = i;
    let total = 0, actual = 0, despuesDeMillon = false, ultimoMult = 0, uso = false, soloArticulo = true;
    while (i < tokens.length) {
      const t = tokens[i];
      const p = valorPalabra(t);
      const d = valorDigitos(t);
      if (p !== undefined) {
        actual += p; uso = true;
        if (!["un", "una", "uno"].includes(t)) soloArticulo = false;
      } else if (d !== null) {
        actual += d; uso = true; soloArticulo = false;
      } else if (MIL.has(t) && (uso || t === "mil")) {
        total += (actual || 1) * 1000; actual = 0; ultimoMult = 1000; soloArticulo = false; uso = true;
      } else if (MILLON.has(t)) {
        total += (actual || 1) * 1_000_000; actual = 0; ultimoMult = 1_000_000; despuesDeMillon = true; uso = true; soloArticulo = false;
      } else if (t === "y" && i > desde && DECENAS[tokens[i - 1]] !== undefined && UNIDADES[tokens[i + 1]] !== undefined && UNIDADES[tokens[i + 1]] < 10) {
        // "treinta y seis"
      } else if (FIN_DE_MONTO.has(t) && uso) {
        i++;
        break;
      } else break;
      i++;
    }
    // "un palo doscientos" = 1.200.000
    if (despuesDeMillon && ultimoMult === 1_000_000 && actual > 0 && actual < 1000) actual *= 1000;
    const valor = total + actual;
    if (uso && !(soloArticulo && valor === 1) && valor >= 10) out.push({ valor, desde, hasta: i });
    if (i === desde) i++;
  }
  return out;
}

const CLAVES: [RegExp, Categoria | "ventas" | "tarjeta"][] = [
  [/\b(tarjeta|qr|mercado ?pago|debito|credito|posnet|point|transferencia|transfirieron)/, "tarjeta"],
  [/\b(flete|envio|nafta|remis|uber|colectivo|transporte)/, "flete"],
  [/\b(vuelto|cambio)/, "vuelto"],
  [/\b(proveedor|proveedores|mercaderia|distribuidor|distribuidora|reparto|repartidor|preventista|mayorista)/, "proveedor"],
  [/\b(vend|venta|hice|hicimos|factur|entr(o|aron|ó)|recaud|caja)/, "ventas"],
  [/\b(otros|otras|otra cosa|varios|gast|pague|pagamos|compre|limpieza|bolsas)/, "otros"],
];

function tokenizar(texto: string) {
  const limpio = sinTildes(texto).replace(/\$/g, " ");
  // separadores de frase se conservan como tokens propios
  return limpio.split(/(\s+|[;:!?¡¿()"]|,(?!\d)|\.(?!\d{3}))/).map((t) => t.trim()).filter((t) => t && !/^\s+$/.test(t));
}
const SEPARADORES = new Set([",", ".", ";", ":", "!", "?"]);

/** Productos nombrados en el texto (coincidencia por palabra significativa del nombre). */
export function productosMencionados(texto: string, productos: string[]) {
  const palabras = new Set(sinTildes(texto).split(/[^a-z0-9ñ]+/).filter(Boolean).flatMap((w) => [w, w.replace(/(es|s)$/, "")]));
  const genericas = new Set(["de", "la", "el", "los", "las", "con", "sin", "por", "kg", "gr", "lt", "litro", "litros", "unidad", "x", "grande", "chico", "chica"]);
  return productos.filter((p) =>
    sinTildes(p).split(/[^a-z0-9ñ]+/).some((w) => w.length >= 3 && !genericas.has(w) && !/^\d/.test(w) && (palabras.has(w) || palabras.has(w.replace(/(es|s)$/, "")))),
  );
}

/** Lee el cierre: ventas, cobrado con tarjeta/QR, gastos por categoría y productos que se movieron. */
export function entenderCierre(texto: string, productos: string[] = []): CierreEntendido {
  const tokens = tokenizar(texto);
  const ms = montos(tokens);
  const r: CierreEntendido = { ventas: 0, tarjeta: 0, gastos: [], productos: productosMencionados(texto, productos) };
  ms.forEach((m, k) => {
    // cláusula: desde el separador (o "y" suelta, o el monto anterior) hasta el próximo separador o monto
    let a = m.desde - 1;
    const tope = k > 0 ? ms[k - 1].hasta : 0;
    while (a >= tope && !SEPARADORES.has(tokens[a]) && tokens[a] !== "y") a--;
    let b = m.hasta;
    const fin = k < ms.length - 1 ? ms[k + 1].desde : tokens.length;
    while (b < fin && !SEPARADORES.has(tokens[b]) && tokens[b] !== "y") b++;
    const antes = tokens.slice(a + 1, m.desde).join(" ");
    const despues = tokens.slice(m.hasta, b).join(" ");
    const clase = (txt: string) => CLAVES.find(([re]) => re.test(txt))?.[1];
    let tipo = clase(`${antes} ${despues}`);
    if (!tipo) tipo = r.ventas === 0 && k === 0 ? "ventas" : "otros";
    if (tipo === "ventas") r.ventas += m.valor;
    else if (tipo === "tarjeta") r.tarjeta += m.valor;
    else {
      const g = r.gastos.find((x) => x.categoria === tipo);
      if (g) g.monto += m.valor;
      else r.gastos.push({ categoria: tipo, monto: m.valor });
    }
  });
  if (r.tarjeta > r.ventas && r.ventas > 0) r.tarjeta = r.ventas;
  return r;
}
