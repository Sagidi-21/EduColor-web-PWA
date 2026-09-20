import { useState, useEffect, useRef } from "react";
import { useClassProfile } from "../../core/context/ClassProfileContext";
import spaceImage from "../../assets/mascota/temas/mascota-tema-space.png";
import dinosaursImage from "../../assets/mascota/temas/mascota-tema-dinosaurs.png";
import piratesImage from "../../assets/mascota/temas/mascota-tema-pirates.png";
import magicImage from "../../assets/mascota/temas/mascota.team.magic.png";
import underwaterImage from "../../assets/mascota/temas/mascota-tema-underwater.png";
import animalsImage from "../../assets/mascota/temas/mascota-tema-animals.png";
import natureImage from "../../assets/mascota/temas/mascota-tema-nature.png";
import technologyImage from "../../assets/mascota/temas/mascota.tema-technology.png";
import medievalImage from "../../assets/mascota/temas/mascota-tema-medieval.png";
import racingImage from "../../assets/mascota/temas/mascota-tema-racing.png";
import otherImage from "../../assets/mascota/temas/mascota-tema-other.png";
import aiChoiceImage from "../../assets/mascota/tipos/mascota-tipo-ai_choice.png";
import personImage from "../../assets/mascota/tipos/mascota-tipo-person.png";
import animalImage from "../../assets/mascota/tipos/mascota-tipo-animal.png";
import fantasyImage from "../../assets/mascota/tipos/mascota-tipo-fantasy.png";
import robotImage from "../../assets/mascota/tipos/mascota-tipo-robot.png";
import magicCharacterImage from "../../assets/mascota/tipos/mascota-tipo-magic.png";
import funnyImage from "../../assets/mascota/personalidad/mascota-personalidad-funny.png";
import curiousImage from "../../assets/mascota/personalidad/mascota-personalidad-curious.png";
import adventurousImage from "../../assets/mascota/personalidad/mascota-personalidad-adventurous.png";
import braveImage from "../../assets/mascota/personalidad/mascota-personalidad-brave.png";
import playfulImage from "../../assets/mascota/personalidad/mascota-personalidad-playful.png";
import intelligentImage from "../../assets/mascota/personalidad/mascota-personalidad-intelligent.png";
import kindImage from "../../assets/mascota/personalidad/mascota-personalidad-kind.png";
import enthusiasticImage from "../../assets/mascota/personalidad/mascota-personalidad-enthusiastic.png";
import calmImage from "../../assets/mascota/personalidad/mascota-personalidad-calm.png";
import aiNameImage from "../../assets/mascota/nombre/mascota-nombre-ai_choice.png";
import teacherNameImage from "../../assets/mascota/nombre/mascota-nombre-user_choice.png";
import "./MascotaScreen.css";

interface MascotaConfig {
  theme: string;
  customTheme: string;
  characterType: "ai_choice" | "person" | "animal" | "fantasy" | "robot" | "magic";
  personality: string;
  nameMode: "ai" | "teacher";
  teacherName: string;
  visualStyle: "cartoon_3d" | "illustration" | "anime" | "soft_fantasy";
  specialDetails: string;
}

const THEMAS = [
  { value: "space", label: "El espacio", image: spaceImage },
  { value: "dinosaurs", label: "Dinosaurios", image: dinosaursImage },
  { value: "pirates", label: "Piratas", image: piratesImage },
  { value: "magic", label: "Mundo mágico", image: magicImage },
  { value: "underwater", label: "Mundo submarino", image: underwaterImage },
  { value: "animals", label: "Animales", image: animalsImage },
  { value: "nature", label: "Aventura en la naturaleza", image: natureImage },
  { value: "technology", label: "Robots y tecnología", image: technologyImage },
  { value: "medieval", label: "Aventuras medievales", image: medievalImage },
  { value: "racing", label: "Carreras", image: racingImage },
  { value: "other", label: "Otro tema", image: otherImage },
];

