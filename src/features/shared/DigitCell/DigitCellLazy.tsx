/**
 * DigitCellLazy.tsx
 * -----------------
 * Wrapper perezoso (React.lazy) alrededor de DigitCell.
 *
 * TF.js (≈890 kB gzipped) solo se descarga cuando un renderer monta
 * esta componente, nunca en la carga inicial de la app. Así el entrypoint
 * principal no incluye TensorFlow.js en su grafo de carga.
 */

import { lazy, Suspense } from "react";
import type { DigitCellProps } from "./DigitCell";

const DigitCellLazy = lazy(() => import("./DigitCell").then((m) => ({ default: m.DigitCell })));

export function LazyDigitCell(props: DigitCellProps) {
  return (
    <Suspense fallback={<div className="dab dab--loading">Cargando escritura…</div>}>
      <DigitCellLazy {...props} />
    </Suspense>
  );
}

export type { DigitCellProps };