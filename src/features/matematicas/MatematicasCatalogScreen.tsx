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
import { isDemoActivityAllowed } from "../../core/demo/demoMode";
import { useViewTransition } from "../../core/transition/ViewTransitionContext";
import { useExerciseSession } from "./ExerciseSessionContext";
import { CatalogFilterBar } from "./CatalogFilterBar";
import { DifficultyReveal } from "./components/DifficultyReveal";
import { getCurriculumLevelsForGrade, getDifficultyStars, getStarsForLevel } from "./levelSelect";
import "./MatematicasCatalogScreen.css";
import fondoImg from "../../assets/catalogo-fondo.png";

interface Props {
  initialGradeId: GradeId;
  onBack: () => void;
  demoMode?: boolean;
}

export function MatematicasCatalogScreen({ initialGradeId, onBack, demoMode = false }: Props) {
  const { profile } = useClassProfile();
  const { launchSession, catalogGradeId, setCatalogGradeId } = useExerciseSession();
  const { navigate } = useViewTransition();
  const subjects = getSubjects();
  const [subjectId, setSubjectId] = useState(subjects[0].id);
  // ViewTransition remonta el catálogo al salir del ejercicio: preferir el curso
  // que se estaba usando (p. ej. 1.º) frente al del aula por defecto.
  const [gradeId, setGradeId] = useState(() => catalogGradeId ?? initialGradeId);
  const [blockId, setBlockId] = useState<string>("");
  const [selected, setSelected] = useState<ActivityManifest | null>(null);
  const [difficulty, setDifficulty] = useState<ActivityDifficulty>("easy");
  const [levelId, setLevelId] = useState<CurriculumLevelId | null>(null);
  const [popupShrinking, setPopupShrinking] = useState(false);
  const grades = getGrades(subjectId);
  const blocks = getCurriculumBlocks(subjectId, gradeId);
  const visibleBlocks = blockId ? blocks.filter((block) => block.id === blockId) : blocks;
  const gradeTitle = grades.find((grade) => grade.id === gradeId)?.title ?? "Primaria";
  const activityGroups = visibleBlocks.map((block) => ({
    block,
    activities: getActivities({ subjectId, gradeId, curriculumBlockId: block.id }),
  }));

  const launchExercise = () => {
    if (!selected) return;
    const diffStars = levelId ? getStarsForLevel(levelId) : getDifficultyStars(difficulty);
    launchSession({
      activity: selected,
      difficulty,
      levelId: levelId ?? undefined,
      gradeId,
      gradeTitle,
      className: profile.className,
      mascotUrl: profile.mascotUrl,
      difficultyStars: diffStars,
    });
    setSelected(null);
    setPopupShrinking(false);
    navigate("exercise", "right");
  };

  return (
    <div className="mat">
      <img src={fondoImg} alt="" className="catalogo-fondo-img" />
      <header className="mat__header">
        <button className="mat__back-btn" onClick={onBack}>
          ← Inicio
        </button>
        <div className="mat__title-area">
          <span className="mat__subject">
            {subjects.find((subject) => subject.id === subjectId)?.title}
          </span>
          <span className="mat__grade">
            <span className="mat__grade-title">{gradeTitle}</span>
            <span className="mat__grade-separator"> — </span>
            <span className="mat__class-name">{profile.className}</span>
          </span>
        </div>
        <span className="mat__mode-badge">🖥️ Pizarra Digital</span>
        {profile.mascotUrl && <img src={profile.mascotUrl} alt="" className="mat__header-mascot" />}
      </header>

      <div className="mat__body">
        <div className="mat__filters-dock">
          <CatalogFilterBar
            subjects={subjects}
            grades={grades}
            blocks={blocks}
            subjectId={subjectId}
            gradeId={gradeId}
            blockId={blockId}
            onSubjectChange={(id) => setSubjectId(id)}
            onGradeChange={(id) => {
              setGradeId(id);
              setCatalogGradeId(id);
              setBlockId("");
            }}
            onBlockChange={setBlockId}
          />
        </div>

        <div className="mat__scroll">
          {activityGroups.map(({ block, activities }) => (
            <section key={block.id} className="mat__section">
              <h2 className="mat__section-title">
                {block.description} — {block.title}
              </h2>
              <div className="mat__activities">
                {activities.map((activity) => {
                  const demoLocked = demoMode && !isDemoActivityAllowed(activity.id);
                  const launchable = canLaunchActivity(activity) && !demoLocked;
                  return (
                    <button
                      key={activity.id}
                      className={`activity-card edu-glow ${launchable ? "" : "activity-card--soon edu-glow--soon"}`}
                      disabled={!launchable}
                      onClick={() => {
                        if (!launchable) return;
                        setSelected(activity);
                        setDifficulty("easy");
                        if (
                          activity.engineId === "counting" ||
                          activity.engineId === "tresSumandos"
                        ) {
                          setLevelId(getCurriculumLevelsForGrade(activity, gradeId)[0]!);
                        } else {
                          setLevelId(null);
                        }
                      }}
                    >
                      <span className="activity-card__icon">
                        {activity.boardCard?.icon ?? "🔢"}
                      </span>
                      <span className="activity-card__title">{activity.title}</span>
                      <span className="activity-card__desc">{activity.description}</span>
                      {demoLocked ? (
                        <span className="activity-card__soon">No disponible en DEMO</span>
                      ) : (
                        !launchable && <span className="activity-card__soon">En migración PWA</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      {selected && (
        <DifficultyReveal
          activity={selected}
          gradeId={gradeId}
          selectedDifficulty={difficulty}
          selectedLevelId={levelId}
          onSelectDifficulty={(diff, lvlId) => {
            setDifficulty(diff);
            setLevelId(lvlId);
          }}
          onStart={() => {
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
              launchExercise();
            } else {
              setPopupShrinking(true);
            }
          }}
          onClose={() => setSelected(null)}
          isShrinking={popupShrinking}
          onAnimationEnd={() => {
            if (popupShrinking) launchExercise();
          }}
        />
      )}
    </div>
  );
}
