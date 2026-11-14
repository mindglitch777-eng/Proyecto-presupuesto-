"use client";

import { useEffect, useState } from "react";
import { aBlob, dibujarCarteles, type ItemCartel, type TipoCartel } from "@/lib/carteles";
import { botonPrincipal, botonSecundario } from "../auth/Marco";

/** Muestra los carteles listos y los comparte por WhatsApp (o los descarga si el celular no puede compartir). */
export function Carteles({ items, negocio }: { items: ItemCartel[]; negocio: string }) {
  const [tipo, setTipo] = useState<TipoCartel>("hoja");
  const [urls, setUrls] = useState<string[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    let vivas: string[] = [];
    void (async () => {
      await document.fonts?.ready;
      const cvs = dibujarCarteles(items, tipo, negocio);
      vivas = await Promise.all(cvs.map(async (cv) => URL.createObjectURL(await aBlob(cv))));
      setUrls(vivas);
    })();
    return () => vivas.forEach((u) => URL.revokeObjectURL(u));
  }, [items, tipo, negocio]);

  async function compartir() {
    setAviso(null);
    try {
      const archivos = await Promise.all(urls.map(async (u, i) => new File([await (await fetch(u)).blob()], `precios-${tipo}-${i + 1}.png`, { type: "image/png" })));
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
      if (nav.canShare?.({ files: archivos })) {
        await nav.share({ files: archivos, title: "Precios nuevos" });
        return;
      }
      setAviso("Este celular no deja compartir directo. Tocá «Descargar» y mandalas desde la galería.");
    } catch (e) {
      if ((e as Error).name !== "AbortError") setAviso("No se pudo compartir. Probá con «Descargar».");
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-linea bg-white p-5" aria-label="Carteles">
      <h2 className="font-display text-[20px] font-bold">Tus carteles</h2>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de cartel">
        {([["hoja", "Hoja para imprimir"], ["estado", "Estado de WhatsApp"]] as [TipoCartel, string][]).map(([t, texto]) => (
          <button key={t} type="button" role="radio" aria-checked={tipo === t} onClick={() => setTipo(t)} className={`min-h-[48px] cursor-pointer rounded-xl border text-[15px] font-semibold ${tipo === t ? "border-verde bg-verde text-white" : "border-linea2 bg-white"}`}>{texto}</button>
        ))}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {urls.map((u, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={u} src={u} alt={`Cartel ${i + 1}`} className={`flex-none rounded-lg border border-linea shadow-sm ${tipo === "hoja" ? "w-[220px]" : "w-[150px]"}`} />
        ))}
      </div>
      <button type="button" onClick={compartir} disabled={!urls.length} className={botonPrincipal}>Mandar por WhatsApp</button>
      <div className="flex flex-col gap-2">
        {urls.map((u, i) => <a key={u} href={u} download={`precios-${tipo}-${i + 1}.png`} className={`${botonSecundario} text-center leading-[24px]`}>Descargar{urls.length > 1 ? ` (${i + 1} de ${urls.length})` : ""}</a>)}
      </div>
      {aviso ? <p className="text-[14px] text-g1">{aviso}</p> : null}
    </section>
  );
}
