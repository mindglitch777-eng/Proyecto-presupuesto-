// Genera las 3 facturas de ejemplo (tests/facturas/*.jpg) como fotos: un poco torcidas, con sombra y grano.
const { chromium } = require("playwright");
const datos = require("../tests/facturas/facturas.json");
const ar = (n) => n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 900, height: 1200 } });
  for (const [i, f] of datos.facturas.entries()) {
    const filas = f.renglones.map(([c, d, q, u]) => `<tr><td>${c}</td><td>${d}</td><td class=n>${q}</td><td class=n>${ar(u)}</td><td class=n>${ar(q * u)}</td></tr>`).join("");
    const total = f.renglones.reduce((s, r) => s + r[2] * r[3], 0);
    await p.setContent(`<body style="margin:0;background:#6d6458;display:flex;justify-content:center;align-items:center;height:1200px">
      <div style="width:780px;background:#fbfaf6;padding:36px 38px;font:15px 'DejaVu Sans Mono',monospace;color:#1d1d1d;transform:rotate(${[-1.4, 1.1, -0.7][i]}deg);box-shadow:0 20px 50px #0008;filter:contrast(.95) blur(.25px)">
        <div style="display:flex;justify-content:space-between"><div><b style="font-size:20px">${f.proveedor}</b><br>CUIT 30-71234567-8 · Ruta 14 km 750</div><div style="text-align:right"><b style="font-size:26px">FACTURA B</b><br>N° 0003-0001${i}482<br>Fecha 10/11/2026</div></div>
        <hr><div>Cliente: KIOSCO DON PEDRO · Condición: Contado</div><hr>
        <table style="width:100%;border-collapse:collapse;margin-top:8px">
          <tr style="border-bottom:1px solid #444"><th align=left>Cód.</th><th align=left>Descripción</th><th>Cant.</th><th>Precio</th><th>Importe</th></tr>${filas}
        </table>
        <style>td{padding:7px 4px;border-bottom:1px dashed #bbb}.n{text-align:right}th{padding:6px 4px}</style>
        <div style="text-align:right;margin-top:16px;font-size:20px"><b>TOTAL $ ${ar(total)}</b></div>
        <div style="margin-top:20px;font-size:12px">CAE 76543210987654 · Vto. CAE 20/11/2026</div>
      </div>
      <div style="position:fixed;inset:0;background:radial-gradient(circle at 70% 20%,transparent 40%,#0004);pointer-events:none"></div></body>`);
    await p.screenshot({ path: `tests/facturas/${f.archivo}`, type: "jpeg", quality: 72 });
  }
  await b.close();
})();
