/** Tipos mínimos del esquema D-028 (colegios + profesorado). */
export type SchoolRole = "owner" | "teacher";

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export type SchoolStatus = "pending" | "active" | "disabled";

export interface School {
  id: string;
  name: string;
  slug: string | null;
  status?: SchoolStatus;
  /** Fondo Home; null = asset demo genérico. */
  background_url?: string | null;
  /** Logo de fichas; null = logo EduColor. */
  logo_ficha_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SchoolMembership {
  id: string;
  school_id: string;
  user_id: string;
  role: SchoolRole;
  is_active: boolean;
  first_name: string | null;
  last_name_1: string | null;
  last_name_2: string | null;
  /** HEX #RRGGBB; único por colegio. */
  avatar_color: string | null;
  created_at: string;
}

export interface SchoolInvite {
  id: string;
  school_id: string;
  email: string;
  first_name: string;
  last_name_1: string;
  last_name_2: string;
  status: "pending" | "accepted" | "expired" | "cancelled";
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
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
        Update: Partial<Pick<School, "name" | "slug" | "background_url" | "logo_ficha_url">>;
        Relationships: [];
      };
      school_memberships: {
        Row: SchoolMembership;
        Insert: {
          school_id: string;
          user_id: string;
          role: SchoolRole;
          is_active?: boolean;
          first_name?: string | null;
          last_name_1?: string | null;
          last_name_2?: string | null;
          avatar_color?: string | null;
        };
        Update: Partial<
          Pick<
            SchoolMembership,
            "role" | "is_active" | "first_name" | "last_name_1" | "last_name_2" | "avatar_color"
          >
        >;
        Relationships: [];
      };
      school_invites: {
        Row: SchoolInvite;
        Insert: Omit<SchoolInvite, "id" | "created_at" | "accepted_at" | "status"> & {
          status?: SchoolInvite["status"];
          token_hash: string;
          invited_by: string;
        };
        Update: Partial<SchoolInvite>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_school_member: { Args: { p_school_id: string }; Returns: boolean };
      is_school_owner: { Args: { p_school_id: string }; Returns: boolean };
      create_school_as_owner: { Args: { p_name: string }; Returns: School };
      log_auth_security_event: {
        Args: { p_event_type: string; p_context?: string | null };
        Returns: undefined;
      };
      registration_inputs_unavailable: {
        Args: { p_email: string; p_name: string };
        Returns: boolean;
      };
      get_my_school_role: { Args: { p_school_id: string }; Returns: string };
      owner_create_teacher_invite: {
        Args: {
          p_school_id: string;
          p_email: string;
          p_first_name: string;
          p_last_name_1: string;
          p_last_name_2?: string;
        };
        Returns: Record<string, unknown>;
      };
      owner_list_staff: { Args: { p_school_id: string }; Returns: Record<string, unknown> };
      owner_cancel_invite: { Args: { p_invite_id: string }; Returns: undefined };
      owner_set_teacher_active: {
        Args: { p_membership_id: string; p_active: boolean };
        Returns: undefined;
      };
      owner_remove_teacher: { Args: { p_membership_id: string }; Returns: undefined };
      owner_update_teacher_avatar_color: {
        Args: { p_membership_id: string; p_color: string };
        Returns: undefined;
      };
      peek_teacher_invite: { Args: { p_token: string }; Returns: Record<string, unknown> };
      complete_teacher_invite: {
        Args: { p_token: string; p_user_id?: string | null };
        Returns: Record<string, unknown>;
      };
      consume_password_recovery: {
        Args: { p_fingerprint: string };
        Returns: Record<string, unknown>;
      };
    };
    Enums: {
      school_role: SchoolRole;
    };
    CompositeTypes: Record<string, never>;
  };
}
