import { useEffect, useRef, useState } from "react";
import { unlockAudio } from "../../platform/audio";
import videoUrl from "../../assets/video_libro.mp4";
import "./SplashScreen.css";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [ended, setEnded] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    // Solo al montar. No depender de onDone: en cada re-render de App es una
    // función nueva y volver a play() reinicia el audio tras el fin del vídeo.
    unlockAudio();
    const el = video.current;
    if (!el) return;
    el.muted = false;
    void el.play().catch(() => {
      el.muted = true;
      void el.play().catch(() => {
        onDoneRef.current();
      });
    });
  }, []);

  const finishVideo = () => {
    const el = video.current;
    if (el) {
      el.pause();
      el.muted = true;
    }
    setEnded(true);
  };

  const continueAfterVideo = () => {
    const el = video.current;
    if (el) {
      el.pause();
      el.muted = true;
    }
    onDone();
  };

  return (
    <div
      className="splash"
      onClick={() => {
        if (ended) continueAfterVideo();
      }}
    >
      <video
        ref={video}
        className="splash__video"
        src={videoUrl}
        playsInline
        onEnded={finishVideo}
      />
      {ended && <p className="splash__hint">Toca para continuar</p>}
    </div>
  );
}
