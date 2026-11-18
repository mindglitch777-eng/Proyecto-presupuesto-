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
