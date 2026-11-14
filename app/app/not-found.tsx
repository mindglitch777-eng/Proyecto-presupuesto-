import { MarcoAuth, botonPrincipal } from "@/components/auth/Marco";

export default function NoExiste() {
  return (
    <MarcoAuth titulo="Esta página no existe" bajada="Puede ser un link viejo o mal copiado.">
      <a href="/app" className={`${botonPrincipal} text-center no-underline`}>Ir a Tu día</a>
    </MarcoAuth>
  );
}
