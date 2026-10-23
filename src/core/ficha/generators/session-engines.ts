import type { ActivityDifficulty } from "../../content/contracts";
import type { SheetConfig } from "../types";

import { generateSession as generateAbaco3cifras } from "../../activities/abaco3cifras";
import { generateSession as generateAlgoritmo3cifras } from "../../activities/algoritmo3cifras";
import { generateSession as generateAlgoritmoVertical } from "../../activities/algoritmoVertical";
import { generateSession as generateAmigos10 } from "../../activities/amigos10";
import { generateSession as generateBalanza } from "../../activities/balanza";
import { generateSession as generateBalanzaEquilibra } from "../../activities/balanzaEquilibra";
import { generateSession as generateCapacidad } from "../../activities/capacidad";
import { generateCCSession } from "../../activities/circuloCircunferencia";
import { generateSession as generateCintaMetrica } from "../../activities/cintaMetrica";
import { createComparisonExercise } from "../../activities/comparison";
import {
  generateSession as generateCounting,
  PRESET_CONFIGS as countingPresets,
} from "../../activities/counting";
import { generateSession as generateCuerpos3d } from "../../activities/cuerpos3d";
import { generateSession as generateDatosInnecesarios } from "../../activities/datosInnecesarios";
import { generateSession as generateDobleYMitad } from "../../activities/dobleYMitad";
import { generateSession as generateElKilo } from "../../activities/elKilo";
import { generateSession as generateElLitro } from "../../activities/elLitro";
import { generateSession as generateGraficoBarras } from "../../activities/graficoBarras";
import { generateSession as generateIgualdad } from "../../activities/igualdad";
import { generateSession as generateIntervalosTiempo } from "../../activities/intervalosTiempo";
import { generateSession as generateInventarProblema } from "../../activities/inventarProblema";
import { generateSession as generateLaberinto } from "../../activities/laberintoMatematico";
import { generateSession as generateLecturaNumeros } from "../../activities/lecturaNumeros";
import { generateSession as generateLeftRight } from "../../activities/leftRight";
import { generateSession as generateLineTypes } from "../../activities/lineTypes";
import { generateSession as generateMenuCafeteria } from "../../activities/menuCafeteria";
import { generateSession as generateMonedasBilletes } from "../../activities/monedasBilletes";
import { generateMatchBlocks as generateMultiplicacion } from "../../activities/multiplicacion";
import { generateNumeracion1119Session } from "../../activities/numeracion1119";
import { generateSession as generateNumeracion4059 } from "../../activities/numeracion4059";
import { generateSession as generateNumeracion6099 } from "../../activities/numeracion6099";
import { generateSession as generateNumeracion999 } from "../../activities/numeracion999";
import { generateSession as generateRestaSession } from "../../activities/operations";
import { createOrderingSession } from "../../activities/ordering";
import { generateSession as generateOrdinales } from "../../activities/ordinales";
import { generateSession as generateParImpar } from "../../activities/parImpar";
import { generateSession as generatePoligonos } from "../../activities/poligonos";
import { generateSession as generatePosicionesAula } from "../../activities/posicionesAula";
import { generateSession as generateProbabilidad } from "../../activities/probabilidad";
import { generateSession as generateProblemas } from "../../activities/problemas";
import { generateSession as generateProblemas2pasos } from "../../activities/problemas2pasos";
import { generateSession as generateRectaNumerica } from "../../activities/rectaNumerica";
import { generateSession as generateRedondeo } from "../../activities/redondeo";
import { generateSession as generateRelacionar } from "../../activities/relacionar";
import { generateSession as generateRelacionarCantidades } from "../../activities/relacionarCantidades";
import { generateSession as generateRelacionSumaResta } from "../../activities/relacionSumaResta";
import { generateSession as generateReloj } from "../../activities/reloj";
import { generateSession as generateRelojPonerHora } from "../../activities/relojPonerHora";
import { generateSession as generateRepartoIgual } from "../../activities/repartoIgual";
import { generateSession as generateRestaColumna } from "../../activities/restaColumna";
import { generateSession as generateRutaCuadricula } from "../../activities/rutaCuadricula";
import { generateSeriesSession } from "../../activities/series";
import { generateSeries3CifrasSession } from "../../activities/series3cifras";
import { generateSession as generateShapes } from "../../activities/shapes";
import { generateSession as generateSimetria } from "../../activities/simetria";
import { generateSession as generateSumaLlevando } from "../../activities/sumaLlevando";
import { SHAPES_REAL_IMAGES } from "../../../platform/shapesRealImages";
import { generateSession as generateTablaNumerica } from "../../activities/tablaNumerica";
import { generateSession as generateTresSumandos } from "../../activities/tresSumandos";
import { generateSession as generateTresSumandosColumna } from "../../activities/tresSumandosColumna";
import { generateVecinosSession } from "../../activities/vecinos";
import { generateSession as generateWeekDays } from "../../activities/weekDays";

const COMPARISON_SESSION_SIZE = 10;

export interface SessionEngine {
  supportsImages: boolean;
  generateSession: (difficulty: ActivityDifficulty, seed: number, config: SheetConfig) => unknown[];
}

function toList(session: unknown): unknown[] {
  if (Array.isArray(session)) return session;
  if (session && typeof session === "object") {
    const record = session as Record<string, unknown>;
    if (Array.isArray(record.exercises)) return record.exercises;
    if (Array.isArray(record.pairs)) return record.pairs;
  }
  return [session];
}

