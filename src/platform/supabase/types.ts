/** Tipos mínimos del esquema D-028 (colegios + profesorado). */
export type SchoolRole = "owner" | "teacher";

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface School {
  id: string;
  name: string;
  slug: string | null;
  created_at: string;
  updated_at: string;
}

export interface SchoolMembership {
  id: string;
  school_id: string;
  user_id: string;
  role: SchoolRole;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      schools: {
        Row: School;
        Insert: { name: string; slug?: string | null };
        Update: Partial<Pick<School, "name" | "slug">>;
        Relationships: [];
      };
      school_memberships: {
        Row: SchoolMembership;
        Insert: {
          school_id: string;
          user_id: string;
          role: SchoolRole;
        };
        Update: Partial<Pick<SchoolMembership, "role">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_school_member: { Args: { p_school_id: string }; Returns: boolean };
      is_school_owner: { Args: { p_school_id: string }; Returns: boolean };
    };
    Enums: {
      school_role: SchoolRole;
    };
    CompositeTypes: Record<string, never>;
  };
}
