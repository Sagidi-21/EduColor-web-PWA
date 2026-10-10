/** Número de ejercicios por defecto al generar una ficha (la mayoría: 10). */
export function defaultFichaCount(activityId: string): number {
  if (activityId === "laberintoMatematico" || activityId === "laberintoMatematico2") {
    return 4;
  }
  return 10;
}
