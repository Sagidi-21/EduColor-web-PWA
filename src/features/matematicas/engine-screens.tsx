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
const Numeracion1119Screen = lazy(() =>
  import("./numeracion1119/Numeracion1119Screen").then((module) => ({ default: module.Numeracion1119Screen })),
);
const SumaScreen = lazy(() =>
  import("./operations/SumaScreen").then((module) => ({ default: module.SumaScreen })),
);
const RestaScreen = lazy(() =>
  import("./operations/RestaScreen").then((module) => ({ default: module.RestaScreen })),
);

const IgualdadScreen = lazy(() =>
  import("./igualdad/IgualdadScreen").then((module) => ({ default: module.IgualdadScreen })),
);
const CountingScreen = lazy(() =>
  import("./counting/CountingScreen").then((module) => ({ default: module.CountingScreen })),
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
  if (props.activity.engineId === "numeracion1119") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <Numeracion1119Screen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "suma") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <SumaScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "resta") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <RestaScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "counting") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <CountingScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "igualdad") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <IgualdadScreen {...props} />
      </Suspense>
    );
  }
  return null;
}
