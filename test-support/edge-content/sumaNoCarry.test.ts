/**
 * «La suma» (1.º) no debe generar llevada de algoritmo en columna
 * cuando hay algún sumando de 2 cifras. Eso corresponde a «Sumamos llevando».
 * Sumas de una cifra que pasan de 10 (p. ej. 7+8) sí están permitidas.
 */
import { describe, expect, it } from "vitest";
import {
  generateSumaSession,
  hasColumnCarry,
} from "../../supabase/functions/_shared/engines/suma.ts";

describe("suma hard/expert sin llevada de columna", () => {
  it("expert no genera pares con llevada (p. ej. 12+8) en varias semillas", () => {
    const offenders: string[] = [];
    for (const seed of [1, 7, 28, 42, 99]) {
      const session = generateSumaSession("expert", seed);
      expect(session.length).toBe(10);
      for (const ex of session) {
        if (hasColumnCarry(ex.a, ex.b)) {
          offenders.push(`seed=${seed} ${ex.a}+${ex.b}`);
        }
      }
    }
    expect(offenders, `llevadas encontradas: ${offenders.join(", ")}`).toEqual([]);
  });

  it("1000 semillas hard+expert: ningún ejercicio con llevada de columna", () => {
    const offenders: string[] = [];
    let shortSessions = 0;
    for (let seed = 1; seed <= 1000; seed++) {
      for (const difficulty of ["hard", "expert"] as const) {
        const session = generateSumaSession(difficulty, seed);
        if (session.length !== 10) shortSessions++;
        for (const ex of session) {
          if (hasColumnCarry(ex.a, ex.b)) {
            offenders.push(`${difficulty} seed=${seed} ${ex.a}+${ex.b}`);
            if (offenders.length >= 20) break;
          }
        }
        if (offenders.length >= 20) break;
      }
      if (offenders.length >= 20) break;
    }
    expect(shortSessions, "sesiones incompletas (<10)").toBe(0);
    expect(
      offenders,
      `${offenders.length}+ llevadas; primeras: ${offenders.slice(0, 10).join(", ")}`,
    ).toEqual([]);
  });
});
