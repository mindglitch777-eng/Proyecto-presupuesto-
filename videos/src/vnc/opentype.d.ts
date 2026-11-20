declare module "opentype.js" {
  export type Comando = { type: "M" | "L" | "Q" | "C" | "Z"; x: number; y: number; x1: number; y1: number; x2: number; y2: number };
  export interface Font { unitsPerEm: number; getPath(texto: string, x: number, y: number, size: number): { commands: Comando[] } }
  export function parse(buf: ArrayBuffer): Font;
  const opentype: { parse: typeof parse };
  export default opentype;
}
