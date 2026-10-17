import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({})),
}));

describe("supabase client", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("isSupabaseConfigured es false sin env", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");
    const { isSupabaseConfigured } = await import("./client");
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("isSupabaseConfigured es true con env", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "test-key");
    const { isSupabaseConfigured } = await import("./client");
    expect(isSupabaseConfigured()).toBe(true);
  });

  it("pingSupabase ok cuando Auth health responde", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: true, status: 200 })),
    );
    const { pingSupabase } = await import("./client");
    const result = await pingSupabase();
    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/OK/i);
  });

  it("pingSupabase falla si Auth health no responde", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: false, status: 401 })),
    );
    const { pingSupabase } = await import("./client");
    const result = await pingSupabase();
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/401/);
  });
});
