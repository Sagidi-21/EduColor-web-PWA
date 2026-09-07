import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export interface Aula {
  id: string;
  grade: 1 | 2;
  letter: string;
}

export interface ClassProfile {
  className: string;
  mascotUrl: string;
  accentColor: string;
}

export const CLASS_PROFILE_DEFAULTS: ClassProfile = {
  className: "Mi Clase",
  mascotUrl: "",
  accentColor: "#6366f1",
};

const defaultAulas: Aula[] = [
  { id: "1A", grade: 1, letter: "A" },
  { id: "2A", grade: 2, letter: "A" },
];
const aulasKey = "educolor-aulas";
const activeKey = "educolor-active-aula";
const profileKey = (id: string) => `educolor-profile-${id}`;

function loadAulas(): Aula[] {
  try {
    const stored = localStorage.getItem(aulasKey);
    if (stored) return JSON.parse(stored) as Aula[];
  } catch {
    // Se recupera con las aulas de inicio si los datos locales son inválidos.
  }
  localStorage.setItem(aulasKey, JSON.stringify(defaultAulas));
  return defaultAulas;
}

function loadProfile(id: string): ClassProfile {
  try {
    const stored = localStorage.getItem(profileKey(id));
    return stored ? { ...CLASS_PROFILE_DEFAULTS, ...JSON.parse(stored) } : CLASS_PROFILE_DEFAULTS;
  } catch {
    return CLASS_PROFILE_DEFAULTS;
  }
}

export function getAulaLabel(aula: Aula, allAulas: Aula[]): string {
  return allAulas.filter((item) => item.grade === aula.grade).length === 1
    ? `${aula.grade}º Primaria`
    : `${aula.grade}º ${aula.letter}`;
}

interface ClassProfileContextValue {
  aulas: Aula[];
  activeAulaId: string;
  profile: ClassProfile;
  setActiveAula: (id: string) => void;
  save: (updates: Partial<ClassProfile>) => boolean;
  getProfile: (id: string) => ClassProfile;
  addAula: (grade: 1 | 2, letter: string) => void;
  removeAula: (id: string) => void;
}

const ClassProfileContext = createContext<ClassProfileContextValue | null>(null);

export function ClassProfileProvider({ children }: { children: ReactNode }) {
  const [aulas, setAulas] = useState(loadAulas);
  const [activeAulaId, setActiveAulaId] = useState(() => {
    const initialAulas = loadAulas();
    const stored = localStorage.getItem(activeKey);
    return stored && initialAulas.some((aula) => aula.id === stored) ? stored : initialAulas[0].id;
  });
  const [profile, setProfile] = useState(() => loadProfile(activeAulaId));

  const setActiveAula = useCallback((id: string) => {
    localStorage.setItem(activeKey, id);
    setActiveAulaId(id);
    setProfile(loadProfile(id));
  }, []);

  const save = useCallback(
    (updates: Partial<ClassProfile>) => {
      const next = { ...profile, ...updates };
      try {
        localStorage.setItem(profileKey(activeAulaId), JSON.stringify(next));
        setProfile(next);
        return true;
      } catch {
        return false;
      }
    },
    [activeAulaId, profile],
  );

  const addAula = useCallback(
    (grade: 1 | 2, letter: string) => {
      const id = `${grade}${letter}`;
      if (aulas.some((aula) => aula.id === id)) return;
      const next = [...aulas, { id, grade, letter }];
      localStorage.setItem(aulasKey, JSON.stringify(next));
      setAulas(next);
    },
    [aulas],
  );

  const removeAula = useCallback(
    (id: string) => {
      if (aulas.length === 1) return;
      const next = aulas.filter((aula) => aula.id !== id);
      localStorage.setItem(aulasKey, JSON.stringify(next));
      localStorage.removeItem(profileKey(id));
      setAulas(next);
      if (activeAulaId === id) setActiveAula(next[0].id);
    },
    [activeAulaId, aulas, setActiveAula],
  );

  useEffect(() => {
    const hex = profile.accentColor;
    const darken = (start: number) =>
      Math.max(0, Math.round(start * 0.6))
        .toString(16)
        .padStart(2, "0");
    const dark = `#${darken(parseInt(hex.slice(1, 3), 16))}${darken(parseInt(hex.slice(3, 5), 16))}${darken(parseInt(hex.slice(5, 7), 16))}`;
    document.documentElement.style.setProperty("--color-primary", hex);
    document.documentElement.style.setProperty("--color-primary-dark", dark);
  }, [profile.accentColor]);

  return (
    <ClassProfileContext.Provider
      value={{
        aulas,
        activeAulaId,
        profile,
        setActiveAula,
        save,
        getProfile: loadProfile,
        addAula,
        removeAula,
      }}
    >
      {children}
    </ClassProfileContext.Provider>
  );
}

export function useClassProfile(): ClassProfileContextValue {
  const value = useContext(ClassProfileContext);
  if (!value) throw new Error("useClassProfile debe usarse dentro de ClassProfileProvider.");
  return value;
}
