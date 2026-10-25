import { useEffect, useState, type ReactNode } from "react";
import { useClassProfile } from "../core/context/ClassProfileContext";
import { useSchoolAuth } from "../core/context/SchoolAuthContext";
import {
  DEMO_ACCENT_COLOR,
  clearLocalDemoFlags,
  enterLocalDemoFlags,
  normalizeLocalAccessFlags,
} from "../core/demo/demoMode";
import { AcceptInviteScreen } from "../features/auth/AcceptInviteScreen";
import { clearInviteFromUrl, readInviteTokenFromUrl } from "../features/auth/inviteUrl";
import { SchoolAccessScreen } from "../features/auth/SchoolAccessScreen";
import { SetPasswordScreen } from "../features/auth/SetPasswordScreen";
import { clearSetPasswordFromUrl, readSetPasswordFromUrl } from "../features/auth/setPasswordUrl";
import {
  MSG_RECOVERY_EXPIRED,
  clearPasswordRecoveryActive,
  isPasswordRecoveryActive,
  markPasswordRecoveryActive,
} from "../features/auth/passwordRecovery";
import { getSupabase, isSupabaseConfigured } from "../platform/supabase/client";
import { AdminHubScreen, type AdminView } from "../features/admin/AdminHubScreen";
import { WaitingApprovalScreen } from "../features/admin/WaitingApprovalScreen";
import { AuthBusyPlaceholder } from "./AuthBusyPlaceholder";
import { AuthenticatedSession } from "./AuthenticatedSession";
import { BootAccessFlow } from "./BootAccessFlow";

/**
 * Orquestación post-providers: invite, recovery, welcome/auth y sesión.
 * La lógica de negocio no cambia; solo se separa de App.tsx (SRP).
 */
