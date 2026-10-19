export { getSupabase, isSupabaseConfigured, pingSupabase } from "./client";
export {
  ensureOwnerSchool,
  fetchMySchools,
  sessionHasAppAccess,
  signInWithPassword,
  signOut,
  signUpOwner,
  slugifySchoolName,
} from "./auth";
export type { AuthResult } from "./auth";
export type { Database, Profile, School, SchoolMembership, SchoolRole } from "./types";
export { clearSchoolBranding, uploadSchoolBranding, brandingAspectHint } from "./schoolBranding";
export type { BrandingKind, BrandingUploadResult } from "./schoolBranding";
