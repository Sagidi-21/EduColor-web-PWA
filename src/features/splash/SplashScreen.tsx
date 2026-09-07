import { useRef, useState } from "react";
import videoUrl from "../../assets/video_libro.mp4";
import "./SplashScreen.css";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [ended, setEnded] = useState(false);
  const [needsStart, setNeedsStart] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  const startVideo = () => {
    void video.current?.play().then(
      () => setNeedsStart(false),
      () => setNeedsStart(true),
    );
  };

  const handleClick = () => {
    if (ended) onDone();
    else if (needsStart) startVideo();
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
