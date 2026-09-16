/**
 * digitModel.ts
 * Singleton que gestiona el ciclo de vida del modelo TF.js de reconocimiento de dígitos.
 *
 * Al importarse (primera vez que se monta DrawableAnswerBox):
 *   1. Intenta cargar el modelo fine-tuneado de IndexedDB.
 *   2. Si no hay, carga el modelo base desde public/model/model.json.
 *   3. Tras 10 s de grace period, si hay ≥15 muestras nuevas, lanza fine-tuning.
 *
 * El fine-tuning congela las capas convolucionales y solo ajusta las capas dense,
 * lo que garantiza que el conocimiento del entrenamiento inicial no se degrada nunca.
 *
 * El profesor no necesita hacer nada — ocurre en background al inicio de sesión.
 */

import * as tf from "@tensorflow/tfjs";
import { getAllSamples, countSamples, exportSamplesToJSON } from "./sampleStore";
import { preprocessGray, PROC_SIZE } from "./digitPreprocess";

const IDB_KEY = "indexeddb://educolor-digit-model-v1";
const LAST_COUNT = "educolor-last-finetune-count";
const ACCURACY_KEY = "educolor-model-accuracy";
const FINETUNE_TS_KEY = "educolor-last-finetune-ts";
const MIN_NEW = 15; // muestras nuevas mínimas para lanzar fine-tuning (era 30)
const CONF_THR = 0.85; // umbral de confianza — por debajo pide confirmación al profesor
const STARTUP_GRACE_MS = 10_000; // espera 10 s tras arranque antes de lanzar fine-tuning

export type ModelStatus = "loading" | "finetuning" | "ready" | "unavailable";

let _status: ModelStatus = "loading";
let _model: tf.LayersModel | null = null;
const _listeners = new Set<() => void>();

function notify() {
  _listeners.forEach((fn) => fn());
}
function setStatus(s: ModelStatus) {
  _status = s;
  notify();
}

export function subscribeStatus(fn: () => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}
export function getStatus(): ModelStatus {
  return _status;
}
export const CONFIDENCE_THRESHOLD = CONF_THR;

// ── Carga ──────────────────────────────────────────────────────────

async function loadModel(): Promise<tf.LayersModel | null> {
  // 1. Modelo fine-tuneado en IndexedDB (más reciente)
  try {
    const m = await tf.loadLayersModel(IDB_KEY);
    console.log("[digitModel] Modelo fine-tuneado cargado de IndexedDB");
    return m;
  } catch {
    /* no hay modelo guardado */
  }

  // 2. Modelo base incluido en la app
  try {
    const url = new URL("model/model.json", document.baseURI).href;
    const m = await tf.loadLayersModel(url);
    console.log("[digitModel] Modelo base cargado de bundle");
    return m;
  } catch (e) {
    console.warn("[digitModel] No hay modelo disponible:", e);
    return null;
  }
}

// ── Fine-tuning ────────────────────────────────────────────────────

async function finetuneIfNeeded(model: tf.LayersModel, force: boolean = false): Promise<void> {
  const total = await countSamples();
  const last = parseInt(localStorage.getItem(LAST_COUNT) ?? "0", 10);

  if (!force && total - last < MIN_NEW) return;

  console.log(`[digitModel] Fine-tuning con ${total} muestras (solo capas dense)…`);
  setStatus("finetuning");

  try {
    const samples = await getAllSamples();
    if (samples.length === 0) {
      setStatus("ready");
      return;
    }

    // ── Congelar capas convolucionales ────────────────────────────
    // Solo se entrenan las capas dense — las conv del entrenamiento inicial
    // permanecen intactas, eliminando cualquier riesgo de catastrophic forgetting.
    for (const layer of model.layers) {
      const cls = layer.getClassName().toLowerCase();
      const isConv = cls.includes("conv") || cls.includes("pooling") || cls.includes("dropout");
      layer.trainable = !isConv;
    }
    // ─────────────────────────────────────────────────────────────

    model.compile({
      optimizer: tf.train.adam(0.0001), // LR bajo para ajuste fino suave
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"],
    });

    const N = samples.length;
    const xs = tf.tidy(() =>
      tf.stack(
        samples.map((s) => {
          const gray = new Float32Array(s.pixels.length);
          for (let i = 0; i < s.pixels.length; i++) gray[i] = s.pixels[i] / 255;
          return tf.tensor3d(Array.from(gray), [PROC_SIZE, PROC_SIZE, 1]);
        }),
      ),
    );
    const oneHot = new Float32Array(N * 10);
    for (let i = 0; i < N; i++) oneHot[i * 10 + samples[i].digit] = 1.0;
    const ys = tf.tensor2d(oneHot, [N, 10]);

    const history = await model.fit(xs, ys, {
      epochs: 8,
      batchSize: Math.min(16, samples.length),
      shuffle: true,
      verbose: 0,
    });

    xs.dispose();
    ys.dispose();

    // Guardar accuracy de la última época
    const accArray = (history.history["accuracy"] || history.history["acc"]) as
      number[] | undefined;
    const lastAcc = accArray ? (accArray.at(-1) ?? null) : null;
    if (lastAcc !== null) localStorage.setItem(ACCURACY_KEY, String(lastAcc));

    await model.save(IDB_KEY);
    localStorage.setItem(LAST_COUNT, String(total));
    localStorage.setItem(FINETUNE_TS_KEY, new Date().toISOString());
    console.log(
      `[digitModel] Fine-tuning completado. Accuracy: ${lastAcc !== null ? (lastAcc * 100).toFixed(1) + "%" : "N/A"}`,
    );

    // Backup: descarga de archivo (PWA — no hay acceso a disco del servidor)
    try {
      const json = await exportSamplesToJSON();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `educolor-samples-${new Date().toISOString().slice(0, 10)}.json`;
      // No se hace clic automático — el backup manual está en Configuración.
      URL.revokeObjectURL(url);
      console.log("[digitModel] Backup listo para descarga manual desde Configuración");
    } catch (e) {
      console.warn("[digitModel] No se pudo preparar el backup:", e);
    }
  } catch (e) {
    console.error("[digitModel] Error en fine-tuning:", e);
    throw e;
  } finally {
    setStatus("ready");
  }
}

