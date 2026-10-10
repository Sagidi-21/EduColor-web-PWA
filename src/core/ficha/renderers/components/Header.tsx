import type { FichaMeta } from "../../types";

export interface FichaHeaderProps {
  meta: FichaMeta;
  logoUrl?: string;
}

function metaLine(meta: FichaMeta): string {
  return [meta.grade, meta.subject, meta.className].filter(Boolean).join(" — ");
}

/**
 * Cabecera Word-safe: tabla en lugar de logo absolute + transform.
 */
export function FichaHeader({ meta, logoUrl }: FichaHeaderProps): JSX.Element {
  const line = metaLine(meta);
  const logo = logoUrl ? (
    <img src={logoUrl} alt="" className="ficha-header__logo" width={90} height={90} />
  ) : null;

  return (
    <header className="ficha-header">
      <table className="ficha-header__table" cellPadding={0} cellSpacing={0} role="presentation">
        <tbody>
          <tr>
            <td className="ficha-header__meta-cell" valign="bottom">
              {line ? <p className="ficha-header__meta">{line}</p> : null}
            </td>
            {logo ? (
              <td className="ficha-header__logo-cell" valign="bottom" width={96}>
                {logo}
              </td>
            ) : null}
          </tr>
        </tbody>
      </table>
      <h1 className="ficha-header__title">
        {meta.title}
        {meta.difficultyStars ? (
          <span className="ficha-header__stars">
            {"    "}
            {meta.difficultyStars}
          </span>
        ) : null}
      </h1>
    </header>
  );
}
