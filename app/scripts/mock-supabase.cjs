// Servidor de prueba que imita las 3 funciones SQL de la lista de espera (supabase/migrations/…_lista_espera.sql).
// Solo para probar la landing sin una base real:  node scripts/mock-supabase.cjs   (puerto 54321)
const http = require("node:http");

const clave = process.env.SUPABASE_SERVICE_ROLE_KEY || "clave-de-prueba";
const filas = new Map(); // whatsapp → fila
let secuencia = 0;

const funciones = {
  anotarse_lista_espera(a) {
    const ya = filas.get(a.p_whatsapp);
    if (ya) return [{ numero: ya.numero, ya_estaba: true }];
    const numero = ++secuencia;
    filas.set(a.p_whatsapp, { ...a, numero });
    console.log("[mock] anotado", numero, a.p_name, a.p_rubro, a.p_numero_del_dia, a.p_utm_source, a.p_utm_content);
    return [{ numero, ya_estaba: false }];
  },
  lugares_fundadores: () => Math.max(0, 100 - filas.size),
  baja_lista_espera(a) {
    if (!filas.delete(a.p_whatsapp)) return null;
    return Math.random().toString(16).slice(2, 10).toUpperCase();
  },
};

http
  .createServer((req, res) => {
    const m = req.url?.match(/^\/rest\/v1\/rpc\/(\w+)$/);
    let cuerpo = "";
    req.on("data", (c) => (cuerpo += c));
    req.on("end", () => {
      if (req.headers.apikey !== clave || !m || !funciones[m[1]]) {
        res.writeHead(m ? 401 : 404).end(JSON.stringify({ message: "no" }));
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(funciones[m[1]](JSON.parse(cuerpo || "{}"))));
    });
  })
  .listen(54321, "127.0.0.1", () => console.log("[mock] Supabase de prueba en http://127.0.0.1:54321"));
