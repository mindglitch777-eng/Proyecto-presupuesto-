// Variables públicas de Supabase para el navegador y el servidor. Si falta alguna, el mensaje dice dónde cargarla.
export class ConfigFaltante extends Error {
  constructor(public variable: string) {
    super(`Falta la variable ${variable}. Cargala en Netlify: Project configuration → Environment variables.`);
  }
}

// OJO: tienen que escribirse literal (process.env.NEXT_PUBLIC_...) para que Next las incluya en el navegador.
export function configPublica() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new ConfigFaltante("NEXT_PUBLIC_SUPABASE_URL");
  if (!clave) throw new ConfigFaltante("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return { url, clave };
}
