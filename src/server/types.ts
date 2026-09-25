export const ALLOWED_THEMES = [
  "space",
  "dinosaurs",
  "pirates",
  "magic",
  "underwater",
  "animals",
  "nature",
  "technology",
  "medieval",
  "racing",
  "other",
] as const;

export const ALLOWED_CHARACTER_TYPES = [
  "ai_choice",
  "person",
  "animal",
  "fantasy",
  "robot",
  "magic",
  "other",
] as const;

export const ALLOWED_PERSONALITY = [
  "funny",
  "curious",
  "adventurous",
  "brave",
  "playful",
  "intelligent",
  "kind",
  "enthusiastic",
  "calm",
] as const;

export const ALLOWED_NAME_MODES = ["ai", "teacher"] as const;

export const ALLOWED_VISUAL_STYLES = [
  "cartoon_3d",
  "illustration",
  "anime",
  "soft_fantasy",
] as const;

export interface MascotConfig {
  theme: string;
  customTheme: string;
  characterType: string;
  customCharacterType: string;
  personality: string[];
  nameMode: string;
  teacherName: string;
  visualStyle: string;
  specialDetails: string;
}

export interface MascotPreviewResult {
  id: string;
  imageUrl: string;
  name: string;
  description: string;
}

export interface MascotPoseGridResult {
  imageUrl: string;
}

export interface MascotAssetsResult {
  referenceImage: string;
  assets: {
    explain: string;
    think: string;
    celebrate: string;
    encourage: string;
    header: string;
    blackboard: string;
  };
}

export interface MascotPoseAssetsResult {
  explain: string;
  point: string;
  think: string;
  celebrate: string;
}
