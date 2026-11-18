import React from "react";

// Ilustración plana y adulta para la serie V8 "explicador financiero": línea gruesa, 2–3 colores de la marca En Claro.
// Nada de muñecos ni dibujitos: objetos del kiosco reconocibles al instante.

export const C = {
  verde: "#0e3b2a",
  hoja: "#16794a",
  ambar: "#f5a524",
  mostaza: "#e9a400",
  papel: "#f7f8f5",
  crema: "#fff4dc",
  tinta: "#0f1f17",
  rojo: "#d92d20",
  salvia: "#a9c7b5",
  rosa: "#f4b9b2",
};
const L = { stroke: C.tinta, strokeWidth: 5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

/** Frente de kiosco de barrio: toldo a rayas, cartel, vidriera con golosinas detrás de la reja y la puerta. */
export const Kiosco: React.FC<{ w: number; t: number; persiana?: number }> = ({ w, t, persiana = 0 }) => {
  const prod = ["#f5a524", "#d92d20", "#16794a", "#a9c7b5", "#f4b9b2", "#e9a400", "#16794a", "#d92d20"];
  return (
    <svg width={w} height={w * 0.92} viewBox="0 0 300 276" style={{ overflow: "visible" }}>
      {/* pared */}
      <rect x="14" y="78" width="272" height="190" rx="6" fill={C.crema} {...L} />
      {/* cartel */}
      <rect x="40" y="14" width="220" height="46" rx="8" fill={C.verde} {...L} />
      <text x="150" y="47" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontWeight={800} fontSize="28" fill={C.ambar} letterSpacing="3">KIOSCO</text>
      {/* toldo */}
      {Array.from({ length: 8 }, (_, i) => (
        <path key={i} d={`M${14 + i * 34} 64 h34 v26 a17 13 0 0 1 -34 0 z`} fill={i % 2 ? C.crema : C.hoja} {...L} strokeWidth={4} />
      ))}
      {/* vidriera con estantes y golosinas */}
      <rect x="32" y="116" width="150" height="120" rx="4" fill="#dfeee4" {...L} />
      {[0, 1, 2].map((f) => (
        <g key={f}>
          <line x1="34" x2="180" y1={150 + f * 34} y2={150 + f * 34} {...L} strokeWidth={4} />
          {Array.from({ length: 6 }, (_, k) => (
            <rect key={k} x={40 + k * 23} y={150 + f * 34 - 20 - ((k + f) % 2) * 4} width="17" height={20 + ((k + f) % 2) * 4} rx="3" fill={prod[(k + f * 3) % prod.length]} stroke={C.tinta} strokeWidth={2.5} />
          ))}
        </g>
      ))}
      {/* reja */}
      {Array.from({ length: 8 }, (_, i) => <line key={i} x1={44 + i * 18} x2={44 + i * 18} y1="116" y2="236" stroke={C.tinta} strokeWidth="3" />)}
      <line x1="32" x2="182" y1="176" y2="176" stroke={C.tinta} strokeWidth="3" />
      {/* persiana (baja si persiana > 0) */}
      {persiana > 0 ? (
        <g>
          <rect x="30" y="114" width="154" height={124 * persiana} fill="#b8bcb6" {...L} />
          {Array.from({ length: Math.floor(12 * persiana) }, (_, i) => <line key={i} x1="32" x2="182" y1={124 + i * 10} y2={124 + i * 10} stroke="#8a8f88" strokeWidth="2" />)}
        </g>
      ) : null}
      {/* puerta */}
      <rect x="200" y="116" width="66" height="152" rx="4" fill={C.hoja} {...L} />
      <rect x="210" y="128" width="46" height="62" rx="3" fill="#dfeee4" stroke={C.tinta} strokeWidth="3" />
      <circle cx="254" cy="208" r="5" fill={C.ambar} stroke={C.tinta} strokeWidth="2.5" />
      {/* luz de la vidriera que "respira" */}
      <rect x="34" y="118" width="146" height="116" fill="#fff6c8" opacity={0.18 + 0.08 * Math.sin(t * 3)} />
      {/* vereda */}
      <rect x="0" y="262" width="300" height="14" rx="4" fill="#cfd5cc" stroke={C.tinta} strokeWidth="4" />
    </svg>
  );
};

/** Góndola de almacén cargada (mercadería). */
export const Gondola: React.FC<{ w: number; t: number; vacia?: number }> = ({ w, t, vacia = 0 }) => {
  const prod = ["#f5a524", "#d92d20", "#16794a", "#a9c7b5", "#e9a400", "#f4b9b2"];
  return (
    <svg width={w} height={w * 0.9} viewBox="0 0 260 234">
      <rect x="10" y="10" width="240" height="214" rx="8" fill={C.papel} {...L} />
      {[0, 1, 2, 3].map((f) => (
        <g key={f}>
          <rect x="16" y={62 + f * 50} width="228" height="8" fill={C.verde} stroke={C.tinta} strokeWidth="3" />
          {Array.from({ length: 8 }, (_, k) => {
            const id = f * 8 + k;
            const sale = Math.max(0, Math.min(1, vacia * 34 - id));
            return (
              <rect key={k} x={22 + k * 28} y={62 + f * 50 - 34 + ((id * 7) % 3) * 3 - sale * 60} width="22" height={34 - ((id * 7) % 3) * 3} rx="3"
                fill={prod[id % prod.length]} stroke={C.tinta} strokeWidth="2.5" opacity={1 - sale} transform={`rotate(${Math.sin(t * 2 + id) * 1.2} ${33 + k * 28} ${62 + f * 50})`} />
            );
          })}
        </g>
      ))}
    </svg>
  );
};

/** Persiana metálica con candado y una lamparita encendida (alquiler y luz). */
export const PersianaLuz: React.FC<{ w: number; t: number }> = ({ w, t }) => (
  <svg width={w} height={w * 0.86} viewBox="0 0 280 240" style={{ overflow: "visible" }}>
    <rect x="10" y="20" width="170" height="210" rx="6" fill="#c3c7c0" {...L} />
    {Array.from({ length: 17 }, (_, i) => <line key={i} x1="14" x2="176" y1={34 + i * 11.5} y2={34 + i * 11.5} stroke="#8a8f88" strokeWidth="3" />)}
    <rect x="4" y="8" width="182" height="22" rx="6" fill="#9aa09a" {...L} />
    <rect x="78" y="186" width="34" height="28" rx="5" fill={C.ambar} {...L} strokeWidth={4} />
    <path d="M85 186 v-10 a10 10 0 0 1 20 0 v10" fill="none" {...L} strokeWidth={4} />
    {/* lamparita */}
    <g transform={`translate(226 ${92 + Math.sin(t * 2) * 3})`}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (i / 8) * Math.PI * 2;
        const r1 = 44, r2 = 56 + 4 * Math.sin(t * 6 + i);
        return <line key={i} x1={Math.cos(a) * r1} y1={Math.sin(a) * r1 - 6} x2={Math.cos(a) * r2} y2={Math.sin(a) * r2 - 6} stroke={C.mostaza} strokeWidth="5" strokeLinecap="round" />;
      })}
      <circle cx="0" cy="-6" r="30" fill="#ffe28a" {...L} />
      <rect x="-14" y="22" width="28" height="22" rx="4" fill="#9aa09a" {...L} strokeWidth={4} />
      <path d="M-9 -4 q9 14 18 0" fill="none" stroke={C.tinta} strokeWidth="3.5" strokeLinecap="round" />
    </g>
  </svg>
);

