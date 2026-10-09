import React, { useState } from "react";
import { ClassProfileProvider } from "./core/context/ClassProfileContext";
import { useClassProfile } from "./core/context/ClassProfileContext";
import { ViewTransition } from "./core/transition/ViewTransition";
import { ConfiguracionScreen } from "./features/configuracion/ConfiguracionScreen";
import { ExerciseSessionProvider } from "./features/matematicas/ExerciseSessionContext";
import { ExerciseView } from "./features/matematicas/ExerciseView";
import { HomeScreen } from "./features/home/HomeScreen";
import { MatematicasCatalogScreen } from "./features/matematicas/MatematicasCatalogScreen";
import { SplashScreen } from "./features/splash/SplashScreen";
import { WelcomeScreen } from "./features/splash/WelcomeScreen";
import { FichaPreviewScreen } from "./features/ficha/FichaPreviewScreen";

function isFichaPreviewRoute(): boolean {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  return path === "/ficha-preview" || path.endsWith("/ficha-preview");
}

function AppShell() {
  const { activeAulaId, aulas } = useClassProfile();
  const [welcomeDone, setWelcomeDone] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  // Aplicar zoom por defecto al inicio
  React.useEffect(() => {
    const zoomKey = "educolor_zoom";
    const zoom = Number.parseFloat(localStorage.getItem(zoomKey) ?? "1.5") || 1.5;
    document.body.style.setProperty("zoom", String(zoom));
    document.body.style.setProperty("--zoom", String(zoom));
  }, []);

  // Fase 1: pantalla de bienvenida
  if (!welcomeDone) {
    return (
      <WelcomeScreen
        onEnterWithVideo={() => {
          setShowVideo(true);
          setWelcomeDone(true);
        }}
        onEnterWithoutVideo={() => {
          setSplashDone(true);
          setWelcomeDone(true);
        }}
      />
    );
  }

  // Fase 2: video de intro (solo si eligió "con video")
  if (showVideo && !splashDone) {
    return <SplashScreen onDone={() => setSplashDone(true)} />;
  }

  // Fase 3: app con transiciones globales
  const activeAula = aulas.find((aula) => aula.id === activeAulaId) ?? aulas[0];
  const initialGradeId = activeAula.grade === 1 ? "grade-1" : "grade-2";

  return (
    <ExerciseSessionProvider>
      <ViewTransition
        initialView="home"
        views={{
          home: ({ navigate }) => <HomeScreen onNavigate={navigate} />,
          configuration: ({ navigate }) => (
            <ConfiguracionScreen onBack={() => navigate("home", "left")} />
          ),
          // mascota: ({ navigate }) => (
          //   <MascotaScreen onBack={() => navigate("configuration", "left")} />
          // ),
          mathematics: ({ navigate }) => (
            <MatematicasCatalogScreen
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
  // Vista de impresión / preview sin splash ni navegación de aula
  if (isFichaPreviewRoute()) {
    return (
      <div className="app">
        <FichaPreviewScreen />
      </div>
    );
  }

  return (
    <ClassProfileProvider>
      <div className="app">
        <AppShell />
      </div>
    </ClassProfileProvider>
  );
}
