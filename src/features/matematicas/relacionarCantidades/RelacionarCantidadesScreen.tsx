import { useCallback, useState } from "react";
import { generateSession, representacion } from "../../../core/activities/relacionarCantidades";
import type {
  CantidadVisual,
  RelacionarCantidadesPair,
  RelacionarCantidadesRound,
} from "../../../core/activities/relacionarCantidades";
import type { EngineScreenProps } from "../engine-screens";
import { MatchColumns, type MatchReport } from "../components/MatchColumns";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActivityHeader } from "../components/ActivityHeader";
import "./RelacionarCantidadesScreen.css";

/** Cuántas pantallas tiene la sesión. */
const TOTAL_PANTALLAS = 10;

/**
 * "Relacionar cantidades" (2.º, unidad 1: los números hasta el 99).
 *
 * La aritmética es la de
 * `electron-reference/Colegio/src/renderer/src/core/engines/relacionarCantidades/`,
 * y las diferencias están todas anotadas en el núcleo. Aquí se compone.
 *
 * El emparejamiento lo pone `MatchColumns`, el componente compartido con
 * `relacionar` y `multiplicacion`.
 */
export function RelacionarCantidadesScreen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
  className,
  mascotUrl,
  difficultyStars,
}: EngineScreenProps) {
  /** Semilla de la sesión: "Repetir" la reutiliza para dar las mismas pantallas. */
  const [sessionSeed] = useState(seed);
  const [rondas, setRondas] = useState<RelacionarCantidadesRound[]>(() =>
    generateSession(difficulty, sessionSeed, TOTAL_PANTALLAS),
  );
  const [indice, setIndice] = useState(0);
  const [acertadas, setAcertadas] = useState(0);
  const [inicio] = useState(() => Date.now());
  const [finished, setFinished] = useState<SessionResult | null>(null);

  /** Una pantalla cuenta solo si se completó sin fallar ninguna unión. */
  const handleComplete = useCallback(
    (report: MatchReport) => {
      const perfecta = report.completa && report.fallos === 0;
      const siguiente = indice + 1;
      if (siguiente >= TOTAL_PANTALLAS) {
        setFinished({
          total: TOTAL_PANTALLAS,
          // El acierto de esta última pantalla aún no está en el estado.
          correct: perfecta ? acertadas + 1 : acertadas,
          duration: Date.now() - inicio,
        });
      } else {
        if (perfecta) setAcertadas((c) => c + 1);
        setIndice(siguiente);
      }
    },
    [indice, acertadas, inicio],
  );

  const handleRestart = useCallback(() => {
    setFinished(null);
    setRondas(generateSession(difficulty, sessionSeed, TOTAL_PANTALLAS));
    setIndice(0);
    setAcertadas(0);
  }, [difficulty, sessionSeed]);

  const actual = rondas[indice];

  if (finished) {
    return (
      <SummaryScreen
        result={finished}
        gradeLabel={gradeTitle ?? ""}
        onRestart={handleRestart}
        onExit={onExit}
      />
    );
  }

  if (!actual) {
    return (
      <SummaryScreen
        result={{ total: TOTAL_PANTALLAS, correct: 0, duration: 0 }}
        gradeLabel={gradeTitle ?? ""}
        onRestart={handleRestart}
        onExit={onExit}
      />
    );
  }

  return (
    <div className={`rel2 ${className ?? ""}`}>
      <ActivityHeader
        unitTitle={activity.title}
        gradeTitle={gradeTitle}
        progress={`${indice + 1} / ${TOTAL_PANTALLAS}`}
        onExit={onExit}
        className={className}
        mascotUrl={mascotUrl}
        difficultyStars={difficultyStars}
      />

      <main className="rel2__main">
        <p className="rel2__instruction">
          Relaciona cada situación con la cantidad o el cambio correspondiente
        </p>

        <MatchColumns<RelacionarCantidadesPair>
          key={indice}
          prefix="rel2"
          leftClass="rel2__item--left"
          rightClass="rel2__item--right"
          left={actual.leftColumn}
          right={actual.rightColumn}
          celebrateText="¡Excelente relación! 🎉"
          renderLeft={(par) => (
            <Tarjeta par={par} texto={par.leftText} cantidades={par.izquierda} resultado={false} />
          )}
          renderRight={(par) => (
            <Tarjeta par={par} texto={par.rightText} cantidades={[par.derecha]} resultado />
          )}
          onComplete={handleComplete}
        />
      </main>
    </div>
  );
}

/** Una tarjeta: el texto arriba y debajo lo que dice, dibujado. */
function Tarjeta({
  par,
  texto,
  cantidades,
  resultado,
}: {
  par: RelacionarCantidadesPair;
  texto: string;
  cantidades: CantidadVisual[];
  /** Solo para la clase, que el texto de resultado se pinta de otra forma. */
  resultado: boolean;
}) {
  return (
    <>
      <div className={`rel2__text-box${resultado ? " rel2__text-box--result" : ""}`}>{texto}</div>
      <div className="rel2__visual">
        {cantidades.map((cantidad, i) => (
          <CantidadDibujo key={`${cantidad.total}-${i}`} cantidad={cantidad} par={par} />
        ))}
      </div>
    </>
  );
}

/**
 * Dibuja una cantidad: un bloque por decena, rotulado `×10`, y las unidades sueltas.
 *
 * Un bloque de diez lleva su rótulo porque un grupo de diez figuras no es diez
 * veces una figura suelta: es la base decimal, y de eso va la actividad.
 */
function CantidadDibujo({
  cantidad,
  par,
}: {
  cantidad: CantidadVisual;
  par: RelacionarCantidadesPair;
}) {
  const { bloques, unidades, decenasOcultas } = representacion(cantidad.total);

  return (
    <div className="rel2__cantidad">
      {cantidad.rotulo && <span className="rel2__rotulo">{cantidad.rotulo}</span>}

      <div className="rel2__figuras">
        {Array.from({ length: bloques }, (_, b) => (
          <div key={`bloque-${b}`} className="rel2__bloque">
            <div className="rel2__bloque-figuras">
              {Array.from({ length: 10 }, (_, f) => (
                <img key={f} src={par.imageUrl} className="rel2__img" alt="" />
              ))}
            </div>
            <span className="rel2__bloque-rotulo">×10</span>
          </div>
        ))}

        {Array.from({ length: unidades }, (_, u) => (
          <img
            key={`suelta-${u}`}
            src={par.imageUrl}
            className="rel2__img rel2__img--suelta"
            alt=""
          />
        ))}
      </div>

      {decenasOcultas > 0 && (
        // Solo llega en `expert`, con números de tres cifras: dibujar 34 bloques
        // no cabe en una tarjeta, así que se declara lo que no se dibuja.
        <span className="rel2__oculto">+{decenasOcultas} × 10</span>
      )}
    </div>
  );
}
