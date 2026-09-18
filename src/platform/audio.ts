/**
 * Servicio de audio PWA.
 *
 * Sintetiza el "piribip" de acierto con Web Audio API pura,
 * sin depender de archivos externos. Fail-silent si el
 * navegador no soporta AudioContext.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (ctx) return ctx;
  try {
    ctx = new AudioContext();
  } catch {
    ctx = null;
  }
  return ctx;
}

/**
 * Desbloquea el AudioContext tras un gesto del usuario.
 * Llamar desde el primer click/tap de la app.
 */
export function unlockAudio(): void {
  const ac = getCtx();
  if (ac && ac.state === "suspended") {
    void ac.resume();
  }
}

function tone(freq: number, start: number, duration: number, volume = 0.28): void {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.connect(env);
  env.connect(c.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, start);
  env.gain.setValueAtTime(0, start);
  env.gain.linearRampToValueAtTime(volume, start + 0.01);
  env.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

// Acorde ascendente C5-E5-G5 (alegre, corto)
export function playCorrect(): void {
  try {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    tone(523, now, 0.18); // C5
    tone(659, now + 0.13, 0.18); // E5
    tone(784, now + 0.26, 0.28); // G5
  } catch {
    /* sin dispositivo de audio */
  }
}

// Tono grave descendente G3-C3 (severo, corto) para respuesta incorrecta
export function playWrong(): void {
  try {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    tone(196, now, 0.2); // G3
    tone(131, now + 0.15, 0.28); // C3
  } catch {
    /* sin dispositivo de audio */
  }
}

// Sonido "pop" rápido y suave para toques
export function playPop(): void {
  try {
    const c = getCtx();
    if (!c) return;
    tone(440, c.currentTime, 0.08, 0.1); 
  } catch {
    /* sin dispositivo de audio */
  }
}