/** Billete plano (sale volando cuando el número baja). */
export const Billete: React.FC<{ w: number }> = ({ w }) => (
  <svg width={w} height={w * 0.5} viewBox="0 0 80 40">
    <rect x="2" y="2" width="76" height="36" rx="5" fill="#7cc79a" stroke={C.tinta} strokeWidth="3" />
    <circle cx="40" cy="20" r="9" fill={C.hoja} stroke={C.tinta} strokeWidth="2.5" />
    <rect x="9" y="9" width="10" height="5" rx="2" fill={C.hoja} />
    <rect x="61" y="26" width="10" height="5" rx="2" fill={C.hoja} />
  </svg>
);

/** El kiosquero, de medio cuerpo, plano y adulto: pelo canoso, bigote, camisa y delantal verde. `ceño` 0 tranquilo → 1 preocupado. */
export const Kiosquero: React.FC<{ w: number; t: number; ceno?: number }> = ({ w, t, ceno = 0 }) => {
  const parpadeo = (t % 3.1) > 2.98 ? 0.15 : 1;
  return (
    <svg width={w} height={w * 1.05} viewBox="0 0 120 126" style={{ overflow: "visible" }}>
      {/* hombros y camisa */}
      <path d="M8 126 q0 -40 52 -42 q52 2 52 42 z" fill="#9cc3e8" {...L} strokeWidth={4} />
      {/* delantal */}
      <path d="M34 126 v-30 q26 -10 52 0 v30 z" fill={C.hoja} stroke={C.tinta} strokeWidth="4" strokeLinejoin="round" />
      <rect x="52" y="104" width="16" height="8" rx="2" fill={C.crema} />
      {/* cuello y cabeza */}
      <rect x="51" y="70" width="18" height="16" fill="#e2a77f" stroke={C.tinta} strokeWidth="3.5" />
      <ellipse cx="60" cy="48" rx="27" ry="31" fill="#e8b48a" {...L} strokeWidth={4} />
      {/* pelo canoso */}
      <path d="M33 44 q2 -30 27 -30 q25 0 27 30 q-6 -14 -27 -16 q-21 2 -27 16 z" fill="#c9c9c4" stroke={C.tinta} strokeWidth="3.5" strokeLinejoin="round" />
      {/* cejas (se juntan cuando se preocupa) */}
      <path d={`M43 ${40 - 2 * ceno} l11 ${2 + 3 * ceno}`} stroke={C.tinta} strokeWidth="3.5" strokeLinecap="round" />
      <path d={`M77 ${40 - 2 * ceno} l-11 ${2 + 3 * ceno}`} stroke={C.tinta} strokeWidth="3.5" strokeLinecap="round" />
      {/* ojos */}
      <ellipse cx="49" cy="48" rx="3.2" ry={3.6 * parpadeo} fill={C.tinta} />
      <ellipse cx="71" cy="48" rx="3.2" ry={3.6 * parpadeo} fill={C.tinta} />
      {/* bigote y boca */}
      <path d="M46 62 q14 -8 28 0 q-14 5 -28 0 z" fill="#8f8f88" stroke={C.tinta} strokeWidth="2.5" strokeLinejoin="round" />
      <path d={`M52 ${70 + ceno} q8 ${-4 * ceno + 2} 16 0`} fill="none" stroke={C.tinta} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
};

/** Cuaderno de fiados abierto. Renglones con nombres y montos escritos a mano. */
export const Cuaderno: React.FC<{ w: number; t: number; renglones?: [string, string][]; tachado?: number }> = ({ w, t, renglones = [], tachado }) => (
  <svg width={w} height={w * 0.78} viewBox="0 0 320 250" style={{ overflow: "visible" }}>
    <rect x="6" y="14" width="308" height="226" rx="10" fill="#6b4a2b" {...L} />
    <rect x="18" y="8" width="140" height="222" rx="4" fill="#fffdf4" {...L} strokeWidth={4} />
    <rect x="162" y="8" width="140" height="222" rx="4" fill="#fffdf4" {...L} strokeWidth={4} />
    {Array.from({ length: 9 }, (_, i) => (
      <g key={i}>
        <line x1="24" x2="152" y1={38 + i * 22} y2={38 + i * 22} stroke="#9cc3e8" strokeWidth="1.6" />
        <line x1="168" x2="296" y1={38 + i * 22} y2={38 + i * 22} stroke="#9cc3e8" strokeWidth="1.6" />
      </g>
    ))}
    <line x1="40" x2="40" y1="12" y2="228" stroke="#f4b9b2" strokeWidth="2" />
    {renglones.slice(0, 9).map(([n, m], i) => (
      <g key={i} transform={`rotate(${((i * 37) % 5) - 2} ${90} ${34 + i * 22})`}>
        <text x="46" y={34 + i * 22} fontFamily="'Permanent Marker', cursive" fontWeight={700} fontSize="17" fill="#1d3b8a">{n}</text>
        <text x="296" y={34 + i * 22} textAnchor="end" fontFamily="'Permanent Marker', cursive" fontWeight={700} fontSize="17" fill="#1d3b8a">{m}</text>
      </g>
    ))}
    {tachado !== undefined ? <rect x="44" y={18} width={252} height={22} rx="4" fill="#ffffff" stroke="#c9c9c4" strokeWidth="2" opacity={1 - tachado} transform={`translate(${Math.sin(t * 40) * 1.2 * (1 - tachado)} 0)`} /> : null}
    <rect x="156" y="8" width="8" height="222" fill="#d9d2bf" />
  </svg>
);

/** Tapa del cuaderno cerrado (portada verde con etiqueta "FIADOS"). */
export const CuadernoCerrado: React.FC<{ w: number }> = ({ w }) => (
  <svg width={w} height={w * 1.3} viewBox="0 0 200 260" style={{ overflow: "visible" }}>
    <rect x="10" y="8" width="180" height="244" rx="10" fill={C.hoja} {...L} />
    <rect x="10" y="8" width="26" height="244" rx="8" fill={C.verde} {...L} strokeWidth={4} />
    <rect x="56" y="70" width="114" height="54" rx="6" fill={C.crema} {...L} strokeWidth={4} />
    <text x="113" y="106" textAnchor="middle" fontFamily="'Permanent Marker', cursive" fontWeight={700} fontSize="30" fill="#1d3b8a">FIADOS</text>
  </svg>
);

/** Burbuja de chat genérica (sin logos): verde clara (mía) o blanca (de otro). */
export const Burbuja: React.FC<{ texto: string; mia?: boolean; ancho?: number }> = ({ texto, mia = false, ancho = 250 }) => (
  <div style={{ position: "relative", width: ancho, padding: "10px 14px 18px", borderRadius: 18, borderTopLeftRadius: mia ? 18 : 4, borderTopRightRadius: mia ? 4 : 18, background: mia ? "#d9f5c9" : "#fff", border: `3px solid ${C.tinta}`, boxShadow: `0 5px 0 ${C.tinta}`, font: "700 21px/1.2 'Inter', sans-serif", color: C.tinta }}>
    <span style={{ position: "static" }}>{texto}</span>
    <span style={{ position: "absolute", right: 10, bottom: 3, font: "600 11px 'Inter', sans-serif", color: "#6b7a72" }}>21:4{texto.length % 10} ✓✓</span>
  </div>
);

/** Clienta de espaldas entrando con una bolsa enorme. `paso` mueve las piernas. */
export const Clienta: React.FC<{ w: number; paso: number }> = ({ w, paso }) => (
  <svg width={w} height={w * 1.6} viewBox="0 0 100 160" style={{ overflow: "visible" }}>
    <path d={`M38 112 l${-4 + 6 * Math.sin(paso)} 44`} stroke={C.tinta} strokeWidth="9" strokeLinecap="round" />
    <path d={`M60 112 l${4 - 6 * Math.sin(paso)} 44`} stroke={C.tinta} strokeWidth="9" strokeLinecap="round" />
    <path d="M22 118 q-2 -62 28 -66 q30 4 28 66 z" fill="#c2577a" {...L} strokeWidth={4} />
    <circle cx="50" cy="32" r="20" fill="#5a3b2a" {...L} strokeWidth={4} />
    <circle cx="50" cy="14" r="9" fill="#5a3b2a" {...L} strokeWidth={3} />
    <rect x="70" y="70" width="42" height="50" rx="6" fill={C.crema} {...L} strokeWidth={4} transform={`rotate(${Math.sin(paso) * 4} 76 70)`} />
    <path d="M78 72 q12 -18 26 0" fill="none" stroke={C.tinta} strokeWidth="4" />
    <rect x="76" y="58" width="10" height="16" rx="2" fill={C.ambar} stroke={C.tinta} strokeWidth="2" />
    <rect x="88" y="54" width="12" height="20" rx="2" fill={C.rojo} stroke={C.tinta} strokeWidth="2" />
    <rect x="100" y="60" width="8" height="14" rx="2" fill={C.hoja} stroke={C.tinta} strokeWidth="2" />
  </svg>
);

/** Recibo de alquiler con barra que se llena (`p` 0 → 1). */
export const Recibo: React.FC<{ w: number; p: number }> = ({ w, p }) => (
  <svg width={w} height={w * 1.35} viewBox="0 0 160 216">
    <path d="M8 6 h144 v196 l-12 8 l-12 -8 l-12 8 l-12 -8 l-12 8 l-12 -8 l-12 8 l-12 -8 l-12 8 l-12 -8 l-12 8 l-12 -8 z" fill="#fff" {...L} strokeWidth={4} />
    {[40, 54, 68].map((y) => <line key={y} x1="22" x2={y === 68 ? 100 : 138} y1={y} y2={y} stroke="#c9c9c4" strokeWidth="4" strokeLinecap="round" />)}
    <rect x="22" y="150" width="116" height="22" rx="6" fill="#eef1ec" stroke={C.tinta} strokeWidth="3" />
    <rect x="24" y="152" width={112 * p} height="18" rx="5" fill={C.rojo} />
  </svg>
);

/** Caja registradora abierta con el cajón lleno de billetes. */
export const CajaRegistradora: React.FC<{ w: number; t: number; abierta?: number }> = ({ w, t, abierta = 1 }) => (
  <svg width={w} height={w * 0.85} viewBox="0 0 260 220" style={{ overflow: "visible" }}>
    <path d="M40 30 h180 l14 96 h-208 z" fill={C.verde} {...L} />
    <rect x="70" y="40" width="120" height="34" rx="6" fill="#0b1f15" {...L} strokeWidth={4} />
    <text x="130" y="65" textAnchor="middle" fontFamily="'Space Grotesk', monospace" fontWeight={800} fontSize="22" fill="#7cf2a8">210.000</text>
    {Array.from({ length: 8 }, (_, i) => <rect key={i} x={58 + (i % 4) * 38} y={84 + Math.floor(i / 4) * 18} width="30" height="12" rx="3" fill={C.crema} stroke={C.tinta} strokeWidth="2.5" />)}
    <rect x="16" y="126" width="228" height="38" rx="6" fill={C.hoja} {...L} />
    <g transform={`translate(0 ${abierta * 40})`}>
      <rect x="26" y="150" width="208" height="40" rx="5" fill="#cfd5cc" {...L} />
      {Array.from({ length: 5 }, (_, i) => (
        <g key={i} transform={`translate(${36 + i * 40} ${154 - (i % 2) * 4 + Math.sin(t * 3 + i) * 1.5}) rotate(${(i % 3) - 1} 16 8)`}>
          <rect width="34" height="20" rx="3" fill="#7cc79a" stroke={C.tinta} strokeWidth="2.5" />
          <rect x="4" y="-6" width="34" height="20" rx="3" fill="#8fd3a9" stroke={C.tinta} strokeWidth="2.5" />
          <circle cx="21" cy="4" r="4" fill={C.hoja} />
        </g>
      ))}
    </g>
  </svg>
);

/** Reloj de pared. `hora` en horas decimales (7.25 = 7:15). */
export const Reloj: React.FC<{ w: number; hora: number }> = ({ w, hora }) => {
  const m = (hora % 1) * 360, h = ((hora % 12) / 12) * 360;
  return (
    <svg width={w} height={w} viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="54" fill="#fff" {...L} strokeWidth={6} />
      {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return <line key={i} x1={60 + Math.sin(a) * 42} y1={60 - Math.cos(a) * 42} x2={60 + Math.sin(a) * 48} y2={60 - Math.cos(a) * 48} stroke={C.tinta} strokeWidth={i % 3 ? 2.5 : 5} strokeLinecap="round" />; })}
      <line x1="60" y1="60" x2={60 + Math.sin((h * Math.PI) / 180) * 26} y2={60 - Math.cos((h * Math.PI) / 180) * 26} stroke={C.tinta} strokeWidth="7" strokeLinecap="round" />
      <line x1="60" y1="60" x2={60 + Math.sin((m * Math.PI) / 180) * 40} y2={60 - Math.cos((m * Math.PI) / 180) * 40} stroke={C.rojo} strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="60" cy="60" r="5" fill={C.tinta} />
    </svg>
  );
};

