/**
 * TeacherConfirmPanel
 * -------------------
 * Aparece cuando el modelo reconoce un dígito con confianza baja (<85%).
 * El profesor ve lo que ha dibujado el niño y selecciona el dígito correcto.
 * La muestra queda guardada para mejorar el modelo automáticamente.
 */

import { useEffect, useRef } from "react";
import "./TeacherConfirmPanel.css";

interface Props {
  imageData: ImageData;
  predictedDigit: number;
  confidence: number;
  onConfirm: (digit: string) => void; // profesor identifica el dígito
  onRetry: () => void; // niño borra y vuelve a intentarlo
}

export default function TeacherConfirmPanel({
  imageData,
  predictedDigit,
  confidence,
  onConfirm,
  onRetry,
}: Props) {
  const previewRef = useRef<HTMLCanvasElement>(null);

  // Dibuja la imagen del niño en el canvas de previsualización
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    ctx.putImageData(imageData, 0, 0);
  }, [imageData]);

  const pct = Math.round(confidence * 100);

  return (
    <div className="tcp__overlay">
      <div className="tcp__panel">
        <p className="tcp__title">¿Qué número ha escrito?</p>
        <p className="tcp__sub">
          El sistema cree que es <strong className="tcp__predicted">{predictedDigit}</strong> ({pct}
          % seguro). Confirma para ayudarlo a aprender.
        </p>

        <canvas ref={previewRef} className="tcp__preview" />

        <div className="tcp__grid">
          {Array.from({ length: 10 }, (_, i) => (
            <button
              key={i}
              className={`tcp__digit-btn ${i === predictedDigit ? "tcp__digit-btn--predicted" : ""}`}
              onClick={() => onConfirm(String(i))}
            >
              {i}
            </button>
          ))}
        </div>

        <button className="tcp__retry-btn" onClick={onRetry}>
          No se entiende — borrar y repetir
        </button>
      </div>
    </div>
  );
}
