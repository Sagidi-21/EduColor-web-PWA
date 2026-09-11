import { lazy, Suspense } from "react";
import type { ActivityDifficulty, ActivityManifest } from "../../core/content/contracts";

const ComparisonScreen = lazy(() =>
  import("./comparison/ComparisonScreen").then((module) => ({ default: module.ComparisonScreen })),
);
const OrderingScreen = lazy(() =>
  import("./ordering/OrderingScreen").then((module) => ({ default: module.OrderingScreen })),
);
const SeriesScreen = lazy(() =>
  import("./series/SeriesScreen").then((module) => ({ default: module.SeriesScreen })),
);
const VecinosScreen = lazy(() =>
  import("./vecinos/VecinosScreen").then((module) => ({ default: module.VecinosScreen })),
);

export interface EngineScreenProps {
  activity: ActivityManifest;
  difficulty: ActivityDifficulty;
  seed: number;
  onExit: () => void;
  /** Datos de contexto para mostrar en el header de la actividad */
  gradeTitle?: string;
  className?: string;
  mascotUrl?: string;
  difficultyStars?: string;
}

/** Registro de renderers PWA. Añadir aquí un motor no exige cambiar la navegación. */
export function EngineScreen(props: EngineScreenProps) {
  if (props.activity.engineId === "comparison") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <ComparisonScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "ordenar") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <OrderingScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "seriesNumericas") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <SeriesScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "vecinosNumero") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <VecinosScreen {...props} />
      </Suspense>
    );
  }
  return null;
}
