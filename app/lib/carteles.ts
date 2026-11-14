// Carteles de precios como imagen PNG, dibujados en el celular (sin servicios externos).
import { pesos } from "./formato";

export type ItemCartel = { nombre: string; precio: number };
export type TipoCartel = "hoja" | "estado";

function fuente(variable: string, respaldo: string) {
  if (typeof document === "undefined") return respaldo;
  const v = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return v ? `${v}, ${respaldo}` : respaldo;
}

/** Corta un texto en renglones que entren en `ancho` (máximo `max` renglones, con "…" si no entra). */
function renglones(ctx: CanvasRenderingContext2D, texto: string, ancho: number, max: number) {
  const palabras = texto.split(/\s+/);
  const out: string[] = [];
  let actual = "";
  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p;
    if (ctx.measureText(prueba).width <= ancho) actual = prueba;
    else { if (actual) out.push(actual); actual = p; }
  }
  if (actual) out.push(actual);
  if (out.length > max) { out.length = max; out[max - 1] = out[max - 1].replace(/\s*\S*$/, "") + "…"; }
  return out;
}

/** Dibuja los carteles. "hoja": A4 con hasta 8 tarjetas para imprimir. "estado": imagen vertical para el estado de WhatsApp. */
export function dibujarCarteles(items: ItemCartel[], tipo: TipoCartel, negocio: string): HTMLCanvasElement[] {
  const display = fuente("--font-jakarta", "system-ui, sans-serif");
  const cuerpo = fuente("--font-inter", "system-ui, sans-serif");
  const porPagina = tipo === "hoja" ? 8 : 6;
  const paginas: HTMLCanvasElement[] = [];
  for (let i = 0; i < items.length; i += porPagina) {
    const grupo = items.slice(i, i + porPagina);
    const cv = document.createElement("canvas");
    const [W, H] = tipo === "hoja" ? [1240, 1754] : [1080, 1920];
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext("2d")!;
    ctx.fillStyle = tipo === "hoja" ? "#ffffff" : "#0e3b2a";
    ctx.fillRect(0, 0, W, H);
    // toldo rayado arriba
    for (let x = 0; x < W; x += 52) { ctx.fillStyle = (x / 52) % 2 ? "#f2f2ea" : "#1b7a43"; ctx.fillRect(x, 0, 52, tipo === "hoja" ? 22 : 34); }
    if (tipo === "hoja") {
      const cols = 2, filas = 4, m = 50, gap = 28, top = 70;
      const cw = (W - m * 2 - gap) / cols, ch = (H - top - 90 - gap * (filas - 1)) / filas;
      grupo.forEach((it, k) => {
        const x = m + (k % cols) * (cw + gap), y = top + Math.floor(k / cols) * (ch + gap);
        ctx.strokeStyle = "#0e3b2a"; ctx.lineWidth = 4; ctx.setLineDash([14, 10]); ctx.strokeRect(x, y, cw, ch); ctx.setLineDash([]);
        ctx.fillStyle = "#0f1f17"; ctx.font = `700 46px ${display}`; ctx.textBaseline = "top";
        renglones(ctx, it.nombre, cw - 60, 2).forEach((r, j) => ctx.fillText(r, x + 30, y + 34 + j * 56));
        ctx.fillStyle = "#0e3b2a"; ctx.font = `800 118px ${display}`; ctx.textBaseline = "alphabetic";
        ctx.fillText(pesos(it.precio), x + 30, y + ch - 44);
      });
      ctx.fillStyle = "#8a968f"; ctx.font = `500 22px ${cuerpo}`; ctx.textBaseline = "alphabetic";
      ctx.fillText(`${negocio} · hecho con En Claro`, m, H - 36);
    } else {
      ctx.fillStyle = "#f5a524"; ctx.font = `800 64px ${display}`; ctx.textBaseline = "top";
      ctx.fillText("Precios nuevos", 70, 120);
      ctx.fillStyle = "#c5d9cc"; ctx.font = `600 38px ${cuerpo}`;
      ctx.fillText(negocio, 70, 205);
      grupo.forEach((it, k) => {
        const y = 330 + k * 245;
        ctx.fillStyle = "#ffffff1a"; ctx.beginPath(); ctx.roundRect(60, y, W - 120, 215, 28); ctx.fill();
        ctx.fillStyle = "#ffffff"; ctx.font = `700 48px ${display}`; ctx.textBaseline = "top";
        renglones(ctx, it.nombre, W - 220, 1).forEach((r) => ctx.fillText(r, 100, y + 34));
        ctx.fillStyle = "#f5a524"; ctx.font = `800 96px ${display}`; ctx.textBaseline = "alphabetic";
        ctx.fillText(pesos(it.precio), 100, y + 182);
      });
      ctx.fillStyle = "#a9c7b5"; ctx.font = `500 28px ${cuerpo}`; ctx.textBaseline = "alphabetic";
      ctx.fillText("hecho con En Claro", 70, H - 70);
    }
    paginas.push(cv);
  }
  return paginas;
}

export const aBlob = (cv: HTMLCanvasElement) => new Promise<Blob>((ok, mal) => cv.toBlob((b) => (b ? ok(b) : mal(new Error("sin imagen"))), "image/png"));
