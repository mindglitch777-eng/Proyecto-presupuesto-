import type { NextRequest } from "next/server";
import { irA } from "@/lib/redirigir";
import { supabaseServidor } from "@/lib/supabase/servidor";

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServidor();
    await supabase.auth.signOut();
  } catch {
    // si no había sesión, igual se vuelve al inicio
  }
  return irA(request, "/");
}
