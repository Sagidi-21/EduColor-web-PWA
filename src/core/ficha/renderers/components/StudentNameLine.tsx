export interface StudentNameLineProps {
  label?: string;
}

export function StudentNameLine({ label = "Nombre:" }: StudentNameLineProps): JSX.Element {
  return (
    <div className="ficha-name-line">
      <span className="ficha-name-line__label">{label}</span>
      <span className="ficha-name-line__line" />
      <span className="ficha-name-line__line" />
    </div>
  );
}
