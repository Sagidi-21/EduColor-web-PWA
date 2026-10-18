import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Sin genérico Database: supabase-js ≥2.49 exige un shape de schema que nuestro
// types.ts mínimo no cumple (RPC/select caían en `never` y rompían `tsc -b` / pre-push).
// Los contratos de dominio siguen en `./types` para la app.
let client: SupabaseClient | null = null;

/** true si hay URL + Publishable key en el entorno Vite. */
export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && key);
}

/**
 * Cliente único de Supabase para el frontend.
 * Usa solo la Publishable / anon key (nunca la Secret).
 */
export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    throw new Error(
      "Supabase no configurado: faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env",
    );
  }

  client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return client;
}

/**
 * Comprueba que URL + Publishable key llegan al proyecto Auth.
 * No lee tablas: con RLS, anon no tiene SELECT en schools (eso es correcto).
 */
export async function pingSupabase(): Promise<{ ok: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY" };
  }
  const url = import.meta.env.VITE_SUPABASE_URL!.trim().replace(/\/$/, "");
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY!.trim();
  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key },
    });
    if (!res.ok) {
      return { ok: false, message: `Auth health HTTP ${res.status}` };
    }
    // Inicializa el cliente (misma URL/key) y confirma sesión local sin red extra
    getSupabase();
    return { ok: true, message: "Conexión OK (Auth responde)" };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Error desconocido al conectar",
    };
  }
}
