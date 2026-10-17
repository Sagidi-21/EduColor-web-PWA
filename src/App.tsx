import React, { useState } from "react";
import { ClassProfileProvider } from "./core/context/ClassProfileContext";
import { useClassProfile } from "./core/context/ClassProfileContext";
import { SchoolAuthProvider, useSchoolAuth } from "./core/context/SchoolAuthContext";
import { ViewTransition } from "./core/transition/ViewTransition";
import { SchoolAccessScreen } from "./features/auth/SchoolAccessScreen";
import { ConfiguracionScreen } from "./features/configuracion/ConfiguracionScreen";
import { ExerciseSessionProvider } from "./features/matematicas/ExerciseSessionContext";
import { ExerciseView } from "./features/matematicas/ExerciseView";
import { HomeScreen } from "./features/home/HomeScreen";
import { MatematicasCatalogScreen } from "./features/matematicas/MatematicasCatalogScreen";
import { SplashScreen } from "./features/splash/SplashScreen";
import { WelcomeScreen } from "./features/splash/WelcomeScreen";
import { FichaPreviewScreen } from "./features/ficha/FichaPreviewScreen";
import { FichaGeneratorScreen } from "./features/ficha/FichaGeneratorScreen";

const AUTH_SKIP_KEY = "educolor_auth_skip_local";

function isFichaPreviewRoute(): boolean {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  return path === "/ficha-preview" || path.endsWith("/ficha-preview");
}

function AuthBusyPlaceholder() {
  return <div className="school-access" style={{ background: "#0a1a4a" }} aria-busy="true" />;
}

function AppShell() {
  const { activeAulaId, aulas } = useClassProfile();
  const { loading: authLoading, session } = useSchoolAuth();
  const [bootDone, setBootDone] = useState(false);
  const [authSkipped, setAuthSkipped] = useState(
    () => sessionStorage.getItem(AUTH_SKIP_KEY) === "1",
  );
  const [forceAuth, setForceAuth] = useState(false);
  /** Tras splash→auth: si la sesión llega tarde, saltar el gate. */
  const [awaitingAuthGate, setAwaitingAuthGate] = useState(false);

  React.useEffect(() => {
    const zoomKey = "educolor_zoom";
    const zoom = Number.parseFloat(localStorage.getItem(zoomKey) ?? "1.5") || 1.5;
    document.body.style.setProperty("zoom", String(zoom));
    document.body.style.setProperty("--zoom", String(zoom));
  }, []);

  const canSkipAuth = !authLoading && (!!session || authSkipped);
  const showApp = bootDone || (awaitingAuthGate && canSkipAuth);

  const finishAuthGate = (skipped: boolean) => {
    if (skipped) {
      sessionStorage.setItem(AUTH_SKIP_KEY, "1");
      setAuthSkipped(true);
    } else {
      sessionStorage.removeItem(AUTH_SKIP_KEY);
      setAuthSkipped(false);
    }
    setForceAuth(false);
    setBootDone(true);
  };

  const renderSchoolAccess = () => {
    if (authLoading) return <AuthBusyPlaceholder />;
    if (session || authSkipped) return <AuthBusyPlaceholder />;
    return (
      <SchoolAccessScreen
        onAuthenticated={() => finishAuthGate(false)}
        onContinueLocal={() => finishAuthGate(true)}
      />
    );
  };

  const goToAuthOrApp = (navigate: (view: string, dir?: "left" | "right") => void) => {
    setAwaitingAuthGate(true);
    if (!authLoading && (session || authSkipped)) {
      setBootDone(true);
      return;
    }
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

  const activeAula = aulas.find((aula) => aula.id === activeAulaId) ?? aulas[0];
  const initialGradeId = activeAula.grade === 1 ? "grade-1" : "grade-2";

  return (
    <ExerciseSessionProvider>
      <ViewTransition
        initialView="home"
        views={{
          home: ({ navigate }) => (
            <HomeScreen onNavigate={navigate} onOpenSchoolAccess={() => setForceAuth(true)} />
          ),
          configuration: ({ navigate }) => (
            <ConfiguracionScreen
              onBack={() => navigate("home", "left")}
              onOpenSchoolAccess={() => setForceAuth(true)}
            />
          ),
          mathematics: ({ navigate }) => (
            <MatematicasCatalogScreen
              initialGradeId={initialGradeId}
              onBack={() => navigate("home", "left")}
            />
          ),
          generator: ({ navigate }) => (
            <FichaGeneratorScreen
              initialGradeId={initialGradeId}
              onBack={() => navigate("home", "left")}
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
  if (isFichaPreviewRoute()) {
    return (
      <div className="app">
        <FichaPreviewScreen />
      </div>
    );
  }

  return (
    <ClassProfileProvider>
      <SchoolAuthProvider>
        <div className="app">
          <AppShell />
        </div>
      </SchoolAuthProvider>
    </ClassProfileProvider>
  );
}
