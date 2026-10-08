import { useEffect, useRef, useState } from "react";
import { getAulaLabel, useClassProfile } from "../../core/context/ClassProfileContext";
import { THEMES, useTransitionTheme } from "../../core/transition";
import type { AppView } from "../home/HomeScreen";
import "./ConfiguracionScreen.css";

const colors = [
  { value: "#6366f1", label: "Índigo" },
  { value: "#2563eb", label: "Azul" },
  { value: "#16a34a", label: "Verde" },
  { value: "#ea580c", label: "Naranja" },
  { value: "#db2777", label: "Rosa" },
  { value: "#7c3aed", label: "Violeta" },
];
const zoomLevels = [
  { value: 1, label: "Normal", desc: "Tableta / pantalla pequeña", icon: "📱" },
  { value: 1.25, label: "Grande", desc: "PDI cerca / pantalla mediana", icon: "🖥️" },
  { value: 1.5, label: "Muy grande", desc: "PDI lejos / pantalla grande", icon: "📺" },
];
const zoomKey = "educolor_zoom";
const storedZoom = () => Number.parseFloat(localStorage.getItem(zoomKey) ?? "1.5") || 1.5;

export function ConfiguracionScreen({
  onBack,
  onNavigate,
}: {
  onBack: () => void;
  onNavigate?: (view: AppView) => void;
}) {
  const { aulas, activeAulaId, profile, setActiveAula, save, getProfile, addAula, removeAula } =
    useClassProfile();
  const { theme, setTheme } = useTransitionTheme();
  const [name, setName] = useState(profile.className);
  const [color, setColor] = useState(profile.accentColor);
  const [zoom, setZoom] = useState(storedZoom);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.setProperty("zoom", String(zoom));
    document.body.style.setProperty("--zoom", String(zoom));
    localStorage.setItem(zoomKey, String(zoom));
  }, [zoom]);
  const changeAula = (id: string) => {
    const next = getProfile(id);
    setActiveAula(id);
    setName(next.className);
    setColor(next.accentColor);
    setSaved(false);
  };
  const upload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, 256 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext("2d");
        if (!context) return;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        if (!save({ mascotUrl: canvas.toDataURL("image/jpeg", 0.82) }))
          setError("No se pudo guardar la imagen.");
        else setError("");
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };
  const saveProfile = () => {
    save({ className: name.trim() || "Mi Clase", accentColor: color });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };
  const applyZoom = (value: number) => {
    setZoom(value);
  };
  return (
    <div className="cfg">
      <header className="cfg__header">
        <button className="cfg__back-btn" onClick={onBack}>
          ← Inicio
        </button>
        <h1 className="cfg__title">Configuración</h1>
      </header>
      <div className="cfg__body">
        <section className="cfg__section">
          <h2 className="cfg__section-title">Perfil de clase</h2>
          <p className="cfg__section-desc">
            Personaliza la app con el nombre y la mascota de tu clase. Esta información se guarda en
            este ordenador.
          </p>
          <div className="cfg__aula-selector">
            <span className="cfg__aula-selector-label">Editando el perfil de:</span>
            <div className="cfg__aula-pills">
              {aulas.map((aula) => (
                <button
                  key={aula.id}
                  className={`cfg__aula-pill ${activeAulaId === aula.id ? "cfg__aula-pill--active" : ""}`}
                  onClick={() => changeAula(aula.id)}
                >
                  {getAulaLabel(aula, aulas)}
                </button>
              ))}
            </div>
            <button
              className="cfg__mascota-btn cfg__mascota-btn--disabled"
              disabled
              onClick={() => onNavigate && onNavigate("mascota")}
            >
              🎨 Configurar mascota
            </button>
            <span className="cfg__mascota-badge">Desarrollando actualización</span>
          </div>
          <div className="cfg__profile-layout">
            <div className="cfg__mascot-col">
              <span className="cfg__label">Mascota de la clase</span>
              {error && <p className="cfg__aula-add-error">{error}</p>}
              <div className="cfg__mascot-preview">
                {profile.mascotUrl ? (
                  <img src={profile.mascotUrl} alt="Mascota" className="cfg__mascot-img" />
                ) : (
                  <span className="cfg__mascot-placeholder">🏫</span>
                )}
              </div>
              <input
                ref={input}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                hidden
                onChange={upload}
              />
              <button className="cfg__upload-btn" onClick={() => input.current?.click()}>
                📷 Subir imagen
              </button>
              {profile.mascotUrl && (
                <button
                  className="cfg__remove-btn"
                  onClick={() => save({ mascotUrl: "", mascotAssets: undefined })}
                >
                  Quitar imagen
                </button>
              )}
            </div>
            <div className="cfg__profile-fields">
              <label className="cfg__label">Nombre de la clase</label>
              <input
                className="cfg__text-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={40}
              />
              <label className="cfg__label" style={{ marginTop: 20 }}>
                Color de acento
              </label>
              <div className="cfg__color-grid">
                {colors.map((item) => (
                  <button
                    key={item.value}
                    className={`cfg__color-swatch ${color === item.value ? "cfg__color-swatch--active" : ""}`}
                    style={{ background: item.value }}
                    title={item.label}
                    onClick={() => setColor(item.value)}
                  />
                ))}
              </div>
              <button className="cfg__save-btn" style={{ background: color }} onClick={saveProfile}>
                {saved ? "✓ Guardado" : "Guardar perfil"}
              </button>
            </div>
          </div>
          <div className="cfg__preview-bar" style={{ borderColor: color }}>
            <span className="cfg__preview-label">Vista previa:</span>
            {profile.mascotUrl ? (
              <img src={profile.mascotUrl} alt="" className="cfg__preview-mascot" />
            ) : (
              <span className="cfg__preview-mascot-fallback">🏫</span>
            )}
            <span className="cfg__preview-name" style={{ color }}>
              {name || "Mi Clase"}
            </span>
          </div>
        </section>
        <section className="cfg__section">
          <h2 className="cfg__section-title">Gestión de aulas</h2>
          <p className="cfg__section-desc">
            Añade o elimina aulas. Cada una puede tener su propio nombre, mascota y color de acento.
          </p>
          <div className="cfg__aulas-list">
            {aulas.map((aula) => (
              <div
                key={aula.id}
                className={`cfg__aula-chip ${activeAulaId === aula.id ? "cfg__aula-chip--active" : ""}`}
              >
                <span className="cfg__aula-chip-label">{getAulaLabel(aula, aulas)}</span>
                {aulas.length > 1 && (
                  <button className="cfg__aula-chip-remove" onClick={() => removeAula(aula.id)}>
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="cfg__aula-add-row">
            <button
              className="cfg__aula-add-btn"
              onClick={() =>
                addAula(
                  1,
                  String.fromCharCode(65 + aulas.filter((aula) => aula.grade === 1).length),
                )
              }
            >
              + Añadir 1º
            </button>
            <button
              className="cfg__aula-add-btn"
              onClick={() =>
                addAula(
                  2,
                  String.fromCharCode(65 + aulas.filter((aula) => aula.grade === 2).length),
                )
              }
            >
              + Añadir 2º
            </button>
          </div>
        </section>
        <section className="cfg__section">
          <h2 className="cfg__section-title">Tamaño de la interfaz</h2>
          <p className="cfg__section-desc">Ajusta el zoom según el dispositivo del aula.</p>
          <div className="cfg__zoom-grid">
            {zoomLevels.map((level) => (
              <button
                key={level.value}
                className={`cfg__zoom-card ${zoom === level.value ? "cfg__zoom-card--active" : ""}`}
                onClick={() => applyZoom(level.value)}
              >
                <span className="cfg__zoom-icon">{level.icon}</span>
                <span className="cfg__zoom-label">{level.label}</span>
                <span className="cfg__zoom-desc">{level.desc}</span>
                {zoom === level.value && <span className="cfg__zoom-check">✓ Activo</span>}
              </button>
            ))}
          </div>
        </section>
        <section className="cfg__section">
          <h2 className="cfg__section-title">Tema de transición</h2>
          <p className="cfg__section-desc">
            Elige el efecto de animación al navegar entre pantallas.
          </p>
          <div className="cfg__theme-grid">
            {THEMES.map((item) => (
              <button
                key={item.value}
                className={`cfg__theme-card ${theme === item.value ? "cfg__theme-card--active" : ""}`}
                onClick={() => setTheme(item.value)}
              >
                <span className="cfg__theme-label">{item.label}</span>
                {theme === item.value && <span className="cfg__theme-check">✓ Activo</span>}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
