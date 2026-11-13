// Genera public/og.png (1200×630) para cuando compartís el link por WhatsApp o redes.
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.setContent(`<body style="margin:0;width:1200px;height:630px;background:#0e3b2a;font-family:system-ui,sans-serif;color:#fff;display:flex;flex-direction:column;justify-content:center;padding:0 90px;box-sizing:border-box">
  <div style="height:26px;width:260px;background:repeating-linear-gradient(90deg,#f5a524 0 40px,#fff 40px 80px);border-radius:0 0 14px 14px;position:absolute;top:0;left:90px"></div>
  <div style="font-size:34px;font-weight:700;color:#9fd3b5;margin-bottom:24px">En Claro</div>
  <div style="font-size:84px;font-weight:800;line-height:1.05;letter-spacing:-2px">¿Cuánto tenés que vender por día para no perder?</div>
  <div style="font-size:36px;color:#f5a524;margin-top:34px;font-weight:700">Calculalo gratis. Sin registrarte.</div></body>`);
  await p.screenshot({ path: "public/og.png" });
  await b.close();
})();
