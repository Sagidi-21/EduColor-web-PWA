import { useState, type CSSProperties } from "react";
import logoUrl from "../../assets/splash-logo.png";
import defaultSchoolBgUrl from "../../assets/demo-school-exterior.jpg";
import { getAulaLabel, useClassProfile } from "../../core/context/ClassProfileContext";
import { useSchoolAuth } from "../../core/context/SchoolAuthContext";
import { OWNER_AVATAR_COLOR, avatarTextColor } from "../shared/teacherAvatar";
import "./HomeScreen.css";

export type AppView =
  "home" | "configuration" | "profesorado" | "mathematics" | "generator" | "mascota";
const modes: readonly {
  id: AppView;
  label: string;
  description: string;
  icon: string;
  color: string;
}[] = [
  {
    id: "mathematics",
    label: "Pizarra Digital",
    description: "Actividades interactivas para clase",
    icon: "🖥️",
    color: "#eab308",
  },
  {
    id: "generator",
    label: "Generador de Fichas",
    description: "Crea ejercicios imprimibles",
    icon: "📄",
    color: "#16a34a",
  },
];
const gradeMetadata = {
  1: { color: "#2563eb", light: "#dbeafe", emoji: "⭐", age: "6-7 años" },
  2: { color: "#7c3aed", light: "#ede9fe", emoji: "🌟", age: "7-8 años" },
};