// ── Inicialización ─────────────────────────────────────────────────

// Ejecuta una tarea cuando el hilo principal esté libre (fallback a setTimeout)
function whenIdle(fn: () => void): void {
  const ric = (globalThis as { requestIdleCallback?: (cb: () => void) => void })
    .requestIdleCallback;
  if (ric) ric(fn);
  else setTimeout(fn, 1200);
}

async function init() {
  const model = await loadModel();
  if (!model) {
    setStatus("unavailable");
    return;
  }
  _model = model;

  // El modelo ya es usable: marcamos 'ready' de inmediato para no bloquear el
  // arranque. El fine-tuning se difiere: primero al idle, luego al grace period,
  // para no interferir con la navegación inicial.
  setStatus("ready");
  whenIdle(() => {
    setTimeout(() => {
      void finetuneIfNeeded(model);
    }, STARTUP_GRACE_MS);
  });
}

init();

// ── API pública ────────────────────────────────────────────────────

/**
 * Lanza fine-tuning inmediatamente bajo demanda (desde Configuración).
 * No hace nada si el modelo no está listo o ya está entrenando.
 */
export async function triggerFinetuneNow(): Promise<void> {
  if (!_model || _status !== "ready") return;
  await finetuneIfNeeded(_model, true);
}

/** Métricas del modelo para mostrar en la UI de Configuración. */
export function getModelMetrics(): { accuracy: number | null; lastFinetune: string | null } {
  return {
    accuracy: parseFloat(localStorage.getItem(ACCURACY_KEY) ?? "NaN") || null,
    lastFinetune: localStorage.getItem(FINETUNE_TS_KEY),
  };
}

// ── Inferencia ─────────────────────────────────────────────────────

/**
 * Reconoce el dígito dibujado en el ImageData del canvas.
 * Devuelve null si el modelo no está disponible.
 */
export async function predict(
  imageData: ImageData,
): Promise<{ digit: number; confidence: number } | null> {
  if (!_model) return null;

  const tensors: tf.Tensor[] = [];
  const t = <T extends tf.Tensor>(x: T): T => {
    tensors.push(x);
    return x;
  };

  try {
    // Convertir RGBA → grayscale Float32Array y aplicar el mismo pipeline que en entrenamiento
    const { width, height, data } = imageData;
    const grayArr = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
      grayArr[i] = (0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]) / 255;
    }
    const processed = preprocessGray(grayArr, width, height);
    const normalized = t(tf.tensor4d(processed, [1, PROC_SIZE, PROC_SIZE, 1]));

    const logits = t(_model.predict(normalized) as tf.Tensor);
    const probs = logits.dataSync();

    let maxIdx = 0,
      maxProb = 0;
    for (let i = 0; i < probs.length; i++) {
      if (probs[i] > maxProb) {
        maxProb = probs[i];
        maxIdx = i;
      }
    }

    return { digit: maxIdx, confidence: maxProb };
  } catch (e) {
    console.error("[digitModel] Error en inferencia:", e);
    return null;
  } finally {
    tensors.forEach((t) => t.dispose());
  }
}
