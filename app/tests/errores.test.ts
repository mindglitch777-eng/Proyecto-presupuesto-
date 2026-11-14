import { describe, expect, it } from "vitest";
import { esArchivoViejo } from "@/components/errores/PantallaError";

// P-08: después de cada actualización, un celular con la app vieja abierta pide archivos que ya no existen.
describe("pantalla de error", () => {
  it("reconoce el error de 'app vieja' en Chrome, Safari y Firefox", () => {
    const e = (name: string, message: string) => Object.assign(new Error(message), { name });
    expect(esArchivoViejo(e("ChunkLoadError", "Loading chunk 123 failed."))).toBe(true);
    expect(esArchivoViejo(e("TypeError", "Failed to fetch dynamically imported module: https://x/_next/a.js"))).toBe(true);
    expect(esArchivoViejo(e("TypeError", "Importing a module script failed."))).toBe(true);
    expect(esArchivoViejo(e("TypeError", "error loading dynamically imported module"))).toBe(true);
  });
  it("no confunde otros errores con 'app vieja' (no recarga en loop)", () => {
    expect(esArchivoViejo(new Error("Cannot read properties of undefined"))).toBe(false);
    expect(esArchivoViejo(new Error("fetch failed"))).toBe(false);
  });
});
