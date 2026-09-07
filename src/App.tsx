import { useState } from "react";
import { ClassProfileProvider } from "./core/context/ClassProfileContext";
import { useClassProfile } from "./core/context/ClassProfileContext";
import { ConfiguracionScreen } from "./features/configuracion/ConfiguracionScreen";
import { HomeScreen, type AppView } from "./features/home/HomeScreen";
import { MatematicasCatalogScreen } from "./features/matematicas/MatematicasCatalogScreen";
import { SplashScreen } from "./features/splash/SplashScreen";

function AppShell() {
  const { activeAulaId, aulas } = useClassProfile();
  const [splashDone, setSplashDone] = useState(false);
  const [view, setView] = useState<AppView>("home");

  if (!splashDone) return <SplashScreen onDone={() => setSplashDone(true)} />;
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
