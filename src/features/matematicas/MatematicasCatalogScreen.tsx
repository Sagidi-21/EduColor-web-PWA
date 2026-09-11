import { useState } from "react";
import {
  getActivities,
  getCurriculumBlocks,
  getGrades,
  getSubjects,
} from "../../core/content/catalog";
import type { ActivityDifficulty, ActivityManifest, GradeId } from "../../core/content/contracts";
import { canLaunchActivity } from "../../core/content/engine-registry";
import { useClassProfile } from "../../core/context/ClassProfileContext";
import { EngineScreen } from "./engine-screens";
import "./MatematicasCatalogScreen.css";

interface Props {
  initialGradeId: GradeId;
  onBack: () => void;
}

const difficultyOptions: readonly {
  id: ActivityDifficulty;
  label: string;
  stars: string;
}[] = [
  { id: "easy", label: "Fácil", stars: "⭐" },
  { id: "medium", label: "Medio", stars: "⭐⭐" },
  { id: "hard", label: "Difícil", stars: "⭐⭐⭐" },
  { id: "expert", label: "Experto", stars: "⭐⭐⭐⭐" },
];

export function MatematicasCatalogScreen({ initialGradeId, onBack }: Props) {
  const { profile } = useClassProfile();
  const subjects = getSubjects();
  const [subjectId, setSubjectId] = useState(subjects[0].id);
  const [gradeId, setGradeId] = useState(initialGradeId);
  const [blockId, setBlockId] = useState<string>("");
  const [selected, setSelected] = useState<ActivityManifest | null>(null);
  const [difficulty, setDifficulty] = useState<ActivityDifficulty>("easy");
  const [session, setSession] = useState<{
    activity: ActivityManifest;
    difficulty: ActivityDifficulty;
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
    const diffStars = difficultyOptions.find((d) => d.id === session.difficulty)?.stars ?? "";
    return (
      <EngineScreen
        activity={session.activity}
        difficulty={session.difficulty}
        seed={session.seed}
        onExit={() => setSession(null)}
        gradeTitle={gradeTitle}
        className={profile.className}
        mascotUrl={profile.mascotUrl}
        difficultyStars={diffStars}
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
            <div className="mat__difficulty">
              {difficultyOptions.map((option) => (
                <button
                  key={option.id}
                  className={`diff-card ${difficulty === option.id ? "diff-card--selected" : ""}`}
                  onClick={() => setDifficulty(option.id)}
                >
                  <span className="diff-card__stars">{option.stars}</span>
                  <span className="diff-card__label">{option.label}</span>
                  <span className="diff-card__desc">
                    {selected.boardCard?.difficultyDescriptions[option.id]}
                  </span>
                </button>
              ))}
            </div>
            <button
              className="mat__start-btn"
              onClick={() => {
                setSession({ activity: selected, difficulty, seed: Date.now() });
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
