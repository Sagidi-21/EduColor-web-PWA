import { useState } from "react";
import videoUrl from "../../assets/video_libro.mp4";
import "./SplashScreen.css";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [ended, setEnded] = useState(false);
  return (
    <div className="splash" onClick={ended ? onDone : undefined}>
      <video
        className="splash__video"
        src={videoUrl}
        autoPlay
        playsInline
        onEnded={() => setEnded(true)}
      />
      {ended && <p className="splash__hint">Toca para continuar</p>}
    </div>
  );
}
