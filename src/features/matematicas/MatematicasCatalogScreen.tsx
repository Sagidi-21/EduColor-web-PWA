import { useMemo, useState } from "react";
import {
  getActivities,
  getCurriculumBlocks,
  getGrades,
  getSubjects,
} from "../../core/content/catalog";
import type { GradeId } from "../../core/content/contracts";
import { canLaunchActivity } from "../../core/content/engine-registry";
import { useClassProfile } from "../../core/context/ClassProfileContext";
import "./MatematicasCatalogScreen.css";

interface Props {
  initialGradeId: GradeId;
  onBack: () => void;
}

export function MatematicasCatalogScreen({ initialGradeId, onBack }: Props) {
  const { profile } = useClassProfile();
  const subjects = getSubjects();
  const [subjectId, setSubjectId] = useState(subjects[0].id);
  const [gradeId, setGradeId] = useState(initialGradeId);
  const [blockId, setBlockId] = useState<string>("");
  const grades = getGrades(subjectId);
  const blocks = getCurriculumBlocks(subjectId, gradeId);
  const visibleBlocks = blockId ? blocks.filter((block) => block.id === blockId) : blocks;
  const gradeTitle = grades.find((grade) => grade.id === gradeId)?.title ?? "Primaria";
  const activityGroups = useMemo(
    () =>
      visibleBlocks.map((block) => ({
        block,
        activities: getActivities({ subjectId, gradeId, curriculumBlockId: block.id }),
      })),
    [blockId, gradeId, subjectId, visibleBlocks],
  );

  return (
    <div className="mat">
      <header className="mat__header">
        <button className="mat__back-btn" onClick={onBack}>
          ← Inicio
        </button>
        <div className="mat__title-area">
          <span className="mat__subject">{subjects.find((subject) => subject.id === subjectId)?.title}</span>
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
          El catálogo ya procede de los manifiestos PWA. Una actividad solo se podrá iniciar cuando
          su motor haya sido migrado y validado.
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
    </div>
  );
}