/** Camión de reparto genérico (sin marca). */
export const Camion: React.FC<{ w: number; t: number }> = ({ w, t }) => (
  <svg width={w} height={w * 0.55} viewBox="0 0 200 110" style={{ overflow: "visible" }}>
    <rect x="4" y="10" width="124" height="70" rx="6" fill={C.crema} {...L} />
    <text x="66" y="52" textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight={800} fontSize="17" fill={C.hoja}>PROVEEDOR</text>
    <path d="M128 30 h40 l26 26 v24 h-66 z" fill={C.hoja} {...L} />
    <rect x="140" y="38" width="26" height="20" rx="3" fill="#dfeee4" stroke={C.tinta} strokeWidth="3" />
    {[40, 160].map((x) => <g key={x} transform={`rotate(${t * 400} ${x} 86)`}><circle cx={x} cy="86" r="16" fill="#333" {...L} strokeWidth={4} /><line x1={x - 8} x2={x + 8} y1="86" y2="86" stroke="#bbb" strokeWidth="3" /></g>)}
  </svg>
);

/** Caja de mercadería del depósito con telarañas (`polvo` 0 → 1). */
export const CajaDeposito: React.FC<{ w: number; polvo: number; color?: string }> = ({ w, polvo, color = "#d9a86c" }) => (
  <svg width={w} height={w * 0.75} viewBox="0 0 120 90" style={{ overflow: "visible" }}>
    <rect x="4" y="10" width="112" height="76" rx="4" fill={color} {...L} strokeWidth={4} />
    <line x1="4" x2="116" y1="30" y2="30" stroke={C.tinta} strokeWidth="3" />
    <rect x="48" y="10" width="24" height="20" fill="#f0d9a8" stroke={C.tinta} strokeWidth="3" />
    <g opacity={polvo}>
      <path d="M4 10 q14 4 18 18 M4 10 q8 12 4 22 M4 10 l18 18 M10 13 q4 4 2 8 M14 16 q-2 6 -8 6" fill="none" stroke="#f7f8f5" strokeWidth="1.8" />
      <path d="M116 10 q-14 4 -18 18 M116 10 q-8 12 -4 22 M116 10 l-18 18 M110 13 q-4 4 -2 8" fill="none" stroke="#f7f8f5" strokeWidth="1.8" />
      <rect x="4" y="10" width="112" height="76" rx="4" fill="#8a8f88" opacity="0.35" />
    </g>
  </svg>
);

