import { useEffect, useRef, useState } from "react";
import defaultSchoolBgUrl from "../../assets/demo-school-exterior.jpg";
/** Mismo logo que la ficha en modo DEMO (`FichaModal` → welcome-logo-bg). */
import defaultFichaLogoUrl from "../../assets/welcome-logo-bg.png";
import { getAulaLabel, useClassProfile } from "../../core/context/ClassProfileContext";
import { useSchoolAuth } from "../../core/context/SchoolAuthContext";
import { readDemoMode } from "../../core/demo/demoMode";
import { THEMES, useTransitionTheme } from "../../core/transition";
import {
  clearSchoolBranding,
  uploadSchoolBranding,
  type BrandingKind,
} from "../../platform/supabase/schoolBranding";
import type { AppView } from "../home/HomeScreen";
import "./ConfiguracionScreen.css";

/** D-030: bloque oculto temporalmente (código conservado). */
const SHOW_TRANSITION_THEME = false;

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
  const { isOwner, session, primarySchool, refreshSchools } = useSchoolAuth();
  const { theme, setTheme } = useTransitionTheme();
  const [name, setName] = useState(profile.className);
  const [color, setColor] = useState(profile.accentColor);
  const [zoom, setZoom] = useState(storedZoom);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [brandingBusy, setBrandingBusy] = useState<BrandingKind | null>(null);
  const [brandingMsg, setBrandingMsg] = useState("");
  const [brandingHint, setBrandingHint] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const bgInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  // Cinturón: si DEMO se fuerza por consola, no servir configuración.
  useEffect(() => {
    if (readDemoMode()) onBack();
  }, [onBack]);

  useEffect(() => {
    document.body.style.setProperty("zoom", String(zoom));
    document.body.style.setProperty("--zoom", String(zoom));
    localStorage.setItem(zoomKey, String(zoom));
  }, [zoom]);

  if (readDemoMode()) {
    return null;
  }
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

  const onBrandingFile = async (kind: BrandingKind, file: File | undefined) => {
    if (!file || !primarySchool?.id) return;
    setBrandingBusy(kind);
    setBrandingMsg("");
    setBrandingHint("");
    const result = await uploadSchoolBranding(primarySchool.id, kind, file);
    setBrandingBusy(null);
    if (!result.ok) {
      setBrandingMsg(result.message);
      return;
    }
    if (result.hint) setBrandingHint(result.hint);
    setBrandingMsg(kind === "background" ? "Fondo actualizado." : "Logo de fichas actualizado.");
    await refreshSchools();
  };

  const onClearBranding = async (kind: BrandingKind) => {
    if (!primarySchool?.id) return;
    setBrandingBusy(kind);
    setBrandingMsg("");
    setBrandingHint("");
    const result = await clearSchoolBranding(primarySchool.id, kind);
    setBrandingBusy(null);
    if (!result.ok) {
      setBrandingMsg(result.message ?? "No se pudo restaurar.");
      return;
    }
    setBrandingMsg(
      kind === "background" ? "Fondo restaurado (demo)." : "Logo restaurado (EduColor).",
    );
    await refreshSchools();
  };

  const bgPreview = primarySchool?.background_url || defaultSchoolBgUrl;
  const logoPreview = primarySchool?.logo_ficha_url || defaultFichaLogoUrl;

  return (
    <div className="cfg">
      <header className="cfg__header">
        <button className="cfg__back-btn" onClick={onBack}>
          ← Inicio
        </button>
        <h1 className="cfg__title">Configuración</h1>
      </header>
      <div className="cfg__body">
        {session && isOwner ? (
          <>
            <section className="cfg__section">
              <h2 className="cfg__section-title">Profesores</h2>
              <p className="cfg__section-desc">
                Invita docentes, consulta pendientes y gestiona el equipo del colegio.
              </p>
              <button
                type="button"
                className="cfg__mascota-btn"
                onClick={() => onNavigate?.("profesorado")}
              >
                Acceder
              </button>
            </section>

            <section className="cfg__section">
              <h2 className="cfg__section-title">Imagen del colegio</h2>
              {brandingMsg ? <p className="cfg__branding-msg">{brandingMsg}</p> : null}
              {brandingHint ? <p className="cfg__branding-hint">{brandingHint}</p> : null}

              <div className="cfg__branding-grid">
                <div className="cfg__branding-block">
                  <h3 className="cfg__branding-subtitle">Fondo de selección de curso</h3>
                  <ul className="cfg__branding-reqs">
                    <li>Formato: JPG, PNG o WebP</li>
                    <li>
                      Horizontal (paisaje), recomendado <strong>1920 × 1080</strong> (16:9)
                    </li>
                    <li>Máximo 5 MB (se comprime al guardar)</li>
                  </ul>
                  <div
                    className="cfg__branding-bg-preview"
                    style={{ backgroundImage: `url(${bgPreview})` }}
                    role="img"
                    aria-label="Vista previa del fondo"
                  />
                  <input
                    ref={bgInput}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    hidden
                    onChange={(e) => {
                      void onBrandingFile("background", e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                  <div className="cfg__branding-actions">
                    <button
                      type="button"
                      className="cfg__upload-btn"
                      disabled={brandingBusy !== null || !primarySchool}
                      onClick={() => bgInput.current?.click()}
                    >
                      {brandingBusy === "background" ? "Subiendo…" : "📷 Subir fondo"}
                    </button>
                    {primarySchool?.background_url ? (
                      <button
                        type="button"
                        className="cfg__remove-btn"
                        disabled={brandingBusy !== null}
                        onClick={() => void onClearBranding("background")}
                      >
                        Restaurar fondo demo
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="cfg__branding-block">
                  <h3 className="cfg__branding-subtitle">Logo de fichas</h3>
                  <ul className="cfg__branding-reqs">
                    <li>Formato: PNG preferible (transparencia) o JPG</li>
                    <li>
                      Cuadrado, recomendado <strong>512 × 512</strong> (mín. 256 × 256)
                    </li>
                    <li>Máximo 2 MB</li>
                  </ul>
                  <div className="cfg__branding-logo-preview">
                    <img src={logoPreview} alt="Logo de fichas" />
                  </div>
                  <input
                    ref={logoInput}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    hidden
                    onChange={(e) => {
                      void onBrandingFile("logo_ficha", e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                  <div className="cfg__branding-actions">
                    <button
                      type="button"
                      className="cfg__upload-btn"
                      disabled={brandingBusy !== null || !primarySchool}
                      onClick={() => logoInput.current?.click()}
                    >
                      {brandingBusy === "logo_ficha" ? "Subiendo…" : "📷 Subir logo"}
                    </button>
                    {primarySchool?.logo_ficha_url ? (
                      <button
                        type="button"
                        className="cfg__remove-btn"
                        disabled={brandingBusy !== null}
                        onClick={() => void onClearBranding("logo_ficha")}
                      >
                        Restaurar logo EduColor
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : null}
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
        {SHOW_TRANSITION_THEME ? (
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
        ) : null}
      </div>
    </div>
  );
}
