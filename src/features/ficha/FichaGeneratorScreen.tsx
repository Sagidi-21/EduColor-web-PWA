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
import { CatalogFilterBar } from "../matematicas/CatalogFilterBar";
import { FichaModal } from "./FichaModal";
import "../matematicas/MatematicasCatalogScreen.css";
import fondoImg from "../../assets/catalogo-fondo.png";

interface Props {
  initialGradeId: GradeId;
  onBack: () => void;
}

/**
 * Catálogo dedicado al Generador de Fichas (entrada desde Home).
 * Al elegir una actividad abre el modal de ficha directamente.
 */
export function FichaGeneratorScreen({ initialGradeId, onBack }: Props): JSX.Element {
  const { profile } = useClassProfile();
  const subjects = getSubjects();
  const [subjectId, setSubjectId] = useState(subjects[0].id);
  const [gradeId, setGradeId] = useState(initialGradeId);
  const [blockId, setBlockId] = useState("");
  const [selected, setSelected] = useState<ActivityManifest | null>(null);
  const [difficulty, setDifficulty] = useState<ActivityDifficulty>("easy");

  const grades = getGrades(subjectId);
  const blocks = getCurriculumBlocks(subjectId, gradeId);
  const visibleBlocks = blockId ? blocks.filter((block) => block.id === blockId) : blocks;
  const gradeTitle = grades.find((grade) => grade.id === gradeId)?.title ?? "Primaria";
  const subjectTitle = subjects.find((subject) => subject.id === subjectId)?.title ?? "Matemáticas";
  const activityGroups = visibleBlocks.map((block) => ({
    block,
    activities: getActivities({ subjectId, gradeId, curriculumBlockId: block.id }),
  }));

  return (
    <div className="mat">
      <img src={fondoImg} alt="" className="catalogo-fondo-img" />
      <header className="mat__header">
        <button type="button" className="mat__back-btn" onClick={onBack}>
          ← Inicio
        </button>
        <div className="mat__title-area">
          <span className="mat__subject">📄 Generador de Fichas</span>
          <span className="mat__grade">
            <span className="mat__grade-title">{gradeTitle}</span>
            <span className="mat__grade-separator"> — </span>
            <span className="mat__class-name">{profile.className}</span>
          </span>
        </div>
        <span className="mat__mode-badge">Imprimible A4</span>
        {profile.mascotUrl && <img src={profile.mascotUrl} alt="" className="mat__header-mascot" />}
      </header>

      <div className="mat__body">
        <CatalogFilterBar
          subjects={subjects}
          grades={grades}
          blocks={blocks}
          subjectId={subjectId}
          gradeId={gradeId}
          blockId={blockId}
          onSubjectChange={setSubjectId}
          onGradeChange={(id) => {
            setGradeId(id);
            setBlockId("");
          }}
          onBlockChange={setBlockId}
        />

        <p className="mat__migration-note">
          Elige una actividad para generar la ficha de alumno, la de soluciones, o ambas a la vez.
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
                    type="button"
                    className={`activity-card edu-glow ${launchable ? "" : "activity-card--soon edu-glow--soon"}`}
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
        <FichaModal
          activity={selected}
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
          gradeTitle={gradeTitle}
          subjectTitle={subjectTitle}
          className={profile.className}
          mascotUrl={profile.mascotUrl || undefined}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
