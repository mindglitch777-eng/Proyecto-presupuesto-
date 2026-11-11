import React from "react";
import { I, eIn, eIO, lin, spring, win } from "../lib/anim";
import { BODY, DISP } from "../lib/fuentes";
import { ars } from "../lib/formato";
import { Icono } from "../components/Iconos";
import { TextoCinetico } from "./Dolor";

// Escenas 6 a 9: "Esto sí.", el celular 3D, la voz que hace la cuenta, las tarjetas y la foto a la factura.

const TITLES: [number, number, string][] = [
  [16, 19.5, "Le hablás y te hace la cuenta."],
  [19.5, 23, "Te dice qué hacer."],
  [23, 26.3, "Una foto y listo."],
];

export const EstoSi: React.FC<{ t: number }> = ({ t }) => {
  const o = win(t, 14.25, 16.1, 0.05, 0.4);
  if (o <= 0) return null;
  const s5 = spring(t - 14.3, 12, 0.5);
  return (
    <div style={{ left: 0, right: 0, top: 104, textAlign: "center", font: `700 96px/1 ${DISP}`, color: "#FFB703", opacity: o, transform: `scale(${1.5 - 0.5 * s5})`, filter: `blur(${(1 - Math.min(1, s5)) * 8}px)`, textShadow: "0 6px 0 #000, 0 0 40px #FFB70366" }}>
      Esto sí.
    </div>
  );
};

export const TitulosSolucion: React.FC<{ t: number }> = ({ t }) => {
  const ttl = TITLES.find((x) => t >= x[0] && t < x[1]);
  return (
    <>
      <div style={{ left: 20, top: 66, font: `800 12px ${BODY}`, letterSpacing: ".12em", color: "#FFB703", opacity: win(t, 16, 26.3, 0.2, 0.2) }}>EN CLARO</div>
      {ttl ? (
        <TextoCinetico
          key={ttl[0]}
          t={t}
          desde={ttl[0] + 0.05}
          paso={0.07}
          texto={ttl[2]}
          amarillas={[0]}
          style={{ left: 20, right: 20, top: 84, font: `700 30px/1.05 ${DISP}`, color: "#fff", opacity: win(t, ttl[0], ttl[1], 0.01, 0.2) }}
        />
      ) : null}
    </>
  );
};

const card = { background: "#143723", border: "1px solid #2f6a4b", borderRadius: 12 } as const;

const PantallaVoz: React.FC<{ t: number }> = ({ t }) => {
  const talk = t > 15.6 && t < 17.8;
  const txt = "“Hoy vendí 280 lucas, le pagué 150 al de las gaseosas y 8 de flete.”";
  const sr = spring(t - 17.9);
  return (
    <div style={{ inset: 0, opacity: win(t, 14, 19.7, 0.01, 0.25) }}>
      <div style={{ left: 14, top: 30, font: `700 13px ${DISP}`, color: "#fff" }}>Cierre de hoy</div>
      <div style={{ left: 57, top: 62, width: 46, height: 46, borderRadius: "50%", background: "#FFB703", display: "grid", placeItems: "center", transform: `scale(${talk ? 1 + 0.12 * Math.sin(t * 12) : 1})`, boxShadow: talk ? `0 0 0 ${8 + 6 * Math.sin(t * 12)}px #FFB70333` : "none" }}>
        <Icono nombre="mic" size={22} />
      </div>
      <div style={{ left: 14, right: 14, top: 120, height: 34, display: "flex", gap: 3, alignItems: "center", justifyContent: "center" }}>
        {Array.from({ length: 22 }, (_, i) => (
          <i key={i} style={{ position: "relative", width: 3, borderRadius: 2, background: "#FFB703", height: t > 15.8 && t < 17.8 ? Math.abs(Math.sin(t * 9 + i * 0.7) * Math.sin(t * 3.1 + i)) * 30 + 4 : 4 }} />
        ))}
      </div>
      <div style={{ left: 14, right: 14, top: 160, font: `500 11px/1.4 ${BODY}`, color: "#ffffffcc" }}>{txt.slice(0, Math.floor(I(t, 16, 17.8, 0, txt.length, lin)))}</div>
      <div style={{ ...card, left: 10, right: 10, top: 222, padding: 12, borderRadius: 14, opacity: Math.min(1, sr), transform: `translateY(${(1 - sr) * 30}px) scale(${0.9 + 0.1 * sr})` }}>
        <div style={{ position: "static", font: `600 10px ${BODY}`, color: "#9DB8A8", textTransform: "uppercase", letterSpacing: ".08em" }}>Hoy te quedaron</div>
        <div style={{ position: "static", font: `700 32px/1.1 ${DISP}`, color: "#FFB703", fontVariantNumeric: "tabular-nums" }}>{ars(I(t, 18, 18.8, 0, 85667))}</div>
        <div style={{ position: "static", font: `600 10px ${BODY}`, color: "#5FD39A", opacity: I(t, 18.9, 19.1, 0, 1) }}>▲ 8% vs. la semana pasada</div>
      </div>
    </div>
  );
};

