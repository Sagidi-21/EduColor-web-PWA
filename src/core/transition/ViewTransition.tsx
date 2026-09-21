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
  duration?: number;
}

const DEFAULT_DURATION = 550;

type TransitionState =
  | { phase: "idle"; current: string }
  | { phase: "animating"; outgoing: string; incoming: string; direction: TransitionDirection };

export function ViewTransition({
  views,
  initialView,
  duration = DEFAULT_DURATION,
}: ViewTransitionProps) {
  const [transition, setTransition] = useState<TransitionState>({
    phase: "idle",
    current: initialView,
  });

  const navigateRef = useRef<(view: string, direction?: TransitionDirection) => void>(() => {});

  const navigate = (nextView: string, dir: TransitionDirection = "right") => {
    if (transition.phase === "animating" || nextView === transition.current || !views[nextView]) return;
    setTransition({
      phase: "animating",
      outgoing: transition.current,
      incoming: nextView,
      direction: dir,
    });
  };

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    (window as unknown as { setView: (view: string) => void }).setView = (view: string) => {
      navigateRef.current(view);
    };
  }, []);

  useEffect(() => {
    if (transition.phase !== "animating") return;
    const timer = window.setTimeout(() => {
      setTransition({ phase: "idle", current: transition.incoming });
    }, duration);
    return () => window.clearTimeout(timer);
  }, [transition, duration]);

  const isAnimating = transition.phase === "animating";
  const activeView = isAnimating ? transition.outgoing : transition.current;
  const nextView = isAnimating ? transition.incoming : null;

  const api: ViewTransitionApi = { navigate };

  const sceneClass = [
    "vt-scene",
    isAnimating ? "vt-scene--animating" : "",
    isAnimating ? `vt-scene--${transition.direction}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const wrapperClass = [
    "vt-wrapper",
    isAnimating ? "vt-wrapper--animating" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <ViewTransitionContext.Provider value={api}>
      <div className={wrapperClass}>
        <div className={sceneClass}>
          <div className="vt-panel vt-panel--from">{views[activeView]?.(api)}</div>
          {nextView && (
            <div className="vt-panel vt-panel--to">{views[nextView]?.(api)}</div>
          )}
        </div>
      </div>
    </ViewTransitionContext.Provider>
  );
}