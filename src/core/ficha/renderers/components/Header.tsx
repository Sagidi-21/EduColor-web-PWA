import type { FichaMeta } from "../../types";

export interface FichaHeaderProps {
  meta: FichaMeta;
  logoUrl?: string;
}

function metaLine(meta: FichaMeta): string {
  return [meta.grade, meta.subject, meta.className].filter(Boolean).join(" — ");
}

export function FichaHeader({ meta, logoUrl }: FichaHeaderProps): JSX.Element {
  const line = metaLine(meta);
  const logo = logoUrl ? <img src={logoUrl} alt="" className="ficha-header__logo" /> : null;

  return (
    <header className="ficha-header">
      <div className="ficha-header__text">
        {line ? (
          <div className="ficha-header__meta-row">
            <p className="ficha-header__meta">{line}</p>
            {logo}
          </div>
        ) : (
          logo && <div className="ficha-header__logo-only">{logo}</div>
        )}
        <h1 className="ficha-header__title">
          {meta.title}
          {meta.difficultyStars ? (
            <span className="ficha-header__stars">
              {"    "}
              {meta.difficultyStars}
            </span>
          ) : null}
        </h1>
      </div>
    </header>
  );
}