function std(
  generate: (difficulty: ActivityDifficulty, seed: number) => unknown,
  supportsImages = false,
): SessionEngine {
  return {
    supportsImages,
    generateSession: (difficulty, seed) => toList(generate(difficulty, seed)),
  };
}

function seedFirst(
  generate: (seed: number, difficulty: ActivityDifficulty) => unknown,
  supportsImages = false,
): SessionEngine {
  return {
    supportsImages,
    generateSession: (difficulty, seed) => toList(generate(seed, difficulty)),
  };
}

/**
 * Un adaptador por actividad del catálogo. No hay un `engineRegistry.get()`
 * con `generateSession`: cada motor vive en `src/core/activities/` con firmas
 * distintas, y este mapa las unifica para el generador de fichas.
 */
export const sessionEngines: Record<string, SessionEngine> = {
  abaco3cifras: std(generateAbaco3cifras),
  algoritmo3cifras: std(generateAlgoritmo3cifras),
  algoritmoVertical: std(generateAlgoritmoVertical),
  amigos10: std(generateAmigos10, true),
  balanza: std(generateBalanza, true),
  balanzaEquilibra: std(generateBalanzaEquilibra, true),
  capacidad: std(generateCapacidad),
  circuloCircunferencia: seedFirst(generateCCSession),
  cintaMetrica: std(generateCintaMetrica, true),
  comparison: {
    supportsImages: true,
    generateSession: (difficulty, seed) =>
      Array.from({ length: COMPARISON_SESSION_SIZE }, (_, i) =>
        createComparisonExercise(seed + i, difficulty),
      ),
  },
  counting: {
    supportsImages: true,
    generateSession: (difficulty, seed, config) =>
      generateCounting({ ...countingPresets[difficulty], quantity: config.count }, seed),
  },
  cuerpos3d: std(generateCuerpos3d),
  datosInnecesarios: std(generateDatosInnecesarios),
  dobleYMitad: std(generateDobleYMitad),
  elKilo: std(generateElKilo, true),
  elLitro: std(generateElLitro, true),
  graficoBarras: std(generateGraficoBarras, true),
  igualdad: std(generateIgualdad, true),
  intervalosTiempo: std(generateIntervalosTiempo, true),
  inventarProblema: std(generateInventarProblema, true),
  laberintoMatematico: std((difficulty, seed) => generateLaberinto(difficulty, seed, "1")),
  laberintoMatematico2: std((difficulty, seed) => generateLaberinto(difficulty, seed, "2")),
  lecturaNumeros: std(generateLecturaNumeros),
  leftRight: std(generateLeftRight, true),
  lineTypes: std(generateLineTypes),
  menuCafeteria: std(generateMenuCafeteria, true),
  monedasBilletes: std(generateMonedasBilletes, true),
  // Ficha: siempre bloques de unir (`generateSession` devolvería opción múltiple en hard/expert).
  multiplicacion: std((difficulty, seed) => generateMultiplicacion(difficulty, seed)),
  numeracion1119: seedFirst(generateNumeracion1119Session),
  numeracion4059: std(generateNumeracion4059),
  numeracion6099: std(generateNumeracion6099),
  numeracion999: std(generateNumeracion999),
  ordenar: seedFirst(createOrderingSession),
  ordinales: std(generateOrdinales, true),
  parImpar: std(generateParImpar, true),
  poligonos: std(generatePoligonos),
  posicionesAula: std(generatePosicionesAula),
  probabilidad: std(generateProbabilidad),
  problemas: std(generateProblemas),
  problemas2pasos: std(generateProblemas2pasos),
  rectaNumerica: std(generateRectaNumerica),
  redondeo: std(generateRedondeo),
  relacionar: std(generateRelacionar, true),
  relacionarCantidades: std(generateRelacionarCantidades, true),
  relacionSumaResta: std(generateRelacionSumaResta),
  reloj: std(generateReloj),
  relojPonerHora: std(generateRelojPonerHora),
  repartoIgual: std(generateRepartoIgual),
  resta: {
    supportsImages: true,
    generateSession: (difficulty, seed) => generateRestaSession("resta", difficulty, seed),
  },
  restaColumna: std(generateRestaColumna),
  rutaCuadricula: std(generateRutaCuadricula),
  series3cifras: seedFirst(generateSeries3CifrasSession),
  seriesNumericas: seedFirst(generateSeriesSession),
  shapes: {
    supportsImages: true,
    generateSession: (difficulty, seed) =>
      toList(generateShapes(difficulty, seed, SHAPES_REAL_IMAGES)),
  },
  simetria: std(generateSimetria),
  // suma: D2 — generación solo vía Edge (content-ficha). No registrar motor local.
  sumaLlevando: std(generateSumaLlevando),
  tablaNumerica: std(generateTablaNumerica),
  tresSumandos: {
    supportsImages: true,
    generateSession: (difficulty, seed) => generateTresSumandos(difficulty, undefined, seed),
  },
  tresSumandosColumna: std(generateTresSumandosColumna),
  vecinosNumero: seedFirst(generateVecinosSession),
  weekDays: std(generateWeekDays),
};

export function getSessionEngine(activityId: string): SessionEngine | undefined {
  return sessionEngines[activityId];
}
