import { beforeEach, describe, expect, it, vi } from "vitest";

describe("slugifySchoolName", () => {
  it("normaliza acentos y espacios", async () => {
    const { slugifySchoolName } = await import("./auth");
    expect(slugifySchoolName("CEIP Los Olivos")).toBe("ceip-los-olivos");
    expect(slugifySchoolName("  Colégio Ávila  ")).toBe("colegio-avila");
  });
});

describe("signInWithPassword", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("falla si Supabase no está configurado", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");
    const { signInWithPassword } = await import("./auth");
    const result = await signInWithPassword("a@b.com", "secret1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/no está configurado/i);
  });
});
