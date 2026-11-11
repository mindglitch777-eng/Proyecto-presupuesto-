import React, { useMemo } from "react";
import { createTikTokStyleCaptions, type TikTokPage } from "@remotion/captions";
import { BODY } from "../lib/fuentes";
import type { Guion, Palabra } from "../lib/guion";

// Subtítulos estilo TikTok: máximo 3 palabras, la que se dice en amarillo y más grande.
// Se ocultan cuando ese mismo texto ya está gigante en pantalla.

/** Momentos donde el texto ya está enorme en pantalla y el subtítulo taparía algo. */
const OCULTOS: [number, number][] = [[4.05, 5.1], [26.3, 29.7]];

export function armarPaginas(g: Guion, palabras: Palabra[]): TikTokPage[] {
  const pages: TikTokPage[] = [];
  g.lineas.forEach((l, n) => {
    if (l.gigante) return;
    const ws = palabras.filter((p) => p.linea === n);
    if (!ws.length) return;
    const { pages: ps } = createTikTokStyleCaptions({
      captions: ws.map((w, i) => ({ text: (i ? " " : "") + w.texto, startMs: w.desde * 1000, endMs: w.hasta * 1000, timestampMs: w.desde * 1000, confidence: 1 })),
      combineTokensWithinMilliseconds: 400,
    });
    for (const p of ps) {
      for (let i = 0; i < p.tokens.length; i += 3) {
        const tk = p.tokens.slice(i, i + 3);
        const startMs = tk[0].fromMs;
        const next = p.tokens[i + 3];
        const endMs = next ? next.fromMs : Math.max(tk[tk.length - 1].toMs, startMs + 300);
        pages.push({ text: tk.map((x) => x.text).join(""), startMs, durationMs: endMs - startMs, tokens: tk });
      }
    }
  });
  return pages;
}

export const Subtitulos: React.FC<{ t: number; tv: number; g: Guion; palabras: Palabra[]; ocultos?: [number, number][] }> = ({ t, tv, g, palabras, ocultos = OCULTOS }) => {
  const pages = useMemo(() => armarPaginas(g, palabras), [g, palabras]);
  if (ocultos.some(([a, b]) => t > a && t < b)) return null;
  const ms = tv * 1000;
  const page = pages.find((p) => ms >= p.startMs && ms < p.startMs + p.durationMs + 150);
  if (!page) return null;
  return (
    <div style={{ left: 16, right: 16, top: 486, textAlign: "center" }}>
      <span style={{ position: "relative", display: "inline-block", padding: "6px 12px", borderRadius: 10, background: "#000c", font: `900 23px/1.15 ${BODY}`, color: "#fff", textShadow: "0 3px 0 #000" }}>
        {page.tokens.map((tk, j) => {
          const on = ms >= tk.fromMs && ms < tk.toMs + 60;
          return (
            <span key={j} style={{ position: "relative", display: "inline-block", margin: "0 4px", color: on ? "#FFB703" : "#fff", transform: on ? "scale(1.12)" : undefined }}>
              {tk.text.trim()}
            </span>
          );
        })}
      </span>
    </div>
  );
};
