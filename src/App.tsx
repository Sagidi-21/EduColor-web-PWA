import { useState } from "react";
import { ClassProfileProvider } from "./core/context/ClassProfileContext";
import { useClassProfile } from "./core/context/ClassProfileContext";
import { ConfiguracionScreen } from "./features/configuracion/ConfiguracionScreen";
import { HomeScreen, type AppView } from "./features/home/HomeScreen";
import { MatematicasCatalogScreen } from "./features/matematicas/MatematicasCatalogScreen";
import { SplashScreen } from "./features/splash/SplashScreen";
import { WelcomeScreen } from "./features/splash/WelcomeScreen";

function AppShell() {
  const { activeAulaId, aulas } = useClassProfile();
  const [welcomeDone, setWelcomeDone] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [view, setView] = useState<AppView>("home");

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

  // Fase 3: app
  if (view === "configuration") return <ConfiguracionScreen onBack={() => setView("home")} />;
  if (view === "mathematics") {
    const activeAula = aulas.find((aula) => aula.id === activeAulaId) ?? aulas[0];
    return (
      <MatematicasCatalogScreen
        initialGradeId={activeAula.grade === 1 ? "grade-1" : "grade-2"}
        onBack={() => setView("home")}
      />
    );
  }
  return <HomeScreen onNavigate={setView} />;
}

export default function App() {
  return (
    <ClassProfileProvider>
      <div className="app">
        <AppShell />
      </div>
    </ClassProfileProvider>
  );
}
