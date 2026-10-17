/**
 * Prueba de conexión real a Supabase (lee .env de la raíz).
 * Uso: node scripts/ping-supabase.mjs
 *
 * No consulta tablas: RLS deniega SELECT anónimo en schools (esperado).
 * Valida URL + Publishable key contra Auth health.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: resolve(root, ".env") });

const url = process.env.VITE_SUPABASE_URL?.trim()?.replace(/\/$/, "");
const key = process.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!url || !key) {
  console.error("FAIL: faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env");
  process.exit(1);
}

const health = await fetch(`${url}/auth/v1/health`, {
  headers: { apikey: key },
});

if (!health.ok) {
  console.error("FAIL: Auth health HTTP", health.status);
  process.exit(1);
}

// Confirma que el cliente JS acepta las mismas credenciales
createClient(url, key);

console.log("OK: conectado a Supabase (Auth responde). URL:", url);
process.exit(0);