const PantallaResumen: React.FC<{ t: number }> = ({ t }) => (
  <div style={{ inset: 0, opacity: win(t, 19.5, 23.2, 0.25, 0.25) }}>
    <div style={{ left: 14, top: 30, font: `700 13px ${DISP}`, color: "#fff" }}>Tu resumen</div>
    {[["#FF4D5A", "Marta debe hace 41 días"], ["#FFB703", "La gaseosa subió 8%"], ["#9DB8A8", "3 productos dormidos"]].map((r, i) => (
      <div key={i} style={{ ...card, left: 10, right: 10, top: 58 + i * 52, height: 44, font: `600 10.5px ${BODY}`, color: "#fff", display: "flex", alignItems: "center", padding: "0 10px", opacity: Math.min(1, spring(t - 19.6 - i * 0.12)) }}>
        <Icono nombre="punto" color={r[0]} size={12} />
        {r[1]}
      </div>
    ))}
    <div style={{ ...card, left: 10, right: 10, top: 220, height: 90, display: "flex", alignItems: "flex-end", gap: 5, padding: 10 }}>
      {[40, 55, 35, 70, 60, 80, 65].map((h, i) => (
        <i key={i} style={{ position: "relative", flex: 1, height: `${h * Math.min(1, spring(t - 19.8 - i * 0.05))}%`, borderRadius: 3, background: i === 5 ? "#FFB703" : "#2f6a4b" }} />
      ))}
    </div>
  </div>
);

