import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  ActivityDifficulty,
  ActivityManifest,
  CurriculumLevelId,
  GradeId,
} from "../../../core/content/contracts";
import { playBackpackOpenSFX, playCardsBurstSFX } from "../../../shared/utils/audioSFX";
import { getRandomMascotVariant } from "../../../assets/mascota/variants";
import "./DifficultyReveal.css";

const levelOrder: CurriculumLevelId[] = [
  "1-L1",
  "1-L2",
  "1-L3",
  "1-L4",
  "2-L1",
  "2-L2",
  "2-L3",
  "2-L4",
];

function getLevelsForActivity(
  activity: ActivityManifest,
  currentGradeId?: string,
): CurriculumLevelId[] {
  if (currentGradeId === "grade-1") return levelOrder.slice(0, 4);
  if (currentGradeId === "grade-2") return levelOrder.slice(4, 8);

  const isGrade1 = activity.gradeIds.includes("grade-1");
  const isGrade2 = activity.gradeIds.includes("grade-2");
  if (isGrade1 && !isGrade2) return levelOrder.slice(0, 4);
  if (isGrade2 && !isGrade1) return levelOrder.slice(4, 8);
  return levelOrder;
}

function getStarsForLevel(levelId: CurriculumLevelId): string {
  const match = levelId.match(/L(\d)/);
  const stars = match ? parseInt(match[1], 10) : 1;
  return "⭐".repeat(stars);
}

function getDifficultyStars(difficulty: ActivityDifficulty): string {
  switch (difficulty) {
    case "easy":
      return "⭐";
    case "medium":
      return "⭐⭐";
    case "hard":
      return "⭐⭐⭐";
    case "expert":
      return "⭐⭐⭐⭐";
  }
}

function getLevelName(levelId: CurriculumLevelId, engineId: string): string {
  if (engineId === "tresSumandos") {
    const tresMap: Record<CurriculumLevelId, string> = {
      "1-L1": "Descubro",
      "1-L2": "Construyo",
      "1-L3": "Sumo en columna",
      "1-L4": "¡Me llevo una!",
      "2-L1": "2 cifras, sin llevadas",
      "2-L2": "2 cifras, con llevadas",
      "2-L3": "3 cifras, sin llevadas",
      "2-L4": "3 cifras, con llevadas",
    };
    return tresMap[levelId] || "";
  }
  const levelMap: Record<CurriculumLevelId, string> = {
    "1-L1": "Conteo 1 a 1 y Subitización",
    "1-L2": "Cuadrículas y Conteo por Pares",
    "1-L3": "Agrupación en Decenas",
    "1-L4": "Descomposición D+U",
    "2-L1": "Saltos Numéricos Extendidos",
    "2-L2": "Arreglos Matriciales",
    "2-L3": "Descomposición C, D y U libre",
    "2-L4": "Arreglos Matriciales",
  };
  return levelMap[levelId] || "";
}

function getLevelRange(levelId: CurriculumLevelId, engineId: string): string {
  if (engineId === "tresSumandos") return "";
  const rangeMap: Record<CurriculumLevelId, string> = {
    "1-L1": "1-10",
    "1-L2": "1-20",
    "1-L3": "1-50",
    "1-L4": "1-99",
    "2-L1": "",
    "2-L2": "",
    "2-L3": "",
    "2-L4": "",
  };
  return rangeMap[levelId] || "";
}

function getLevelMechanic(levelId: CurriculumLevelId, engineId: string): string {
  if (engineId === "tresSumandos") {
    const tresMap: Record<CurriculumLevelId, string> = {
      "1-L1": "Suma de 3 números con apoyos (<=10)",
      "1-L2": "Suma directa de 3 números (11-19)",
      "1-L3": "3 sumandos ordenados en columna",
      "1-L4": "Suma vertical acumulando decenas",
      "2-L1": "Sumandos de 2 cifras sin llevada",
      "2-L2": "Sumandos de 2 cifras con llevada",
      "2-L3": "Sumandos de 3 cifras sin llevada",
      "2-L4": "Sumandos de 3 cifras con llevada",
    };
    return tresMap[levelId] || "";
  }
  const mechanicMap: Record<CurriculumLevelId, string> = {
    "1-L1": "Toca elementos 1 a 1 / reconocimiento visual directo",
    "1-L2": "Contar de 2 en 2 en cuadrículas",
    "1-L3": "Formar decenas y contar unidades",
    "1-L4": "Separar en Decenas y Unidades",
    "2-L1": "Saltos en la recta numérica",
    "2-L2": "Multiplicación visual previa",
    "2-L3": "Descomponer números en C, D y U",
    "2-L4": "Organización en filas y columnas",
  };
  return mechanicMap[levelId] || "";
}

