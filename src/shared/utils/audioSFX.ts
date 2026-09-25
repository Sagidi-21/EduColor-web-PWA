/**
 * Sintetizador Web Audio API para efectos de sonido mágicos en EduColor.
 * Sin dependencias externas, latencia 0ms, compatible con PWA y 100% offline.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {
      /* Manejo de autoplay en navegadores */
    });
  }
  return audioCtx;
}

/**
 * Efecto de sonido 1: Apertura Mágica de la Mochila (Whoosh + brillo)
 */
export function playBackpackOpenSFX(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Tono mágico ascendente (Chime sweep)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);

    // Armónico agudo brillante (Brillo místico)
    const bellOsc = ctx.createOscillator();
    const bellGain = ctx.createGain();

    bellOsc.type = "triangle";
    bellOsc.frequency.setValueAtTime(1200, now + 0.1);
    bellOsc.frequency.exponentialRampToValueAtTime(1760, now + 0.3);

    bellGain.gain.setValueAtTime(0.001, now + 0.1);
    bellGain.gain.linearRampToValueAtTime(0.15, now + 0.15);
    bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    bellOsc.connect(bellGain);
    bellGain.connect(ctx.destination);

    bellOsc.start(now + 0.1);
    bellOsc.stop(now + 0.35);
  } catch (err) {
    console.warn("No se pudo reproducir SFX backpack:", err);
  }
}

/**
 * Efecto de sonido 2: Explosión Mágica de Tarjetas (Arpegio estelar)
 */
export function playCardsBurstSFX(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6 (5 notas cristalinas para 4 tarjetas + botón)

    notes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.32;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.2, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.3);
    });
  } catch (err) {
    console.warn("No se pudo reproducir SFX cards burst:", err);
  }
}