const CHARACTER_TYPES = [
  { value: "ai_choice", label: "Que lo decida la IA", image: aiChoiceImage },
  { value: "person", label: "Persona", image: personImage },
  { value: "animal", label: "Animal", image: animalImage },
  { value: "fantasy", label: "Criatura fantástica", image: fantasyImage },
  { value: "robot", label: "Robot", image: robotImage },
  { value: "magic", label: "Personaje mágico", image: magicCharacterImage },
];

const PERSONALITY_OPTIONS = [
  { value: "funny", label: "Divertido", image: funnyImage },
  { value: "curious", label: "Curioso", image: curiousImage },
  { value: "adventurous", label: "Aventurero", image: adventurousImage },
  { value: "brave", label: "Valiente", image: braveImage },
  { value: "playful", label: "Travieso", image: playfulImage },
  { value: "intelligent", label: "Inteligente", image: intelligentImage },
  { value: "kind", label: "Amable", image: kindImage },
  { value: "enthusiastic", label: "Entusiasta", image: enthusiasticImage },
  { value: "calm", label: "Tranquilo", image: calmImage },
];

const NAME_MODES = [
  { value: "ai", label: "Que lo invente la IA", image: aiNameImage },
  { value: "teacher", label: "Yo elegiré el nombre", image: teacherNameImage },
];

const VISUAL_STYLES = [
  { value: "cartoon_3d", label: "🧸 Cartoon 3D", icon: "🎲" },
  { value: "illustration", label: "✏️ Ilustración infantil", icon: "✏️" },
  { value: "anime", label: "🎨 Dibujo animado", icon: "🎨" },
  { value: "soft_fantasy", label: "✨ Fantasía suave", icon: "✨" },
];

const DEFAULT_CONFIG: MascotaConfig = {
  theme: "",
  customTheme: "",
  characterType: "ai_choice",
  personality: "",
  nameMode: "ai",
  teacherName: "",
  visualStyle: "cartoon_3d",
  specialDetails: "",
};

type MascotState =
  "configuring" | "generating_preview" | "preview_ready" | "generating_assets" | "ready" | "error";

