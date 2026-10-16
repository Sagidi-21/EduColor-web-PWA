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
    <div
      className={`rel2${difficulty === "hard" || difficulty === "expert" ? " rel2--text-only" : ""} ${className ?? ""}`}
    >
      <ActivityHeader
        unitTitle={activity.title}
        gradeTitle={gradeTitle}
        progress={`${indice + 1}/${TOTAL_PANTALLAS}`}
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
          layout={difficulty === "medium" ? "rows" : "columns"}
          leftClass="rel2__item--left"
          rightClass="rel2__item--right"
          left={actual.leftColumn}
          right={actual.rightColumn}
          celebrateText="¡Excelente relación! 🎉"
          renderLeft={(par) => (
            <Tarjeta
              par={par}
              texto={par.leftText}
              /* En hard/expert solo texto: sin apoyo visual de figuras. */
              cantidades={difficulty === "hard" || difficulty === "expert" ? [] : par.izquierda}
              resultado={false}
            />
          )}
          renderRight={(par) => (
            <Tarjeta par={par} texto={par.rightText} cantidades={[]} resultado />
          )}
          onComplete={handleComplete}
        />
      </main>
    </div>
  );
}

/** Números del enunciado de la tarjeta en primary (como Reloj / pizarra). */
function resaltarNumeros(texto: string) {
  return texto.split(/(\d+)/).map((parte, i) =>
    /^\d+$/.test(parte) ? (
      <span key={i} className="rel2__num">
        {parte}
      </span>
    ) : (
      parte
    ),
  );
}

/**
 * Una tarjeta: el texto arriba y, si hay cantidades, el dibujo debajo.
 *
 * Derecha: solo texto. Izquierda: dibujo en easy/medium; hard/expert solo enunciado.
 */
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
      <div className={`rel2__text-box${resultado ? " rel2__text-box--result" : ""}`}>
        {resaltarNumeros(texto)}
      </div>
      {cantidades.length > 0 && (
        <div className="rel2__visual">
          {cantidades.map((cantidad, i) => (
            <CantidadDibujo key={`${cantidad.total}-${i}`} cantidad={cantidad} par={par} />
          ))}
        </div>
      )}
    </>
  );
}

/**
 * Dibuja una cantidad: una caja por cada cien, una por cada diez y las unidades
 * sueltas.
 *
 * Cada caja lleva **una sola figura** y su rótulo debajo, no las cien ni las diez
 * figuras que representa: dibujar 100 figuras para decir «cien» es lo que
 * dejaba la tarjeta sin sitio. La caja es el objeto —la plancha y la barra de las
 * bases diez— y el rótulo dice cuánto vale, de modo que la diferencia entre cien
 * y diez se ve en el tamaño de la caja y no en tener que contar figuras.
 */
function CantidadDibujo({
  cantidad,
  par,
}: {
  cantidad: CantidadVisual;
  par: RelacionarCantidadesPair;
}) {
  const { centenas, decenas, unidades } = representacion(cantidad.total);

  return (
    <div className="rel2__cantidad">
      {cantidad.rotulo && <span className="rel2__rotulo">{cantidad.rotulo}</span>}

      {/* Las cajas y las unidades comparten fila pero no envoltorio: si compartieran
          el mismo, las unidades que no cabían caían debajo de las cajas de ×10 o
          ×100 y se leían como si fueran parte de ellas. */}
      <div className="rel2__figuras">
        {(centenas > 0 || decenas > 0) && (
          <div className="rel2__cajas">
            {Array.from({ length: centenas }, (_, c) => (
              <div key={`cien-${c}`} className="rel2__bloque rel2__bloque--cien">
                <img src={par.imageUrl} className="rel2__img" alt="" />
                <span className="rel2__bloque-rotulo">×100</span>
              </div>
            ))}

            {Array.from({ length: decenas }, (_, d) => (
              <div key={`diez-${d}`} className="rel2__bloque">
                <img src={par.imageUrl} className="rel2__img" alt="" />
                <span className="rel2__bloque-rotulo">×10</span>
              </div>
            ))}
          </div>
        )}

        {unidades > 0 && (
          <div className="rel2__unidades">
            {Array.from({ length: unidades }, (_, u) => (
              <img
                key={`suelta-${u}`}
                src={par.imageUrl}
                className="rel2__img rel2__img--suelta"
                alt=""
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