const PantallaFoto: React.FC<{ t: number }> = ({ t }) => (
  <div style={{ inset: 0, opacity: win(t, 23, 26.6, 0.25, 0.1) }}>
    <div style={{ inset: 0, background: "#111" }} />
    <div style={{ left: 22, right: 22, top: 46, height: 150, background: "#f5f5f0", borderRadius: 4, padding: 10, color: "#333", font: `600 8px/1.7 ui-monospace,monospace`, opacity: 1 - I(t, 24.1, 24.3, 0, 0.6), transform: `scale(${1 - I(t, 24.1, 24.4, 0, 0.08)})` }}>
      <div style={{ position: "static", fontWeight: 800 }}>DISTRIBUIDORA NORTE · FACTURA B</div>
      <div style={{ position: "static" }}>Gaseosa 500 x12 ........ 18.000</div>
      <div style={{ position: "static" }}>Alfajor triple x24 ..... 21.600</div>
      <div style={{ position: "static" }}>Galletitas x10 ......... 9.400</div>
      <div style={{ position: "static" }}>Agua 1,5 L x6 ........... 7.800</div>
    </div>
    <div style={{ left: 18, right: 18, height: 3, background: "#FFB703", boxShadow: "0 0 14px #FFB703", top: I(t, 23.3, 24.1, 44, 196, eIO), opacity: win(t, 23.25, 24.2, 0.05, 0.1) }} />
    <div style={{ left: 16, right: 16, top: 40, height: 162, border: "2px solid #ffffff55", borderRadius: 8 }} />
    <div style={{ left: 10, right: 10, top: 212, height: 150, opacity: I(t, 24.1, 24.3, 0, 1) }}>
      {[["Gaseosa 500", "$2.000", "$2.160"], ["Alfajor triple", "$1.200", "$1.300"], ["Agua 1,5 L", "$1.800", "$1.950"]].map((r, i) => {
        const a = I(t, 24.3 + i * 0.22, 24.6 + i * 0.22, 0, 180, eIO);
        return (
          <div key={i} style={{ ...card, left: 0, right: 0, top: i * 44, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px", font: `600 10.5px ${BODY}`, color: "#fff" }}>
            <span style={{ position: "static" }}>{r[0]}</span>
            <span style={{ position: "relative", width: 62, height: 24, perspective: 200 }}>
              <b style={{ inset: 0, display: "grid", placeItems: "center", background: "#24503A", borderRadius: 6, backfaceVisibility: "hidden", color: "#ffffffaa", textDecoration: "line-through", transform: `rotateX(${a}deg)` }}>{r[1]}</b>
              <b style={{ inset: 0, display: "grid", placeItems: "center", background: "#FFB703", color: "#1A1200", borderRadius: 6, backfaceVisibility: "hidden", transform: `rotateX(${a - 180}deg)` }}>{r[2]}</b>
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

export const Celular3D: React.FC<{ t: number }> = ({ t }) => {
  const o = win(t, 14.1, 26.6, 0.05, 0.1);
  if (o <= 0) return null;
  const sp = spring(t - 14.15, 11, 0.55);
  const pull = I(t, 19.5, 20, 0, 1, eIO) * (1 - I(t, 22.8, 23.2, 0, 1, eIO));
  const exit = I(t, 25.9, 26.5, 0, 1, eIn);
  const ry = (1 - sp) * 70 - 14 + Math.sin(t * 0.8) * 5 + I(t, 23, 23.5, 0, 14, eIO);
  return (
    <div style={{ left: 85, top: 170, width: 190, height: 390, perspective: 900, opacity: o, transform: `translateY(${(1 - sp) * 520 + Math.sin(t * 1.5) * 4 + exit * 620}px) scale(${(0.7 + 0.3 * sp) * (1 - 0.18 * pull)}) rotate(${exit * 18}deg)` }}>
      <div style={{ inset: 0, borderRadius: 30, background: "#0b0b0b", boxShadow: "0 30px 60px #000c, 0 0 80px #FFB70322, inset 0 0 0 2px #2a2a2a", transformStyle: "preserve-3d", transform: `rotateY(${ry}deg) rotateX(${6 + Math.cos(t * 0.7) * 2}deg)` }}>
        <div style={{ left: 8, top: 8, right: 8, bottom: 8, borderRadius: 23, overflow: "hidden", background: "#0E2A1C" }}>
          <PantallaVoz t={t} />
          {t > 19.4 ? <PantallaResumen t={t} /> : null}
          {t > 22.9 ? <PantallaFoto t={t} /> : null}
          <div style={{ left: 60, right: 60, top: 6, height: 16, borderRadius: 9, background: "#000" }} />
          {/* reflejo del vidrio que se mueve con el giro */}
          <div style={{ left: -120 + ry * 4, top: -40, width: 60, height: 500, background: "linear-gradient(90deg,transparent,#ffffff12,transparent)", transform: "rotate(20deg)" }} />
        </div>
      </div>
    </div>
  );
};

const CARDS: [number, number, number, React.ReactNode][] = [
  [19.8, -76, -150, <>
    <div style={{ position: "static", font: `700 10px ${BODY}`, color: "#ffffffaa" }}><Icono nombre="punto" color="#FF4D5A" size={10} />FIADO · 41 días</div>
    <div style={{ position: "static", font: `700 16px ${DISP}` }}>Marta · $18.000</div>
    <div style={{ position: "static", marginTop: 6, display: "inline-block", background: "#25D366", color: "#062", font: `800 10px ${BODY}`, borderRadius: 999, padding: "4px 10px" }}>Recordar por WhatsApp</div>
  </>],
  [20.4, 76, -10, <>
    <div style={{ position: "static", font: `700 10px ${BODY}`, color: "#ffffffaa" }}><Icono nombre="punto" color="#FFB703" size={10} />SUBIÓ 8%</div>
    <div style={{ position: "static", font: `700 15px ${DISP}` }}>Gaseosa 500</div>
    <div style={{ position: "static", font: `700 22px ${DISP}`, color: "#FFB703" }}>Vendela a $2.160</div>
  </>],
  [21.0, -72, 150, <>
    <div style={{ position: "static", font: `700 10px ${BODY}`, color: "#ffffffaa" }}><Icono nombre="punto" color="#9DB8A8" size={10} />NO ROTAN</div>
    <div style={{ position: "static", font: `700 15px ${DISP}` }}>3 productos</div>
    <div style={{ position: "static", font: `700 22px ${DISP}`, color: "#FFB703" }}>$37.800 dormidos</div>
  </>],
];

export const InterfazExplotada: React.FC<{ t: number }> = ({ t }) => {
  if (t < 19.7 || t > 23.3) return null;
  return (
    <div style={{ left: 0, top: 0, width: 360, height: 640, perspective: 800 }}>
      {CARDS.map((c, i) => {
        const s = spring(t - c[0], 12, 0.5);
        const back = I(t, 22.7, 23.15, 0, 1, eIn);
        const k = Math.min(1, s) * (1 - back);
        return (
          <div
            key={i}
            style={{
              left: 100, top: 300, width: 160, padding: 12, borderRadius: 16, color: "#fff",
              background: "linear-gradient(160deg,#ffffff2e,#ffffff10)", border: "1px solid #ffffff44",
              boxShadow: "0 18px 40px #000a,inset 0 1px 0 #ffffff55", backdropFilter: "blur(8px)",
              opacity: win(t, c[0], 23.2, 0.05, 0.4),
              transform: `translate(${c[1] * k + Math.sin(t * 1.2 + i) * 3}px,${c[2] * k + Math.cos(t * 1.1 + i) * 4}px) rotateY(${(1 - k) * 40 + Math.sin(t + i) * 6}deg) scale(${0.3 + 0.7 * k})`,
            }}
          >
            {c[3]}
          </div>
        );
      })}
    </div>
  );
};

export const CartelImpreso: React.FC<{ t: number }> = ({ t }) => {
  const o = win(t, 25, 26.5, 0.05, 0.3);
  if (o <= 0) return null;
  const sct = spring(t - 25, 10, 0.5);
  return (
    <div style={{ left: 60, top: 196, width: 200, padding: 14, background: "#fff", color: "#111", borderRadius: 6, boxShadow: "0 20px 40px #0009", textAlign: "center", opacity: o, transform: `translate(${(1 - sct) * 20}px,${(1 - sct) * 180}px) scale(${0.3 + 0.75 * sct}) rotate(${-8 + (1 - sct) * 30}deg)` }}>
      <div style={{ position: "static", font: `700 14px ${DISP}`, letterSpacing: ".06em" }}>GASEOSA 500 ML</div>
      <div style={{ position: "static", font: `700 54px/1 ${DISP}`, color: "#C1121F" }}>$2.160</div>
      <div style={{ position: "static", font: `600 10px ${BODY}`, color: "#555" }}>precio actualizado · hecho con En Claro</div>
    </div>
  );
};
