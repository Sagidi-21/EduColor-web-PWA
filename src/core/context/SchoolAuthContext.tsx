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
import { fetchIsPlatformAdmin } from "../../platform/supabase/platformAdmin";
import { fetchMyMembershipAvatar, fetchMyRole } from "../../platform/supabase/teachers";
import type { School, SchoolRole } from "../../platform/supabase/types";
import {
  isPasswordRecoveryActive,
  markPasswordRecoveryActive,
} from "../../features/auth/passwordRecovery";
import { readSetPasswordFromUrl } from "../../features/auth/setPasswordUrl";
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
  /** Operador de la plataforma (Central admin). */
  isPlatformAdmin: boolean;
  /** Admin ha entrado en un colegio (modo OW). */
  isActingAsSchool: boolean;
  /** Colegio pendiente de aceptación (owner real, no admin). */
  schoolPendingApproval: boolean;
  /** HEX del avatar en el colegio principal. */
  avatarColor: string | null;
  /** Iniciales (OW si owner; AD si admin en hub). */
  avatarInitials: string;
  /** Error al completar el alta del colegio (A10: no fallar en silencio). */
  schoolBootstrapError: string | null;
  refreshSchools: () => Promise<void>;
  retrySchoolBootstrap: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Admin: entrar a un colegio como OW. */
  enterSchoolAsAdmin: (
    school: Pick<School, "id" | "name"> &
      Partial<
        Pick<School, "slug" | "created_at" | "updated_at" | "background_url" | "logo_ficha_url">
      >,
  ) => void;
  /** Admin: volver a la Central. */
  leaveAdminSchool: () => void;
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
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [actingSchool, setActingSchool] = useState<School | null>(null);

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
    // Admin en modo OW: recargar solo ese colegio (no la lista real del admin).
    if (actingSchool) {
      const { data } = await getSupabase()
        .from("schools")
        .select("*")
        .eq("id", actingSchool.id)
        .maybeSingle();
      if (data) {
        setActingSchool(data);
        setSchools([data]);
      }
      return;
    }
    const list = await fetchMySchools();
    await applySchools(list, session.user.id);
  }, [configured, session, applySchools, actingSchool]);

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
        setIsPlatformAdmin(false);
        setActingSchool(null);
        return;
      }
      // Recovery de contraseña: no expulsar la sesión (hace falta para updateUser).
      // Incluye ?setPassword=1 (redirect Netlify) y type=recovery en hash/query.
      if (typeof window !== "undefined" && readSetPasswordFromUrl().active) {
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
        setIsPlatformAdmin(false);
        setActingSchool(null);
        return;
      }
      const platformAdmin = await fetchIsPlatformAdmin();
      if (cancelled) return;
      setIsPlatformAdmin(platformAdmin);
      if (platformAdmin) {
        setActingSchool(null);
        setSchoolBootstrapError(null);
        await applySchools([], next.user.id);
        setAvatarColor(OWNER_AVATAR_COLOR);
        setAvatarInitials("AD");
        setSession(next);
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
    setIsPlatformAdmin(false);
    setActingSchool(null);
  }, []);

  const enterSchoolAsAdmin = useCallback(
    (
      school: Pick<School, "id" | "name"> &
        Partial<
          Pick<School, "slug" | "created_at" | "updated_at" | "background_url" | "logo_ficha_url">
        >,
    ) => {
      if (!isPlatformAdmin) return;
      const now = new Date().toISOString();
      const full: School = {
        id: school.id,
        name: school.name,
        slug: school.slug ?? null,
        status: "active",
        background_url: school.background_url ?? null,
        logo_ficha_url: school.logo_ficha_url ?? null,
        created_at: school.created_at ?? now,
        updated_at: school.updated_at ?? now,
      };
      setActingSchool(full);
      setSchools([full]);
      setSchoolRole("owner");
      setAvatarColor(OWNER_AVATAR_COLOR);
      setAvatarInitials(OWNER_AVATAR_INITIALS);
    },
    [isPlatformAdmin],
  );

  const leaveAdminSchool = useCallback(() => {
    setActingSchool(null);
    setSchools([]);
    setSchoolRole(null);
    setAvatarColor(OWNER_AVATAR_COLOR);
    setAvatarInitials("AD");
  }, []);

  const primarySchool = actingSchool ?? schools[0] ?? null;
  const schoolPendingApproval =
    !isPlatformAdmin &&
    !actingSchool &&
    Boolean(primarySchool?.status === "pending" || (schools[0] && schools[0].status === "pending"));
  const effectiveIsOwner = schoolRole === "owner" || Boolean(isPlatformAdmin && actingSchool);

  const value = useMemo<SchoolAuthValue>(
    () => ({
      configured,
      loading,
      session,
      user: session?.user ?? null,
      schools,
      primarySchool,
      schoolRole,
      isOwner: effectiveIsOwner,
      isPlatformAdmin,
      isActingAsSchool: Boolean(actingSchool),
      schoolPendingApproval,
      avatarColor,
      avatarInitials,
      schoolBootstrapError,
      refreshSchools,
      retrySchoolBootstrap: runBootstrap,
      signOut,
      enterSchoolAsAdmin,
      leaveAdminSchool,
    }),
    [
      configured,
      loading,
      session,
      schools,
      primarySchool,
      schoolRole,
      effectiveIsOwner,
      isPlatformAdmin,
      actingSchool,
      schoolPendingApproval,
      avatarColor,
      avatarInitials,
      schoolBootstrapError,
      refreshSchools,
      runBootstrap,
      signOut,
      enterSchoolAsAdmin,
      leaveAdminSchool,
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