export function AppShell() {
  const { activeAulaId, aulas, save } = useClassProfile();
  const {
    loading: authLoading,
    session,
    isPlatformAdmin,
    isActingAsSchool,
    schoolPendingApproval,
    leaveAdminSchool,
  } = useSchoolAuth();
  const [adminView, setAdminView] = useState<AdminView>("accepted");
  const [inviteToken, setInviteToken] = useState(() => readInviteTokenFromUrl());
  const [bootDone, setBootDone] = useState(false);
  const [authSkipped, setAuthSkipped] = useState(() => normalizeLocalAccessFlags().authSkipped);
  const [demoMode, setDemoMode] = useState(() => normalizeLocalAccessFlags().demoMode);
  const [forceAuth, setForceAuth] = useState(false);
  /** Tras Registrar Docente → abrir SchoolAccess en modo login (no registro). */
  const [preferLoginAccess, setPreferLoginAccess] = useState(false);
  /** Tras splash→auth: si la sesión llega tarde, saltar el gate. */
  const [awaitingAuthGate, setAwaitingAuthGate] = useState(false);
  /**
   * Solo tras PASSWORD_RECOVERY consumido (un uso).
   * `?setPassword=1` no abre la pantalla por sí solo (evita reutilizar el enlace).
   */
  const [setPasswordFlow, setSetPasswordFlow] = useState<{
    active: boolean;
    source: string;
    waiting: boolean;
    error: string;
  }>(() => {
    const fromUrl = readSetPasswordFromUrl();
    const resume = isPasswordRecoveryActive();
    return {
      active: resume,
      source: fromUrl.source || "forgot",
      waiting: fromUrl.active && !resume,
      error: "",
    };
  });

  useEffect(() => {
    const zoomKey = "educolor_zoom";
    const zoom = Number.parseFloat(localStorage.getItem(zoomKey) ?? "1.5") || 1.5;
    document.body.style.setProperty("zoom", String(zoom));
    document.body.style.setProperty("--zoom", String(zoom));
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;

    const activateRecovery = async () => {
      const {
        data: { session },
      } = await getSupabase().auth.getSession();
      if (cancelled) return;
      if (!session?.access_token) {
        clearPasswordRecoveryActive();
        clearSetPasswordFromUrl();
        setSetPasswordFlow({
          active: false,
          source: "forgot",
          waiting: false,
          error: MSG_RECOVERY_EXPIRED,
        });
        return;
      }
      markPasswordRecoveryActive();
      setSetPasswordFlow((prev) => ({
        active: true,
        source: prev.source || readSetPasswordFromUrl().source || "forgot",
        waiting: false,
        error: "",
      }));
    };

    const {
      data: { subscription },
    } = getSupabase().auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        void activateRecovery();
      }
    });

    const fromUrl = readSetPasswordFromUrl();
    let timeoutId: number | undefined;
    if (fromUrl.active && !isPasswordRecoveryActive()) {
      timeoutId = window.setTimeout(() => {
        if (cancelled) return;
        setSetPasswordFlow((prev) => {
          if (prev.active) return prev;
          clearSetPasswordFromUrl();
          return {
            active: false,
            source: "forgot",
            waiting: false,
            error: MSG_RECOVERY_EXPIRED,
          };
        });
      }, 8000);
    }

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  const canSkipAuth = !authLoading && (!!session || authSkipped);
  const showApp = bootDone || (awaitingAuthGate && canSkipAuth);

  const finishAuthGate = (skipped: boolean) => {
    if (skipped) {
      const flags = enterLocalDemoFlags();
      setAuthSkipped(flags.authSkipped);
      setDemoMode(flags.demoMode);
    } else {
      const flags = clearLocalDemoFlags();
      setAuthSkipped(flags.authSkipped);
      setDemoMode(flags.demoMode);
    }
    setForceAuth(false);
    setPreferLoginAccess(false);
    setBootDone(true);
  };

  const enterDemo = () => {
    save({ accentColor: DEMO_ACCENT_COLOR });
    finishAuthGate(true);
  };

  const exitDemoToRegister = () => {
    const flags = clearLocalDemoFlags();
    setAuthSkipped(flags.authSkipped);
    setDemoMode(flags.demoMode);
    setForceAuth(true);
  };

  const clearDemoSkip = () => {
    const flags = clearLocalDemoFlags();
    setAuthSkipped(flags.authSkipped);
    setDemoMode(flags.demoMode);
  };

  const renderSchoolAccess = (): ReactNode => {
    if (authLoading && !session) return <AuthBusyPlaceholder />;
    if (session) return <AuthBusyPlaceholder />;
    return (
      <SchoolAccessScreen
        onAuthenticated={() => finishAuthGate(false)}
        onContinueLocal={enterDemo}
        initialLoginMode={preferLoginAccess}
      />
    );
  };

  if (inviteToken) {
    return (
      <AcceptInviteScreen
        token={inviteToken}
        onGoToLogin={() => {
          setInviteToken(null);
          clearInviteFromUrl();
          const flags = clearLocalDemoFlags();
          setAuthSkipped(flags.authSkipped);
          setDemoMode(flags.demoMode);
          setPreferLoginAccess(true);
          setForceAuth(true);
          setBootDone(true);
        }}
      />
    );
  }

  if (setPasswordFlow.waiting) {
    return <AuthBusyPlaceholder />;
  }

  if (setPasswordFlow.error && !setPasswordFlow.active) {
    return (
      <SchoolAccessScreen
        onAuthenticated={() => {
          setSetPasswordFlow({
            active: false,
            source: "forgot",
            waiting: false,
            error: "",
          });
          finishAuthGate(false);
        }}
        onContinueLocal={enterDemo}
        initialLoginMode
        initialStatus={setPasswordFlow.error}
      />
    );
  }

  if (setPasswordFlow.active) {
    return (
      <SetPasswordScreen
        source={setPasswordFlow.source}
        onDone={() => {
          clearPasswordRecoveryActive();
          clearSetPasswordFromUrl();
          setSetPasswordFlow({
            active: false,
            source: "forgot",
            waiting: false,
            error: "",
          });
          const flags = clearLocalDemoFlags();
          setAuthSkipped(flags.authSkipped);
          setDemoMode(flags.demoMode);
          setPreferLoginAccess(true);
          setForceAuth(true);
          setBootDone(true);
        }}
      />
    );
  }

  const goToAuthOrApp = (navigate: (view: string, dir?: "left" | "right") => void) => {
    setAwaitingAuthGate(true);
    if (!authLoading && session) {
      clearDemoSkip();
      setBootDone(true);
      return;
    }
    clearDemoSkip();
    navigate("school-access", "right");
  };

  if (!showApp) {
    return (
      <BootAccessFlow onGoToAuthOrApp={goToAuthOrApp} renderSchoolAccess={renderSchoolAccess} />
    );
  }

  const wantsAuthGate = !session && (!authSkipped || forceAuth);

  if (wantsAuthGate) {
    return renderSchoolAccess();
  }

  if (session && isPlatformAdmin && !isActingAsSchool) {
    return <AdminHubScreen view={adminView} onChangeView={setAdminView} />;
  }

  if (session && schoolPendingApproval) {
    return <WaitingApprovalScreen />;
  }

  const activeAula = aulas.find((aula) => aula.id === activeAulaId) ?? aulas[0];
  const initialGradeId = activeAula.grade === 1 ? "grade-1" : "grade-2";

  return (
    <AuthenticatedSession
      initialGradeId={initialGradeId}
      demoMode={demoMode}
      onOpenSchoolAccess={() => setForceAuth(true)}
      onExitDemo={exitDemoToRegister}
      onBackToAdmin={
        isPlatformAdmin && isActingAsSchool
          ? () => {
              leaveAdminSchool();
              setAdminView("accepted");
            }
          : undefined
      }
    />
  );
}
