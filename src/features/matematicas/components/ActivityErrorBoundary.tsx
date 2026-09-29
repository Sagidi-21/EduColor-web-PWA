import { Component, type ErrorInfo, type ReactNode } from "react";
import "./ActivityErrorBoundary.css";

interface Props {
  /** Nombre de la actividad, solo para el mensaje. */
  activityTitle: string;
  /** Salir de la actividad cuando algo falla y no hay recuperacion posible. */
  onExit: () => void;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Barrera de error de una actividad.
 *
 * Sin ella, dos fallos que no son de la logica matematique dejan la pantalla
 * **completamente en blanco**, sin un solo mensaje, porque React desmonta todo el
 * arbol cuando un render lanza:
 *
 * 1. Un `React.lazy` que no puede descargar su trozo. La escritura a mano
 *    (`LazyDigitCell`) arrastra TensorFlow.js, unos 890 kB que se piden al
 *    cambiar de numpad a lienzo. Si ese trozo falla por la red, React rechaza
 *    la promesa y no hay quien la capture.
 * 2. Cualquier excepcion en el render de un renderer.
 *
 * Con la barrera, el fallo se ve y el alumno puede volver al catalogo en lugar
 * de encontrarse con una pizarra vacia.
 *
 * Es un componente de clase porque `React.lazy` y los errores de render solo se
 * pueden interceptar asi: los hooks y los errores de la funcion de render no los
 * captura ningun hook.
 */
export class ActivityErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Sin consola, un fallo asi no deja rastro y es imposible diagnosticar.
    console.error(
      `[Actividad] fallo al renderizar "${this.props.activityTitle}"`,
      error,
      info.componentStack,
    );
  }

  handleExit = () => {
    this.setState({ error: null });
    this.props.onExit();
  };

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="act-error" role="alert">
        <div className="act-error__panel">
          <p className="act-error__title">No se ha podido cargar la actividad</p>
          <p className="act-error__text">
            Vuelve a intentarlo. Si el problema continua, el profesor puede elegir otra actividad
            del catalogo.
          </p>
          <div className="act-error__actions">
            <button type="button" className="act-error__btn" onClick={this.handleRetry}>
              Reintentar
            </button>
            <button
              type="button"
              className="act-error__btn act-error__btn--primary"
              onClick={this.handleExit}
            >
              Volver al catalogo
            </button>
          </div>
        </div>
      </div>
    );
  }
}
