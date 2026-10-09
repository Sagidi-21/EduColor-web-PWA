export interface FichaFooterProps {
  logoUrl?: string;
  label?: string;
}

export function FichaFooter({ logoUrl, label = "EduColor" }: FichaFooterProps): JSX.Element {
  return (
    <footer className="ficha-footer">
      <span>{label}</span>
      {logoUrl && (
        <img
          src={logoUrl}
          alt=""
          className="ficha-header__logo"
          style={{ height: 28, width: 28 }}
        />
      )}
    </footer>
  );
}
