/**
 * sampleStore.ts
 * Almacén IndexedDB para muestras de escritura confirmadas por el profesor.
 * Cada muestra es un dígito escrito a mano guardado como imagen 32×32 en escala de grises.
 * Se usa para reentrenar el modelo TF.js sin salir de la app.
 *
 * Cada muestra incluye:
 *   - source: 'teacher' si el profesor corrigió el dígito (confianza < 85%)
 *             'auto'    si el modelo predijo con alta confianza (≥ 85%)
 *   - confidence: confianza del modelo en el momento de guardar
 */

import { preprocessGray, PROC_SIZE } from "./digitPreprocess";

const DB_NAME = "educolor-training";
const DB_VERSION = 2; // v2: añade source y confidence
const STORE = "samples";

export type SampleSource = "teacher" | "auto";

export interface Sample {
  id?: number;
  digit: number;
  pixels: Uint8Array; // PROC_SIZE × PROC_SIZE valores 0-255
  timestamp: number;
  source: SampleSource;
  confidence: number; // 0-1, confianza del modelo al guardar
}

export interface SampleStats {
  total: number;
  byDigit: Record<number, number>; // { 0: 12, 1: 8, … }
  bySource: { teacher: number; auto: number };
  lastFinetune: string | null; // ISO string o null
  modelAccuracy: number | null; // 0-1 o null
}

let _db: IDBDatabase | null = null;

async function getDB(): Promise<IDBDatabase> {
  if (_db) return _db;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      }
      // v2: los campos source/confidence se añaden automáticamente al guardar
      // No hace falta migración — las muestras antiguas simplemente no los tienen.
    };
    req.onsuccess = () => {
      _db = req.result;
      resolve(_db);
    };
    req.onerror = () => reject(req.error);
  });
}

// Aplica el mismo pipeline de normalización que en entrenamiento e inferencia
function processToGray(imageData: ImageData): Uint8Array {
  const { width, height, data } = imageData;
  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    gray[i] = (0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]) / 255;
  }
  const processed = preprocessGray(gray, width, height); // → PROC_SIZE×PROC_SIZE float [0,1]
  const out = new Uint8Array(PROC_SIZE * PROC_SIZE);
  for (let i = 0; i < PROC_SIZE * PROC_SIZE; i++) out[i] = Math.round(processed[i] * 255);
  return out;
}

export async function saveSample(
  digit: number,
  imageData: ImageData,
  source: SampleSource = "teacher",
  confidence: number = 0
): Promise<void> {
  const pixels = processToGray(imageData);
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const req = store.add({ digit, pixels, timestamp: Date.now(), source, confidence } as Sample);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAllSamples(): Promise<(Sample & { id: number })[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function countSamples(): Promise<number> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Devuelve estadísticas agregadas para mostrar en la UI. */
export async function getSampleStats(): Promise<SampleStats> {
  const samples = await getAllSamples();
  const byDigit: Record<number, number> = {};
  for (let d = 0; d <= 9; d++) byDigit[d] = 0;
  let teacher = 0,
    auto = 0;
  for (const s of samples) {
    byDigit[s.digit] = (byDigit[s.digit] ?? 0) + 1;
    if (s.source === "auto") auto++;
    else teacher++;
  }
  return {
    total: samples.length,
    byDigit,
    bySource: { teacher, auto },
    lastFinetune: localStorage.getItem("educolor-last-finetune-ts"),
    modelAccuracy: parseFloat(localStorage.getItem("educolor-model-accuracy") ?? "NaN") || null,
  };
}

/** Serializa todas las muestras a JSON portable para backup en disco. */
export async function exportSamplesToJSON(): Promise<string> {
  const samples = await getAllSamples();
  // Uint8Array no serializa bien con JSON.stringify — convertir a Array
  const plain = samples.map((s) => ({
    ...s,
    pixels: Array.from(s.pixels),
  }));
  return JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), samples: plain });
}

interface RawSample {
  digit: number;
  pixels: number[];
  timestamp: number;
  source: SampleSource;
  confidence: number;
  id?: number;
}

interface ParsedJSON {
  version: number;
  samples: RawSample[];
}

/** Importa muestras desde un JSON de backup. Las muestras duplicadas se ignoran
 *  (se importa todo sin deduplicar — el fine-tuning aguanta repetidos). */
export async function importSamplesFromJSON(json: string): Promise<number> {
  const parsed = JSON.parse(json) as ParsedJSON;
  if (!parsed.samples || !Array.isArray(parsed.samples)) throw new Error("JSON inválido");
  const db = await getDB();
  let imported = 0;
  for (const s of parsed.samples) {
    const pixels = s.pixels instanceof Uint8Array ? s.pixels : new Uint8Array(s.pixels);
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      const req = tx.objectStore(STORE).add({
        digit: s.digit,
        pixels,
        timestamp: s.timestamp ?? Date.now(),
        source: s.source ?? "teacher",
        confidence: s.confidence ?? 0,
      } as Sample);
      req.onsuccess = () => {
        imported++;
        resolve();
      };
      req.onerror = () => resolve(); // ignora duplicados / errores individuales
    });
  }
  return imported;
}
