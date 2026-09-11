import { useRef, useState } from "react";
import { unlockAudio } from "../../platform/audio";
import videoUrl from "../../assets/video_libro.mp4";
import "./SplashScreen.css";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [ended, setEnded] = useState(false);
  const [needsStart, setNeedsStart] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  const startVideo = () => {
    unlockAudio();
    const el = video.current;
    if (!el) return;
    // Intentar con audio; si falla, silenciar y volver a intentar
    el.muted = false;
    void el.play().then(
      () => setNeedsStart(false),
      () => {
        el.muted = true;
        void el.play().then(
          () => setNeedsStart(false),
          () => setNeedsStart(true),
        );
      },
    );
  };

  const handleClick = () => {
    unlockAudio();
    if (ended) onDone();
    else startVideo();
  };

  return (
    <div className="splash" onClick={handleClick}>
      <video
        ref={video}
        className="splash__video"
        src={videoUrl}
        autoPlay
        muted
        playsInline
        onCanPlay={startVideo}
        onError={() => setNeedsStart(true)}
        onEnded={() => setEnded(true)}
      />
      {needsStart && !ended && (
        <button className="splash__start-btn" onClick={startVideo}>
          Iniciar presentación
        </button>
      )}
      {ended && <p className="splash__hint">Toca para continuar</p>}
    </div>
  );
}
