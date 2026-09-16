/**
 * audioFeedback.ts
 * ----------------
 * Capa de adaptador de feedback sonoro entre motores y reproductor.
 *
 * Los motores no importan `platform/audio` directamente: notifican
 * un resultado (correcto / incorrecto) y el adaptador decide qué sonido
 * reproducir. Esto centraliza la lógica de audio y evita que los motores
 * conozcan los detalles de síntesis del reproductor (DT-003).
 */

import { playCorrect, playWrong } from "../../platform/audio";

export function playFeedback(correct: boolean): void {
  if (correct) playCorrect();
  else playWrong();
}