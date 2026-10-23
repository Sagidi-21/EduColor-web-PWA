import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearSetPasswordFromUrl, readSetPasswordFromUrl } from "./setPasswordUrl";

describe("setPasswordUrl", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  describe("readSetPasswordFromUrl", () => {
    it("activa el flujo cuando setPassword=1", () => {
      window.history.replaceState({}, "", "/ruta?setPassword=1");
      expect(readSetPasswordFromUrl()).toEqual({ active: true, source: "forgot" });
    });

    it("usa src cuando está presente", () => {
      window.history.replaceState({}, "", "/?setPassword=1&src=lockout");
      expect(readSetPasswordFromUrl()).toEqual({ active: true, source: "lockout" });
    });

    it("hace trim de src y cae a forgot si queda vacío", () => {
      window.history.replaceState({}, "", "/?setPassword=1&src=%20%20");
      expect(readSetPasswordFromUrl()).toEqual({ active: true, source: "forgot" });
    });

    it("no activa si falta setPassword", () => {
      window.history.replaceState({}, "", "/?src=lockout");
      expect(readSetPasswordFromUrl()).toEqual({ active: false, source: "forgot" });
    });

    it("no activa si setPassword no es exactamente 1", () => {
      window.history.replaceState({}, "", "/?setPassword=true");
      expect(readSetPasswordFromUrl()).toEqual({ active: false, source: "forgot" });
    });
  });

  describe("clearSetPasswordFromUrl", () => {
    it("elimina setPassword y src y conserva otros params y el hash", () => {
      window.history.replaceState({}, "", "/auth?setPassword=1&src=forgot&x=1#seccion");
      clearSetPasswordFromUrl();
      expect(window.location.pathname).toBe("/auth");
      expect(window.location.search).toBe("?x=1");
      expect(window.location.hash).toBe("#seccion");
    });

    it("no altera la URL si no hay setPassword ni src", () => {
      window.history.replaceState({}, "", "/ok?keep=1#h");
      const before = window.location.href;
      clearSetPasswordFromUrl();
      expect(window.location.href).toBe(before);
    });

    it("limpia solo src si no hay setPassword", () => {
      window.history.replaceState({}, "", "/?src=lockout&keep=yes");
      clearSetPasswordFromUrl();
      expect(window.location.search).toBe("?keep=yes");
    });
  });
});
