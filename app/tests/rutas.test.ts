import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as anotarse } from "@/app/api/lista-espera/route";
import { POST as baja } from "@/app/api/baja/route";

const post = (url: string, cuerpo: unknown) => new Request(`http://localhost${url}`, { method: "POST", body: typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo) });
const valido = { nombre: "Marta", whatsapp: "3756 15 123456", rubro: "kiosco", numero_del_dia: 121111, utm_source: "tiktok", utm_content: "v5-01" };

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://demo.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "clave-de-servicio");
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/lista-espera", () => {
  it("guarda y devuelve el número de socio fundador", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify([{ numero: 7, ya_estaba: false }]), { status: 200 }));
    const res = await anotarse(post("/api/lista-espera", valido));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, numero: 7, yaEstaba: false });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://demo.supabase.co/rest/v1/rpc/anotarse_lista_espera");
    expect(init.headers.apikey).toBe("clave-de-servicio");
    const args = JSON.parse(init.body);
    expect(args).toMatchObject({ p_name: "Marta", p_whatsapp: "5493756123456", p_rubro: "kiosco", p_numero_del_dia: 121111, p_utm_source: "tiktok", p_utm_content: "v5-01" });
  });

  it("si el WhatsApp ya estaba anotado devuelve el mismo número", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify([{ numero: 7, ya_estaba: true }]), { status: 200 }));
    const res = await anotarse(post("/api/lista-espera", valido));
    expect(await res.json()).toEqual({ ok: true, numero: 7, yaEstaba: true });
  });

  it("rechaza datos inválidos con un mensaje claro y sin tocar la base", async () => {
    const res = await anotarse(post("/api/lista-espera", { ...valido, whatsapp: "123" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/WhatsApp/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rechaza un cuerpo que no es JSON", async () => {
    const res = await anotarse(post("/api/lista-espera", "esto no es json"));
    expect(res.status).toBe(400);
  });

  it("con el campo escondido lleno responde ok pero no guarda nada", async () => {
    const res = await anotarse(post("/api/lista-espera", { ...valido, web: "http://spam" }));
    expect(res.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sin variables de Supabase falla con 503 y lo marca como falta de configuración", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const res = await anotarse(post("/api/lista-espera", valido));
    expect(res.status).toBe(503);
    const j = await res.json();
    expect(j.config).toBe(true);
    expect(j.error).toMatch(/probá de nuevo/i);
    expect(console.error).toHaveBeenCalledWith("[lista-espera]", expect.stringContaining("SUPABASE_SERVICE_ROLE_KEY"));
  });

  it("si Supabase falla devuelve 500 sin filtrar el detalle", async () => {
    fetchMock.mockResolvedValue(new Response("boom secreto", { status: 500 }));
    const res = await anotarse(post("/api/lista-espera", valido));
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("secreto");
  });
});

describe("POST /api/baja", () => {
  it("devuelve el número de trámite", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify("AB12CD34"), { status: 200 }));
    const res = await baja(post("/api/baja", { whatsapp: "3756 15 123456" }));
    expect(await res.json()).toEqual({ ok: true, tramite: "AB12CD34" });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ p_whatsapp: "5493756123456" });
  });

  it("si el número no estaba, avisa con tramite null", async () => {
    fetchMock.mockResolvedValue(new Response("null", { status: 200 }));
    const res = await baja(post("/api/baja", { whatsapp: "3756 15 123456" }));
    expect(await res.json()).toEqual({ ok: true, tramite: null });
  });

  it("rechaza un WhatsApp inválido", async () => {
    const res = await baja(post("/api/baja", { whatsapp: "x" }));
    expect(res.status).toBe(400);
  });
});
