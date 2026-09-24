import { type ReactNode } from "react";

export type TransitionDirection = "right" | "left";

export type TransitionTheme = "cube" | "flip" | "carousel" | "fall" | "newspaper" | "pageTurn";

export const THEMES: ReadonlyArray<{ value: TransitionTheme; label: string }> = [
  { value: "cube", label: "Cubo" },
  { value: "flip", label: "Volteo" },
  { value: "carousel", label: "Carrusel" },
  { value: "fall", label: "Caída" },
  { value: "newspaper", label: "Newspaper" },
  { value: "pageTurn", label: "Volteo página" },
] as const;

export interface ViewTransitionApi {
  navigate: (view: string, direction?: TransitionDirection) => void;
}

export interface TransitionThemeApi {
  theme: TransitionTheme;
  setTheme: (theme: TransitionTheme) => void;
}

export type ViewRender = (api: ViewTransitionApi) => ReactNode;

export interface ViewTransitionProps {
  views: Record<string, ViewRender>;
  initialView: string;
  defaultTheme?: TransitionTheme;
}
