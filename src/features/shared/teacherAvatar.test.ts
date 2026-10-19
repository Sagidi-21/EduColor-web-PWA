import { describe, expect, it } from "vitest";
import {
  INACTIVE_AVATAR_COLOR,
  INACTIVE_AVATAR_TEXT,
  OWNER_AVATAR_INITIALS,
  avatarTextColor,
  normalizeHexColor,
  resolveAvatarColors,
  teacherInitials,
} from "./teacherAvatar";

describe("teacherAvatar", () => {
  it("normaliza HEX", () => {
    expect(normalizeHexColor("abc")).toBeNull();
    expect(normalizeHexColor("#dc2626")).toBe("#DC2626");
    expect(normalizeHexColor("001F3F")).toBe("#001F3F");
  });

  it("iniciales de nombre o email", () => {
    expect(teacherInitials("Ana", "López")).toBe("AL");
    expect(teacherInitials(null, null, "profe@colegio.edu")).toBe("PR");
    expect(OWNER_AVATAR_INITIALS).toBe("OW");
  });

  it("contraste de texto según fondo", () => {
    expect(avatarTextColor("#001F3F")).toBe("#FFFFFF");
    expect(avatarTextColor("#FDE68A")).toBe("#0F172A");
  });

  it("desactivado usa gris fijo", () => {
    expect(resolveAvatarColors("#2C41DD", false)).toEqual({
      bg: INACTIVE_AVATAR_COLOR,
      fg: INACTIVE_AVATAR_TEXT,
    });
    expect(resolveAvatarColors("#2C41DD", true).bg).toBe("#2C41DD");
  });
});
