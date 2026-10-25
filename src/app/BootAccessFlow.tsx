import type { ReactNode } from "react";
import { ViewTransition } from "../core/transition/ViewTransition";
import { SplashScreen } from "../features/splash/SplashScreen";
import { WelcomeScreen } from "../features/splash/WelcomeScreen";

type Navigate = (view: string, dir?: "left" | "right") => void;

/**
 * Welcome → splash (opcional) → school-access.
 * Solo composición; el gate de sesión lo decide AppShell.
 */
export function BootAccessFlow({
  onGoToAuthOrApp,
  renderSchoolAccess,
}: {
  onGoToAuthOrApp: (navigate: Navigate) => void;
  renderSchoolAccess: () => ReactNode;
}) {
  return (
    <ViewTransition
      initialView="welcome"
      views={{
        welcome: ({ navigate }) => (
          <WelcomeScreen
            onEnterWithVideo={() => navigate("splash", "right")}
            onEnterWithoutVideo={() => onGoToAuthOrApp(navigate)}
          />
        ),
        splash: ({ navigate }) => <SplashScreen onDone={() => onGoToAuthOrApp(navigate)} />,
        "school-access": () => renderSchoolAccess(),
      }}
    />
  );
}
