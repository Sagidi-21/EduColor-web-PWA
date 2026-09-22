import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import "./ViewTransition.css";

export type TransitionDirection = "right" | "left";

export type TransitionTheme = "cube" | "flip" | "carousel" | "fall" | "newspaper";

export const THEMES: ReadonlyArray<{ value: TransitionTheme; label: string }> = [
  { value: "cube", label: "Cubo" },
  { value: "flip", label: "Volteo" },
  { value: "carousel", label: "Carrusel" },
  { value: "fall", label: "Caída" },
  { value: "newspaper", label: "Newspaper" },
] as const;

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

export interface ViewTransitionApi {
  navigate: (view: string, direction?: TransitionDirection) => void;
}

const ViewTransitionContext = createContext<ViewTransitionApi | null>(null);

export function useViewTransition(): ViewTransitionApi {
  const ctx = useContext(ViewTransitionContext);
  if (!ctx) {
    throw new Error("useViewTransition must be used within ViewTransition");
  }
  return ctx;
}

export type ViewRender = (api: ViewTransitionApi) => ReactNode;

export interface ViewTransitionProps {
  views: Record<string, ViewRender>;
  initialView: string;
  defaultTheme?: TransitionTheme;
}

export function ViewTransition({ views, initialView, defaultTheme = "cube" }: ViewTransitionProps) {
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

  const navigateRef = useRef<(view: string, direction?: TransitionDirection) => void>(() => {});

  const navigate = (nextView: string, dir: TransitionDirection = "right") => {
    if (exiting !== null || nextView === current || !views[nextView]) return;
    setExiting(current);
    setCurrent(nextView);
    setExitDirection(dir);
  };

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

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

  return (
    <ViewTransitionContext.Provider value={api}>
      <TransitionThemeContext.Provider value={themeApi}>
        <div className="vt-wrapper">
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
        </div>
      </TransitionThemeContext.Provider>
    </ViewTransitionContext.Provider>
  );
}
