import { describe, expect, it } from "vitest";
import { destino, emailValido, estadoDeClaims, rutaSegura, traducirError } from "@/lib/acceso";

describe("estadoDeClaims", () => {
  it("lee account_status del token", () => {
    expect(estadoDeClaims({ account_status: "trial" })).toBe("trial");
    expect(estadoDeClaims({ account_status: "expired" })).toBe("expired");
  });
  it("si no viene o es raro, devuelve null (no se sabe)", () => {
    expect(estadoDeClaims({})).toBeNull();
    expect(estadoDeClaims(null)).toBeNull();
    expect(estadoDeClaims({ account_status: "admin" })).toBeNull();
  });
});

describe("destino (a dónde va cada persona)", () => {
  it("sin sesión, la app manda a entrar y guarda a dónde quería ir", () => {
    expect(destino("/app", false, null)).toBe("/entrar?siguiente=%2Fapp");
    expect(destino("/app/cierre", false, null)).toBe("/entrar?siguiente=%2Fapp%2Fcierre");
  });
  it("con prueba o suscripción vigente entra", () => {
    for (const e of ["trial", "active", "past_due"] as const) expect(destino("/app", true, e)).toBeNull();
  });
  it("vencida, cancelada o bloqueada va a suscribirme", () => {
    for (const e of ["expired", "cancelled", "blocked"] as const) expect(destino("/app", true, e)).toBe("/suscribirme");
  });
  it("si el token no trae estado, deja pasar (la base igual protege)", () => {
    expect(destino("/app", true, null)).toBeNull();
  });
  it("quien ya tiene sesión no ve entrar ni registrarme", () => {
    expect(destino("/entrar", true, "trial")).toBe("/app");
    expect(destino("/registrarme", true, "expired")).toBe("/suscribirme");
  });
  it("suscribirme es solo para quien no tiene acceso", () => {
    expect(destino("/suscribirme", true, "expired")).toBeNull();
    expect(destino("/suscribirme", true, "trial")).toBe("/app");
    expect(destino("/suscribirme", false, null)).toBe("/entrar?siguiente=%2Fsuscribirme");
  });
  it("las páginas públicas no se tocan", () => {
    expect(destino("/", false, null)).toBeNull();
    expect(destino("/terminos", true, "expired")).toBeNull();
  });
});

describe("rutaSegura", () => {
  it("acepta rutas internas", () => expect(rutaSegura("/app/cierre")).toBe("/app/cierre"));
  it("rechaza otros sitios y trucos", () => {
    for (const mala of ["https://malo.com", "//malo.com", "/\\malo.com", "malo", "/app\r\nSet-Cookie: x", "", null, undefined]) {
      expect(rutaSegura(mala as string | null | undefined)).toBe("/app");
    }
  });
});

describe("traducirError", () => {
  it("traduce los errores comunes a lenguaje simple", () => {
    expect(traducirError({ code: "invalid_credentials", message: "Invalid login credentials" })).toBe("El mail o la contraseña no son correctos.");
    expect(traducirError({ message: "Email not confirmed" })).toContain("confirmaste tu mail");
    expect(traducirError({ code: "user_already_exists" })).toContain("Ya hay una cuenta");
    expect(traducirError({ code: "weak_password" })).toContain("8 caracteres");
    expect(traducirError({ code: "over_email_send_rate_limit" })).toContain("muchos mails");
    expect(traducirError({ message: "Failed to fetch" })).toContain("conexión");
    expect(traducirError({ message: "Auth session missing!" })).toContain("link venció");
  });
  it("nunca muestra el texto técnico", () => {
    expect(traducirError({ message: "SQLSTATE 23505 duplicate key value" })).toBe("No se pudo completar. Probá de nuevo en un rato.");
    expect(traducirError(null)).toBe("No se pudo completar. Probá de nuevo en un rato.");
  });
});

describe("emailValido", () => {
  it("valida lo básico", () => {
    expect(emailValido("ana@gmail.com")).toBe(true);
    expect(emailValido(" ana@gmail.com ")).toBe(true);
    for (const m of ["ana", "ana@", "@gmail.com", "ana@gmail", "a b@c.com"]) expect(emailValido(m)).toBe(false);
  });
});
