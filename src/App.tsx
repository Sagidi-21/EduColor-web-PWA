import { useState } from "react";
import { ClassProfileProvider } from "./core/context/ClassProfileContext";
import { ConfiguracionScreen } from "./features/configuracion/ConfiguracionScreen";
import { HomeScreen, type AppView } from "./features/home/HomeScreen";
import { SplashScreen } from "./features/splash/SplashScreen";

function AppShell() {
  const [splashDone, setSplashDone] = useState(false);
  const [view, setView] = useState<AppView>("home");

  if (!splashDone) return <SplashScreen onDone={() => setSplashDone(true)} />;
  if (view === "configuration") return <ConfiguracionScreen onBack={() => setView("home")} />;
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
