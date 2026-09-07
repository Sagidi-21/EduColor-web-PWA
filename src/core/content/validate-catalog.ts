export interface CatalogValidationIssue {
  source: string;
  field: string;
  message: string;
}

/** Detecta IDs de actividad repetidos e indica archivo, campo y motivo. */
export function findDuplicateActivityIds(
  entries: readonly { source: string; id: string }[],
): CatalogValidationIssue[] {
  const sourcesById = new Map<string, string[]>();
  for (const entry of entries) {
    const sources = sourcesById.get(entry.id) ?? [];
    sources.push(entry.source);
    sourcesById.set(entry.id, sources);
  }

  const issues: CatalogValidationIssue[] = [];
  for (const [id, sources] of sourcesById) {
    if (sources.length < 2) continue;
    for (const source of sources) {
      const others = sources.filter((candidate) => candidate !== source);
      issues.push({
        source,
        field: "id",
        message: `ID duplicado "${id}" (también en ${others.join(", ")})`,
      });
    }
  }
  return issues;
}
