import React, { useState } from "react";
import { ClassProfileProvider } from "./core/context/ClassProfileContext";
import { useClassProfile } from "./core/context/ClassProfileContext";
import { SchoolAuthProvider, useSchoolAuth } from "./core/context/SchoolAuthContext";
import {
  DEMO_ACCENT_COLOR,
  clearLocalDemoFlags,
  enterLocalDemoFlags,
  normalizeLocalAccessFlags,
} from "./core/demo/demoMode";
import { isFichaPreviewAllowed, isFichaPreviewPath } from "./core/demo/fichaPreviewAccess";
import { ViewTransition } from "./core/transition/ViewTransition";
import { AcceptInviteScreen } from "./features/auth/AcceptInviteScreen";
import { clearInviteFromUrl, readInviteTokenFromUrl } from "./features/auth/inviteUrl";
import { SchoolAccessScreen } from "./features/auth/SchoolAccessScreen";
import { SetPasswordScreen } from "./features/auth/SetPasswordScreen";
import { clearSetPasswordFromUrl, readSetPasswordFromUrl } from "./features/auth/setPasswordUrl";
import {
  MSG_RECOVERY_EXPIRED,
  clearPasswordRecoveryActive,
  isPasswordRecoveryActive,
  markPasswordRecoveryActive,
} from "./features/auth/passwordRecovery";
import { getSupabase, isSupabaseConfigured } from "./platform/supabase/client";
import { ConfiguracionScreen } from "./features/configuracion/ConfiguracionScreen";
import { ProfesoradoScreen } from "./features/profesorado/ProfesoradoScreen";
import { ExerciseSessionProvider } from "./features/matematicas/ExerciseSessionContext";
import { ExerciseView } from "./features/matematicas/ExerciseView";
import { AdminHubScreen, type AdminView } from "./features/admin/AdminHubScreen";
import { WaitingApprovalScreen } from "./features/admin/WaitingApprovalScreen";
import { HomeScreen } from "./features/home/HomeScreen";
import { MatematicasCatalogScreen } from "./features/matematicas/MatematicasCatalogScreen";
import { SplashScreen } from "./features/splash/SplashScreen";
import { WelcomeScreen } from "./features/splash/WelcomeScreen";
import { FichaPreviewScreen } from "./features/ficha/FichaPreviewScreen";
import { FichaGeneratorScreen } from "./features/ficha/FichaGeneratorScreen";

function FichaPreviewUnavailable() {
  return (
    <main
      className="school-access"
      style={{
        background: "#0a1a4a",
        color: "#f8fafc",
        display: "grid",
        placeItems: "center",
        minHeight: "100vh",
        padding: "1.5rem",
        textAlign: "center",
      }}
    >
      <div>
        <h1>Ruta no disponible</h1>
        <p>La vista previa de fichas no está disponible en este entorno.</p>
        <p>
          <a href="/" style={{ color: "#93c5fd" }}>
            Volver a EduColor
          </a>
        </p>
      </div>
    </main>
  );
}

function AuthBusyPlaceholder() {
  return <div className="school-access" style={{ background: "#0a1a4a" }} aria-busy="true" />;
}

function AppShell() {
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

  React.useEffect(() => {
    const zoomKey = "educolor_zoom";
    const zoom = Number.parseFloat(localStorage.getItem(zoomKey) ?? "1.5") || 1.5;
    document.body.style.setProperty("zoom", String(zoom));
    document.body.style.setProperty("--zoom", String(zoom));
  }, []);

  React.useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;

    const activateRecovery = async () => {
      const {
        data: { session },
      } = await getSupabase().auth.getSession();
      if (cancelled) return;
      if (!session?.access_token) {
        // Sin sesión: el verify de Auth falló (enlace caducado o quemado por filtro de correo).
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
      // No consumir aquí: Auth ya hace un solo uso del verify. Consumimos tras guardar.
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

    // Si aterrizamos con ?setPassword=1, esperamos el evento recovery del hash.
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
      // Contención: skip sin cuenta siempre implica DEMO (nunca catálogo completo).
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

  const renderSchoolAccess = () => {
    // No desmontar el login si hay un flash de sesión (p. ej. docente rechazado):
    // si no, se pierde el error y ViewTransition vuelve a Welcome.
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

  // Mientras haya ?invite=, mantener Registrar Docente (también tras el alta,
  // cuando Auth ya tiene sesión: si no, se desmonta y no se ve el popup de éxito).
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
    // Mantener el error en estado: si se limpia al montar, caemos en Welcome.
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
    // Solo sesión real salta el acceso; DEMO no se reabre sola tras Welcome.
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
      <ViewTransition
        initialView="welcome"
        views={{
          welcome: ({ navigate }) => (
            <WelcomeScreen
              onEnterWithVideo={() => navigate("splash", "right")}
              onEnterWithoutVideo={() => goToAuthOrApp(navigate)}
            />
          ),
          splash: ({ navigate }) => <SplashScreen onDone={() => goToAuthOrApp(navigate)} />,
          "school-access": () => renderSchoolAccess(),
        }}
      />
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
    <ExerciseSessionProvider>
      <ViewTransition
        initialView="home"
        views={{
          home: ({ navigate }) => (
            <HomeScreen
              onNavigate={navigate}
              onOpenSchoolAccess={() => setForceAuth(true)}
              demoMode={demoMode}
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
          ),
          configuration: ({ navigate }) =>
            demoMode ? (
              // DEMO: no configuración (tampoco vía consola / navigate manual).
              <HomeScreen onNavigate={navigate} demoMode onExitDemo={exitDemoToRegister} />
            ) : (
              <ConfiguracionScreen onBack={() => navigate("home", "left")} onNavigate={navigate} />
            ),
          profesorado: ({ navigate }) =>
            demoMode ? (
              <HomeScreen onNavigate={navigate} demoMode onExitDemo={exitDemoToRegister} />
            ) : (
              <ProfesoradoScreen onBack={() => navigate("configuration", "left")} />
            ),
          mathematics: ({ navigate }) => (
            <MatematicasCatalogScreen
              initialGradeId={initialGradeId}
              onBack={() => navigate("home", "left")}
              demoMode={demoMode}
            />
          ),
          generator: ({ navigate }) => (
            <FichaGeneratorScreen
              initialGradeId={initialGradeId}
              onBack={() => navigate("home", "left")}
              demoMode={demoMode}
            />
          ),
          exercise: ({ navigate }) => (
            <ExerciseView onExit={() => navigate("mathematics", "left")} />
          ),
        }}
      />
    </ExerciseSessionProvider>
  );
}

export default function App() {
  if (isFichaPreviewPath(window.location.pathname)) {
    if (!isFichaPreviewAllowed()) {
      return (
        <div className="app">
          <FichaPreviewUnavailable />
        </div>
      );
    }
    return (
      <div className="app">
        <FichaPreviewScreen />
      </div>
    );
  }

  return (
    <SchoolAuthProvider>
      <ClassProfileProvider>
        <div className="app">
          <AppShell />
        </div>
      </ClassProfileProvider>
    </SchoolAuthProvider>
  );
}
