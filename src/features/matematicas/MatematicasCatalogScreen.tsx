import { useState } from "react";
import {
  getActivities,
  getCurriculumBlocks,
  getGrades,
  getSubjects,
} from "../../core/content/catalog";
import type {
  ActivityDifficulty,
  CurriculumLevelId,
  ActivityManifest,
  GradeId,
} from "../../core/content/contracts";
import { canLaunchActivity } from "../../core/content/engine-registry";
import { useClassProfile } from "../../core/context/ClassProfileContext";
import { EngineScreen } from "./engine-screens";
import "./MatematicasCatalogScreen.css";

interface Props {
  initialGradeId: GradeId;
  onBack: () => void;
}

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
  // Si estamos viendo el catálogo desde 1º, mostramos los 4 primeros (1-L1 a 1-L4)
  if (currentGradeId === "grade-1") return levelOrder.slice(0, 4);
  // Si estamos en 2º, mostramos los 4 siguientes (2-L1 a 2-L4)
  if (currentGradeId === "grade-2") return levelOrder.slice(4, 8);

  // Fallback si no hay grade (ej: búsqueda global futura)
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
  if (engineId === "tresSumandos") {
    return ""; // Not specifically requested, covered by mechanic
  }
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
    const mechanicMap: Record<CurriculumLevelId, string> = {
      "1-L1": "3 sumandos pequeños, sin llevadas",
      "1-L2": "3 sumandos hasta 20, con llevadas",
      "1-L3": "2 cifras, sin llevadas",
      "1-L4": "2 cifras con una llevada",
      "2-L1": "3 sumandos de 2 cifras, sin llevadas",
      "2-L2": "3 sumandos de 2 cifras, con llevadas",
      "2-L3": "3 sumandos de 3 cifras, sin llevadas",
      "2-L4": "3 sumandos de 3 cifras, con llevadas",
    };
    return mechanicMap[levelId] || "";
  }
  const mechanicMap: Record<CurriculumLevelId, string> = {
    "1-L1": "Toque individual",
    "1-L2": "Selección por pares",
    "1-L3": "Arrastre a contenedores",
    "1-L4": "Escribe D y U",
    "2-L1": "Selección de respuesta",
    "2-L2": "Escribe C, D y U",
    "2-L3": "Selección de respuesta",
    "2-L4": "Selección de respuesta",
  };
  return mechanicMap[levelId] || "";
}

function getDifficultyStars(difficulty?: ActivityDifficulty): string {
  const map: Record<ActivityDifficulty, string> = {
    easy: "⭐",
    medium: "⭐⭐",
    hard: "⭐⭐⭐",
    expert: "⭐⭐⭐⭐",
  };
  return difficulty ? map[difficulty] : "";
}

