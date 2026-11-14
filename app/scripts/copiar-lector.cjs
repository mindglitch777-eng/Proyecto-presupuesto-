// Copia el lector de facturas (Tesseract, gratis y local) a public/lector para servirlo desde la propia web.
// Corre solo antes de "npm run build" y "npm run dev". No se sube al repositorio (está en .gitignore).
const fs = require("node:fs");
const path = require("node:path");
const raiz = path.join(__dirname, "..");
const destino = path.join(raiz, "public", "lector");
fs.mkdirSync(destino, { recursive: true });
const copiar = (desde, nombre) => fs.copyFileSync(path.join(raiz, "node_modules", desde), path.join(destino, nombre ?? path.basename(desde)));
copiar("tesseract.js/dist/worker.min.js");
for (const v of ["tesseract-core-lstm.wasm.js", "tesseract-core-simd-lstm.wasm.js", "tesseract-core-relaxedsimd-lstm.wasm.js"]) copiar(`tesseract.js-core/${v}`);
copiar("@tesseract.js-data/spa/4.0.0_best_int/spa.traineddata.gz");
console.log("Lector de facturas copiado a public/lector");
