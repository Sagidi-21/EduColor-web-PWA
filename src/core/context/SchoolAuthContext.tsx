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
  peekPendingSchoolName,
  takePendingSchoolName,
  signOut as supabaseSignOut,
} from "../../platform/supabase/auth";
import { getSupabase, isSupabaseConfigured } from "../../platform/supabase/client";
import type { School } from "../../platform/supabase/types";

interface SchoolAuthValue {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  schools: School[];
  primarySchool: School | null;
  refreshSchools: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SchoolAuthContext = createContext<SchoolAuthValue | null>(null);

async function syncPendingSchool(): Promise<void> {
  const pending = peekPendingSchoolName();
  if (!pending) return;
  const result = await ensureOwnerSchool(pending);
  if (result.ok) takePendingSchoolName();
}

export function SchoolAuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = useState(configured);
  const [session, setSession] = useState<Session | null>(null);
  const [schools, setSchools] = useState<School[]>([]);

  const refreshSchools = useCallback(async () => {
    if (!configured || !session) {
      setSchools([]);
      return;
    }
    const list = await fetchMySchools();
    setSchools(list);
  }, [configured, session]);

  useEffect(() => {
    if (!configured) return;

    const supabase = getSupabase();
    let cancelled = false;

    void supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      if (data.session) {
        await syncPendingSchool();
        const list = await fetchMySchools();
        if (!cancelled) setSchools(list);
      }
      if (!cancelled) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      void (async () => {
        setSession(next);
        if (next) {
          await syncPendingSchool();
          const list = await fetchMySchools();
          setSchools(list);
        } else {
          setSchools([]);
        }
        setLoading(false);
      })();
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [configured]);

  const signOut = useCallback(async () => {
    await supabaseSignOut();
    setSchools([]);
  }, []);

  const value = useMemo<SchoolAuthValue>(
    () => ({
      configured,
      loading,
      session,
      user: session?.user ?? null,
      schools,
      primarySchool: schools[0] ?? null,
      refreshSchools,
      signOut,
    }),
    [configured, loading, session, schools, refreshSchools, signOut],
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
