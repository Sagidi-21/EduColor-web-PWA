import "./ActivityErrorBoundary.css";

interface Props {
  /** Que se estaba intentando mostrar, para que el aviso sea util al diagnosticar. */
  activityTitle: string;
  onExit: () => void;
}

/**
 * Sustituye al `if (!current) return null;` que tienen los renderers.
 *
 * Devolver `null` dejaba la pantalla **completamente en blanco**: sin cabecera,
 * sin mensaje y sin forma de salir, porque el `onExit` vive en la cabecera que
 * tampoco se pinta. Se llega cuando el generador devuelve una sesion vacia o
 * cuando el indice de ejercicio se sale de rango, y en ambos casos lo unico
 * razonable es decirlo y devolver al alumno al catalogo.
 */
export function NoExerciseNotice({ activityTitle, onExit }: Props) {
  return (
    <div className="act-error" role="alert">
      <div className="act-error__panel">
        <p className="act-error__title">No hay ningun ejercicio que mostrar</p>
        <p className="act-error__text">
          La sesion de <strong>{activityTitle}</strong> ha llegado vacia. Vuelve al catalogo y elige
          la actividad de nuevo.
        </p>
        <div className="act-error__actions">
          <button type="button" className="act-error__btn act-error__btn--primary" onClick={onExit}>
            Volver al catalogo
          </button>
        </div>
      </div>
    </div>
  );
}
