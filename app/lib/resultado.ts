import type { ZodError } from "zod";

export type Resultado = { ok: true } | { ok: false; mensaje: string };
export const ERROR_GUARDAR = "No se pudo guardar. Revisá tu conexión y probá de nuevo.";
export const primerError = (e: ZodError) => e.issues[0]?.message ?? "Revisá los datos.";

/** Las acciones del primer uso: el servidor real guarda en la base; la página de prueba solo valida. */
export type AccionesBienvenida = {
  guardarNegocio: (datos: unknown) => Promise<Resultado>;
  guardarFijos: (datos: unknown) => Promise<Resultado>;
  guardarProductos: (datos: unknown) => Promise<Resultado>;
  terminar: () => Promise<Resultado>;
};
