import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Fuentes guardadas en public/fuentes (licencia SIL Open Font License), así el render no depende de internet.
// Space Grotesk e Inter son variables: un archivo cubre todos los pesos.
const cargar = (family: string, file: string, weight: string) =>
  loadFont({ family, url: staticFile(`fuentes/${file}`), weight, format: "woff2" }).catch((e) => console.error("[fuente]", family, e));

cargar("Space Grotesk", "SpaceGrotesk.woff2", "300 700");
cargar("Inter", "Inter.woff2", "100 900");
cargar("Permanent Marker", "PermanentMarker.woff2", "400");

export const DISP = `"Space Grotesk", system-ui, sans-serif`;
export const BODY = `"Inter", system-ui, sans-serif`;
export const MARKER = `"Permanent Marker", cursive`;