export function HomeScreen({
  onNavigate,
  onOpenSchoolAccess,
  demoMode = false,
  onExitDemo,
  onBackToAdmin,
}: {
  onNavigate: (view: AppView) => void;
  onOpenSchoolAccess?: () => void;
  demoMode?: boolean;
  onExitDemo?: () => void;
  /** Admin en modo OW: volver a la Central. */
  onBackToAdmin?: () => void;
}) {
  const { aulas, setActiveAula } = useClassProfile();
  const {
    primarySchool,
    session,
    loading: authLoading,
    schoolBootstrapError,
    retrySchoolBootstrap,
    signOut,
    isOwner,
    avatarColor,
    avatarInitials,
  } = useSchoolAuth();
  const headerAvatarBg = isOwner ? OWNER_AVATAR_COLOR : (avatarColor ?? "#2563EB");
  const headerAvatarFg = avatarTextColor(headerAvatarBg);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bootstrapBusy, setBootstrapBusy] = useState(false);
  const selected = aulas.find((aula) => aula.id === selectedId);
  // Nombre del colegio; nunca el copy de alta de owner en la cabecera del docente.
  const schoolLabel = demoMode
    ? "Modo DEMO"
    : (primarySchool?.name ?? (session && authLoading ? "Cargando colegio…" : "EduColor"));
  const selectAula = (id: string) => {
    setSelectedId(id);
    setActiveAula(id);
  };
  const retryBootstrap = async () => {
    setBootstrapBusy(true);
    try {
      await retrySchoolBootstrap();
    } finally {
      setBootstrapBusy(false);
    }
  };
  return (
    <div
      className={`home${demoMode ? " home--demo" : ""}`}
      style={
        {
          "--home-bg-image": `url(${
            demoMode ? defaultSchoolBgUrl : (primarySchool?.background_url ?? defaultSchoolBgUrl)
          })`,
        } as CSSProperties
      }
    >
      <header className="home__header">
        <div className="home__logo-area">
          <img className="home__logo-img" src={logoUrl} alt="Logo del colegio" />
          <div className="home__title-area">
            <h1 className="home__app-name">EduColor</h1>
            <p className="home__school-name">
              {schoolLabel}
              {!demoMode && !session && onOpenSchoolAccess ? (
                <>
                  {" · "}
                  <button
                    type="button"
                    className="home__school-access-link"
                    onClick={onOpenSchoolAccess}
                  >
                    Acceso colegio
                  </button>
                </>
              ) : null}
            </p>
          </div>
        </div>
        <div className="home__header-right">
          {onBackToAdmin ? (
            <button type="button" className="home__exit-demo" onClick={onBackToAdmin}>
              ← Central admin
            </button>
          ) : null}
          {demoMode && onExitDemo ? (
            <button type="button" className="home__exit-demo" onClick={onExitDemo}>
              Salir al registro
            </button>
          ) : (
            <div className="home__settings">
              <button
                type="button"
                className="home__settings-gear"
                aria-label="Configuración"
                onClick={() => onNavigate("configuration")}
              >
                ⚙️
              </button>
              <div className="home__settings-tooltip">Temas, clases y ajustes</div>
            </div>
          )}
        </div>
      </header>
      {!demoMode && session && schoolBootstrapError ? (
        <div className="home__auth-alert" role="alert">
          <p className="home__auth-alert-text">{schoolBootstrapError}</p>
          <div className="home__auth-alert-actions">
            <button
              type="button"
              className="home__auth-alert-btn"
              disabled={bootstrapBusy}
              onClick={() => void retryBootstrap()}
            >
              {bootstrapBusy ? "Reintentando…" : "Reintentar"}
            </button>
            <button
              type="button"
              className="home__auth-alert-btn home__auth-alert-btn--ghost"
              disabled={bootstrapBusy}
              onClick={() => void signOut()}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      ) : null}
      <main className="home__main">
        <section className="home__section">
          <h2 className="home__section-title">¿Con qué clase trabajamos hoy?</h2>
          <div className="home__grade-grid">
            {aulas.map((aula) => {
              const meta = gradeMetadata[aula.grade];
              return (
                <button
                  key={aula.id}
                  className={`grade-card ${selectedId === aula.id ? "grade-card--selected" : ""}`}
                  style={
                    {
                      "--grade-color": meta.color,
                      "--grade-color-hover": `${meta.color}99`,
                      "--grade-color-light": meta.light,
                    } as React.CSSProperties
                  }
                  onClick={() => selectAula(aula.id)}
                >
                  <span className="grade-card__emoji">{meta.emoji}</span>
                  <span className="grade-card__label">{getAulaLabel(aula, aulas)}</span>
                  <span className="grade-card__age">{meta.age}</span>
                  {selectedId === aula.id && <span className="grade-card__check">✓</span>}
                </button>
              );
            })}
          </div>
        </section>
        <section className="home__section">
          <h2 className={`home__section-title ${!selected ? "home__section-title--muted" : ""}`}>
            {selected
              ? `¿Qué hacemos con ${getAulaLabel(selected, aulas)}?`
              : "← Selecciona una clase primero"}
          </h2>
          <div className="home__mode-grid">
            {modes.map((mode) => {
              const blocked = !selected;
              return (
                <button
                  key={mode.id}
                  className={`mode-card ${blocked ? "mode-card--dimmed" : ""}`}
                  style={
                    {
                      "--mode-color": mode.color,
                      "--mode-color-hover": `${mode.color}99`,
                    } as React.CSSProperties
                  }
                  disabled={blocked}
                  onClick={() => onNavigate(mode.id)}
                >
                  <span className="mode-card__icon">{mode.icon}</span>
                  <span className="mode-card__label">{mode.label}</span>
                  <span className="mode-card__desc">{mode.description}</span>
                  <span className="mode-card__check">✓</span>
                </button>
              );
            })}
          </div>
        </section>
      </main>
      <footer className="home__footer">
        <span className="home__footer-copy">Software educativo · {schoolLabel}</span>
        {!demoMode && session ? (
          <div className="home__footer-session">
            <span
              className="home__avatar"
              style={{ backgroundColor: headerAvatarBg, color: headerAvatarFg }}
              title={avatarInitials || "Usuario"}
              aria-label={`Sesión ${avatarInitials || "activa"}`}
            >
              {avatarInitials || "?"}
            </span>
            <button type="button" className="home__sign-out" onClick={() => void signOut()}>
              Cerrar Sesión
            </button>
          </div>
        ) : null}
      </footer>
    </div>
  );
}
