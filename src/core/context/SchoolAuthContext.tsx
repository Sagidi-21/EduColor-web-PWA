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
import { fetchMyMembershipAvatar, fetchMyRole } from "../../platform/supabase/teachers";
import type { School, SchoolRole } from "../../platform/supabase/types";
import {
  isPasswordRecoveryActive,
  markPasswordRecoveryActive,
} from "../../features/auth/passwordRecovery";
import {
  OWNER_AVATAR_COLOR,
  OWNER_AVATAR_INITIALS,
  normalizeHexColor,
  teacherInitials,
} from "../../features/shared/teacherAvatar";

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
  /** HEX del avatar en el colegio principal. */
  avatarColor: string | null;
  /** Iniciales (OW si owner). */
  avatarInitials: string;
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
  const [avatarColor, setAvatarColor] = useState<string | null>(null);
  const [avatarInitials, setAvatarInitials] = useState("");
  const [schoolBootstrapError, setSchoolBootstrapError] = useState<string | null>(null);

  const applySchools = useCallback(async (list: School[], userId?: string | null) => {
    setSchools(list);
    const primary = list[0];
    if (!primary || !userId) {
      setSchoolRole(null);
      setAvatarColor(null);
      setAvatarInitials("");
      return;
    }
    const [role, membership] = await Promise.all([
      fetchMyRole(primary.id),
      fetchMyMembershipAvatar(primary.id, userId),
    ]);
    setSchoolRole(role);
    if (role === "owner" || membership?.role === "owner") {
      setAvatarColor(OWNER_AVATAR_COLOR);
      setAvatarInitials(OWNER_AVATAR_INITIALS);
      return;
    }
    setAvatarColor(normalizeHexColor(membership?.avatar_color) ?? null);
    setAvatarInitials(
      teacherInitials(membership?.first_name, membership?.last_name_1, null) || "?",
    );
  }, []);

  const refreshSchools = useCallback(async () => {
    if (!configured || !session) {
      setSchools([]);
      setSchoolRole(null);
      setAvatarColor(null);
      setAvatarInitials("");
      return;
    }
    const list = await fetchMySchools();
    await applySchools(list, session.user.id);
  }, [configured, session, applySchools]);

  const runBootstrap = useCallback(async () => {
    const { schools: next, error } = await syncPendingSchool();
    const uid = (await getSupabase().auth.getSession()).data.session?.user.id ?? null;
    await applySchools(next, uid);
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
        setAvatarColor(null);
        setAvatarInitials("");
        setSchoolBootstrapError(null);
        return;
      }
      // Recovery de contraseña: no expulsar la sesión (hace falta para updateUser).
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      if (hash.includes("type=recovery")) {
        markPasswordRecoveryActive();
      }
      if (isPasswordRecoveryActive()) {
        if (cancelled) return;
        setSchoolBootstrapError(null);
        setSession(next);
        void applySchools([], next.user.id);
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
        setAvatarColor(null);
        setAvatarInitials("");
        setSchoolBootstrapError(null);
        return;
      }
      // Colegios antes que session: el header no debe mostrar el placeholder de alta de owner.
      const { schools: list, error } = await syncPendingSchool();
      if (cancelled) return;
      await applySchools(list, next.user.id);
      setSchoolBootstrapError(error);
      setSession(next);
    };

    void supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      await adoptSession(data.session);
      if (!cancelled) setLoading(false);
    });

    // Diferir queries: dentro de onAuthStateChange el cliente Auth puede bloquearse
    // (lock) y dejar schools vacío → header «Completando alta del colegio…».
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      // Antes que AppShell: conservar sesión recovery para updateUser.
      if (event === "PASSWORD_RECOVERY") {
        markPasswordRecoveryActive();
      }
      window.setTimeout(() => {
        void (async () => {
          if (cancelled) return;
          await adoptSession(next);
          if (!cancelled) setLoading(false);
        })();
      }, 0);
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
    setAvatarColor(null);
    setAvatarInitials("");
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
      avatarColor,
      avatarInitials,
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
      avatarColor,
      avatarInitials,
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
