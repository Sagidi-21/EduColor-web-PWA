import type { ActivityManifest, EngineId } from "./contracts";

export type EngineMigrationStatus = "available" | "pending";

export interface EngineRegistration {
  id: EngineId;
  status: EngineMigrationStatus;
}

/**
 * Solo se añaden aquí motores cuya lógica y renderer ya funcionen en la PWA.
 * Un manifiesto por sí solo nunca habilita el lanzamiento de una actividad.
 */
const migratedEngines: ReadonlySet<EngineId> = new Set([
  "comparison",
  "ordenar",
  "seriesNumericas",
  "vecinosNumero",
  "numeracion1119",
  "suma",
  "resta",
  "igualdad",
  "counting",
  "problemas",
  "relacionar",
  "rectaNumerica",
  "tresSumandos",
  "numeracion4059",
  "numeracion6099",
  "numeracion999",
  "leftRight",
  "laberintoMatematico",
  "laberintoMatematico2",
  "algoritmoVertical",
  "restaColumna",
  "tresSumandosColumna",
  "relacionSumaResta",
  "repartoIgual",
  "multiplicacion",
  "dobleYMitad",
  "relacionarCantidades",
  "graficoBarras",
  "monedasBilletes",
  "reloj",
  "relojPonerHora",
  "sumaLlevando",
  "weekDays",
  "shapes",
  "tablaNumerica",
  "lineTypes",
  "capacidad",
  "ordinales",
  "parImpar",
  "elLitro",
  "elKilo",
  "poligonos",
  "balanza",
  "balanzaEquilibra",
  "intervalosTiempo",
  "abaco3cifras",
  "algoritmo3cifras",
  "datosInnecesarios",
  "rutaCuadricula",
]);

export function getEngineRegistration(engineId: EngineId): EngineRegistration {
  return {
    id: engineId,
    status: migratedEngines.has(engineId) ? "available" : "pending",
  };
}

export function canLaunchActivity(activity: ActivityManifest): boolean {
  return (
    activity.status === "available" &&
    getEngineRegistration(activity.engineId).status === "available"
  );
}
