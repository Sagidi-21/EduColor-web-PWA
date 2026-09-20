import { useState, useEffect } from "react";
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
import "./MascotaScreen.css";

interface MascotaConfig {
  theme: string;
  customTheme: string;
  characterType: "ai_choice" | "person" | "animal" | "fantasy" | "robot" | "magic" | "other";
  customCharacterType: string;
  personality: string[];
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
  { value: "ai_choice", label: "✨ Que lo decida la IA", icon: "🎨" },
  { value: "person", label: "🧑 Persona", icon: "👤" },
  { value: "animal", label: "🐾 Animal", icon: "🦁" },
  { value: "fantasy", label: "👽 Criatura fantástica", icon: "🛸" },
  { value: "robot", label: "🤖 Robot", icon: "🤖" },
  { value: "magic", label: "🧙 Personaje mágico", icon: "🔮" },
  { value: "other", label: "✏️ Otro", icon: "🎭" },
];

const PERSONALITY_OPTIONS = [
  { value: "funny", label: "😄 Divertido", icon: "😄" },
  { value: "curious", label: "🔎 Curioso", icon: "🔍" },
  { value: "adventurous", label: "🚀 Aventurero", icon: "🚀" },
  { value: "brave", label: "💪 Valiente", icon: "🛡️" },
  { value: "playful", label: "🤪 Travieso", icon: "🎭" },
  { value: "intelligent", label: "🧠 Inteligente", icon: "🧠" },
  { value: "kind", label: "❤️ Amable", icon: "💖" },
  { value: "enthusiastic", label: "🎉 Entusiasta", icon: "🎉" },
  { value: "calm", label: "🧘 Tranquilo", icon: "🧘" },
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
  customCharacterType: "",
  personality: ["funny", "curious"],
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

  useEffect(() => {
    localStorage.setItem("mascota-config", JSON.stringify(config));
  }, [config]);

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
        if (config.characterType === "other" && !config.customCharacterType.trim()) {
          setError("Por favor, describe tu tipo de personaje personalizado");
          return false;
        }
        return true;
      case 3:
        if (config.personality.length < 2 || config.personality.length > 3) {
          setError("Selecciona entre 2 y 3 rasgos de personalidad");
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

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
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
                    onClick={() => selectTheme(tema.value)}
                  >
                    <span className="theme-card edu-glow">
                      <img className="theme-card-image" src={tema.image} alt="" />
                    </span>
                    <span className="theme-label">{tema.label}</span>
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
            <div className="character-type-grid">
              {CHARACTER_TYPES.map((tipo) => (
                <button
                  key={tipo.value}
                  className={`character-type-card ${config.characterType === tipo.value ? "active" : ""}`}
                  onClick={() =>
                    updateConfig({ characterType: tipo.value as MascotaConfig["characterType"] })
                  }
                >
                  <span className="character-type-icon">{tipo.icon}</span>
                  <span className="character-type-label">{tipo.label}</span>
                </button>
              ))}
            </div>
            {config.characterType === "other" && (
              <div className="custom-input">
                <label>Describe tu tipo de personaje personalizado:</label>
                <input
                  type="text"
                  value={config.customCharacterType}
                  onChange={(e) => updateConfig({ customCharacterType: e.target.value })}
                  placeholder="Ej: Robot astronauta"
                  maxLength={100}
                />
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div className="mascot-step">
            <h2>💫 Su personalidad</h2>
            <p>¿Cómo será vuestro compañero? (Selecciona entre 2 y 3)</p>
            <div className="personality-grid">
              {PERSONALITY_OPTIONS.map((persona) => (
                <button
                  key={persona.value}
                  className={`personality-card ${config.personality.includes(persona.value) ? "active" : ""}`}
                  onClick={() => {
                    const newPersonality = config.personality.includes(persona.value)
                      ? config.personality.filter((p) => p !== persona.value)
                      : [...config.personality, persona.value];
                    updateConfig({ personality: newPersonality });
                  }}
                >
                  <span className="personality-icon">{persona.icon}</span>
                  <span className="personality-label">{persona.label}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="mascot-step">
            <h2>🏷️ El nombre</h2>
            <p>¿Quién elegirá su nombre?</p>
            <div className="name-mode-grid">
              <button
                className={`name-mode-card ${config.nameMode === "ai" ? "active" : ""}`}
                onClick={() => updateConfig({ nameMode: "ai" })}
              >
                <span className="name-mode-icon">✨</span>
                <span className="name-mode-label">Que lo invente la IA</span>
              </button>
              <button
                className={`name-mode-card ${config.nameMode === "teacher" ? "active" : ""}`}
                onClick={() => updateConfig({ nameMode: "teacher" })}
              >
                <span className="name-mode-icon">✏️</span>
                <span className="name-mode-label">Yo elegiré el nombre</span>
              </button>
            </div>
            {config.nameMode === "teacher" && (
              <div className="custom-input">
                <label>¿Cómo se llamará?</label>
                <input
                  type="text"
                  value={config.teacherName}
                  onChange={(e) => updateConfig({ teacherName: e.target.value })}
                  placeholder="Ej: Astro"
                  maxLength={20}
                />
                <small>2-20 caracteres</small>
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
                  onClick={() =>
                    updateConfig({ visualStyle: estilo.value as MascotaConfig["visualStyle"] })
                  }
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
              {currentStep > 1 && (
                <button className="mascot-screen__btn-secondary" onClick={prevStep}>
                  Anterior
                </button>
              )}
              {currentStep > 1 && currentStep < 6 ? (
                <button className="mascot-screen__btn-primary" onClick={nextStep}>
                  Siguiente
                </button>
              ) : currentStep === 6 ? (
                <button
                  className="mascot-screen__btn-primary"
                  onClick={generateMascot}
                  disabled={isGenerating}
                >
                  {isGenerating ? "Generando..." : "✨ Crear compañero"}
                </button>
              ) : null}
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
    </div>
  );
}
