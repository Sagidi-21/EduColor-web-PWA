/**
 * DrawableAnswerBox
 * -----------------
 * Recuadro tÃ¡ctil donde el niÃ±o dibuja el dÃ­gito con el dedo o el lÃ¡piz
 * de la pizarra digital.
 *
 * Flujo de reconocimiento:
 *   1. NiÃ±o dibuja y pulsa âœ“
 *   2. Se lanza inferencia TF.js (digitModel)
 *   3. Si confianza â‰¥ 85% â†’ onConfirm(dÃ­gito) automÃ¡tico
 *   4. Si confianza < 85% â†’ TeacherConfirmPanel
 *      â€¢ Profesor identifica el dÃ­gito â†’ se guarda la muestra + onConfirm
 *      â€¢ Profesor pulsa "No se entiende" â†’ el niÃ±o borra y repite
 *
 * Al inicio de sesiÃ³n, digitModel hace fine-tuning automÃ¡tico si hay
 * â‰¥30 muestras nuevas confirmadas por el profesor (IndexedDB).
 */

import { useRef, useEffect, useCallback, useReducer, useState } from "react";
import {
  subscribeStatus,
  getStatus,
  predict,
  CONFIDENCE_THRESHOLD,
} from "../../../platform/digit/digitModel";
import { saveSample } from "../../../platform/digit/sampleStore";
import TeacherConfirmPanel from "./TeacherConfirmPanel";
import "./DigitCell.css";

interface Props {
  isActive: boolean;
  onActivate: () => void;
  onConfirm: (digit: string) => void;
  onClear: () => void;
  state: "idle" | "correct" | "wrong";
  value: string;
}

const CANVAS_SIZE = 240;

export type DigitCellProps = Props;

export function DigitCell({ isActive, onActivate, onConfirm, onClear, state, value }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasStrokes = useRef(false);

  // Reacciona a cambios en el estado del modelo (loading â†’ finetuning â†’ ready)
  const [, rerender] = useReducer((x) => x + 1, 0);
  useEffect(() => subscribeStatus(rerender), []);

  const modelStatus = getStatus();
  const modelReady = modelStatus === "ready";

  // Panel de confirmaciÃ³n del profesor
  const [confirmData, setConfirmData] = useState<{
    imageData: ImageData;
    predictedDigit: number;
    confidence: number;
  } | null>(null);

  const ctx = () => canvasRef.current?.getContext("2d") ?? null;

  const clearCanvas = useCallback(() => {
    const c = ctx();
    if (!c) return;
    c.fillStyle = "#fff";
    c.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    hasStrokes.current = false;
    onClear();
  }, [onClear]);

  useEffect(() => {
    const c = ctx();
    if (!c) return;
    c.fillStyle = "#fff";
    c.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    c.strokeStyle = "var(--color-primary-dark)";
    c.lineWidth = 10;
    c.lineCap = "round";
    c.lineJoin = "round";
  }, []);

  // Limpia el canvas visualmente cuando el padre resetea el valor.
  // No llama a onClear() para evitar el bucle: onClear â†’ setSession â†’ re-render â†’ nueva
  // referencia de onClear â†’ clearCanvas recreado â†’ efecto vuelve a dispararse â†’ loop.
  useEffect(() => {
    if (state !== "idle" || value) return;
    const c = canvasRef.current?.getContext("2d");
    if (!c) return;
    c.fillStyle = "#fff";
    c.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    hasStrokes.current = false;
  }, [state, value]);

  const pos = (e: MouseEvent | Touch) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (CANVAS_SIZE / rect.width),
      y: (e.clientY - rect.top) * (CANVAS_SIZE / rect.height),
    };
  };

  // ── Pointer Events (sustituye handlers separados mouse/touch del original) ──
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isActive || state !== "idle") return;
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    drawing.current = true;
    hasStrokes.current = true;
    const c = ctx()!;
    const p = pos(e.nativeEvent);
    c.beginPath();
    c.moveTo(p.x, p.y);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const c = ctx()!;
    const p = pos(e.nativeEvent);
    c.lineTo(p.x, p.y);
    c.stroke();
  };
  const onPointerUp = () => {
    drawing.current = false;
  };

  const handleConfirm = useCallback(async () => {
    if (!hasStrokes.current || state !== "idle" || !modelReady) return;
    const c = ctx();
    if (!c) return;
    const imageData = c.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const result = await predict(imageData);
    if (!result) return; // modelo fallÃ³ â€” no hacer nada

    if (result.confidence >= CONFIDENCE_THRESHOLD) {
      // Guardar silenciosamente como muestra 'auto' â€” no interrumpe al profesor
      void saveSample(result.digit, imageData, "auto", result.confidence);
      onConfirm(String(result.digit));
    } else {
      setConfirmData({ imageData, predictedDigit: result.digit, confidence: result.confidence });
    }
  }, [state, modelReady, onConfirm]);

  const handleTeacherConfirm = useCallback(
    async (digit: string) => {
      if (!confirmData) return;
      await saveSample(parseInt(digit, 10), confirmData.imageData);
      setConfirmData(null);
      onConfirm(digit);
    },
    [confirmData, onConfirm],
  );

  const handleTeacherRetry = useCallback(() => {
    setConfirmData(null);
    clearCanvas();
  }, [clearCanvas]);

  const boxClass = [
    "dab",
    state === "correct" ? "dab--correct" : "",
    state === "wrong" ? "dab--wrong" : "",
    isActive ? "dab--active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Mostrar dÃ­gito si: hay valor Y (respuesta enviada O la caja ya no estÃ¡ activa)
  if (value && (state !== "idle" || !isActive)) {
    return (
      <div className={boxClass} onClick={onActivate}>
        <span className="dab__digit">{value}</span>
      </div>
    );
  }

  return (
    <>
      <div className={boxClass} onClick={!isActive ? onActivate : undefined}>
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="dab__canvas"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}

          style={{ touchAction: "none" }}
        />

        {isActive && (
          <div className="dab__controls">
            <button className="dab__btn dab__btn--clear" onClick={clearCanvas}>
              Borrar
            </button>
            <button
              className="dab__btn dab__btn--confirm"
              onClick={handleConfirm}
              disabled={!modelReady}
              title={
                modelStatus === "loading"
                  ? "Cargando modeloâ€¦"
                  : modelStatus === "finetuning"
                    ? "Mejorando reconocimientoâ€¦"
                    : modelStatus === "unavailable"
                      ? "Modelo no disponible"
                      : ""
              }
            >
              ✔
            </button>
          </div>
        )}
      </div>

      {confirmData && (
        <TeacherConfirmPanel
          imageData={confirmData.imageData}
          predictedDigit={confirmData.predictedDigit}
          confidence={confirmData.confidence}
          onConfirm={handleTeacherConfirm}
          onRetry={handleTeacherRetry}
        />
      )}
    </>
  );
}
