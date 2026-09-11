import { useEffect, useRef, useState } from "react";
import { unlockAudio } from "../../platform/audio";
import videoUrl from "../../assets/video_libro.mp4";
import "./SplashScreen.css";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [ended, setEnded] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // El usuario ya interactuó en WelcomeScreen → reproducir con audio directamente
    unlockAudio();
    const el = video.current;
    if (!el) return;
    el.muted = false;
    void el.play().catch(() => {
      // Fallback silencioso si el navegador aún bloquea
      el.muted = true;
      void el.play().catch(() => {
        // Si ni silenciado arranca, saltar directamente al home
        onDone();
      });
    });
  }, [onDone]);

  return (
    <div className="splash" onClick={() => { if (ended) onDone(); }}>
      <video
        ref={video}
        className="splash__video"
        src={videoUrl}
        playsInline
        onEnded={() => setEnded(true)}
      />
      {ended && <p className="splash__hint">Toca para continuar</p>}
    </div>
  );
}
