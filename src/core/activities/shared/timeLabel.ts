/**
 * Como se dice la hora en voz alta en español.
 *
 * Vive fuera de `reloj.ts` porque la usan dos motores: `reloj` la nombra en el
 * enunciado y en los botones de las opciones con esfera, y `relojPonerHora` la
 * usa para nombrar el reloj de agujas a los lectores de pantalla. Con la tabla
 * dentro del motor, un segundo consumidor acababa importándola de ahí o
 * copiándola, que es exactamente lo que pasó con el defecto de cálculo que
 * esta función ya no tiene.
 */

/**
 * "menos cuarto", "menos diez" y "menos cinco" se dicen respecto de la hora
 * SIGUIENTE, no de la que lleva la aguja: las 11:45 se dicen "la 1 menos
 * cuarto", y las 12:45 también, porque el reloj da la vuelta a la una. El
 * artículo se recalcula sobre esa hora adelantada.
 */
function conHoraSiguiente(h: number, resto: string): string {
  const siguiente = h === 12 ? 1 : h + 1;
  return `${siguiente === 1 ? "la" : "las"} ${siguiente} ${resto}`;
}

/**
 * "las 7 en punto", "las 7 y cuarto", "la 1 menos cuarto" (que son las 12:45).
 *
 * El artículo concuerda con la hora que se nombra: a la una se dice "la 1 en
 * punto", al resto "las 3 en punto".
 *
 * Ojo con las tres ramas de "menos" (45, 50 y 55): adelantan la hora una
 * posición, con vuelta a la una al pasar de las 12, así que el artículo se
 * calcula sobre la hora ya adelantada y no sobre `h`. Anteponerle el `h`
 * original produce frases que no corresponden a ninguna hora (las 12:45 como
 * "las 12 menos cuarto"), y es un error fácil de reintroducir: venía del motor
 * original de Electron.
 */
export function timeLabel(h: number, m: number): string {
  const las = h === 1 ? "la" : "las";
  if (m === 0) return `${las} ${h} en punto`;
  if (m === 5) return `${las} ${h} y cinco`;
  if (m === 10) return `${las} ${h} y diez`;
  if (m === 15) return `${las} ${h} y cuarto`;
  if (m === 20) return `${las} ${h} y veinte`;
  if (m === 25) return `${las} ${h} y veinticinco`;
  if (m === 30) return `${las} ${h} y media`;
  if (m === 35) return `${las} ${h} y treinta y cinco`;
  if (m === 40) return `${las} ${h} y cuarenta`;
  if (m === 45) return conHoraSiguiente(h, "menos cuarto");
  if (m === 50) return conHoraSiguiente(h, "menos diez");
  return conHoraSiguiente(h, "menos cinco");
}
