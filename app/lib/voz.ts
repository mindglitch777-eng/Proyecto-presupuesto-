// Entiende un cierre dicho de palabra ("vendí ciento veinte mil, le pagué sesenta al proveedor…").
// Funciona sin internet ni servicios externos: números en castellano (con "lucas", "palo", "y medio"), dígitos tal como
// los escribe el dictado del celular (120.000 · 120,000 · 120 000 · $120k · 1,2 millones) y palabras clave.
// Corpus de pruebas: tests/voz-corpus.test.ts (si una frase real falla, se agrega ahí y se arregla acá).

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
const MEDIO = new Set(["medio", "media"]);
const FIN_DE_MONTO = new Set(["pesos", "peso", "mangos"]);
const MESES = new Set(["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "setiembre", "octubre", "noviembre", "diciembre"]);
// Un número seguido de estas palabras es una cantidad de cosas, no plata ("3 cajas", "2 proveedores", "2 litros").
const COSAS = /^(cajas?|paquetes?|packs?|botellas?|unidades?|litros?|kilos?|kg|gramos?|horas?|dias?|semanas?|meses?|clientes?|personas?|veces|proveedores?|productos?|cosas?|bolsas?|docenas?|cajones?)$/;

const valorPalabra = (t: string) => UNIDADES[t] ?? DECENAS[t] ?? CENTENAS[t];
function valorDigitos(t: string): number | null {
  const k = /^(\d+(?:[.,]\d+)?)k$/.exec(t);
  if (k) return Number(k[1].replace(",", ".")) * 1000;
  if (/^\d{1,3}(\.\d{3})+$/.test(t)) return Number(t.replace(/\./g, ""));
  // El dictado del celular a veces escribe los miles con coma ("120,000") o con coma y punto ("1,200,000.00").
  if (/^\d{1,3}(,\d{3})+$/.test(t)) return Number(t.replace(/,/g, ""));
  if (/^\d{1,3}(,\d{3})+\.\d{1,2}$/.test(t)) return Number(t.replace(/,/g, ""));
  if (/^\d{1,3}(\.\d{3})+,\d{1,2}$/.test(t)) return Number(t.replace(/\./g, "").replace(",", "."));
  if (/^\d+,\d{1,2}$/.test(t)) return Number(t.replace(",", "."));
  if (/^\d+\.\d{1,2}$/.test(t)) return Number(t);
  if (/^\d+$/.test(t)) return Number(t);
  return null;
}
const esNumero = (t: string) => valorPalabra(t) !== undefined || valorDigitos(t) !== null;

type Monto = { valor: number; desde: number; hasta: number; conPesos: boolean };

/** Encuentra los montos dentro de una lista de palabras. */
export function montos(tokens: string[]): Monto[] {
  const out: Monto[] = [];
  let i = 0;
  while (i < tokens.length) {
    const t0 = tokens[i];
    const empiezaConMedio = MEDIO.has(t0) && (MIL.has(tokens[i + 1] ?? "") || MILLON.has(tokens[i + 1] ?? ""));
    if (!esNumero(t0) && !MILLON.has(t0) && t0 !== "mil" && !empiezaConMedio) { i++; continue; }
    // Fechas ("12 de noviembre") y horas ("a las 9") no son plata.
    if (tokens[i + 1] === "de" && MESES.has(tokens[i + 2] ?? "")) { i += 3; continue; }
    if (["las", "la"].includes(tokens[i - 1] ?? "") && /^\d{1,2}$/.test(t0)) { i++; continue; }

    const desde = i;
    let total = 0, actual = 0, despuesDeMillon = false, ultimoMult = 0, uso = false, soloArticulo = true, conPesos = false, inicioTrasMil = -1;
    while (i < tokens.length) {
      let t = tokens[i];
      // Miles separados con espacio ("120 000"): se juntan en un solo número.
      if (/^\d{1,3}$/.test(t)) {
        while (/^\d{3}$/.test(tokens[i + 1] ?? "")) { t += tokens[i + 1]; i++; }
      }
      const p = valorPalabra(t);
      const d = valorDigitos(t);
      if (MEDIO.has(t) && (MIL.has(tokens[i + 1] ?? "") || MILLON.has(tokens[i + 1] ?? ""))) {
        actual += 0.5; uso = true; soloArticulo = false;
      } else if (p !== undefined) {
        if (ultimoMult === 1000 && actual === 0) inicioTrasMil = i;
        actual += p; uso = true;
        if (!["un", "una", "uno"].includes(t)) soloArticulo = false;
      } else if (d !== null) {
        if (ultimoMult === 1000 && actual === 0) inicioTrasMil = i;
        actual += d; uso = true; soloArticulo = false;
      } else if (MIL.has(t) && ultimoMult === 1000 && actual > 0 && inicioTrasMil >= 0) {
        // "200 mil 100 mil": son dos montos, no uno.
        actual = 0; i = inicioTrasMil; break;
      } else if (MIL.has(t) && (uso || t === "mil")) {
        total += (actual || 1) * 1000; actual = 0; ultimoMult = 1000; soloArticulo = false; uso = true;
      } else if (MILLON.has(t)) {
        total += (actual || 1) * 1_000_000; actual = 0; ultimoMult = 1_000_000; despuesDeMillon = true; uso = true; soloArticulo = false;
      } else if (t === "y" && ultimoMult && actual === 0 && MEDIO.has(tokens[i + 1] ?? "")) {
        // "un palo y medio", "dos lucas y media"
        total += ultimoMult / 2; i += 2; break;
      } else if (t === "y" && i > desde && (DECENAS[tokens[i - 1]] !== undefined || tokens[i - 1] === "veinte") && UNIDADES[tokens[i + 1]] !== undefined && UNIDADES[tokens[i + 1]] < 10) {
        // "treinta y seis", "veinte y cinco"
      } else if (FIN_DE_MONTO.has(t) && uso) {
        conPesos = true;
        i++;
        break;
      } else break;
      i++;
    }
    // "un palo doscientos" = 1.200.000
    if (despuesDeMillon && ultimoMult === 1_000_000 && actual > 0 && actual < 1000) actual *= 1000;
    const valor = Math.round(total + actual);
    const siguiente = tokens[i] ?? "";
    const esCantidad = valor < 10 && COSAS.test(siguiente);
    if (FIN_DE_MONTO.has(siguiente)) conPesos = true;
    if (uso && !(soloArticulo && valor === 1) && valor > 0 && !esCantidad) out.push({ valor, desde, hasta: i, conPesos });
    if (i === desde) i++;
  }
  return out;
}

type Tipo = Categoria | "ventas" | "tarjeta" | "efectivo";

// Palabras que dicen claramente qué es un monto. Orden = prioridad cuando aparecen varias en el mismo lado.
const FUERTES: [RegExp, Tipo][] = [
  [/\b(para mi|para la casa|para casa|para gastos personales|me lleve|me lo lleve|retire|retiro|saque para)\b/, "otros"],
  [/\b(efectivo|cash|en mano|contado|en billetes?)\b/, "efectivo"],
  [/\b(tarjetas?|qr|mercado ?pago|mp|debito|credito|posnet|point|transferencias?|transfirieron|transfiere|transferi|cuenta dni|modo|billetera|virtual|digital|celular|celu|banco)\b/, "tarjeta"],
  [/\b(flete|fletes|envio|envios|nafta|combustible|remis|taxi|uber|colectivo|transporte|cadete|delivery)\b/, "flete"],
  [/\b(vuelto|cambio|monedas)\b/, "vuelto"],
  [/\b(proveedor|proveedores|mercaderia|distribuidor|distribuidora|reparto|repartidor|preventista|mayorista|repuse|reponer|panadero|panaderia|sodero|soderia|carnicero|carniceria|verdulero|verduleria|fiambres?|lacteos|gaseosas?|bebidas|coca|pepsi|cerveceria)\b|\bal de (la|las|los|el)\b|\bal del\b/, "proveedor"],
  [/\b(bolsas|limpieza|almuerzo|comida|luz|agua|gas|internet|telefono|alquiler|impuestos?|municipalidad|otros|otras|varios|otra cosa)\b/, "otros"],
  [/\b(vend\w*|ventas?|hice|hicimos|factur\w*|entro|entraron|recaude|recaudamos|recaudacion|caja|cerre|cerramos|junte|juntamos|saque|sacamos)\b/, "ventas"],
];
// Palabras de gasto genérico: solo deciden si no hay nada más claro cerca.
// Palabras de venta poco claras ("fueron", "en total"): valen solo si no hay otra cosa cerca.
const VENTA_SUAVE = /\b(fueron|fue|total|dio|hoy)\b/;
const DEBILES = /\b(pague|pagamos|pago|pagar|gaste|gastamos|gasto|compre|compramos|le di|di)\b/;
const CORRECCION = new Set(["no", "perdon", "mejor", "dicho", "digo", "me", "equivoque", "osea", "o", "sea", "bah", "este", "eh", ",", ".", ";"]);

function tipoDe(texto: string): Tipo | undefined {
  return FUERTES.find(([re]) => re.test(texto))?.[1];
}

function tokenizar(texto: string) {
  const limpio = sinTildes(texto).replace(/\$/g, " ").replace(/[«»"]/g, " ");
  // Puntos y comas sueltos son separadores de frase; dentro de un número (120.000 · 1,5) se quedan pegados.
  return limpio.split(/(\s+|[;:!?¡¿()]|,(?!\d)|\.(?!\d))/).map((t) => t.trim()).filter((t) => t && !/^\s+$/.test(t));
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

  // Montos dichos sin "mil": si lo más grande es de miles, los chicos también ("vendí 186 mil, 80 por QR");
  // si todo es chico, se habló en miles ("vendí 120 y le pagué 60").
  const mayor = Math.max(0, ...ms.map((m) => m.valor));
  for (const m of ms) {
    if (m.conPesos) continue;
    if ((mayor >= 20000 && m.valor < 1000) || mayor < 1000) m.valor *= 1000;
  }

  // Qué es cada monto: lo dicho antes manda; si antes no hay nada claro, lo que viene después.
  const tipos: (Tipo | undefined)[] = ms.map((m, k) => {
    let a = m.desde - 1;
    const tope = k > 0 ? ms[k - 1].hasta : 0;
    while (a >= tope && !SEPARADORES.has(tokens[a]) && tokens[a] !== "y") a--;
    let b = m.hasta;
    const fin = k < ms.length - 1 ? ms[k + 1].desde : tokens.length;
    while (b < fin && !SEPARADORES.has(tokens[b]) && tokens[b] !== "y") b++;
    const antes = tokens.slice(a + 1, m.desde).join(" ");
    const despues = tokens.slice(m.hasta, b).join(" ");
    const clausula = `${antes} ${despues}`;
    if (FUERTES[0][0].test(clausula)) return "otros"; // lo que el dueño se llevó para él
    if (FUERTES[1][0].test(clausula)) return "efectivo";
    const deAntes = tipoDe(antes), deDespues = tipoDe(despues);
    if (deAntes) return deAntes;
    if (deDespues) return deDespues;
    if (VENTA_SUAVE.test(clausula)) return "ventas";
    if (DEBILES.test(clausula)) return "otros";
    return undefined;
  });

  // Correcciones: "vendí 120 mil, no, 130 mil" → vale el segundo.
  const usar = ms.map(() => true);
  for (let k = 1; k < ms.length; k++) {
    const entre = tokens.slice(ms[k - 1].hasta, ms[k].desde);
    const esCorreccion = entre.some((t) => ["no", "perdon", "digo", "dicho", "equivoque"].includes(t)) && entre.every((t) => CORRECCION.has(t));
    if (esCorreccion) {
      usar[k - 1] = false;
      if (!tipos[k]) tipos[k] = tipos[k - 1];
    }
  }

  const r: CierreEntendido = { ventas: 0, tarjeta: 0, gastos: [], productos: productosMencionados(texto, productos) };
  let ventasDichas = 0, efectivo = 0, hayVentas = false;
  ms.forEach((m, k) => {
    if (!usar[k]) return;
    let tipo = tipos[k];
    if (!tipo) tipo = !hayVentas ? "ventas" : "otros";
    if (tipo === "ventas") { ventasDichas += m.valor; hayVentas = true; }
    else if (tipo === "efectivo") { efectivo += m.valor; hayVentas = true; }
    else if (tipo === "tarjeta") r.tarjeta += m.valor;
    else {
      const g = r.gastos.find((x) => x.categoria === tipo);
      if (g) g.monto += m.valor;
      else r.gastos.push({ categoria: tipo, monto: m.valor });
    }
  });
  // "120 en efectivo y 60 con tarjeta" suman 180; "vendí 180, 60 con tarjeta" ya incluye la tarjeta.
  r.ventas = efectivo > 0 ? Math.max(ventasDichas, efectivo + r.tarjeta) : ventasDichas || r.tarjeta;
  if (r.tarjeta > r.ventas && r.ventas > 0) r.tarjeta = r.ventas;
  return r;
}
