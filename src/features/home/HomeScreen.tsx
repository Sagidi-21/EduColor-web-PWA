import { useState } from "react";
import logoUrl from "../../assets/splash-logo.png";
import { getAulaLabel, useClassProfile } from "../../core/context/ClassProfileContext";
import "./HomeScreen.css";

export type AppView = "home" | "configuration" | "mathematics" | "generator" | "mascota";
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
  {
    id: "configuration",
    label: "Configuración",
    description: "Temas, clases y ajustes",
    icon: "⚙️",
    color: "#64748b",
  },
];
const gradeMetadata = {
  1: { color: "#2563eb", light: "#dbeafe", emoji: "⭐", age: "6-7 años" },
  2: { color: "#7c3aed", light: "#ede9fe", emoji: "🌟", age: "7-8 años" },
};

export function HomeScreen({ onNavigate }: { onNavigate: (view: AppView) => void }) {
  const { aulas, setActiveAula } = useClassProfile();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = aulas.find((aula) => aula.id === selectedId);
  const selectAula = (id: string) => {
    setSelectedId(id);
    setActiveAula(id);
  };
  return (
    <div className="home">
      <header className="home__header">
        <div className="home__logo-area">
          <img className="home__logo-img" src={logoUrl} alt="Logo del colegio" />
          <div className="home__title-area">
            <h1 className="home__app-name">EduColor</h1>
            <p className="home__school-name">Colegio Color de Montecolorado</p>
          </div>
        </div>
        <div className="home__header-right">
          <span className="home__badge">PWA · Desarrollo</span>
        </div>
      </header>
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
              const isMigrated = mode.id === "configuration" || mode.id === "mathematics";
              const blocked = !isMigrated || (!selected && mode.id !== "configuration");
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
                  <span className="mode-card__desc">
                    {isMigrated ? mode.description : "En migración desde la aplicación original"}
                  </span>
                  <span className="mode-card__check">✓</span>
                </button>
              );
            })}
          </div>
        </section>
      </main>
      <footer className="home__footer">
        <span>Software educativo - Colegio Color de Montecolorado</span>
      </footer>
    </div>
  );
}
