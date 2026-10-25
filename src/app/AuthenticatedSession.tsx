import { ExerciseSessionProvider } from "../features/matematicas/ExerciseSessionContext";
import { ExerciseView } from "../features/matematicas/ExerciseView";
import { ConfiguracionScreen } from "../features/configuracion/ConfiguracionScreen";
import { ProfesoradoScreen } from "../features/profesorado/ProfesoradoScreen";
import { HomeScreen } from "../features/home/HomeScreen";
import { MatematicasCatalogScreen } from "../features/matematicas/MatematicasCatalogScreen";
import { FichaGeneratorScreen } from "../features/ficha/FichaGeneratorScreen";
import { ViewTransition } from "../core/transition/ViewTransition";

/**
 * Sesión ya dentro de la app (owner/docente/DEMO): home y catálogo.
 * Sin lógica de login; solo el árbol de vistas post-gate.
 */
export function AuthenticatedSession({
  initialGradeId,
  demoMode,
  onOpenSchoolAccess,
  onExitDemo,
  onBackToAdmin,
}: {
  initialGradeId: "grade-1" | "grade-2";
  demoMode: boolean;
  onOpenSchoolAccess: () => void;
  onExitDemo: () => void;
  onBackToAdmin?: () => void;
}) {
  return (
    <ExerciseSessionProvider>
      <ViewTransition
        initialView="home"
        views={{
          home: ({ navigate }) => (
            <HomeScreen
              onNavigate={navigate}
              onOpenSchoolAccess={onOpenSchoolAccess}
              demoMode={demoMode}
              onExitDemo={onExitDemo}
              onBackToAdmin={onBackToAdmin}
            />
          ),
          configuration: ({ navigate }) =>
            demoMode ? (
              <HomeScreen onNavigate={navigate} demoMode onExitDemo={onExitDemo} />
            ) : (
              <ConfiguracionScreen onBack={() => navigate("home", "left")} onNavigate={navigate} />
            ),
          profesorado: ({ navigate }) =>
            demoMode ? (
              <HomeScreen onNavigate={navigate} demoMode onExitDemo={onExitDemo} />
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
