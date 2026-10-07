import { lazy, Suspense } from "react";
import { ActivityErrorBoundary } from "./components/ActivityErrorBoundary";
import type {
  ActivityDifficulty,
  ActivityManifest,
  CurriculumLevelId,
} from "../../core/content/contracts";

const ComparisonScreen = lazy(() =>
  import("./comparison/ComparisonScreen").then((module) => ({ default: module.ComparisonScreen })),
);
const OrderingScreen = lazy(() =>
  import("./ordering/OrderingScreen").then((module) => ({ default: module.OrderingScreen })),
);
const SeriesScreen = lazy(() =>
  import("./series/SeriesScreen").then((module) => ({ default: module.SeriesScreen })),
);
const Series3CifrasScreen = lazy(() =>
  import("./series3cifras/Series3CifrasScreen").then((module) => ({
    default: module.Series3CifrasScreen,
  })),
);
const VecinosScreen = lazy(() =>
  import("./vecinos/VecinosScreen").then((module) => ({ default: module.VecinosScreen })),
);
const Numeracion1119Screen = lazy(() =>
  import("./numeracion1119/Numeracion1119Screen").then((module) => ({
    default: module.Numeracion1119Screen,
  })),
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
const ProblemaScreen = lazy(() =>
  import("./problemas/ProblemaScreen").then((module) => ({ default: module.ProblemaScreen })),
);
const RelacionarScreen = lazy(() =>
  import("./relacionar/RelacionarScreen").then((module) => ({ default: module.RelacionarScreen })),
);
const RectaNumericaScreen = lazy(() =>
  import("./rectaNumerica/RectaNumericaScreen").then((module) => ({
    default: module.RectaNumericaScreen,
  })),
);

// Tres Sumandos engine screen
const TresSumandosScreen = lazy(() =>
  import("./tresSumandos/TresSumandosScreen").then((module) => ({
    default: module.TresSumandosScreen,
  })),
);
const Numeracion4059Screen = lazy(() =>
  import("./numeracion4059/Numeracion4059Renderer").then((module) => ({
    default: module.Numeracion4059Screen,
  })),
);
const Numeracion6099Screen = lazy(() =>
  import("./numeracion6099/Numeracion6099Renderer").then((module) => ({
    default: module.Numeracion6099Screen,
  })),
);
const Numeracion999Screen = lazy(() =>
  import("./numeracion999/Numeracion999Renderer").then((module) => ({
    default: module.Numeracion999Screen,
  })),
);
const LeftRightScreen = lazy(() =>
  import("./leftRight/LeftRightScreen").then((module) => ({ default: module.LeftRightScreen })),
);
const AlgoritmoColumnaScreen = lazy(() =>
  import("./algoritmoColumna/AlgoritmoColumnaScreen").then((module) => ({
    default: module.AlgoritmoColumnaScreen,
  })),
);
const SumaLlevandoScreen = lazy(() =>
  import("./sumaLlevando/SumaLlevandoScreen").then((module) => ({
    default: module.SumaLlevandoScreen,
  })),
);
const TresSumandosColumnaScreen = lazy(() =>
  import("./tresSumandosColumna/TresSumandosColumnaScreen").then((module) => ({
    default: module.TresSumandosColumnaScreen,
  })),
);
const RelacionSumaRestaScreen = lazy(() =>
  import("./relacionSumaResta/RelacionSumaRestaScreen").then((module) => ({
    default: module.RelacionSumaRestaScreen,
  })),
);
const RepartoIgualScreen = lazy(() =>
  import("./repartoIgual/RepartoIgualScreen").then((module) => ({
    default: module.RepartoIgualScreen,
  })),
);
const MultiplicacionScreen = lazy(() =>
  import("./multiplicacion/MultiplicacionScreen").then((module) => ({
    default: module.MultiplicacionScreen,
  })),
);
const DobleYMitadScreen = lazy(() =>
  import("./dobleYMitad/DobleYMitadScreen").then((module) => ({
    default: module.DobleYMitadScreen,
  })),
);
const RelacionarCantidadesScreen = lazy(() =>
  import("./relacionarCantidades/RelacionarCantidadesScreen").then((module) => ({
    default: module.RelacionarCantidadesScreen,
  })),
);
const GraficoBarrasScreen = lazy(() =>
  import("./graficoBarras/GraficoBarrasScreen").then((module) => ({
    default: module.GraficoBarrasScreen,
  })),
);
const MonedasBilletesScreen = lazy(() =>
  import("./monedasBilletes/MonedasBilletesScreen").then((module) => ({
    default: module.MonedasBilletesScreen,
  })),
);
const DatosInnecesariosScreen = lazy(() =>
  import("./datosInnecesarios/DatosInnecesariosScreen").then((module) => ({
    default: module.DatosInnecesariosScreen,
  })),
);
const WeekDaysScreen = lazy(() =>
  import("./weekDays/WeekDaysScreen").then((module) => ({
    default: module.WeekDaysScreen,
  })),
);
const ShapesScreen = lazy(() =>
  import("./shapes/ShapesScreen").then((module) => ({
    default: module.ShapesScreen,
  })),
);
const TablaNumericaScreen = lazy(() =>
  import("./tablaNumerica/TablaNumericaScreen").then((module) => ({
    default: module.TablaNumericaScreen,
  })),
);
const LineTypesScreen = lazy(() =>
  import("./lineTypes/LineTypesScreen").then((module) => ({ default: module.LineTypesScreen })),
);
const CapacidadScreen = lazy(() =>
  import("./capacidad/CapacidadScreen").then((module) => ({ default: module.CapacidadScreen })),
);
const OrdinalesScreen = lazy(() =>
  import("./ordinales/OrdinalesScreen").then((module) => ({ default: module.OrdinalesScreen })),
);
const ParImparScreen = lazy(() =>
  import("./parImpar/ParImparScreen").then((module) => ({ default: module.ParImparScreen })),
);
const ElLitroScreen = lazy(() =>
  import("./elLitro/ElLitroScreen").then((module) => ({ default: module.ElLitroScreen })),
);
const ElKiloScreen = lazy(() =>
  import("./elKilo/ElKiloScreen").then((module) => ({ default: module.ElKiloScreen })),
);
const PoligonosScreen = lazy(() =>
  import("./poligonos/PoligonosScreen").then((module) => ({ default: module.PoligonosScreen })),
);
const BalanzaScreen = lazy(() =>
  import("./balanza/BalanzaScreen").then((module) => ({ default: module.BalanzaScreen })),
);
const BalanzaEquilibraScreen = lazy(() =>
  import("./balanzaEquilibra/BalanzaEquilibraScreen").then((module) => ({
    default: module.BalanzaEquilibraScreen,
  })),
);

const RelojScreen = lazy(() =>
  import("./reloj/RelojScreen").then((module) => ({ default: module.RelojScreen })),
);

const RelojPonerHoraScreen = lazy(() =>
  import("./relojPonerHora/RelojPonerHoraScreen").then((module) => ({
    default: module.RelojPonerHoraScreen,
  })),
);

const Algoritmo3CifrasScreen = lazy(() =>
  import("./algoritmo3cifras/Algoritmo3CifrasScreen").then((module) => ({
    default: module.Algoritmo3CifrasScreen,
  })),
);

const Abaco3CifrasScreen = lazy(() =>
  import("./abaco3cifras/Abaco3CifrasScreen").then((module) => ({
    default: module.Abaco3CifrasScreen,
  })),
);

const IntervalosTiempoScreen = lazy(() =>
  import("./intervalosTiempo/IntervalosTiempoScreen").then((module) => ({
    default: module.IntervalosTiempoScreen,
  })),
);

const LaberintoMatematicoScreen = lazy(() =>
  import("./laberintoMatematico/LaberintoMatematicoScreen").then((module) => ({
    default: module.LaberintoMatematicoScreen,
  })),
);

const RutaCuadriculaScreen = lazy(() =>
  import("./rutaCuadricula/RutaCuadriculaScreen").then((module) => ({
    default: module.RutaCuadriculaScreen,
  })),
);

const Amigos10Screen = lazy(() =>
  import("./amigos10/Amigos10Screen").then((module) => ({
    default: module.Amigos10Screen,
  })),
);

const LecturaNumerosScreen = lazy(() =>
  import("./lecturaNumeros/LecturaNumerosScreen").then((module) => ({
    default: module.LecturaNumerosScreen,
  })),
);

const InventarProblemaScreen = lazy(() =>
  import("./inventarProblema/InventarProblemaScreen").then((module) => ({
    default: module.InventarProblemaScreen,
  })),
);

const CintaMetricaScreen = lazy(() =>
  import("./cintaMetrica/CintaMetricaScreen").then((module) => ({
    default: module.CintaMetricaScreen,
  })),
);

const RedondeoScreen = lazy(() =>
  import("./redondeo/RedondeoScreen").then((module) => ({ default: module.RedondeoScreen })),
);
const CirculoCircunferenciaScreen = lazy(() =>
  import("./circuloCircunferencia/CirculoCircunferenciaScreen").then((module) => ({
    default: module.CirculoCircunferenciaScreen,
  })),
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
  levelId?: CurriculumLevelId;
}

/** Registro de renderers PWA. Añadir aquí un motor no exige cambiar la navegación. */
export function EngineScreen(props: EngineScreenProps) {
  return (
    <ActivityErrorBoundary activityTitle={props.activity.title} onExit={props.onExit}>
      <EngineScreenForEngine {...props} />
    </ActivityErrorBoundary>
  );
}

/**
 * Resuelve el motor y lo monta. Va separado de `EngineScreen` para que la
 * barrera de error quede por encima del `React.lazy`: una barrera colocada
 * dentro del `Suspense` no llega a ver el fallo de carga del trozo, que es
 * justo el caso que dejaba la pantalla en blanco.
 */
function EngineScreenForEngine(props: EngineScreenProps) {
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
  if (props.activity.engineId === "series3cifras") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <Series3CifrasScreen {...props} />
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
  if (props.activity.engineId === "igualdad") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <IgualdadScreen {...props} />
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
  if (props.activity.engineId === "problemas") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <ProblemaScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "relacionar") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <RelacionarScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "rectaNumerica") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <RectaNumericaScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "tresSumandos") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <TresSumandosScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "numeracion4059") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <Numeracion4059Screen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "numeracion6099") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <Numeracion6099Screen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "numeracion999") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <Numeracion999Screen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "leftRight") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <LeftRightScreen {...props} />
      </Suspense>
    );
  }
  if (
    props.activity.engineId === "algoritmoVertical" ||
    props.activity.engineId === "restaColumna"
  ) {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <AlgoritmoColumnaScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "sumaLlevando") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <SumaLlevandoScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "tresSumandosColumna") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <TresSumandosColumnaScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "relacionSumaResta") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <RelacionSumaRestaScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "repartoIgual") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <RepartoIgualScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "multiplicacion") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <MultiplicacionScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "dobleYMitad") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <DobleYMitadScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "relacionarCantidades") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <RelacionarCantidadesScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "graficoBarras") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <GraficoBarrasScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "monedasBilletes") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <MonedasBilletesScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "datosInnecesarios") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <DatosInnecesariosScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "weekDays") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <WeekDaysScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "shapes") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <ShapesScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "tablaNumerica") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <TablaNumericaScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "lineTypes") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <LineTypesScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "capacidad") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <CapacidadScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "ordinales") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <OrdinalesScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "parImpar") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <ParImparScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "elLitro") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <ElLitroScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "elKilo") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <ElKiloScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "poligonos") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <PoligonosScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "balanza") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <BalanzaScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "balanzaEquilibra") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <BalanzaEquilibraScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "reloj") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <RelojScreen {...props} />
      </Suspense>
    );
  }

  if (props.activity.engineId === "relojPonerHora") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <RelojPonerHoraScreen {...props} />
      </Suspense>
    );
  }

  if (props.activity.engineId === "algoritmo3cifras") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <Algoritmo3CifrasScreen {...props} />
      </Suspense>
    );
  }

  if (props.activity.engineId === "abaco3cifras") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <Abaco3CifrasScreen {...props} />
      </Suspense>
    );
  }

  if (props.activity.engineId === "intervalosTiempo") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <IntervalosTiempoScreen {...props} />
      </Suspense>
    );
  }

  if (
    props.activity.engineId === "laberintoMatematico" ||
    props.activity.engineId === "laberintoMatematico2"
  ) {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <LaberintoMatematicoScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "rutaCuadricula") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <RutaCuadriculaScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "amigos10") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <Amigos10Screen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "lecturaNumeros") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <LecturaNumerosScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "inventarProblema") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <InventarProblemaScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "cintaMetrica") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <CintaMetricaScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "redondeo") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <RedondeoScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "series3cifras") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <Series3CifrasScreen {...props} />
      </Suspense>
    );
  }
  if (props.activity.engineId === "circuloCircunferencia") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <CirculoCircunferenciaScreen {...props} />
      </Suspense>
    );
  }
  // Un `engineId` sin rama aqui se veia como una pantalla totalmente en blanco,
  // sin ninguna pista de la causa. Ahora dice que falta el renderer.
  return (
    <div className="act-error" role="alert">
      <div className="act-error__panel">
        <p className="act-error__title">Actividad no disponible</p>
        <p className="act-error__text">
          No hay un renderer PWA para <code>{props.activity.engineId}</code>. Elige otra actividad
          del catalogo.
        </p>
        <div className="act-error__actions">
          <button
            type="button"
            className="act-error__btn act-error__btn--primary"
            onClick={props.onExit}
          >
            Volver al catalogo
          </button>
        </div>
      </div>
    </div>
  );
}