export function MascotaScreen({ onBack }: { onBack: () => void }) {
  const { save } = useClassProfile();
  const [config, setConfig] = useState<MascotaConfig>(() => {
    const saved = localStorage.getItem("mascota-config");
    if (saved) {
      try {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_CONFIG;
      }
    }
    return DEFAULT_CONFIG;
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [state, setState] = useState<MascotState>("configuring");
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [mascotName, setMascotName] = useState<string>("");
  const [mascotDescription, setMascotDescription] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [portalTransition, setPortalTransition] = useState<{
    label: string;
    image: string;
    dissolving: boolean;
    type: "theme" | "character";
  } | null>(null);
  const [showTeacherNameInput, setShowTeacherNameInput] = useState(false);
  const dissolveCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    localStorage.setItem("mascota-config", JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    if (!portalTransition?.dissolving) return;
    const canvas = dissolveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    const cell = 16;
    const cols = Math.ceil(w / cell);
    const rows = Math.ceil(h / cell);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = portalTransition.image;
    let raf = 0;
    img.onload = () => {
      ctx.imageSmoothingEnabled = false;
      const tmp = document.createElement("canvas");
      const tctx = tmp.getContext("2d");
      if (!tctx) return;
      tctx.imageSmoothingEnabled = false;
      tmp.width = cols;
      tmp.height = rows;
      tctx.drawImage(img, 0, 0, cols, rows);
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(tmp, 0, 0, w, h);

      const cells: { x: number; y: number }[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          cells.push({ x: c, y: r });
        }
      }
      for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cells[i], cells[j]] = [cells[j], cells[i]];
      }

      const duration = 900;
      let done = 0;
      const start = performance.now();
      const step = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const target = Math.floor(progress * cells.length);
        while (done < target) {
          ctx.clearRect(cells[done].x * cell, cells[done].y * cell, cell, cell);
          done++;
        }
        if (progress < 1) {
          raf = requestAnimationFrame(step);
        }
      };
      raf = requestAnimationFrame(step);
    };

    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [portalTransition?.dissolving, portalTransition?.image]);

  const updateConfig = (updates: Partial<MascotaConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const selectTheme = (value: string) => {
    setError(null);
    updateConfig({ theme: value });
    if (value !== "other") {
      setCurrentStep(2);
    }
  };

  const startPortalTransition = (value: string, label: string, image: string) => {
    setError(null);
    updateConfig({ theme: value });
    setPortalTransition({ label, image, dissolving: false, type: "theme" });
    setTimeout(() => {
      setPortalTransition((prev) => (prev ? { ...prev, dissolving: true } : prev));
      setCurrentStep(2);
      setTimeout(() => {
        setPortalTransition(null);
      }, 1000);
    }, 2000);
  };

  const startCharacterPortalTransition = (value: string, label: string, image: string) => {
    setError(null);
    updateConfig({ characterType: value as MascotaConfig["characterType"] });
    setPortalTransition({ label, image, dissolving: false, type: "character" });
    setTimeout(() => {
      setPortalTransition((prev) => (prev ? { ...prev, dissolving: true } : prev));
      setCurrentStep(3);
      setTimeout(() => {
        setPortalTransition(null);
      }, 1000);
    }, 2000);
  };

  const startPersonalityPortalTransition = (value: string, label: string, image: string) => {
    setError(null);
    updateConfig({ personality: value });
    setPortalTransition({ label, image, dissolving: false, type: "character" });
    setTimeout(() => {
      setPortalTransition((prev) => (prev ? { ...prev, dissolving: true } : prev));
      setCurrentStep(4);
      setTimeout(() => {
        setPortalTransition(null);
      }, 1000);
    }, 2000);
  };

  const startNamePortalTransition = (value: string, label: string, image: string) => {
    setError(null);
    updateConfig({ nameMode: value as MascotaConfig["nameMode"] });
    if (value === "teacher") {
      setShowTeacherNameInput(true);
      return;
    }
    setPortalTransition({ label, image, dissolving: false, type: "character" });
    setTimeout(() => {
      setPortalTransition((prev) => (prev ? { ...prev, dissolving: true } : prev));
      setCurrentStep(5);
      setTimeout(() => {
        setPortalTransition(null);
      }, 1000);
    }, 2000);
  };

  const confirmTeacherName = () => {
    if (!config.teacherName.trim()) {
      setError("Por favor, ingresa un nombre para tu compañero");
      return;
    }
    if (config.teacherName.length < 2 || config.teacherName.length > 20) {
      setError("El nombre debe tener entre 2 y 20 caracteres");
      return;
    }
    setError(null);
    setShowTeacherNameInput(false);
    const teacherMode = NAME_MODES.find((m) => m.value === "teacher");
    if (teacherMode) {
      setPortalTransition({
        label: teacherMode.label,
        image: teacherMode.image,
        dissolving: false,
        type: "character",
      });
      setTimeout(() => {
        setPortalTransition((prev) => (prev ? { ...prev, dissolving: true } : prev));
        setCurrentStep(5);
        setTimeout(() => {
          setPortalTransition(null);
        }, 1000);
      }, 2000);
    }
  };

  const updateCustomTheme = (value: string) => {
    updateConfig({ customTheme: value });
  };

  const confirmCustomTheme = () => {
    if (!config.customTheme.trim()) {
      setError("Describe tu tema personalizado para continuar");
      return;
    }
    setError(null);
    setCurrentStep(2);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!config.theme) {
          setError("Selecciona un tema para continuar");
          return false;
        }
        if (config.theme === "other" && !config.customTheme.trim()) {
          setError("Por favor, describe tu tema personalizado");
          return false;
        }
        return true;
      case 2:
        return true;
      case 3:
        if (!config.personality) {
          setError("Selecciona una personalidad para continuar");
          return false;
        }
        return true;
      case 4:
        if (config.nameMode === "teacher") {
          if (!config.teacherName.trim()) {
            setError("Por favor, ingresa un nombre para tu compañero");
            return false;
          }
          if (config.teacherName.length < 2 || config.teacherName.length > 20) {
            setError("El nombre debe tener entre 2 y 20 caracteres");
            return false;
          }
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setError(null);
      setCurrentStep((prev) => Math.min(prev + 1, 6));
    }
  };

  const getErrorMessage = async (response: Response): Promise<string> => {
    try {
      const data = await response.json();
      return data.error || "Error al procesar la solicitud";
    } catch {
      return "Error al procesar la solicitud";
    }
  };

  const generateMascot = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      return;
    }

    setState("generating_preview");
    setError(null);

    try {
      const response = await fetch("/api/mascot/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const data = await response.json();
      setGenerationId(data.id);
      setPreviewImage(data.imageUrl);
      setMascotName(data.name);
      setMascotDescription(data.description);
      setState("preview_ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setState("error");
    }
  };

  const regeneratePreview = async () => {
    if (!generationId) return;

    setState("generating_preview");
    setError(null);

    try {
      const response = await fetch("/api/mascot/regenerate-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: generationId }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const data = await response.json();
      setPreviewImage(data.imageUrl);
      setMascotName(data.name);
      setMascotDescription(data.description);
      setState("preview_ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setState("error");
    }
  };

  const acceptAndGenerateAssets = async () => {
    if (!generationId || !previewImage) return;

    setState("generating_assets");
    setError(null);

    try {
      const response = await fetch("/api/mascot/generate-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: generationId,
          referenceImage: previewImage,
          ...config,
        }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const data = await response.json();
      save({ mascotUrl: data.referenceImage });
      setState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el compañero");
      setState("error");
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="mascot-step">
            <h2>El mundo de nuestra clase</h2>
            <p>Toca el portal dimensional que acompañará a toda tu clase durante este curso.</p>
            <div className="theme-grid">
              {THEMAS.map((tema) => {
                const isSelected = config.theme === tema.value;
                return (
                  <button
                    key={tema.value}
                    type="button"
                    className={`theme-option ${isSelected ? "active" : ""}`}
                    aria-pressed={isSelected}
                    aria-label={`Seleccionar ${tema.label}`}
                    onClick={() => {
                      if (portalTransition) return;
                      if (tema.value === "other") {
                        selectTheme(tema.value);
                      } else {
                        startPortalTransition(tema.value, tema.label, tema.image);
                      }
                    }}
                  >
                    <span className="theme-card edu-glow">
                      <img className="theme-card-image" src={tema.image} alt="" />
                      <span className="theme-label">{tema.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            {config.theme === "other" && (
              <div className="custom-input">
                <label>Describe tu tema personalizado:</label>
                <input
                  type="text"
                  value={config.customTheme}
                  onChange={(e) => updateCustomTheme(e.target.value)}
                  placeholder="Ej: Coches de juguete"
                  maxLength={100}
                />
                <button
                  type="button"
                  className="mascot-screen__btn-primary custom-input__ok-btn"
                  onClick={confirmCustomTheme}
                >
                  OK
                </button>
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div className="mascot-step">
            <h2>🎨 ¿Quién será nuestro compañero?</h2>
            <p>¿Qué tipo de personaje quieres?</p>
            <div className="theme-grid">
              {CHARACTER_TYPES.map((tipo) => {
                const isSelected = config.characterType === tipo.value;
                return (
                  <button
                    key={tipo.value}
                    type="button"
                    className={`theme-option ${isSelected ? "active" : ""}`}
                    aria-pressed={isSelected}
                    aria-label={`Seleccionar ${tipo.label}`}
                    onClick={() =>
                      startCharacterPortalTransition(tipo.value, tipo.label, tipo.image)
                    }
                  >
                    <span className="theme-card edu-glow">
                      <img className="theme-card-image" src={tipo.image} alt="" />
                      <span className="theme-label">{tipo.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            {config.theme && (
              <div className="previous-selection">
                <p className="previous-selection__label">
                  Mundo seleccionado: Pulsa para volver atrás
                </p>
                <div className="previous-selection__cards">
                  <div className="previous-selection__card">
                    {(() => {
                      const selectedTheme = THEMAS.find((t) => t.value === config.theme);
                      if (!selectedTheme) return null;
                      return (
                        <button
                          type="button"
                          className="theme-card edu-glow previous-selection__btn"
                          onClick={() => setCurrentStep(1)}
                          aria-label={`Cambiar mundo: ${selectedTheme.label}`}
                        >
                          <img className="theme-card-image" src={selectedTheme.image} alt="" />
                          <span className="theme-label">{selectedTheme.label}</span>
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div className="mascot-step">
            <h2>💫 Su personalidad</h2>
            <p>¿Cómo será vuestro compañero?</p>
            <div className="theme-grid">
              {PERSONALITY_OPTIONS.map((persona) => {
                const isSelected = config.personality === persona.value;
                return (
                  <button
                    key={persona.value}
                    type="button"
                    className={`theme-option ${isSelected ? "active" : ""}`}
                    aria-pressed={isSelected}
                    aria-label={`Seleccionar ${persona.label}`}
                    onClick={() => {
                      if (portalTransition) return;
                      updateConfig({ personality: persona.value });
                      startPersonalityPortalTransition(persona.value, persona.label, persona.image);
                    }}
                  >
                    <span className="theme-card edu-glow">
                      <img className="theme-card-image" src={persona.image} alt="" />
                      <span className="theme-label">{persona.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            {(config.theme || config.characterType) && (
              <div className="previous-selection">
                <p className="previous-selection__label">
                  Selecciones previas: Pulsa para volver atrás
                </p>
                <div className="previous-selection__cards">
                  {config.theme && (
                    <div className="previous-selection__card">
                      {(() => {
                        const selectedTheme = THEMAS.find((t) => t.value === config.theme);
                        if (!selectedTheme) return null;
                        return (
                          <button
                            type="button"
                            className="theme-card edu-glow previous-selection__btn"
                            onClick={() => setCurrentStep(1)}
                            aria-label={`Cambiar mundo: ${selectedTheme.label}`}
                          >
                            <img className="theme-card-image" src={selectedTheme.image} alt="" />
                            <span className="theme-label">{selectedTheme.label}</span>
                          </button>
                        );
                      })()}
                    </div>
                  )}
                  {config.characterType && (
                    <div className="previous-selection__card">
                      {(() => {
                        const selectedChar = CHARACTER_TYPES.find(
                          (t) => t.value === config.characterType,
                        );
                        if (!selectedChar) return null;
                        return (
                          <button
                            type="button"
                            className="theme-card edu-glow previous-selection__btn"
                            onClick={() => setCurrentStep(2)}
                            aria-label={`Cambiar personaje: ${selectedChar.label}`}
                          >
                            <img className="theme-card-image" src={selectedChar.image} alt="" />
                            <span className="theme-label">{selectedChar.label}</span>
                          </button>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      case 4:
        return (
          <div className="mascot-step">
            <h2>🏷️ El nombre</h2>
            <p>¿Quién elegirá su nombre?</p>
            <div className="theme-grid">
              {NAME_MODES.map((modo) => {
                const isSelected = config.nameMode === modo.value || (showTeacherNameInput && modo.value === "teacher");
                return (
                  <button
                    key={modo.value}
                    type="button"
                    className={`theme-option ${isSelected ? "active" : ""}`}
                    aria-pressed={isSelected}
                    aria-label={`Seleccionar ${modo.label}`}
                    onClick={() => {
                      if (portalTransition || showTeacherNameInput) return;
                      startNamePortalTransition(modo.value, modo.label, modo.image);
                    }}
                    disabled={showTeacherNameInput}
                  >
                    <span className="theme-card edu-glow">
                      <img className="theme-card-image" src={modo.image} alt="" />
                      <span className="theme-label">{modo.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            {showTeacherNameInput && (
              <div className="custom-input">
                <label>¿Cómo se llamará?</label>
                <div className="custom-input__with-btn">
                   <input
                     type="text"
                     value={config.teacherName}
                     onChange={(e) => updateConfig({ teacherName: e.target.value })}
                     onKeyDown={(e) => {
                       if (e.key === "Enter") {
                         e.preventDefault();
                         confirmTeacherName();
                       }
                     }}
                     placeholder="Ej: Astro"
                     maxLength={20}
                   />
                  <button
                    type="button"
                    className="mascot-screen__btn-primary custom-input__ok-btn"
                    onClick={confirmTeacherName}
                  >
                    OK
                  </button>
                </div>
                <small>2-20 caracteres</small>
              </div>
            )}
            {!showTeacherNameInput && (config.theme || config.characterType || config.personality) && (
              <div className="previous-selection">
                <p className="previous-selection__label">
                  Selecciones previas: Pulsa para volver atrás
                </p>
                <div className="previous-selection__cards">
                  {config.theme && (
                    <div className="previous-selection__card">
                      {(() => {
                        const selectedTheme = THEMAS.find((t) => t.value === config.theme);
                        if (!selectedTheme) return null;
                        return (
                          <button
                            type="button"
                            className="theme-card edu-glow previous-selection__btn"
                            onClick={() => setCurrentStep(1)}
                            aria-label={`Cambiar mundo: ${selectedTheme.label}`}
                          >
                            <img className="theme-card-image" src={selectedTheme.image} alt="" />
                            <span className="theme-label">{selectedTheme.label}</span>
                          </button>
                        );
                      })()}
                    </div>
                  )}
                  {config.characterType && (
                    <div className="previous-selection__card">
                      {(() => {
                        const selectedChar = CHARACTER_TYPES.find(
                          (t) => t.value === config.characterType,
                        );
                        if (!selectedChar) return null;
                        return (
                          <button
                            type="button"
                            className="theme-card edu-glow previous-selection__btn"
                            onClick={() => setCurrentStep(2)}
                            aria-label={`Cambiar personaje: ${selectedChar.label}`}
                          >
                            <img className="theme-card-image" src={selectedChar.image} alt="" />
                            <span className="theme-label">{selectedChar.label}</span>
                          </button>
                        );
                      })()}
                    </div>
                  )}
                  {config.personality && (
                    <div className="previous-selection__card">
                      {(() => {
                        const selectedPersona = PERSONALITY_OPTIONS.find(
                          (p) => p.value === config.personality,
                        );
                        if (!selectedPersona) return null;
                        return (
                          <button
                            type="button"
                            className="theme-card edu-glow previous-selection__btn"
                            onClick={() => setCurrentStep(3)}
                            aria-label={`Cambiar personalidad: ${selectedPersona.label}`}
                          >
                            <img className="theme-card-image" src={selectedPersona.image} alt="" />
                            <span className="theme-label">{selectedPersona.label}</span>
                          </button>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      case 5:
        return (
          <div className="mascot-step">
            <h2>🎨 Estilo visual</h2>
            <p>¿Qué estilo te gustaría?</p>
            <div className="visual-style-grid">
              {VISUAL_STYLES.map((estilo) => (
                <button
                  key={estilo.value}
                  className={`visual-style-card ${config.visualStyle === estilo.value ? "active" : ""}`}
                  onClick={() => {
                    updateConfig({ visualStyle: estilo.value as MascotaConfig["visualStyle"] });
                    nextStep();
                  }}
                >
                  <span className="visual-style-icon">{estilo.icon}</span>
                  <span className="visual-style-label">{estilo.label}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="mascot-step">
            <h2>✨ Un detalle especial</h2>
            <p>¿Quieres añadir algún detalle?</p>
            <div className="special-details-input">
              <label>Detalles adicionales (opcional):</label>
              <textarea
                value={config.specialDetails}
                onChange={(e) => updateConfig({ specialDetails: e.target.value })}
                placeholder="Ej: Lleva gafas verdes y una mochila amarilla"
                maxLength={250}
                rows={3}
              />
              <small>Máximo 250 caracteres</small>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const isGenerating = state === "generating_preview" || state === "generating_assets";

  return (
    <div className="mascot-screen">
      <header className="mascot-screen__header">
        <button className="mascot-screen__back-btn" onClick={onBack}>
          ← Configuración
        </button>
        <h1 className="mascot-screen__title">Compañero de clase IA</h1>
        {state === "configuring" && (
          <div className="mascot-screen__progress">Paso {currentStep} de 6</div>
        )}
      </header>

      <div className="mascot-screen__content">
        {error && state === "error" && (
          <div className="mascot-screen__error">
            <p>{error}</p>
            <button className="mascot-screen__btn-primary" onClick={() => setState("configuring")}>
              Intentar de nuevo
            </button>
          </div>
        )}

        {state === "configuring" && !error && (
          <>
            {error && <div className="mascot-screen__error">{error}</div>}
            {renderStep()}
            <div className="mascot-screen__navigation">
              {currentStep === 6 && (
                <button
                  className="mascot-screen__btn-primary"
                  onClick={generateMascot}
                  disabled={isGenerating}
                >
                  {isGenerating ? "Generando..." : "✨ Crear compañero"}
                </button>
              )}
            </div>
          </>
        )}

        {state === "generating_preview" && (
          <div className="mascot-screen__generating">
            <div className="mascot-screen__spinner"></div>
            <p>✨ Creando vuestro compañero...</p>
            <p className="mascot-screen__generating-subtitle">Esto puede tardar un poquito.</p>
          </div>
        )}

        {state === "preview_ready" && previewImage && (
          <div className="mascot-screen__preview">
            <h3>✨ ¡Vamos a conocer a nuestro compañero!</h3>
            <div className="mascot-screen__preview-image">
              <img src={previewImage} alt="Vista previa del compañero" />
            </div>
            {mascotName && <div className="mascot-screen__mascot-name">{mascotName}</div>}
            {mascotDescription && (
              <p className="mascot-screen__mascot-description">{mascotDescription}</p>
            )}
            <div className="mascot-screen__preview-actions">
              <button
                className="mascot-screen__btn-secondary"
                onClick={regeneratePreview}
                disabled={isGenerating}
              >
                🔄 Probar otro
              </button>
              <button
                className="mascot-screen__btn-primary"
                onClick={acceptAndGenerateAssets}
                disabled={isGenerating}
              >
                ❤️ Nos encanta
              </button>
            </div>
          </div>
        )}

        {state === "generating_assets" && (
          <div className="mascot-screen__generating">
            <div className="mascot-screen__spinner"></div>
            <p>🎨 Generando el pack de imágenes...</p>
            <p className="mascot-screen__generating-subtitle">Esto puede tardar un poquito.</p>
          </div>
        )}

        {state === "ready" && (
          <div className="mascot-screen__success">
            <div className="mascot-screen__success-icon">🎉</div>
            <h3>¡Ya está!</h3>
            <p>Tu compañero de clase está listo y guardado.</p>
            <button className="mascot-screen__btn-primary" onClick={onBack}>
              Volver a inicio
            </button>
          </div>
        )}
      </div>

      {portalTransition && (
        <div
          className={`portal-transition ${portalTransition.dissolving ? "portal-transition--dissolving" : ""}`}
        >
          <img
            className="portal-transition__image"
            src={portalTransition.image}
            alt=""
            style={{ display: portalTransition.dissolving ? "none" : undefined }}
          />
          {portalTransition.dissolving && (
            <canvas className="portal-dissolve__canvas" ref={dissolveCanvasRef} />
          )}
          <div className="portal-transition__banner">
            {portalTransition.type === "theme" ? (
              <>
                Has seleccionado el portal de{" "}
                <span className="portal-transition__name">{portalTransition.label}</span>
              </>
            ) : (
              <>
                Tu compañero será{" "}
                <span className="portal-transition__name">{portalTransition.label}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
