import { getSupabase, isSupabaseConfigured } from "./client";

export const SCHOOL_BRANDING_BUCKET = "school-branding";

export type BrandingKind = "background" | "logo_ficha";

const MAX_BYTES: Record<BrandingKind, number> = {
  background: 5 * 1024 * 1024,
  logo_ficha: 2 * 1024 * 1024,
};

const ACCEPT = ["image/jpeg", "image/png", "image/webp"] as const;

export function brandingAspectHint(
  kind: BrandingKind,
  width: number,
  height: number,
): string | null {
  if (width < 1 || height < 1) return null;
  const ratio = width / height;
  if (kind === "background") {
    if (ratio < 1.4 || ratio > 2.1) {
      return "Mejor resultado con imagen horizontal ~16:9 (p. ej. 1920×1080).";
    }
    return null;
  }
  if (ratio < 0.85 || ratio > 1.15) {
    return "Mejor resultado con logo cuadrado (p. ej. 512×512).";
  }
  return null;
}

function validateFile(kind: BrandingKind, file: File): string | null {
  if (!ACCEPT.includes(file.type as (typeof ACCEPT)[number])) {
    return "Usa JPG, PNG o WebP.";
  }
  if (file.size > MAX_BYTES[kind]) {
    return kind === "background" ? "La imagen supera 5 MB." : "La imagen supera 2 MB.";
  }
  return null;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen."));
    };
    image.src = url;
  });
}

/** Comprime a JPEG (fondo) o PNG (logo con transparencia si viene PNG). */
async function compressBranding(
  kind: BrandingKind,
  file: File,
): Promise<{ blob: Blob; ext: "jpg" | "png"; hint: string | null }> {
  const image = await loadImage(file);
  const hint = brandingAspectHint(kind, image.width, image.height);
  const maxSide = kind === "background" ? 1920 : 512;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen.");
  ctx.drawImage(image, 0, 0, width, height);

  const preferPng = kind === "logo_ficha" && file.type === "image/png";
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("No se pudo comprimir la imagen."))),
      preferPng ? "image/png" : "image/jpeg",
      preferPng ? undefined : 0.85,
    );
  });
  return { blob, ext: preferPng ? "png" : "jpg", hint };
}

function objectPath(schoolId: string, kind: BrandingKind, ext: "jpg" | "png"): string {
  const base = kind === "background" ? "background" : "logo-ficha";
  return `${schoolId}/${base}.${ext}`;
}

function publicUrlWithBust(path: string): string {
  const { data } = getSupabase().storage.from(SCHOOL_BRANDING_BUCKET).getPublicUrl(path);
  const sep = data.publicUrl.includes("?") ? "&" : "?";
  return `${data.publicUrl}${sep}t=${Date.now()}`;
}

export type BrandingUploadResult =
  { ok: true; url: string; hint: string | null } | { ok: false; message: string };

export async function uploadSchoolBranding(
  schoolId: string,
  kind: BrandingKind,
  file: File,
): Promise<BrandingUploadResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase no configurado." };
  }
  const invalid = validateFile(kind, file);
  if (invalid) return { ok: false, message: invalid };

  let compressed: { blob: Blob; ext: "jpg" | "png"; hint: string | null };
  try {
    compressed = await compressBranding(kind, file);
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "No se pudo procesar la imagen.",
    };
  }

  const path = objectPath(schoolId, kind, compressed.ext);
  const supabase = getSupabase();
  const { error: upError } = await supabase.storage
    .from(SCHOOL_BRANDING_BUCKET)
    .upload(path, compressed.blob, {
      upsert: true,
      contentType: compressed.ext === "png" ? "image/png" : "image/jpeg",
      cacheControl: "3600",
    });
  if (upError) {
    return { ok: false, message: upError.message || "No se pudo subir la imagen." };
  }

  const url = publicUrlWithBust(path);
  const column = kind === "background" ? "background_url" : "logo_ficha_url";
  const { error: dbError } = await supabase
    .from("schools")
    .update({ [column]: url })
    .eq("id", schoolId);
  if (dbError) {
    return { ok: false, message: dbError.message || "No se pudo guardar la URL." };
  }
  return { ok: true, url, hint: compressed.hint };
}

export async function clearSchoolBranding(
  schoolId: string,
  kind: BrandingKind,
): Promise<{ ok: boolean; message?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase no configurado." };
  }
  const supabase = getSupabase();
  const paths = [objectPath(schoolId, kind, "jpg"), objectPath(schoolId, kind, "png")];
  await supabase.storage.from(SCHOOL_BRANDING_BUCKET).remove(paths);

  const column = kind === "background" ? "background_url" : "logo_ficha_url";
  const { error } = await supabase
    .from("schools")
    .update({ [column]: null })
    .eq("id", schoolId);
  if (error) return { ok: false, message: error.message || "No se pudo restaurar." };
  return { ok: true };
}
