import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { CierreEntendido } from "./voz";

// La voz pasa por Claude (el modelo más económico) para entender frases raras. Si no hay clave cargada, se usa
// el lector propio (lib/voz.ts), que no cuesta nada. Nunca se muestra la palabra "IA" en la interfaz.
export const MODELO_VOZ = "claude-haiku-5-5";
const USD_POR_TOKEN_ENTRADA = 0.1 / 1_000_000;
const USD_POR_TOKEN_SALIDA = 0.5 / 1_000_000;
export const LIMITE_VOZ_POR_DIA = 10;
export const LIMITE_FACTURAS_POR_DIA = 3;

const esquema = z.object({
  ventas: z.number().int().min(0).describe("Total vendido en el día, en pesos"),
  tarjeta: z.number().int().min(0).describe("Parte de las ventas cobrada con tarjeta, QR o Mercado Pago, en pesos; 0 si no lo dijo"),
  gastos: z.array(z.object({ categoria: z.enum(["proveedor", "flete", "vuelto", "otros"]), monto: z.number().int().min(0) })),
  productos: z.array(z.string()).describe("Nombres exactos de la lista que la persona dijo que se vendieron o se movieron"),
});

const SISTEMA = `Ordenás el cierre del día que el dueño de un kiosco o almacén de Argentina le dicta al celular.
Devolvé solo lo que dijo, en pesos y como números enteros. "Lucas" son miles; "un palo" es un millón ("un palo doscientos" = 1.200.000).
Ventas: lo que vendió o entró en el día. Tarjeta: lo que cobró con tarjeta, QR, transferencia o Mercado Pago (es parte de las ventas).
Gastos del día: "proveedor" (mercadería, distribuidor, preventista, mayorista), "flete" (envíos, nafta, viajes), "vuelto" (cambio), "otros" (todo lo demás).
Productos: elegí solo nombres exactos de la lista que te paso, los que dijo que se vendieron o se movieron. Si no dijo ninguno, lista vacía.
Si algo no lo dijo, ponelo en 0. No inventes montos.`;

export type ResultadoIA = { cierre: CierreEntendido; tokensEntrada: number; tokensSalida: number; costoUsd: number };

export async function entenderConClaude(texto: string, productos: string[]): Promise<ResultadoIA | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const client = new Anthropic({ timeout: 20_000, maxRetries: 1 });
  try {
    const r = await client.messages.parse({
      model: MODELO_VOZ,
      max_tokens: 2000,
      output_config: { effort: "low", format: zodOutputFormat(esquema) },
      system: SISTEMA,
      messages: [{ role: "user", content: `Productos del negocio: ${JSON.stringify(productos)}\n\nLo que dijo:\n${texto}` }],
    });
    if (r.stop_reason === "refusal" || !r.parsed_output) return null;
    const o = r.parsed_output;
    const nombres = new Set(productos);
    const cierre: CierreEntendido = {
      ventas: o.ventas,
      tarjeta: Math.min(o.tarjeta, o.ventas),
      gastos: o.gastos.filter((g) => g.monto > 0),
      productos: o.productos.filter((p) => nombres.has(p)),
    };
    const tokensEntrada = r.usage.input_tokens, tokensSalida = r.usage.output_tokens;
    return { cierre, tokensEntrada, tokensSalida, costoUsd: tokensEntrada * USD_POR_TOKEN_ENTRADA + tokensSalida * USD_POR_TOKEN_SALIDA };
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      console.error(`[voz] Claude respondió ${e.status}`);
      return null;
    }
    console.error("[voz] no se pudo consultar a Claude");
    return null;
  }
}
