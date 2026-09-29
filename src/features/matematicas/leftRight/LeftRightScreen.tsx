import { useState, useEffect, useCallback, useRef } from "react";
import { generateSession, validateAnswer } from "../../../core/activities/leftRight";
import type {
  AnyLRExercise,
  LeftRightCharExercise,
  LeftRightExercise,
  SessionResult,
} from "../../../core/activities/leftRight";
import type { EngineScreenProps } from "../engine-screens";
import { playFeedback } from "../../shared/audioFeedback";
import { ActivityHeader } from "../components/ActivityHeader";
import { ActionButtons } from "../components/ActivityActionButtons";
import { SummaryScreen } from "../components/SummaryScreen";
import "./LeftRightScreen.css";

type AnswerState = "idle" | "correct" | "wrong";
type BoxContent = { "box-left": number | null; "box-right": number | null };
type DragRef = {
  active: boolean;
  objIdx: number;
  x: number;
  y: number;
  lastX: number;
  lastY: number;
  el: HTMLDivElement | null;
  cleanup: (() => void) | null;
};

const DRAG_REF_IDLE: DragRef = {
  active: false,
  objIdx: -1,
  x: 0,
  y: 0,
  lastX: 0,
  lastY: 0,
  el: null,
  cleanup: null,
};
const BOX_EMPTY: BoxContent = { "box-left": null, "box-right": null };

function isChar(ex: AnyLRExercise): ex is LeftRightCharExercise {
  return "kind" in ex && ex.kind !== undefined;
}

