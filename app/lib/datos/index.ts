import "server-only";
import { cookies } from "next/headers";
import { supabaseServidor } from "../supabase/servidor";
import { datosSupabase } from "./supabase";
import { datosMemoria } from "./memoria";
import type { Datos } from "./tipos";

export type { Datos } from "./tipos";
export const COOKIE_PRUEBA = "enclaro_prueba";

/** Modo prueba: solo si el servidor arrancó con ENCLARO_MODO_PRUEBA=1 (nunca en Netlify) y el navegador trae la cookie. */
export async function modoPrueba() {
  if (process.env.ENCLARO_MODO_PRUEBA !== "1") return false;
  return (await cookies()).get(COOKIE_PRUEBA)?.value === "1";
}

export async function obtenerDatos(): Promise<Datos> {
  if (await modoPrueba()) return datosMemoria();
  return datosSupabase(await supabaseServidor());
}