export function MatematicasCatalogScreen({ initialGradeId, onBack }: Props) {
  const { profile } = useClassProfile();
  const subjects = getSubjects();
  const [subjectId, setSubjectId] = useState(subjects[0].id);
  const [gradeId, setGradeId] = useState(initialGradeId);
  const [blockId, setBlockId] = useState<string>("");
  const [selected, setSelected] = useState<ActivityManifest | null>(null);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "expert">("easy");
  const [levelId, setLevelId] = useState<CurriculumLevelId | null>(null);
  const [session, setSession] = useState<{
    activity: ActivityManifest;
    difficulty?: "easy" | "medium" | "hard" | "expert";
    levelId?: CurriculumLevelId;
    seed: number;
  } | null>(null);
  const grades = getGrades(subjectId);
  const blocks = getCurriculumBlocks(subjectId, gradeId);
  const visibleBlocks = blockId ? blocks.filter((block) => block.id === blockId) : blocks;
  const gradeTitle = grades.find((grade) => grade.id === gradeId)?.title ?? "Primaria";
  const activityGroups = visibleBlocks.map((block) => ({
    block,
    activities: getActivities({ subjectId, gradeId, curriculumBlockId: block.id }),
  }));
  if (session) {
    const diffStars = session.levelId
      ? getStarsForLevel(session.levelId)
      : getDifficultyStars(session.difficulty);
    return (
      <EngineScreen
        activity={session.activity}
        difficulty={session.difficulty ?? "easy"}
        seed={session.seed}
        onExit={() => setSession(null)}
        gradeTitle={gradeTitle}
        className={profile.className}
        mascotUrl={profile.mascotUrl}
        difficultyStars={diffStars}
        levelId={session.levelId}
      />
    );
  }

  return (
    <div className="mat">
      <header className="mat__header">
        <button className="mat__back-btn" onClick={onBack}>
          ← Inicio
        </button>
        <div className="mat__title-area">
          <span className="mat__subject">
            {subjects.find((subject) => subject.id === subjectId)?.title}
          </span>
          <span className="mat__grade">
            {gradeTitle} — {profile.className}
          </span>
        </div>
        <span className="mat__mode-badge">🖥️ Pizarra Digital</span>
        {profile.mascotUrl && <img src={profile.mascotUrl} alt="" className="mat__header-mascot" />}
      </header>

      <div className="mat__body">
        <section className="mat__filters" aria-label="Filtros del catálogo">
          <label>
            Materia
            <select value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Curso
            <select
              value={gradeId}
              onChange={(event) => {
                setGradeId(event.target.value);
                setBlockId("");
              }}
            >
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Bloque
            <select value={blockId} onChange={(event) => setBlockId(event.target.value)}>
              <option value="">Todas las unidades</option>
              {blocks.map((block) => (
                <option key={block.id} value={block.id}>
                  {block.description} — {block.title}
                </option>
              ))}
            </select>
          </label>
        </section>

        <p className="mat__migration-note">
          El catálogo procede de los manifiestos. Solo se inician los motores ya migrados a la PWA.
        </p>

        {activityGroups.map(({ block, activities }) => (
          <section key={block.id} className="mat__section">
            <h2 className="mat__section-title">
              {block.description} — {block.title}
            </h2>
            <div className="mat__activities">
              {activities.map((activity) => {
                const launchable = canLaunchActivity(activity);
                return (
                  <button
                    key={activity.id}
                    className={`activity-card ${launchable ? "" : "activity-card--soon"}`}
                    disabled={!launchable}
                    onClick={() => {
                      if (!launchable) return;
                      setSelected(activity);
                      setDifficulty("easy");
                      if (
                        activity.engineId === "counting" ||
                        activity.engineId === "tresSumandos"
                      ) {
                        setLevelId(getLevelsForActivity(activity, gradeId)[0]);
                      } else {
                        setLevelId(null);
                      }
                    }}
                  >
                    <span className="activity-card__icon">{activity.boardCard?.icon ?? "🔢"}</span>
                    <span className="activity-card__title">{activity.title}</span>
                    <span className="activity-card__desc">{activity.description}</span>
                    {!launchable && <span className="activity-card__soon">En migración PWA</span>}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {selected && (
        <div className="mat__popup-backdrop" onClick={() => setSelected(null)}>
          <div
            className="mat__popup"
            role="dialog"
            aria-labelledby="activity-launch-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="mat__popup-close"
              onClick={() => setSelected(null)}
              aria-label="Cerrar"
            >
              ×
            </button>
            <div className="mat__popup-header">
              <span className="mat__popup-icon">{selected.boardCard?.icon ?? "🔢"}</span>
              <h2 id="activity-launch-title" className="mat__popup-title">
                {selected.title}
              </h2>
            </div>
            <div className="mat__level-selector">
              {selected.engineId === "counting" || selected.engineId === "tresSumandos"
                ? // Selector de niveles de currículo
                  getLevelsForActivity(selected, gradeId).map((level) => {
                    const levelName = getLevelName(level, selected.engineId);
                    const levelRange = getLevelRange(level, selected.engineId);
                    const levelMechanic = getLevelMechanic(level, selected.engineId);
                    const stars = getStarsForLevel(level);
                    const isSelected = levelId === level;
                    return (
                      <div
                        key={level}
                        className={`level-card ${isSelected ? "level-card--selected" : ""}`}
                        onClick={() => {
                          setLevelId(level);
                          setDifficulty(
                            level === "1-L1"
                              ? "easy"
                              : level === "1-L2"
                                ? "medium"
                                : level === "1-L3"
                                  ? "hard"
                                  : level === "1-L4"
                                    ? "expert"
                                    : level === "2-L1"
                                      ? "hard"
                                      : level === "2-L2"
                                        ? "expert"
                                        : level === "2-L3"
                                          ? "expert"
                                          : "expert",
                          );
                        }}
                      >
                        <div className="level-header">
                          <span className="level-stars">{stars}</span>
                          <span className="level-title">{levelName}</span>
                        </div>
                        <div className="level-info">
                          {levelRange && <span className="level-range">Rango: {levelRange}</span>}
                          <span className="level-mechanic">Mecánica: {levelMechanic}</span>
                        </div>
                      </div>
                    );
                  })
                : // Selector de dificultad — para el resto de motores
                  (["easy", "medium", "hard", "expert"] as const).map((diff) => {
                    const desc = selected.boardCard?.difficultyDescriptions?.[diff];
                    const stars = getDifficultyStars(diff);
                    const isSelected = difficulty === diff && levelId === null;
                    return (
                      <div
                        key={diff}
                        className={`level-card ${isSelected ? "level-card--selected" : ""}`}
                        onClick={() => {
                          setDifficulty(diff);
                          setLevelId(null);
                        }}
                      >
                        <div className="level-header">
                          <span className="level-stars">{stars}</span>
                          <span className="level-title">
                            {diff === "easy"
                              ? "Fácil"
                              : diff === "medium"
                                ? "Medio"
                                : diff === "hard"
                                  ? "Difícil"
                                  : "Experto"}
                          </span>
                        </div>
                        {desc && (
                          <div className="level-info">
                            <span className="level-mechanic">{desc}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
            </div>
            <button
              className="mat__start-btn"
              onClick={() => {
                setSession({
                  activity: selected,
                  difficulty,
                  levelId: levelId ?? undefined,
                  seed: Date.now(),
                });
                setSelected(null);
              }}
            >
              Empezar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
