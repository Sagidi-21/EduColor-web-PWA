import { createContext, useContext, useEffect, useRef, useState } from "react";
import "./ViewTransition.css";
import {
  THEMES,
  type TransitionDirection,
  type TransitionTheme,
  type ViewTransitionApi,
  type ViewRender,
} from "./vtThemes";

const THEME_STORAGE_KEY = "vt_theme";

/* ---------------------------------------------------------------- */
/* Transition theme context (for runtime theme switching)           */
/* ---------------------------------------------------------------- */

interface TransitionThemeApi {
  theme: TransitionTheme;
  setTheme: (theme: TransitionTheme) => void;
}

const TransitionThemeContext = createContext<TransitionThemeApi | null>(null);

export function useTransitionTheme(): TransitionThemeApi {
  const ctx = useContext(TransitionThemeContext);
  if (!ctx) {
    throw new Error("useTransitionTheme must be used within ViewTransition");
  }
  return ctx;
}

/* ---------------------------------------------------------------- */
/* View transition context (navigation API)                         */
/* ---------------------------------------------------------------- */

const ViewTransitionContext = createContext<ViewTransitionApi | null>(null);

export function useViewTransition(): ViewTransitionApi {
  const ctx = useContext(ViewTransitionContext);
  if (!ctx) {
    throw new Error("useViewTransition must be used within ViewTransition");
  }
  return ctx;
}

export interface ViewTransitionProps {
  views: Record<string, ViewRender>;
  initialView: string;
  defaultTheme?: TransitionTheme;
}

export function ViewTransition({ views, initialView, defaultTheme = "pageTurn" }: ViewTransitionProps) {
  const [current, setCurrent] = useState(initialView);
  const [exiting, setExiting] = useState<string | null>(null);
  const [exitDirection, setExitDirection] = useState<TransitionDirection>("right");
  const [theme, setThemeState] = useState<TransitionTheme>(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (saved && THEMES.some((t) => t.value === saved)) {
        return saved as TransitionTheme;
      }
    }
    return defaultTheme;
  });

  // Usamos refs para que el callback `navigate` pueda leer los valores
  // más recientes sin cambiar de referencia en cada render.
  const viewsRef = useRef(views);
  const currentRef = useRef(current);
  const exitingRef = useRef(exiting);

  useEffect(() => {
    viewsRef.current = views;
    currentRef.current = current;
    exitingRef.current = exiting;
  });

  const navigate = (nextView: string, dir: TransitionDirection = "right") => {
    const currentView = currentRef.current;
    const exitingView = exitingRef.current;
    const currentViews = viewsRef.current;
    if (exitingView !== null || nextView === currentView || !currentViews[nextView]) return;
    setExiting(currentView);
    setCurrent(nextView);
    setExitDirection(dir);
  };

  // Mantener una ref con la última función navigate para usarla desde
  // el effect que expone window(view) (sin depender de `navigate`).
  const navigateRef = useRef(navigate);
  useEffect(() => {
    navigateRef.current = navigate;
  });

  useEffect(() => {
    (window as unknown as { setView: (view: string) => void }).setView = (view: string) => {
      navigateRef.current(view);
    };
  }, []);

  const setTheme = (newTheme: TransitionTheme) => {
    setThemeState(newTheme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    }
  };

  const api: ViewTransitionApi = { navigate };
  const themeApi: TransitionThemeApi = { theme, setTheme };

const handleExitComplete = () => {
    setExiting(null);
    setExitDirection("right");
  };

  const hasTransition = exiting !== null;
  const isPageTurn = theme === "pageTurn";

  // For pageTurn theme, we need to know what content goes on front/back
  // Front = exiting view (current page turning away) or current view (idle)
  // Back = current view (new page being revealed) - only during transition
  const frontViewKey = exiting ?? current;
  const backViewKey = hasTransition ? current : null;
  const backViewRender = hasTransition ? views[backViewKey!] : null;

  return (
    <ViewTransitionContext.Provider value={api}>
      <TransitionThemeContext.Provider value={themeApi}>
        <div className="vt-wrapper" data-theme={theme}>
          {isPageTurn ? (
            <>
              {/* Back page (destination) - only during transition */}
              {hasTransition && backViewRender && (
                <div className="vt-page vt-page--back" key={`back-${backViewKey}`}>
                  {backViewRender(api)}
                </div>
              )}
              {/* Front page (current/exiting) - always rendered */}
              <div
                className={`vt-page vt-page--front${hasTransition ? ` vt-page--turn-${exitDirection}` : ""}`}
                onAnimationEnd={hasTransition ? handleExitComplete : undefined}
                key={`front-${frontViewKey}`}
              >
                <div className="vt-page__content">
                  {views[frontViewKey]?.(api)}
                </div>
                {hasTransition && <div className="vt-page__shadow" />}
              </div>
            </>
          ) : (
            <>
              <div className="vt-panel vt-panel--active">{views[current]?.(api)}</div>
              {hasTransition && (
                <div
                  className={`vt-panel vt-panel--exiting vt-panel--exiting-${theme}-${exitDirection}`}
                  onAnimationEnd={handleExitComplete}
                >
                  {views[exiting]?.(api)}
                </div>
              )}
              {hasTransition && (
                <div className={`vt-panel vt-panel--entering vt-panel--entering-${theme}-${exitDirection}`}>
                  {views[current]?.(api)}
                </div>
              )}
            </>
          )}
        </div>
      </TransitionThemeContext.Provider>
    </ViewTransitionContext.Provider>
  );
}
