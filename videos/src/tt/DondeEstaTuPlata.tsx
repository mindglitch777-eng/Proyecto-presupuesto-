import React from "react";
import { Audio, Img, OffthreadVideo, Sequence, getStaticFiles, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import dialogo from "../../public/voces/tt-08/dialogo.json";
import { clamp, eIO } from "../lib/anim";
import { BODY, DISP, MARKER } from "../lib/fuentes";
import { guionSchema } from "../lib/guion";
import type { VideoProps } from "../Video";
import { Marco, temblor } from "../v6/comun";
import { entra, sp } from "../v8/comun";
import { CORAL, Kiosco, MOSTAZA, PAPEL, Pildora, SOMBRA, TINTA, Titulo, VERDE } from "./MatandoExplicado";
import { Pulso } from "./motion";

// Campaña "¿Dónde está tu plata?" (Meta + TikTok, 27/11/2026). Estilo explicado premium, voz enérgica (Fenrir) y la app de frente,
// sin girar, con zoom a lo importante. Tres videos: A "¿Dónde está tu plata?", B "Después te lo dejo", C "Cerraste… ¿ganaste?".
// Los montos son los de las pantallas reales de la demo (Fiados $380.000, Yerba $3.900 → cuesta $4.300, cierre $120.000 → $19.000).

export type Variante = "plata" | "fiado" | "cerraste";
type Canal = "meta" | "tiktok";
const FR = dialogo.frases as Record<string, { dur: number }>;
const dur = (id: string) => FR[id]?.dur ?? 1.5;
const g = guionSchema.parse({ id: "tt-08", titulo: "Dónde está tu plata", duracionSeg: 25, voz: null, ganchos: [{ lineas: ["", "", ""], voz: "" }], lineas: [], sonidos: [] });

const TXT: Record<string, string> = {
  p1: "¿Dónde está tu plata?", p2: "Vendiste todo el día, y en la caja, nada.", p3: "Una parte está acá: en el cuaderno de fiados.",
  p4: "Otra, acá: mercadería que hace meses no se vende.", p5: "Y otra se la llevó el proveedor: subió, y vos cobrás lo de antes.",
  p6: "En Claro te muestra las tres. En el celular. Todas las noches.", f1: "La frase más cara de tu kiosco.",
  f2: "Y vos anotás, y anotás. ¿Y cuándo es después?", f3: "En Claro te dice quién te debe, cuánto, y desde cuándo.",
  f4: "Y le mandás el recordatorio por WhatsApp. Sin pasar vergüenza.", g1: "Cerraste con $120.000. ¿Ganaste $120.000?",
  g2: "No. Esto es del proveedor.", g3: "Esto, gastos del día. Esto, alquiler y luz.", g4: "Y esto es tuyo.",
  g5: "Le hablás 20 segundos al celular, y te lo dice. Todas las noches.", cm: "Probalo 14 días gratis. Tocá Enviar mensaje y te lo dejo andando.",
  ct: "¿Y la tuya dónde está? Escribime, link en el perfil.", c1: "¡Después te lo dejo!",
};

/** Línea de tiempo: [clave, archivo de voz, aire después]. */
function linea(v: Variante, canal: Canal) {
  const cta = canal === "meta" ? "cm" : "ct";
  const pasos: [string, string, number][] =
    v === "plata" ? [["p1", "p1", 0.3], ["p2", "p2", 0.2], ["p3", "p3", 0.2], ["p4", "p4", 0.2], ["p5", "p5", 0.3], ["p6", "p6", 0.3], ["cta", cta, 0.5]]
    : v === "fiado" ? [["c1a", "c1", 0.15], ["f1", "f1", 0.25], ["c1b", "c1", 0.12], ["c1c", "c1", 0.2], ["f2", "f2", 0.25], ["f3", "f3", 0.2], ["f4", "f4", 0.3], ["cta", cta, 0.5]]
    : [["g1", "g1", 0.3], ["g2", "g2", 0.15], ["g3", "g3", 0.2], ["g4", "g4", 0.35], ["g5", "g5", 0.3], ["cta", cta, 0.5]];
  const T: Record<string, number> = {}, A: Record<string, string> = {};
  let c = 0.08;
  for (const [k, a, aire] of pasos) { T[k] = c; A[k] = a; c += dur(a) + aire; }
  return { T, A, keys: pasos.map((p) => p[0]), d: (k: string) => dur(A[k]), total: c + 0.4 };
}
export const durTT08 = (v: Variante, canal: Canal) => linea(v, canal).total;

const ap = (t: number, desde: number, dd = 0.35) => entra((t - desde) / dd);
const pesos = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

// ---------- piezas ----------
const Escena: React.FC<{ t: number; desde: number; hasta: number; children: React.ReactNode; zoom?: [number, number] }> = ({ t, desde, hasta, children, zoom = [1.04, 1] }) => {
  if (t < desde - 0.01 || t >= hasta + 0.3) return null;
  const kin = clamp((t - desde) / 0.32, 0, 1), kout = clamp((t - hasta) / 0.3, 0, 1);
  const z = zoom[0] + (zoom[1] - zoom[0]) * clamp((t - desde) / Math.max(0.5, hasta - desde), 0, 1);
  const y = desde < 0.05 ? 0 : (1 - eIO(kin)) * 640 - eIO(kout) * 640;
  return <div style={{ inset: 0, transform: `translateY(${y}px) scale(${z})`, filter: (kin > 0 && kin < 1 && desde > 0.05) || (kout > 0 && kout < 1) ? "blur(2px)" : undefined }}>{children}</div>;
};

/** Celular de frente (sin girar): captura nítida con zoom a un punto y un marco que la señala. */
const Telefono: React.FC<{ t: number; desde: number; src?: string; video?: { src: string; desde: number; vel: number }; foco?: [number, number, number]; marco?: [number, number, number, number]; aspecto?: number; fps: number; top?: number }> = ({ t, desde, src, video, foco = [0.5, 0.3, 1], marco, aspecto = 2340 / 1080, fps, top = 86 }) => {
  const W = 244, H = W * aspecto > 520 ? 520 : W * aspecto, w = H / aspecto;
  const s = sp(t - desde, 1.02, 14, 0.62);
  const kz = ap(t, desde + 0.5, 0.9);
  const z = 1 + (Math.min(foco[2], 1.18) - 1) * kz;
  const ox = (0.5 - foco[0]) * w * (z - 1), oy = (0.5 - foco[1]) * H * (z - 1);
  return (
    <div style={{ left: 180 - w / 2 - 9, top, width: w + 18, height: H + 18, borderRadius: 30, background: "#101418", boxShadow: "0 24px 50px rgba(27,35,51,.35), inset 0 0 0 2px #2b3138", transform: `translateY(${(1 - s) * 420}px)` }}>
      <div style={{ left: 9, top: 9, width: w, height: H, borderRadius: 22, overflow: "hidden", background: "#fff" }}>
        <div style={{ inset: 0, transform: `translate(${ox}px, ${oy}px) scale(${z})` }}>
          {src ? <Img src={staticFile(src)} style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 0" }} /> : null}
          {video ? (
            <Sequence from={Math.round(desde * fps)} layout="none">
              <OffthreadVideo src={staticFile(video.src)} startFrom={Math.round(video.desde * 30)} playbackRate={video.vel} muted style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 0" }} />
            </Sequence>
          ) : null}
          {marco && t > desde + 0.9 ? <div style={{ left: marco[0] * w, top: marco[1] * H, width: marco[2] * w, height: marco[3] * H, borderRadius: 10, border: `3px solid ${MOSTAZA}`, boxShadow: `0 0 0 ${4 + 3 * Math.sin(t * 8)}px ${MOSTAZA}55`, opacity: ap(t, desde + 0.9, 0.25) }} /> : null}
        </div>
              </div>
    </div>
  );
};

const Caja: React.FC<{ t: number; abre: number }> = ({ t, abre }) => {
  const k = ap(t, abre, 0.45);
  const polilla = t - abre - 0.35;
  return (
    <svg viewBox="0 0 300 260" width={300} height={260} style={{ left: 30, top: 250, overflow: "visible" }}>
      <ellipse cx={150} cy={250} rx={140} ry={8} fill={TINTA} opacity={0.14} />
      <rect x={60} y={10} width={180} height={64} rx={10} fill={TINTA} />
      <rect x={76} y={22} width={148} height={40} rx={6} fill="#0f1a12" />
      <text x={150} y={52} textAnchor="middle" fill="#7CF29A" style={{ font: `700 22px ${DISP}` }}>$ 0</text>
      <rect x={30} y={74} width={240} height={110} rx={12} fill={MOSTAZA} stroke={TINTA} strokeWidth={3} />
      {Array.from({ length: 12 }, (_, i) => <rect key={i} x={52 + (i % 6) * 34} y={92 + Math.floor(i / 6) * 30} width={24} height={20} rx={4} fill="#FFFDF8" stroke={TINTA} strokeWidth={1.5} />)}
      <g transform={`translate(0 ${k * 50})`}>
        <rect x={20} y={184} width={260} height={56} rx={6} fill="#C98B12" stroke={TINTA} strokeWidth={3} />
        <rect x={40} y={190} width={220} height={36} rx={3} fill="#5b4a2a" opacity={0.85 * k} />
        <rect x={130} y={228} width={40} height={6} rx={3} fill={TINTA} />
      </g>
      {polilla > 0 && polilla < 2.5 ? (
        <g transform={`translate(${150 + polilla * 40 + Math.sin(polilla * 9) * 14} ${200 - polilla * 120}) scale(${1 + 0.2 * Math.sin(polilla * 30)} 1)`}>
          <ellipse cx={-7} cy={0} rx={8} ry={5} fill="#9a8f7c" /><ellipse cx={7} cy={0} rx={8} ry={5} fill="#9a8f7c" /><ellipse cx={0} cy={0} rx={2.5} ry={6} fill="#5d554a" />
        </g>
      ) : null}
    </svg>
  );
};

const Cuaderno: React.FC<{ t: number; desde: number; renglones: [string, string][]; cada?: number; top?: number }> = ({ t, desde, renglones, cada = 0.28, top = 210 }) => (
  <div style={{ left: 36, top, width: 288, height: 300, borderRadius: 10, background: "#FFFDF4", boxShadow: SOMBRA, transform: "rotate(-2deg)" }}>
    <div style={{ left: 0, top: 0, bottom: 0, width: 26, background: CORAL, borderRadius: "10px 0 0 10px", opacity: 0.85 }} />
    <div style={{ left: 40, top: 14, font: `22px ${MARKER}`, color: TINTA }}>FIADOS</div>
    {Array.from({ length: 9 }, (_, i) => <div key={i} style={{ left: 30, right: 10, top: 56 + i * 27, height: 1.5, background: "#9cc3d5" }} />)}
    {renglones.map(([n, m], i) => {
      const k = clamp((t - desde - i * cada) / 0.22, 0, 1);
      if (k <= 0) return null;
      return (
        <div key={i} style={{ left: 40, right: 14, top: 36 + i * 27, height: 24, clipPath: `inset(0 ${(1 - k) * 100}% 0 0)` }}>
          <span style={{ position: "absolute", left: 0, font: `17px ${MARKER}`, color: TINTA }}>{n}</span>
          <span style={{ position: "absolute", right: 0, font: `17px ${MARKER}`, color: CORAL }}>{m}</span>
        </div>
      );
    })}
  </div>
);

const Estante: React.FC<{ t: number; desde: number }> = ({ t, desde }) => {
  const prods = [CORAL, MOSTAZA, VERDE, "#7FB8C9", TINTA, CORAL, VERDE, MOSTAZA];
  const billetes = [[1, 0], [4, 1], [6, 0], [2, 2], [5, 2]];
  return (
    <div style={{ left: 20, top: 200, width: 320, height: 330 }}>
      <div style={{ left: 0, top: 0, width: 320, height: 330, borderRadius: 8, background: "#E9DCC4", border: `3px solid ${TINTA}` }} />
      {[0, 1, 2].map((r) => (
        <React.Fragment key={r}>
          <div style={{ left: 0, width: 320, top: 100 + r * 106, height: 10, background: "#B98E57", borderTop: `3px solid ${TINTA}` }} />
          {prods.map((c, i) => <div key={i} style={{ left: 14 + i * 37, top: 100 + r * 106 - 62 + ((i + r) % 3) * 8, width: 30, height: 62 - ((i + r) % 3) * 8, borderRadius: 4, background: prods[(i + r * 3) % 8], border: `2px solid ${TINTA}`, filter: `saturate(${0.55}) brightness(.95)` }} />)}
        </React.Fragment>
      ))}
      {Array.from({ length: 26 }, (_, i) => { const x = (i * 97) % 300 + 10, y = ((i * 53) % 300) + 10 - ((t * 6 + i * 3) % 20); return <div key={i} style={{ left: x, top: y, width: 2.5, height: 2.5, borderRadius: 2, background: "#fff", opacity: 0.55 }} />; })}
      {billetes.map(([i, r], n) => {
        const k = ap(t, desde + 0.5 + n * 0.32, 0.25);
        if (k <= 0) return null;
        return (
          <div key={n} style={{ left: 10 + i * 37, top: 100 + r * 106 - 46, width: 48, height: 24, borderRadius: 3, background: "#8FD19E", border: `2px solid ${VERDE}`, transform: `rotate(${-12 + n * 7}deg) scale(${2 - sp(t - desde - 0.5 - n * 0.32, 1, 20, 0.6)})`, display: "flex", alignItems: "center", justifyContent: "center", font: `700 13px ${DISP}`, color: VERDE }}>
            $<div style={{ left: 14, top: -5, width: 22, height: 9, background: "#F3E7B3", opacity: 0.85 }} />
          </div>
        );
      })}
    </div>
  );
};

const Factura: React.FC<{ t: number; desde: number }> = ({ t, desde }) => {
  const sello = desde + 0.9, pierde = desde + 1.7;
  return (
    <>
      <div style={{ left: 26, top: 200, width: 168, height: 220, borderRadius: 6, background: "#FFFDF8", boxShadow: SOMBRA, transform: `rotate(-4deg) translateY(${(1 - ap(t, desde, 0.4)) * 300}px)` }}>
        <div style={{ left: 14, top: 14, font: `800 11px ${BODY}`, letterSpacing: 1.6, color: TINTA }}>FACTURA · PROVEEDOR</div>
        {[0, 1, 2].map((i) => <div key={i} style={{ left: 14, right: 30 + i * 14, top: 40 + i * 16, height: 6, borderRadius: 3, background: "#DDD6C8" }} />)}
        <div style={{ left: 14, top: 100, font: `700 14px ${BODY}`, color: TINTA }}>Yerba 1 kg</div>
        <div style={{ left: 14, top: 122, font: `800 11px ${BODY}`, color: TINTA, opacity: 0.6, letterSpacing: 1 }}>TE CUESTA</div>
        <div style={{ left: 14, top: 138, font: `700 30px ${DISP}`, color: TINTA }}>$4.300</div>
        {t >= sello ? <div style={{ left: 62, top: 54, padding: "2px 10px", border: `3px solid ${CORAL}`, borderRadius: 8, color: CORAL, font: `700 28px ${DISP}`, transform: `rotate(-14deg) scale(${2 - sp(t - sello, 1, 22, 0.7)})` }}>+21%</div> : null}
      </div>
      <svg viewBox="0 0 150 120" width={150} height={120} style={{ left: 196, top: 236, opacity: ap(t, desde + 0.3, 0.4) }}>
        <path d="M8 60 L42 10 H144 V110 H42 Z" fill={MOSTAZA} stroke={TINTA} strokeWidth={3} strokeLinejoin="round" />
        <circle cx={30} cy={60} r={7} fill={PAPEL} stroke={TINTA} strokeWidth={2} />
        <text x={92} y={50} textAnchor="middle" fill={TINTA} style={{ font: `800 10px ${BODY}`, letterSpacing: 1 }}>EN EL ESTANTE</text>
        <text x={92} y={82} textAnchor="middle" fill={TINTA} style={{ font: `700 28px ${DISP}` }}>$3.900</text>
      </svg>
      {t >= pierde ? (
        <div style={{ left: 20, right: 20, top: 448, height: 84, borderRadius: 18, background: CORAL, boxShadow: SOMBRA, transform: `scale(${sp(t - pierde, 1.06, 15, 0.55)})`, textAlign: "center" }}>
          <div style={{ left: 0, right: 0, top: 10, font: `800 12px ${BODY}`, letterSpacing: 1.4, color: "#fff", opacity: 0.85 }}>LA VENDÉS MÁS BARATA DE LO QUE TE CUESTA</div>
          <div style={{ left: 0, right: 0, top: 30, font: `700 36px ${DISP}`, color: "#fff" }}>−$400 cada una</div>
        </div>
      ) : null}
    </>
  );
};

const Pilas: React.FC<{ t: number; T: Record<string, number>; d: (k: string) => number }> = ({ t, T, d }) => {
  const partes = [
    { n: "MERCADERÍA", v: 78000, c: TINTA, en: T.g2 + 0.5 }, { n: "GASTOS", v: 5000, c: CORAL, en: T.g3 + 0.3 },
    { n: "ALQUILER Y LUZ", v: 18000, c: CORAL, en: T.g3 + d("g3") * 0.55 }, { n: "VOS", v: 19000, c: VERDE, en: T.g4 + 0.1 },
  ];
  const base = 520, esc = 300 / 120000;
  return (
    <>
      <div style={{ left: 20, right: 20, top: base, height: 3, background: TINTA, opacity: 0.4 }} />
      {partes.map((p, i) => {
        const k = ap(t, p.en, 0.5);
        const h = p.v * esc;
        const x0 = 130, x1 = 22 + i * 82;
        const yAcum = partes.slice(0, i).reduce((s, q) => s + q.v * esc, 0);
        const y0 = base - yAcum - h, y1 = base - h;
        const vos = p.n === "VOS" && t > p.en + 0.4;
        return (
          <React.Fragment key={i}>
            <div style={{ left: x0 + (x1 - x0) * k, top: y0 + (y1 - y0) * k, width: 70, height: h, borderRadius: 6, background: `repeating-linear-gradient(0deg, ${p.c === VERDE ? "#8FD19E" : "#A9D8B3"} 0 7px, ${p.c === VERDE ? VERDE : "#6FB083"} 7px 8px)`, border: `2.5px solid ${p.c === VERDE ? VERDE : "#3f7f52"}`, boxShadow: vos ? `0 0 ${18 + 8 * Math.sin(t * 7)}px ${VERDE}` : "0 4px 10px rgba(0,0,0,.12)" }} />
            {k > 0.6 ? (
              <>
                <div style={{ left: x1 - 10, width: 90, top: y1 - 40, textAlign: "center", font: `800 9px ${BODY}`, letterSpacing: 1, color: p.c, opacity: ap(t, p.en + 0.3) }}>{p.n}</div>
                <div style={{ left: x1 - 10, width: 90, top: y1 - 26, textAlign: "center", font: `700 15px ${DISP}`, color: p.c, opacity: ap(t, p.en + 0.3) }}>{pesos(p.v)}</div>
              </>
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  );
};

const Burbuja: React.FC<{ t: number; desde: number; texto: string; left: number; top: number; cola?: "izq" | "der"; color?: string; size?: number }> = ({ t, desde, texto, left, top, cola = "izq", color = "#fff", size = 22 }) => {
  if (t < desde) return null;
  const s = sp(t - desde, 1.1, 17, 0.5);
  return (
    <div style={{ left, top, transform: `scale(${s}) rotate(${cola === "izq" ? -3 : 3}deg)`, transformOrigin: cola === "izq" ? "0 100%" : "100% 100%" }}>
      <span style={{ position: "static", display: "inline-block", padding: "10px 16px", borderRadius: 20, background: color, boxShadow: SOMBRA, font: `700 ${size}px/1.1 ${DISP}`, color: TINTA, whiteSpace: "nowrap" }}>{texto}</span>
    </div>
  );
};

const Rastreador: React.FC<{ t: number; desde: number; hallados: [string, string, number][] }> = ({ t, desde, hallados }) => {
  if (t < desde) return null;
  return (
    <div style={{ left: 14, right: 14, top: 14, height: 54, borderRadius: 14, background: "#FFFDF8", boxShadow: SOMBRA, opacity: ap(t, desde), display: "flex" }}>
      {hallados.map(([ic, txt, en], i) => {
        const ok = t >= en;
        return (
          <div key={i} style={{ position: "relative", flex: 1, borderLeft: i ? "1px solid #1B233318" : undefined }}>
            <div style={{ left: 0, right: 0, top: 7, textAlign: "center", font: `800 8.5px ${BODY}`, letterSpacing: 1.2, color: TINTA, opacity: 0.6 }}>{ic}</div>
            <div style={{ left: 0, right: 0, top: 22, textAlign: "center", font: `700 ${ok ? 15 : 17}px ${DISP}`, color: ok ? CORAL : "#B9B2A4", transform: `scale(${ok ? sp(t - en, 1.15, 18, 0.5) : 1})` }}>{ok ? txt : "¿?"}</div>
          </div>
        );
      })}
    </div>
  );
};

const Cierre: React.FC<{ t: number; desde: number; canal: Canal; v: Variante }> = ({ t, desde, canal, v }) => (
  <div style={{ inset: 0, background: PAPEL }}>
    <div style={{ left: 0, right: 0, top: 96, textAlign: "center", opacity: ap(t, desde, 0.3) }}>
      <div style={{ position: "static", font: `700 46px ${DISP}`, color: TINTA, letterSpacing: -1 }}>En Claro</div>
      <div style={{ position: "static", font: `600 17px ${BODY}`, color: VERDE, marginTop: 4 }}>Tené claro tu negocio.</div>
    </div>
    <div style={{ left: 30, right: 30, top: 200, height: 220, borderRadius: 22, background: "#FFFDF8", boxShadow: SOMBRA, opacity: ap(t, desde + 0.15) }}>
      {[["Cuánta plata te quedó", 0], ["Quién te debe", 1], ["Qué mercadería no se vende", 2], ["Qué precio quedó viejo", 3]].map(([txt, i]) => (
        <div key={i as number} style={{ left: 22, right: 16, top: 22 + (i as number) * 47, display: "flex", alignItems: "center", gap: 10, opacity: ap(t, desde + 0.3 + (i as number) * 0.15), transform: `translateX(${(1 - ap(t, desde + 0.3 + (i as number) * 0.15)) * 30}px)` }}>
          <span style={{ position: "static", width: 26, height: 26, borderRadius: 13, background: VERDE, color: "#fff", font: `800 15px/26px ${BODY}`, textAlign: "center" }}>✓</span>
          <span style={{ position: "static", font: `700 17px ${BODY}`, color: TINTA }}>{txt}</span>
        </div>
      ))}
    </div>
    <Pildora t={t} desde={desde + 0.9} texto="14 DÍAS GRATIS" top={440} centro fondo={MOSTAZA} color={TINTA} size={16} />
    {canal === "meta" ? (
      <div style={{ left: 40, right: 40, top: 500, height: 60, borderRadius: 30, background: "#25D366", boxShadow: "0 6px 0 #0f8a43", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${t > desde + 1.2 ? sp(t - desde - 1.2, 1.08) * (1 + 0.03 * Math.sin(t * 7)) : 0})` }}>
        <span style={{ position: "static", font: `700 21px ${DISP}`, color: "#fff" }}>Enviar mensaje ➜</span>
      </div>
    ) : (
      <div style={{ left: 0, right: 0, top: 500, textAlign: "center", opacity: ap(t, desde + 1.2) }}>
        <span style={{ position: "static", display: "inline-block", padding: "12px 22px", borderRadius: 30, background: TINTA, font: `700 19px ${DISP}`, color: PAPEL }}>{v === "plata" ? "¿Y la tuya? 👇 link en el perfil" : "Link en el perfil 👆"}</span>
      </div>
    )}
  </div>
);

// ---------- video ----------
export const DondeEstaTuPlata: React.FC<VideoProps & { variante?: Variante; canal?: Canal }> = ({ variante = "plata", canal = "meta" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const { T, A, keys, d, total } = linea(variante, canal);
  const fin = (k: string) => T[k] + d(k);
  const sonidos: { en: number; sfx: string; vol?: number }[] = [];
  const golpes: [number, number][] = [];
  const W = (en: number) => sonidos.push({ en: en - 0.05, sfx: "whoosh", vol: 0.35 });
  let escenas: React.ReactNode = null;

  if (variante === "plata") {
    const ras: [string, string, number][] = [["FIADOS", "$380.000", T.p3 + 1.2], ["ESTANTE", "QUIETA", T.p4 + 1.4], ["PROVEEDOR", "−$400", T.p5 + 1.8]];
    escenas = (
      <>
        <Escena t={t} desde={0} hasta={T.p3}>
          <Titulo t={t} desde={-0.8} top={92} size={48} lineas={[["¿Dónde está", TINTA], ["tu plata?", CORAL]]} />
          <Caja t={t} abre={T.p2 + 0.3} />
          {t > T.p2 + 0.9 ? <Burbuja t={t} desde={T.p2 + 0.9} texto="vacía." left={230} top={520} cola="der" size={20} /> : null}
        </Escena>
        <Escena t={t} desde={T.p3} hasta={T.p4}>
          <Titulo t={t} desde={T.p3} top={92} size={34} lineas={[["1. En el cuaderno", TINTA], ["de fiados", CORAL]]} />
          <Cuaderno t={t} desde={T.p3 + 0.2} renglones={[["Marta", "$62.000"], ["Carlos", "$54.000"], ["Beto", "$39.000"], ["Juan", "$48.000"], ["Rosa", "$27.000"], ["y 5 más…", ""]]} />
          <Pildora t={t} desde={T.p3 + 1.2} texto="TE DEBEN $380.000" top={528} centro fondo={CORAL} color="#fff" size={16} />
        </Escena>
        <Escena t={t} desde={T.p4} hasta={T.p5}>
          <Titulo t={t} desde={T.p4} top={92} size={34} lineas={[["2. En el estante", TINTA], ["plata quieta", CORAL]]} />
          <Estante t={t} desde={T.p4} />
          <Pildora t={t} desde={T.p4 + 1.6} texto="HACE MESES QUE NO SE VENDE" top={546} centro fondo={TINTA} color={PAPEL} size={13} />
        </Escena>
        <Escena t={t} desde={T.p5} hasta={T.p6}>
          <Titulo t={t} desde={T.p5} top={92} size={34} lineas={[["3. Se la llevó", TINTA], ["el proveedor", CORAL]]} />
          <Factura t={t} desde={T.p5 + 0.1} />
        </Escena>
        <Escena t={t} desde={T.p6} hasta={T.cta} zoom={[1, 1]}>
          <div style={{ inset: 0, background: PAPEL }} />
          {[["fiados", "tomas/v8-02/app-inicio.jpg", [0.5, 0.12, 1.5], [0.03, 0.08, 0.94, 0.27]], ["deposito", "tomas/v8-03/app-final.jpg", [0.5, 0.25, 1.35], [0.03, 0.08, 0.94, 0.2]], ["precios", "tomas/v8-04/app-final.jpg", [0.5, 0.12, 1.5], [0.03, 0.08, 0.94, 0.22]]].map(([n, src, foco, marco], i) => {
            const a = T.p6 + (d("p6") / 3) * i, b = i < 2 ? T.p6 + (d("p6") / 3) * (i + 1) : T.cta;
            return t >= a && t < b ? <Telefono key={n as string} t={t} desde={i === 0 ? a : a - 0.6} src={src as string} foco={foco as [number, number, number]} marco={marco as [number, number, number, number]} fps={fps} /> : null;
          })}
          <Pildora t={t} desde={T.p6 + 0.2} texto={t < T.p6 + d("p6") / 3 ? "QUIÉN TE DEBE" : t < T.p6 + (2 * d("p6")) / 3 ? "LO QUE NO SE VENDE" : "LO QUE AUMENTÓ"} top={36} centro fondo={TINTA} color={PAPEL} size={14} />
        </Escena>
      </>
    );
    if (t < T.p6) escenas = <>{escenas}<Rastreador t={t} desde={T.p2 + 0.5} hallados={ras} /></>;
    [T.p3, T.p4, T.p5, T.p6, T.cta].forEach(W);
    sonidos.push({ en: 0, sfx: "slam", vol: 0.5 }, { en: T.p2 + 0.3, sfx: "cajon", vol: 0.55 }, { en: T.p2 + 0.65, sfx: "viento", vol: 0.3 });
    ras.forEach(([, , en]) => sonidos.push({ en, sfx: "ding", vol: 0.35 }));
    [0, 1, 2, 3, 4].forEach((i) => sonidos.push({ en: T.p3 + 0.2 + i * 0.28, sfx: "birome", vol: 0.3 }, { en: T.p4 + 0.5 + i * 0.32, sfx: "cinta", vol: 0.3 }));
    sonidos.push({ en: T.p5 + 1.0, sfx: "sello", vol: 0.6 }, { en: T.p5 + 1.8, sfx: "thump", vol: 0.5 }, { en: T.p6 + 0.05, sfx: "click", vol: 0.4 });
    golpes.push([0.02, 7], [T.p5 + 1.0, 5]);
  } else if (variante === "fiado") {
    const dias: [string, number][] = [["LUNES", T.c1a], ["MIÉRCOLES", T.c1b], ["VIERNES", T.c1c]];
    const prods = ["🥤", "🍪", "🧉"];
    escenas = (
      <>
        <Escena t={t} desde={0} hasta={T.f2} zoom={[1.03, 1]}>
          <Kiosco t={t} cierre={0} vida={1} luz={0} peligro={0} />
          {dias.map(([dia, en], i) => (t >= en - 0.05 && (i === 2 || t < dias[i + 1][1] - 0.05) ? (
            <React.Fragment key={dia}>
              <Pildora t={t} desde={en - 0.05} texto={dia} top={30} centro fondo={TINTA} color={PAPEL} size={14} />
              <Burbuja t={t} desde={en} texto="¡Después te lo dejo!" left={34} top={150} size={i === 0 ? 27 : 24} />
              <div style={{ left: 120 + (t - en) * 160, top: 420 - Math.sin(clamp((t - en) / 0.9, 0, 1) * Math.PI) * 90, fontSize: 44, opacity: t - en < 1 ? 1 : 0 }}>{prods[i]}</div>
            </React.Fragment>
          ) : null))}
          {t >= T.f1 ? <Titulo t={t} desde={T.f1} top={86} size={30} lineas={[["La frase más cara", TINTA], ["de tu kiosco.", CORAL]]} /> : null}
          {t >= T.c1b ? (
            <div style={{ left: 0, right: 0, top: 528, textAlign: "center", opacity: ap(t, T.c1b) }}>
              <span style={{ position: "static", display: "inline-block", padding: "8px 16px", borderRadius: 14, background: "#FFFDF4", boxShadow: SOMBRA, font: `20px ${MARKER}`, color: CORAL }}>Debe: {pesos(t < T.c1c ? 2500 : t < T.c1c + 0.6 ? 5300 : 8900)}</span>
            </div>
          ) : null}
        </Escena>
        <Escena t={t} desde={T.f2} hasta={T.f3}>
          <Titulo t={t} desde={T.f2} top={92} size={36} lineas={[["¿Y cuándo", TINTA], ["es después?", CORAL]]} />
          <Cuaderno t={t} desde={T.f2} cada={0.17} renglones={[["Marta", "$62.000"], ["Carlos", "$54.000"], ["Juan", "$48.000"], ["Beto", "$39.000"], ["Rosa", "$27.000"], ["Nico", "$21.000"], ["Sra. Ana", "$18.000"], ["Lucas", "$12.000"]]} />
        </Escena>
        <Escena t={t} desde={T.f3} hasta={T.cta} zoom={[1, 1]}>
          <div style={{ inset: 0, background: PAPEL }} />
          {t < T.f4 ? <Telefono t={t} desde={T.f3} src="tomas/v8-02/app-inicio.jpg" foco={[0.5, 0.2, 1.25]} marco={[0.03, 0.08, 0.94, 0.27]} fps={fps} />
            : <Telefono t={t} desde={T.f4 - 0.6} src="tomas/p3/app-final.jpg" foco={[0.5, 0.78, 1.45]} marco={[0.03, 0.83, 0.94, 0.09]} fps={fps} />}
          <Pildora t={t} desde={T.f3 + 0.2} texto={t < T.f4 ? "QUIÉN, CUÁNTO Y DESDE CUÁNDO" : "RECORDATORIO EN UN TOQUE"} top={36} centro fondo={TINTA} color={PAPEL} size={14} />
          {t >= T.f4 + 1.3 ? (
            <div style={{ left: 40, right: 40, top: 470, transform: `scale(${sp(t - T.f4 - 1.3, 1.06, 15, 0.55)})`, transformOrigin: "50% 100%" }}>
              <div style={{ position: "static", padding: "10px 12px", borderRadius: 14, background: "#DCF8C6", boxShadow: SOMBRA, font: `500 12.5px/1.35 ${BODY}`, color: "#111" }}>«Hola Marta, te recuerdo el saldo pendiente de $32.000. Cuando puedas, avisame. Gracias.» ✓✓</div>
            </div>
          ) : null}
        </Escena>
      </>
    );
    dias.forEach(([, en]) => sonidos.push({ en: en - 0.05, sfx: "ding", vol: 0.3 }, { en: en + 0.3, sfx: "whoosh", vol: 0.25 }));
    sonidos.push({ en: T.c1b + 0.1, sfx: "birome", vol: 0.35 }, { en: T.c1c + 0.6, sfx: "birome", vol: 0.35 });
    [T.f2, T.f3, T.f4 - 0.6, T.cta].forEach(W);
    [0, 1, 2, 3, 4, 5, 6, 7].forEach((i) => sonidos.push({ en: T.f2 + i * 0.17, sfx: "birome", vol: 0.22 }));
    sonidos.push({ en: T.f4 + 1.3, sfx: "click", vol: 0.45 }, { en: T.f4 + 1.4, sfx: "coins", vol: 0.35 });
    golpes.push([T.f2, 5]);
  } else {
    const persiana = ap(t, 0.0, 1.1) * 0.55;
    escenas = (
      <>
        <Escena t={t} desde={0} hasta={T.g2} zoom={[1.02, 1.06]}>
          <Kiosco t={t} cierre={persiana} vida={1} luz={0} peligro={0} />
          <Titulo t={t} desde={-0.8} top={84} size={36} lineas={[["Cerraste con", TINTA], ["$120.000.", VERDE]]} />
          {t >= T.g1 + d("g1") * 0.5 ? (
            <div style={{ left: 0, right: 0, top: 470, textAlign: "center", transform: `scale(${sp(t - T.g1 - d("g1") * 0.5, 1.1, 16, 0.5)})` }}>
              <span style={{ position: "static", display: "inline-block", padding: "10px 20px", borderRadius: 16, background: CORAL, boxShadow: SOMBRA, font: `700 27px ${DISP}`, color: "#fff" }}>¿Ganaste $120.000?</span>
            </div>
          ) : null}
        </Escena>
        <Escena t={t} desde={T.g2} hasta={T.g5} zoom={[1, 1]}>
          <div style={{ inset: 0, background: PAPEL }} />
          <Titulo t={t} desde={T.g2 - 0.1} top={70} size={30} lineas={t < T.g4 ? [["¿De quién es", TINTA], ["esta plata?", CORAL]] : [["Esto era", TINTA], ["tu ganancia.", VERDE]]} />
          <Pilas t={t} T={T} d={d} />
        </Escena>
        <Escena t={t} desde={T.g5} hasta={T.cta} zoom={[1, 1]}>
          <div style={{ inset: 0, background: PAPEL }} />
          {t < T.g5 + 2.6 ? <Telefono t={t} desde={T.g5} video={{ src: "tomas/fb-01/app.mp4", desde: 3.6, vel: 2 }} aspecto={1848 / 1080} fps={fps} foco={[0.5, 0.5, 1]} top={100} />
            : <Telefono t={t} desde={T.g5 + 2.6} src="tomas/fb-01/resultado.jpg" aspecto={1848 / 1080} foco={[0.5, 0.22, 1.35]} marco={[0.04, 0.1, 0.92, 0.38]} fps={fps} top={100} />}
          <Pildora t={t} desde={T.g5 + 0.2} texto={t < T.g5 + 2.6 ? "🎙  LE HABLÁS 20 SEGUNDOS" : "TU GANANCIA REAL"} top={40} centro fondo={TINTA} color={PAPEL} size={14} />
        </Escena>
      </>
    );
    sonidos.push({ en: 0, sfx: "metal", vol: 0.55 }, { en: T.g1 + d("g1") * 0.5, sfx: "slam", vol: 0.45 });
    [T.g2, T.g5, T.cta].forEach(W);
    [T.g2 + 0.5, T.g3 + 0.3, T.g3 + d("g3") * 0.55].forEach((en) => sonidos.push({ en, sfx: "coins", vol: 0.35 }));
    sonidos.push({ en: T.g4 + 0.1, sfx: "ding", vol: 0.45 }, { en: T.g5 + 2.6, sfx: "click", vol: 0.4 });
    golpes.push([0.02, 6], [T.g1 + d("g1") * 0.5, 5]);
  }

  const hablando = keys.find((k) => t >= T[k] && t < T[k] + d(k) + 0.1);
  const enCierre = t >= T.cta;
  const fondo = (
    <>
      <div style={{ inset: 0, background: PAPEL, backgroundImage: `radial-gradient(${TINTA}1c 1.2px, transparent 1.3px)`, backgroundSize: "22px 22px" }} />
      {escenas}
      {enCierre ? <Cierre t={t} desde={T.cta} canal={canal} v={variante} /> : null}
      {hablando && !enCierre ? (
        <div style={{ left: 16, right: 16, top: 592, textAlign: "center" }}>
          <span style={{ position: "static", display: "inline-block", padding: "6px 12px", borderRadius: 12, background: "rgba(27,35,51,.92)", font: `600 13.5px/1.3 ${BODY}`, color: "#fff" }}>{TXT[A[hablando]]}</span>
        </div>
      ) : null}
    </>
  );
  sonidos.push({ en: T.cta + 1.2, sfx: "ding", vol: 0.4 });

  const archivos = getStaticFiles().map((f) => f.name);
  const voces = keys.filter((k) => archivos.includes(`voces/tt-08/${A[k]}.mp3`)).map((k) => (
    <Sequence key={k} from={Math.round(T[k] * fps)} durationInFrames={Math.round((d(k) + 0.6) * fps)} layout="none">
      <Audio src={staticFile(`voces/tt-08/${A[k]}.mp3`)} />
    </Sequence>
  ));
  const sobre = (<>{voces}<Pulso fps={fps} fin={total} silencios={[]} vol={0.09} /></>);
  const hs = temblor(t, golpes);
  return <Marco g={g} voz={null} pal={[]} cam={{ z: 1, rot: 0, tx: 0, ty: 0, blur: 0 }} hs={hs} wf={0} red={0} frame={frame} t={t} sonidos={sonidos.filter((s) => s.en >= 0)} ocultos={[]} fondo={fondo} frente={null} sobre={sobre} />;
};
