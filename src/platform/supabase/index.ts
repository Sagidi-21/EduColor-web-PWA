export { getSupabase, isSupabaseConfigured, pingSupabase } from "./client";
export {
  ensureOwnerSchool,
  fetchMySchools,
  signInWithPassword,
  signOut,
  signUpOwner,
  slugifySchoolName,
} from "./auth";
export type { AuthResult } from "./auth";
export type { Database, Profile, School, SchoolMembership, SchoolRole } from "./types";
