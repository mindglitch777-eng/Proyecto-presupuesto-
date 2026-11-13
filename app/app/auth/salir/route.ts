import { NextResponse, type NextRequest } from "next/server";
import { supabaseServidor } from "@/lib/supabase/servidor";

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServidor();
    await supabase.auth.signOut();
  } catch {
    // si no había sesión, igual se vuelve al inicio
  }
  return NextResponse.redirect(new URL("/", request.url), 303);
}
