import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSchoolAuth } from "./SchoolAuthContext";

export interface Aula {
  id: string;
  grade: 1 | 2;
  letter: string;
}

export interface ClassProfile {
  className: string;
  mascotUrl: string;
  mascotAssets?: {
    explain: string;
    point: string;
    think: string;
    celebrate: string;
  };
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

/** Sin colegio: claves históricas. Con colegio: aisladas por school id. */
function storageKeys(schoolId: string | null) {
  const prefix = schoolId ? `educolor:school:${schoolId}` : "educolor";
  return {
    aulas: schoolId ? `${prefix}:aulas` : "educolor-aulas",
    active: schoolId ? `${prefix}:active-aula` : "educolor-active-aula",
    profile: (id: string) => (schoolId ? `${prefix}:profile-${id}` : `educolor-profile-${id}`),
  };
}

function loadAulas(schoolId: string | null): Aula[] {
  const { aulas: aulasKey } = storageKeys(schoolId);
  try {
    const stored = localStorage.getItem(aulasKey);
    if (stored) return JSON.parse(stored) as Aula[];
  } catch {
    // Se recupera con las aulas de inicio si los datos locales son inválidos.
  }
  localStorage.setItem(aulasKey, JSON.stringify(defaultAulas));
  return defaultAulas;
}

function loadProfile(schoolId: string | null, id: string): ClassProfile {
  const { profile: profileKey } = storageKeys(schoolId);
  try {
    const stored = localStorage.getItem(profileKey(id));
    return stored ? { ...CLASS_PROFILE_DEFAULTS, ...JSON.parse(stored) } : CLASS_PROFILE_DEFAULTS;
  } catch {
    return CLASS_PROFILE_DEFAULTS;
  }
}

function resolveActiveAulaId(schoolId: string | null, aulas: Aula[]): string {
  const { active: activeKey } = storageKeys(schoolId);
  try {
    const stored = localStorage.getItem(activeKey);
    if (stored && aulas.some((aula) => aula.id === stored)) return stored;
  } catch {
    // ignore
  }
  return aulas[0]?.id ?? defaultAulas[0].id;
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
  const { primarySchool } = useSchoolAuth();
  const schoolId = primarySchool?.id ?? null;

  const [aulas, setAulas] = useState(() => loadAulas(null));
  const [activeAulaId, setActiveAulaId] = useState(() =>
    resolveActiveAulaId(null, loadAulas(null)),
  );
  const [profile, setProfile] = useState(() =>
    loadProfile(null, resolveActiveAulaId(null, loadAulas(null))),
  );
  const [loadedSchoolId, setLoadedSchoolId] = useState<string | null>(null);

  // Al entrar/cambiar de colegio: perfiles propios (colegio nuevo = sin mascota).
  if (schoolId !== loadedSchoolId) {
    const nextAulas = loadAulas(schoolId);
    const nextActive = resolveActiveAulaId(schoolId, nextAulas);
    setLoadedSchoolId(schoolId);
    setAulas(nextAulas);
    setActiveAulaId(nextActive);
    setProfile(loadProfile(schoolId, nextActive));
  }

  const setActiveAula = useCallback(
    (id: string) => {
      const { active: activeKey } = storageKeys(schoolId);
      localStorage.setItem(activeKey, id);
      setActiveAulaId(id);
      setProfile(loadProfile(schoolId, id));
    },
    [schoolId],
  );

  const save = useCallback(
    (updates: Partial<ClassProfile>) => {
      const next = { ...profile, ...updates };
      try {
        const { profile: profileKey } = storageKeys(schoolId);
        localStorage.setItem(profileKey(activeAulaId), JSON.stringify(next));
        setProfile(next);
        return true;
      } catch {
        return false;
      }
    },
    [activeAulaId, profile, schoolId],
  );

  const addAula = useCallback(
    (grade: 1 | 2, letter: string) => {
      const id = `${grade}${letter}`;
      if (aulas.some((aula) => aula.id === id)) return;
      const next = [...aulas, { id, grade, letter }];
      const { aulas: aulasKey } = storageKeys(schoolId);
      localStorage.setItem(aulasKey, JSON.stringify(next));
      setAulas(next);
    },
    [aulas, schoolId],
  );

  const removeAula = useCallback(
    (id: string) => {
      if (aulas.length === 1) return;
      const next = aulas.filter((aula) => aula.id !== id);
      const keys = storageKeys(schoolId);
      localStorage.setItem(keys.aulas, JSON.stringify(next));
      localStorage.removeItem(keys.profile(id));
      setAulas(next);
      if (activeAulaId === id) setActiveAula(next[0].id);
    },
    [activeAulaId, aulas, schoolId, setActiveAula],
  );

  const getProfile = useCallback((id: string) => loadProfile(schoolId, id), [schoolId]);

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

  const value = useMemo<ClassProfileContextValue>(
    () => ({
      aulas,
      activeAulaId,
      profile,
      setActiveAula,
      save,
      getProfile,
      addAula,
      removeAula,
    }),
    [aulas, activeAulaId, profile, setActiveAula, save, getProfile, addAula, removeAula],
  );

  return <ClassProfileContext.Provider value={value}>{children}</ClassProfileContext.Provider>;
}

export function useClassProfile(): ClassProfileContextValue {
  const value = useContext(ClassProfileContext);
  if (!value) throw new Error("useClassProfile debe usarse dentro de ClassProfileProvider.");
  return value;
}
