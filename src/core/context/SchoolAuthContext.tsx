import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  ensureOwnerSchool,
  fetchMySchools,
  resolveSchoolNameForBootstrap,
  sessionHasAppAccess,
  takePendingSchoolName,
  signOut as supabaseSignOut,
} from "../../platform/supabase/auth";
import { getSupabase, isSupabaseConfigured } from "../../platform/supabase/client";
import { fetchMyRole } from "../../platform/supabase/teachers";
import type { School, SchoolRole } from "../../platform/supabase/types";

interface SchoolAuthValue {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  schools: School[];
  primarySchool: School | null;
  /** Rol en el colegio principal (owner / teacher). */
  schoolRole: SchoolRole | null;
  isOwner: boolean;
  /** Error al completar el alta del colegio (A10: no fallar en silencio). */
  schoolBootstrapError: string | null;
  refreshSchools: () => Promise<void>;
  retrySchoolBootstrap: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SchoolAuthContext = createContext<SchoolAuthValue | null>(null);

const BOOTSTRAP_MISSING_NAME =
  "No se pudo completar el alta del colegio. Cierra sesión e inténtalo de nuevo desde el registro.";

async function syncPendingSchool(): Promise<{ schools: School[]; error: string | null }> {
  let schools = await fetchMySchools();
  if (schools.length > 0) {
    return { schools, error: null };
  }

  const pending = await resolveSchoolNameForBootstrap();
  if (!pending) {
    // Sin marca de alta de colegio: no es un owner a medias (p. ej. docente sin membresía).
    return { schools, error: null };
  }

  const result = await ensureOwnerSchool(pending);
  if (!result.ok) {
    return { schools, error: result.message || BOOTSTRAP_MISSING_NAME };
  }
  takePendingSchoolName();
  schools = await fetchMySchools();
  if (schools.length === 0) {
    return {
      schools,
      error: "El colegio no aparece tras crearlo. Recarga la página o vuelve a iniciar sesión.",
    };
  }
  return { schools, error: null };
}

export function SchoolAuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = useState(configured);
  const [session, setSession] = useState<Session | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolRole, setSchoolRole] = useState<SchoolRole | null>(null);
  const [schoolBootstrapError, setSchoolBootstrapError] = useState<string | null>(null);

  const applySchools = useCallback(async (list: School[]) => {
    setSchools(list);
    const primary = list[0];
    if (!primary) {
      setSchoolRole(null);
      return;
    }
    const role = await fetchMyRole(primary.id);
    setSchoolRole(role);
  }, []);

  const refreshSchools = useCallback(async () => {
    if (!configured || !session) {
      setSchools([]);
      setSchoolRole(null);
      return;
    }
    const list = await fetchMySchools();
    await applySchools(list);
  }, [configured, session, applySchools]);

  const runBootstrap = useCallback(async () => {
    const { schools: next, error } = await syncPendingSchool();
    await applySchools(next);
    setSchoolBootstrapError(error);
  }, [applySchools]);

  useEffect(() => {
    if (!configured) return;

    const supabase = getSupabase();
    let cancelled = false;

    const adoptSession = async (next: Session | null) => {
      if (!next) {
        setSession(null);
        setSchools([]);
        setSchoolRole(null);
        setSchoolBootstrapError(null);
        return;
      }
      // No publicar sesión si el docente está desactivado / sin colegio (evita salto a Welcome).
      const allowed = await sessionHasAppAccess(next.user.id);
      if (!allowed) {
        try {
          await supabase.auth.signOut({ scope: "local" });
        } catch {
          // ignore
        }
        setSession(null);
        setSchools([]);
        setSchoolRole(null);
        setSchoolBootstrapError(null);
        return;
      }
      setSession(next);
      const { schools: list, error } = await syncPendingSchool();
      await applySchools(list);
      setSchoolBootstrapError(error);
    };

    void supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      await adoptSession(data.session);
      if (!cancelled) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      void (async () => {
        await adoptSession(next);
        setLoading(false);
      })();
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [configured, applySchools]);

  const signOut = useCallback(async () => {
    await supabaseSignOut();
    setSchools([]);
    setSchoolRole(null);
    setSchoolBootstrapError(null);
  }, []);

  const value = useMemo<SchoolAuthValue>(
    () => ({
      configured,
      loading,
      session,
      user: session?.user ?? null,
      schools,
      primarySchool: schools[0] ?? null,
      schoolRole,
      isOwner: schoolRole === "owner",
      schoolBootstrapError,
      refreshSchools,
      retrySchoolBootstrap: runBootstrap,
      signOut,
    }),
    [
      configured,
      loading,
      session,
      schools,
      schoolRole,
      schoolBootstrapError,
      refreshSchools,
      runBootstrap,
      signOut,
    ],
  );

  return <SchoolAuthContext.Provider value={value}>{children}</SchoolAuthContext.Provider>;
}

export function useSchoolAuth(): SchoolAuthValue {
  const ctx = useContext(SchoolAuthContext);
  if (!ctx) {
    throw new Error("useSchoolAuth debe usarse dentro de SchoolAuthProvider");
  }
  return ctx;
}