/** Productos de kiosco genéricos, sin marcas. */
export const Producto: React.FC<{ tipo: "alfajor" | "gaseosa" | "yerba" | "galletitas"; w: number }> = ({ tipo, w }) => (
  <svg width={w} height={w} viewBox="0 0 100 100" style={{ overflow: "visible" }}>
    {tipo === "alfajor" ? (
      <g>
        <ellipse cx="50" cy="66" rx="40" ry="14" fill="#5a3320" {...L} strokeWidth={4} />
        <rect x="10" y="44" width="80" height="22" fill="#5a3320" stroke="none" />
        <line x1="10" x2="10" y1="44" y2="66" {...L} strokeWidth={4} /><line x1="90" x2="90" y1="44" y2="66" {...L} strokeWidth={4} />
        <rect x="12" y="52" width="76" height="6" fill="#f3d6a4" />
        <ellipse cx="50" cy="44" rx="40" ry="14" fill="#6e4129" {...L} strokeWidth={4} />
        <path d="M28 42 q8 -6 16 0 M54 40 q8 -6 16 0" fill="none" stroke="#8a5a3c" strokeWidth="3" strokeLinecap="round" />
      </g>
    ) : tipo === "gaseosa" ? (
      <g>
        <path d="M42 8 h16 v12 q14 10 14 26 v42 q0 6 -6 6 h-32 q-6 0 -6 -6 v-42 q0 -16 14 -26 z" fill="#3c2a20" {...L} strokeWidth={4} />
        <rect x="40" y="2" width="20" height="9" rx="2" fill={C.rojo} {...L} strokeWidth={3} />
        <rect x="28" y="50" width="44" height="24" rx="3" fill={C.rojo} stroke={C.tinta} strokeWidth="3" />
        <path d="M34 62 q8 -8 16 0 q8 8 16 0" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
        <rect x="36" y="26" width="6" height="18" rx="3" fill="#ffffff55" />
      </g>
    ) : tipo === "yerba" ? (
      <g>
        <path d="M22 18 h56 v74 h-56 z" fill="#f2d24b" {...L} strokeWidth={4} />
        <path d="M22 18 l6 -10 h44 l6 10" fill="#e6c13a" {...L} strokeWidth={4} />
        <rect x="22" y="44" width="56" height="26" fill={C.hoja} stroke={C.tinta} strokeWidth="3" />
        <path d="M40 66 q10 -22 22 -18 q-4 14 -22 18 z" fill="#8fd3a9" stroke={C.tinta} strokeWidth="2.5" />
        <text x="50" y="86" textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight={800} fontSize="13" fill={C.tinta}>1 KG</text>
      </g>
    ) : (
      <g>
        <rect x="12" y="30" width="76" height="44" rx="10" fill="#4f7fbf" {...L} strokeWidth={4} />
        {[0, 1, 2].map((i) => <circle key={i} cx={32 + i * 18} cy="52" r="11" fill="#d9a86c" stroke={C.tinta} strokeWidth="3" />)}
        {[0, 1, 2].map((i) => <circle key={i} cx={32 + i * 18} cy="52" r="4" fill="#8a5a3c" />)}
        <path d="M12 40 l-6 -6 M12 64 l-6 6 M88 40 l6 -6 M88 64 l6 6" stroke={C.tinta} strokeWidth="4" strokeLinecap="round" />
      </g>
    )}
  </svg>
);
