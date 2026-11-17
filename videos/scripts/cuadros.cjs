// Dice cuántos cuadros tiene un video (para repartir el render en partes iguales).
// Uso: node scripts/cuadros.cjs <carpeta-del-bundle> <id-del-video>  →  imprime "cuadros fps"
const path = require("node:path");
const { selectComposition } = require("@remotion/renderer");
(async () => {
  const [, , serve, id] = process.argv;
  const c = await selectComposition({ serveUrl: path.resolve(serve), id, logLevel: "error", chromiumOptions: { gl: "swangle" } });
  console.log(`${c.durationInFrames} ${c.fps}`);
})().catch((e) => { console.error(e); process.exit(1); });
