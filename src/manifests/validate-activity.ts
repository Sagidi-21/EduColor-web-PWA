import Ajv2020 from "ajv/dist/2020";
import type { ErrorObject } from "ajv";
import type { CatalogValidationIssue } from "../core/content/validate-catalog";
import { findDuplicateActivityIds } from "../core/content/validate-catalog";
import schema from "./schema/activity-manifest.schema.json";

const ajv = new Ajv2020({ allErrors: true });
const validateSchema = ajv.compile(schema);

function fieldFromError(error: ErrorObject): string {
  if (error.instancePath) return error.instancePath;
  if (error.params && "missingProperty" in error.params) {
    return String(error.params.missingProperty);
  }
  return "/";
}

export function validateActivityManifest(
  manifest: unknown,
  source = "manifiesto",
): CatalogValidationIssue[] {
  if (validateSchema(manifest)) return [];
  return (validateSchema.errors ?? []).map((error) => ({
    source,
    field: fieldFromError(error),
    message: error.message ?? "manifiesto inválido",
  }));
}

export function validateActivityCatalog(
  entries: readonly { source: string; manifest: unknown }[],
): CatalogValidationIssue[] {
  const schemaIssues = entries.flatMap(({ source, manifest }) =>
    validateActivityManifest(manifest, source),
  );
  const duplicateIssues = findDuplicateActivityIds(
    entries.map(({ source, manifest }) => ({
      source,
      id:
        typeof manifest === "object" && manifest !== null && "id" in manifest
          ? String((manifest as { id: unknown }).id)
          : "",
    })),
  );
  return [...schemaIssues, ...duplicateIssues];
}