export function LeftRightScreen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
  className,
  mascotUrl,
  difficultyStars,
}: EngineScreenProps) {
  const [session, setSession] = useState(() => ({
    exercises: generateSession(difficulty, seed),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle" as AnswerState,
    chosen: null as null | string,
    alreadyFailed: false,
  }));
  const [finished, setFinished] = useState<SessionResult | null>(null);
  const [boxContent, setBoxContent] = useState<BoxContent>(BOX_EMPTY);
  const dragRef = useRef<DragRef>({ ...DRAG_REF_IDLE });

  const boxLeftRef = useRef<HTMLDivElement>(null);
  const boxRightRef = useRef<HTMLDivElement>(null);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;
  const charMode = !!current && isChar(current);
  const charEx = charMode ? (current as LeftRightCharExercise) : null;
  const regEx = !charMode ? (current as LeftRightExercise) : null;

  const handleRetry = useCallback(() => {
    setSession((s) => ({
      ...s,
      answerState: "idle",
      chosen: null,
      alreadyFailed: true,
    }));
  }, []);

  const handleNext = useCallback(() => {
    const next = session.currentIndex + 1;
    if (next >= total)
      setFinished({
        total,
        correct: session.correctCount,
        duration: Date.now() - session.startTime,
      });
    else {
      const d = dragRef.current;
      d.cleanup?.();
      if (d.el) {
        d.el.style.removeProperty("left");
        d.el.style.removeProperty("top");
        d.el.style.removeProperty("z-index");
        d.el.classList.remove("lr__drag-obj--active");
      }
      dragRef.current = { ...DRAG_REF_IDLE };
      setBoxContent(BOX_EMPTY);
      setSession((s) => ({
        ...s,
        currentIndex: next,
        answerState: "idle",
        chosen: null,
        alreadyFailed: false,
      }));
    }
  }, [session, total]);

  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, 900);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  useEffect(
    () => () => {
      dragRef.current.cleanup?.();
    },
    [],
  );

  const handleChoice = useCallback(
    (opt: string) => {
      if (session.answerState !== "idle") return;
      const ok = validateAnswer(current, opt);
      playFeedback(ok);
      setSession((s) => ({
        ...s,
        answerState: ok ? "correct" : "wrong",
        chosen: opt,
        correctCount: ok && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
      }));
    },
    [session, current],
  );

  const charExRef = useRef(charEx);
  const boxContentRef = useRef(boxContent);
  const handleChoiceRef = useRef(handleChoice);
  useEffect(() => {
    charExRef.current = charEx;
  }, [charEx]);
  useEffect(() => {
    boxContentRef.current = boxContent;
  }, [boxContent]);
  useEffect(() => {
    handleChoiceRef.current = handleChoice;
  }, [handleChoice]);

  const handleObjDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, objIdx: number) => {
      if (session.answerState !== "idle") return;
      e.preventDefault();
      const el = e.currentTarget as HTMLDivElement;
      const cs = window.getComputedStyle(el);
      dragRef.current = {
        active: true,
        objIdx,
        x: parseFloat(cs.left),
        y: parseFloat(cs.top),
        lastX: e.clientX,
        lastY: e.clientY,
        el,
        cleanup: null,
      };
      el.classList.add("lr__drag-obj--active");
      el.style.zIndex = "300";

      function onMove(ev: PointerEvent) {
        const d = dragRef.current;
        if (!d.active || !d.el) return;
        const dpr = window.devicePixelRatio || 1;
        d.x += (ev.clientX - d.lastX) / dpr;
        d.y += (ev.clientY - d.lastY) / dpr;
        d.lastX = ev.clientX;
        d.lastY = ev.clientY;
        d.el.style.left = `${d.x}px`;
        d.el.style.top = `${d.y}px`;
      }

      function onUp(ev: PointerEvent) {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        dragRef.current.cleanup = null;

        const d = dragRef.current;
        if (!d.active || !d.el) return;
        const cx = charExRef.current;
        const bc = boxContentRef.current;
        const hc = handleChoiceRef.current;
        if (!cx) return;

        const { objIdx: idx, el: dragEl } = d;
        const obj = cx.objects[idx];
        if (!obj) return;

        dragEl.classList.remove("lr__drag-obj--active");
        dragEl.style.zIndex = "";
        dragEl.style.left = `${obj.startX}%`;
        dragEl.style.top = `${obj.startY}%`;
        dragRef.current = { ...DRAG_REF_IDLE };

        const hit = (ref: React.RefObject<HTMLDivElement>) => {
          const r = ref.current?.getBoundingClientRect();
          return r
            ? ev.clientX >= r.left &&
                ev.clientX <= r.right &&
                ev.clientY >= r.top &&
                ev.clientY <= r.bottom
            : false;
        };
        const hitLeft = hit(boxLeftRef);
        const hitRight = hit(boxRightRef);

        if (!hitLeft && !hitRight) return;

        const droppedOn = (hitLeft ? "box-left" : "box-right") as "box-left" | "box-right";

        if (cx.kind === "char-drag-one") {
          if (obj.targetBox === null || obj.targetBox !== droppedOn) {
            playFeedback(false);
            setSession((s) => ({ ...s, answerState: "wrong", chosen: droppedOn }));
          } else {
            hc(droppedOn);
          }
        } else if (cx.kind === "char-drag-both") {
          if (obj.targetBox === null || obj.targetBox !== droppedOn) {
            playFeedback(false);
            setSession((s) => ({ ...s, answerState: "wrong", chosen: droppedOn }));
          } else {
            const newContent = { ...bc, [droppedOn]: idx };
            setBoxContent(newContent);
            if (newContent["box-left"] !== null && newContent["box-right"] !== null) {
              playFeedback(true);
              setSession((s) => ({
                ...s,
                answerState: "correct",
                correctCount: s.correctCount + 1,
                chosen: "both",
              }));
            }
          }
        }
      }

      dragRef.current.cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [session.answerState],
  );

  const handleRestart = useCallback(() => {
    setFinished(null);
    setSession({
      exercises: generateSession(difficulty, Date.now() % 999983),
      currentIndex: 0,
      correctCount: 0,
      startTime: Date.now(),
      answerState: "idle",
      chosen: null,
      alreadyFailed: false,
    });
    setBoxContent(BOX_EMPTY);
  }, [difficulty]);

  if (finished) {
    return (
      <SummaryScreen
        result={finished}
        gradeLabel={gradeTitle || "Matemáticas"}
        onRestart={handleRestart}
        onExit={onExit}
      />
    );
  }

  if (!current) return null;

  const stageClass =
    session.answerState === "correct"
      ? "lr__stage--correct"
      : session.answerState === "wrong"
        ? "lr__stage--wrong"
        : "";
  const uniqueOpts = regEx ? [...new Set(regEx.options)] : [];
  const answered = session.answerState !== "idle";

  const handLabel = (boxId: "box-left" | "box-right"): string => {
    if (!charEx) return "";
    const side =
      charEx.perspective === "espaldas"
        ? boxId === "box-left"
          ? "izquierda"
          : "derecha"
        : boxId === "box-left"
          ? "derecha"
          : "izquierda";
    return `mano ${side}`;
  };

  const boxCls = (boxId: "box-left" | "box-right"): string => {
    let cls = "lr__char-box";
    if (!charEx) return cls;
    if (charEx.kind === "char-drag-both") {
      if (boxContent[boxId] !== null) cls += " lr__char-box--correct";
      return cls;
    }
    if (!answered) return cls;
    if (session.answerState === "correct" && boxId === charEx.answer)
      cls += " lr__char-box--correct";
    else if (session.answerState === "wrong" && boxId === session.chosen)
      cls += " lr__char-box--wrong";
    return cls;
  };

  return (
    <div className="lr">
      <ActivityHeader
        onExit={onExit}
        exitLabel="← Salir"
        gradeTitle={gradeTitle}
        className={className}
        unitTitle={activity.title}
        difficultyStars={difficultyStars}
        mascotUrl={mascotUrl}
        progress={`${session.currentIndex + 1} / ${total}`}
      />

      <div className={`lr__stage ${stageClass}`}>
        {session.answerState === "correct" && <div className="lr__celebration">¡Muy bien! ⭐</div>}

        {charEx ? (
          <>
            <div className="lr__char-row">
              <div
                ref={boxLeftRef}
                className={boxCls("box-left")}
                onClick={
                  charEx.kind === "char-click" && !answered
                    ? () => handleChoice("box-left")
                    : undefined
                }
                style={charEx.kind === "char-click" && !answered ? { cursor: "pointer" } : {}}
              >
                {charEx.kind === "char-drag-both" && boxContent["box-left"] !== null && (
                  <img
                    src={charEx.objects[boxContent["box-left"]!].imgUrl}
                    alt={charEx.objects[boxContent["box-left"]!].label}
                    className="lr__char-box-obj"
                  />
                )}
                {answered && <span className="lr__char-box-label">{handLabel("box-left")}</span>}
              </div>

              <img src={charEx.charImgUrl} className="lr__char-img" alt={charEx.charName} />

              <div
                ref={boxRightRef}
                className={boxCls("box-right")}
                onClick={
                  charEx.kind === "char-click" && !answered
                    ? () => handleChoice("box-right")
                    : undefined
                }
                style={charEx.kind === "char-click" && !answered ? { cursor: "pointer" } : {}}
              >
                {charEx.kind === "char-drag-both" && boxContent["box-right"] !== null && (
                  <img
                    src={charEx.objects[boxContent["box-right"]!].imgUrl}
                    alt={charEx.objects[boxContent["box-right"]!].label}
                    className="lr__char-box-obj"
                  />
                )}
                {answered && <span className="lr__char-box-label">{handLabel("box-right")}</span>}
              </div>
            </div>

            <p className="lr__question">{charEx.question}</p>

            {charEx.kind !== "char-click" && !answered && (
              <div className="lr__drag-area">
                {charEx.objects.map((obj, i) => {
                  if (
                    charEx.kind === "char-drag-both" &&
                    (boxContent["box-left"] === i || boxContent["box-right"] === i)
                  )
                    return null;
                  return (
                    <div
                      key={i}
                      className="lr__drag-obj"
                      style={{ left: `${obj.startX}%`, top: `${obj.startY}%` }}
                      onPointerDown={(e) => handleObjDown(e, i)}
                    >
                      <img src={obj.imgUrl} alt={obj.label} />
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="lr__scene">
              {difficulty === "easy" && <span className="lr__label">⟵ izquierda</span>}
              <div className="lr__objects">
                <div className="lr__obj">
                  {regEx?.leftImgUrl ? (
                    <img src={regEx.leftImgUrl} className="lr__obj-img" alt={regEx.leftObj} />
                  ) : (
                    <span className="lr__obj-emoji">{regEx?.leftObj}</span>
                  )}
                </div>
                <div className="lr__obj">
                  {regEx?.rightImgUrl ? (
                    <img src={regEx.rightImgUrl} className="lr__obj-img" alt={regEx.rightObj} />
                  ) : (
                    <span className="lr__obj-emoji">{regEx?.rightObj}</span>
                  )}
                </div>
              </div>
              {difficulty === "easy" && <span className="lr__label">derecha ⟶</span>}
            </div>
            <p className="lr__question">{regEx?.question}</p>
          </>
        )}
      </div>

      <footer className="lr__footer">
        {!charMode && (
          <div className="lr__options">
            {uniqueOpts.map((opt, i) => {
              let cls = "lr__option";
              if (regEx && answered && opt === regEx.answer && session.answerState === "correct")
                cls += " lr__option--correct";
              else if (answered && opt === session.chosen && session.answerState === "wrong")
                cls += " lr__option--wrong";
              return (
                <button
                  key={i}
                  type="button"
                  className={cls}
                  onClick={() => handleChoice(opt)}
                  disabled={answered}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}
        {session.answerState === "wrong" && (
          <ActionButtons onRetry={handleRetry} onNext={handleNext} />
        )}
      </footer>
    </div>
  );
}
