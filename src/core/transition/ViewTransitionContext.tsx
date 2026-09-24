import { createContext, useContext } from "react";
import type { ViewTransitionApi, TransitionThemeApi, TransitionTheme } from "./vtThemes";

const ViewTransitionContext = createContext<ViewTransitionApi | null>(null);
const TransitionThemeContext = createContext<TransitionThemeApi | null>(null);

export const useViewTransition = () => {
  const context = useContext(ViewTransitionContext);
  if (!context) {
    throw new Error("useViewTransition must be used within a ViewTransitionProvider");
  }
  return context;
};

export const useTransitionTheme = () => {
  const context = useContext(TransitionThemeContext);
  if (!context) {
    throw new Error("useTransitionTheme must be used within a ViewTransitionProvider");
  }
  return context;
};

export { ViewTransitionContext, TransitionThemeContext };
