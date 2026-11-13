// Genera los íconos de la app instalable (public/icons/*.png) desde el logo. Uso: NODE_PATH=$(npm root -g) node scripts/iconos.cjs
const { chromium } = require("playwright");
const LOGO = `<rect width="34" height="34" rx="{R}" fill="#0E3B2A"/><path d="M6 9h22v5H6z" fill="#FBF6EA"/><path d="M6 9h5.5v5H6zM17 9h5.5v5H17z" fill="#F5A524"/><path d="M6 14a2.75 2.75 0 0 0 5.5 0 2.75 2.75 0 0 0 5.5 0 2.75 2.75 0 0 0 5.5 0 2.75 2.75 0 0 0 5.5 0" fill="#FBF6EA"/><path d="M10 25l5-5 3.5 3 6-6.5" stroke="#F5A524" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
const hacer = (size, maskable) => {
  // maskable: logo al 62 % sobre fondo verde lleno (Android lo recorta en círculo); normal: logo completo con esquinas redondeadas
  const inner = maskable
    ? `<rect width="34" height="34" fill="#0E3B2A"/><g transform="translate(6.46 6.46) scale(.62)">${LOGO.replace("{R}", "9")}</g>`
    : LOGO.replace("{R}", "9");
  return `<body style="margin:0;background:transparent"><svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 34 34">${inner}</svg></body>`;
};
(async () => {
  const b = await chromium.launch();
  const salidas = [["icon-192.png", 192, false], ["icon-512.png", 512, false], ["icon-maskable-512.png", 512, true], ["apple-touch-icon.png", 180, true]];
  for (const [archivo, size, mask] of salidas) {
    const p = await b.newPage({ viewport: { width: size, height: size } });
    await p.setContent(hacer(size, mask));
    await p.screenshot({ path: `public/icons/${archivo}`, omitBackground: !mask });
    await p.close();
  }
  await b.close();
})();
