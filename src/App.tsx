import { ClassProfileProvider } from "./core/context/ClassProfileContext";
import { SchoolAuthProvider } from "./core/context/SchoolAuthContext";
import { isFichaPreviewAllowed, isFichaPreviewPath } from "./core/demo/fichaPreviewAccess";
import { FichaPreviewScreen } from "./features/ficha/FichaPreviewScreen";
import { AppShell } from "./app/AppShell";

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

/**
 * Borde de la app: preview de fichas o providers + AppShell.
 * La orquestación welcome/auth/sesión está en `src/app/`.
 */
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