export interface DifficultyRevealProps {
  activity: ActivityManifest;
  gradeId?: GradeId;
  selectedDifficulty: ActivityDifficulty;
  selectedLevelId: CurriculumLevelId | null;
  onSelectDifficulty: (diff: ActivityDifficulty, levelId: CurriculumLevelId | null) => void;
  onStart: () => void;
  onClose: () => void;
  isShrinking: boolean;
  onAnimationEnd: () => void;
}

export function DifficultyReveal({
  activity,
  gradeId,
  selectedDifficulty,
  selectedLevelId,
  onSelectDifficulty,
  onStart,
  onClose,
  isShrinking,
  onAnimationEnd,
}: DifficultyRevealProps) {
  // Seleccionar una variante aleatoria de la mascota al abrir el modal
  const [mascotImg] = useState(() => getRandomMascotVariant());

  // Secuencia de animación: "mascot_in" -> "backpack_open" -> "cards_burst" -> "ready"
  const [animStep, setAnimStep] = useState<"mascot_in" | "backpack_open" | "cards_burst" | "ready">(
    "mascot_in",
  );

  useEffect(() => {
    // Si la persona prefiere movimiento reducido, ir directamente a ready
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTimeout(() => setAnimStep("ready"), 0);
      return;
    }

    // Paso 1: Entra la mascota con su salto
    const timer1 = setTimeout(() => {
      setAnimStep("backpack_open");
      playBackpackOpenSFX();
    }, 450);

    // Paso 2: La mochila se abre e inician las tarjetas 1 a 1
    const timer2 = setTimeout(() => {
      setAnimStep("cards_burst");
      playCardsBurstSFX();
    }, 900);

    // Paso 3: Las tarjetas se asientan completamente y aparece el botón
    const timer3 = setTimeout(() => {
      setAnimStep("ready");
    }, 2600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const isCurriculum = activity.engineId === "counting" || activity.engineId === "tresSumandos";
  const currLevels = isCurriculum ? getLevelsForActivity(activity, gradeId) : [];
  const stdDifficulties: ActivityDifficulty[] = ["easy", "medium", "hard", "expert"];

  // Variantes para Framer Motion de la Mascota
  const mascotVariants = {
    mascot_in: { y: 140, scale: 0.7, opacity: 0 },
    backpack_open: {
      y: 0,
      scale: 1,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 220, damping: 16 },
    },
    cards_burst: {
      y: 0,
      scale: 1,
      opacity: 1,
      transition: { duration: 0.2 },
    },
    ready: {
      y: 0,
      scale: 1,
      opacity: 1,
      transition: { duration: 0.2 },
    },
  };

  // Travectorias verdaderas desde la mochila (ubicada ARRIBA del grid de tarjetas)
  const cardStartOffsets = [
    { x: 190, y: -100, rotate: -25 }, // Card 0 (Top-Left): viaja desde la mochila (arriba-derecha)
    { x: -170, y: -100, rotate: 25 }, // Card 1 (Top-Right): viaja desde la mochila (arriba-izquierda)
    { x: 190, y: -220, rotate: -18 }, // Card 2 (Bottom-Left): viaja desde la mochila (arriba-derecha)
    { x: -170, y: -220, rotate: 18 }, // Card 3 (Bottom-Right): viaja desde la mochila (arriba-izquierda)
  ];

  return (
    <div className="diff-reveal__backdrop" onClick={onClose}>
      <motion.div
        className={`diff-reveal__container ${isShrinking ? "diff-reveal__container--shrinking" : ""}`}
        role="dialog"
        aria-labelledby="activity-launch-title"
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={onAnimationEnd}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.25 }}
      >
        <button className="diff-reveal__close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>

        <div className="diff-reveal__header">
          <span className="diff-reveal__icon">{activity.boardCard?.icon ?? "🔢"}</span>
          <h2 id="activity-launch-title" className="diff-reveal__title">
            {activity.title}
          </h2>
        </div>

        {/* Cuerpo interno deslizable para proteger siempre la visibilidad del título y el aspa */}
        <div className="diff-reveal__scroll-body">
          {/* Zona central con la Mascota y la apertura mágica */}
          <div className="diff-reveal__stage">
            <motion.div
              className="diff-reveal__mascot-wrapper"
              variants={mascotVariants}
              initial="mascot_in"
              animate={animStep}
            >
              <img
                src={mascotImg}
                alt="Mascota EduColor con Mochila Mágica"
                className="diff-reveal__mascot-img"
              />

              {/* Brillo místico y chispas al abrir la mochila */}
              <AnimatePresence>
                {(animStep === "backpack_open" || animStep === "cards_burst") && (
                  <motion.div
                    className="diff-reveal__magic-glow"
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: 1, scale: 1.2 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.4 }}
                  >
                    <span
                      className="diff-reveal__sparkle"
                      style={{ left: "10%", top: "20%", color: "#facc15" }}
                    >
                      ✨
                    </span>
                    <span
                      className="diff-reveal__sparkle"
                      style={{ left: "60%", top: "10%", color: "#38bdf8" }}
                    >
                      ✦
                    </span>
                    <span
                      className="diff-reveal__sparkle"
                      style={{ left: "40%", top: "60%", color: "#fb923c" }}
                    >
                      ⭐
                    </span>
                    <span
                      className="diff-reveal__sparkle"
                      style={{ left: "80%", top: "50%", color: "#a855f7" }}
                    >
                      ✧
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Grid de las 4 Tarjetas saliendo simultáneamente */}
            <div className="diff-reveal__grid">
              {isCurriculum
                ? currLevels.map((lvl, index) => {
                    const levelName = getLevelName(lvl, activity.engineId);
                    const levelRange = getLevelRange(lvl, activity.engineId);
                    const levelMechanic = getLevelMechanic(lvl, activity.engineId);
                    const stars = getStarsForLevel(lvl);
                    const isSelected = selectedLevelId === lvl;
                    const traj = cardStartOffsets[index % 4];

                    const mappedDiff: ActivityDifficulty =
                      lvl === "1-L1"
                        ? "easy"
                        : lvl === "1-L2"
                          ? "medium"
                          : lvl === "1-L3"
                            ? "hard"
                            : lvl === "1-L4"
                              ? "expert"
                              : "expert";

                    return (
                      <motion.div
                        key={lvl}
                        className={`diff-reveal__card edu-glow ${isSelected ? "diff-reveal__card--selected" : ""}`}
                        onClick={() => onSelectDifficulty(mappedDiff, lvl)}
                        initial={
                          animStep !== "ready"
                            ? { x: traj.x, y: traj.y, scale: 0.05, opacity: 0, rotate: traj.rotate }
                            : false
                        }
                        animate={
                          animStep === "cards_burst" || animStep === "ready"
                            ? { x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }
                            : { x: traj.x, y: traj.y, scale: 0.05, opacity: 0, rotate: traj.rotate }
                        }
                        transition={{
                          type: "spring" as const,
                          stiffness: 140,
                          damping: 14,
                          delay: index * 0.32,
                        }}
                      >
                        <span className="diff-reveal__stars">{stars}</span>
                        <span className="diff-reveal__card-title">{levelName}</span>
                        <div className="diff-reveal__card-info">
                          {activity.engineId !== "counting" && levelRange && (
                            <span className="diff-reveal__card-range">Rango: {levelRange}</span>
                          )}
                          <span className="diff-reveal__card-mechanic">{levelMechanic}</span>
                        </div>
                      </motion.div>
                    );
                  })
                : stdDifficulties.map((diff, index) => {
                    const desc = activity.boardCard?.difficultyDescriptions?.[diff];
                    const stars = getDifficultyStars(diff);
                    const isSelected = selectedDifficulty === diff && selectedLevelId === null;
                    const traj = cardStartOffsets[index % 4];

                    return (
                      <motion.div
                        key={diff}
                        className={`diff-reveal__card edu-glow ${isSelected ? "diff-reveal__card--selected" : ""}`}
                        onClick={() => onSelectDifficulty(diff, null)}
                        initial={
                          animStep !== "ready"
                            ? { x: traj.x, y: traj.y, scale: 0.05, opacity: 0, rotate: traj.rotate }
                            : false
                        }
                        animate={
                          animStep === "cards_burst" || animStep === "ready"
                            ? { x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }
                            : { x: traj.x, y: traj.y, scale: 0.05, opacity: 0, rotate: traj.rotate }
                        }
                        transition={{
                          type: "spring" as const,
                          stiffness: 140,
                          damping: 14,
                          delay: index * 0.32,
                        }}
                      >
                        <span className="diff-reveal__stars">{stars}</span>
                        {desc && (
                          <div className="diff-reveal__card-info">
                            <span className="diff-reveal__card-mechanic">{desc}</span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
            </div>
          </div>

          {/* Botón de inicio volando el último desde la mochila */}
          <motion.button
            className="diff-reveal__start-btn diff-reveal__start-btn--chalk"
            onClick={onStart}
            initial={
              animStep !== "ready" ? { x: 0, y: -380, scale: 0.05, opacity: 0, rotate: -5 } : false
            }
            animate={
              animStep === "cards_burst" || animStep === "ready"
                ? { x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }
                : { x: 0, y: -380, scale: 0.05, opacity: 0, rotate: -5 }
            }
            transition={{
              type: "spring" as const,
              stiffness: 140,
              damping: 14,
              delay: 1.28,
            }}
          >
            🚀 ¡Empezar Ejercicio!
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
