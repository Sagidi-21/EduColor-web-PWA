import { useState } from "react";
import {
  AnimatePresence,
  motion,
  type Variants,
} from "framer-motion";

import {
  THEMES,
  type TransitionDirection,
  type TransitionTheme,
  type ViewTransitionApi,
  type ViewRender,
  type TransitionThemeApi,
} from "./vtThemes";

import {
  ViewTransitionContext,
  TransitionThemeContext,
} from "./ViewTransitionContext";

import "./ViewTransition.css";

const THEME_STORAGE_KEY = "vt_theme";

export interface ViewTransitionProps {
  views: Record<string, ViewRender>;
  initialView: string;
  defaultTheme?: TransitionTheme;
}

const CUBE_DEPTH = 200;

const cubeVariants: Record<string, Variants> = {
  cube: {
    // Center/idle state
    center: {
      rotateY: 0,
      x: 0,
      z: 0,
      opacity: 1,
      transformOrigin: "50% 50%",
    },

    // OUT variants - current page leaving
    leftOut: {
      rotateY: -90,
      x: "-100%",
      z: -CUBE_DEPTH,
      opacity: 0.3,
      transformOrigin: "100% 50%",
      transition: {
        duration: 0.6,
        ease: "easeInOut",
      },
    },
    rightOut: {
      rotateY: 90,
      x: "100%",
      z: -CUBE_DEPTH,
      opacity: 0.3,
      transformOrigin: "0% 50%",
      transition: {
        duration: 0.6,
        ease: "easeInOut",
      },
    },

    // IN variants - next page entering
    leftIn: {
      rotateY: 0,
      x: 0,
      z: 0,
      opacity: 1,
      transformOrigin: "0% 50%",
      transition: {
        duration: 0.6,
        ease: "easeInOut",
      },
    },
    rightIn: {
      rotateY: 0,
      x: 0,
      z: 0,
      opacity: 1,
      transformOrigin: "100% 50%",
      transition: {
        duration: 0.6,
        ease: "easeInOut",
      },
    },

    // Initial states for entering pages
    leftInStart: {
      rotateY: 90,
      x: "100%",
      z: -CUBE_DEPTH,
      opacity: 0.3,
      transformOrigin: "0% 50%",
    },
    rightInStart: {
      rotateY: -90,
      x: "-100%",
      z: -CUBE_DEPTH,
      opacity: 0.3,
      transformOrigin: "100% 50%",
    },
  },
  fade: {
    enter: { opacity: 0 },
    center: { opacity: 1 },
    exit: { opacity: 0 },
  },
};

export function ViewTransition({
  views,
  initialView,
  defaultTheme = "cube",
}: ViewTransitionProps) {
  const [current, setCurrent] = useState(initialView);
  const [direction, setDirection] = useState<TransitionDirection>("right");
  const [nextView, setNextView] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [theme, setThemeState] = useState<TransitionTheme>(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (saved && THEMES.some((t) => t.value === saved)) {
        return saved as TransitionTheme;
      }
    }
    return defaultTheme;
  });

  const navigate = (viewName: string, dir: TransitionDirection = "right") => {
    if (!views[viewName] || viewName === current || isTransitioning) {
      return;
    }
    setDirection(dir);
    setNextView(viewName);
    setIsTransitioning(true);
  };

  const setTheme = (newTheme: TransitionTheme) => {
    setThemeState(newTheme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    }
  };

  const handleTransitionComplete = () => {
    if (nextView) {
      setCurrent(nextView);
    }
    setNextView(null);
    setIsTransitioning(false);
  };

  const api: ViewTransitionApi = { navigate };
  const themeApi: TransitionThemeApi = { theme, setTheme };

  const activeVariants = theme === "cube" ? cubeVariants.cube : cubeVariants.fade;

  const WRAPPER_STYLE: React.CSSProperties = {
    perspective: "1200px",
    width: "calc(100vw / var(--zoom, 1))",
    height: "calc(100vh / var(--zoom, 1))",
    position: "fixed",
    top: 0,
    left: 0,
    overflow: "hidden",
    background: "white",
  };

  const STAGE_STYLE: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    transformStyle: "preserve-3d",
  };

  const PAGE_STYLE: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "white",
    border: "none",
    borderRadius: 0,
    boxShadow: "none",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    backfaceVisibility: "hidden" as const,
    transformStyle: "preserve-3d" as const,
  };

  return (
    <ViewTransitionContext.Provider value={api}>
      <TransitionThemeContext.Provider value={themeApi}>
        <div className="vt-wrapper" style={WRAPPER_STYLE}>
          <div style={STAGE_STYLE}>
            <AnimatePresence mode="popLayout" custom={direction}>
              {/* CURRENT PAGE - leaving */}
              <motion.div
                key={current}
                custom={direction}
                variants={activeVariants}
                initial={isTransitioning ? (direction === "right" ? "rightOut" : "leftOut") : "center"}
                animate={isTransitioning ? (direction === "right" ? "rightOut" : "leftOut") : "center"}
                exit={direction === "right" ? "rightOut" : "leftOut"}
                style={PAGE_STYLE}
                onAnimationComplete={handleTransitionComplete}
              >
                {views[current]?.(api)}
              </motion.div>

              {/* NEXT PAGE - entering */}
              {nextView && (
                <motion.div
                  key={nextView}
                  custom={direction}
                  variants={activeVariants}
                  initial={direction === "right" ? "rightInStart" : "leftInStart"}
                  animate={direction === "right" ? "rightIn" : "leftIn"}
                  style={PAGE_STYLE}
                >
                  {views[nextView]?.(api)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </TransitionThemeContext.Provider>
    </ViewTransitionContext.Provider>
  );
}