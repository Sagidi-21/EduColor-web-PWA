import type { FichaMeta } from "../../types";

export interface FichaHeaderProps {
  meta: FichaMeta;
  logoUrl?: string;
}

export function FichaHeader({ meta, logoUrl }: FichaHeaderProps): JSX.Element {
  return (
    <header className="ficha-header">
      <div>
        <p className="ficha-header__meta">
          {meta.grade}
          {meta.className ? ` — ${meta.className}` : ""}
        </p>
        <h1 className="ficha-header__title">{meta.title}</h1>
      </div>
      {logoUrl && <img src={logoUrl} alt="Logo" className="ficha-header__logo" />}
    </header>
  );
}
