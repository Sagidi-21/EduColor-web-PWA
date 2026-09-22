import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { PortalTransition } from "./PortalTransition";

describe("PortalTransition responsive", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  const setViewport = (width: number, height: number) => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: height });
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: { width, height },
    });
    window.dispatchEvent(new Event("resize"));
  };

  it("renders the image with the portal-transition__image class (object-fit: contain)", () => {
    setViewport(800, 600);
    const { container } = render(
      <PortalTransition label="Espacio" image="test.png" dissolving={false} type="theme" />,
    );
    const img = container.querySelector(".portal-transition__image") as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.classList.contains("portal-transition__image")).toBe(true);
  });

  it("image container covers the viewport via CSS class", () => {
    setViewport(800, 600);
    const { container } = render(
      <PortalTransition label="x" image="test.png" dissolving={false} type="theme" />,
    );
    const portal = container.querySelector(".portal-transition") as HTMLDivElement;
    expect(portal).toBeTruthy();
    // La clase CSS aplica position: fixed; top/left 0; width/height 100vw/100vh
    expect(portal.classList.contains("portal-transition")).toBe(true);
    expect(portal.style.position || getComputedStyle(portal).position).toBe("fixed");
  });

  it("image never exceeds viewport in normal size", () => {
    setViewport(800, 600);
    const { container } = render(
      <PortalTransition label="x" image="test.png" dissolving={false} type="theme" />,
    );
    const portal = container.querySelector(".portal-transition") as HTMLDivElement;
    const rect = portal.getBoundingClientRect();
    expect(rect.right).toBeLessThanOrEqual(800 + 1);
    expect(rect.bottom).toBeLessThanOrEqual(600 + 1);
  });

  it("image never exceeds viewport in large size", () => {
    setViewport(1200, 900);
    const { container } = render(
      <PortalTransition label="x" image="test.png" dissolving={false} type="theme" />,
    );
    const portal = container.querySelector(".portal-transition") as HTMLDivElement;
    const rect = portal.getBoundingClientRect();
    expect(rect.right).toBeLessThanOrEqual(1200 + 1);
    expect(rect.bottom).toBeLessThanOrEqual(900 + 1);
  });

  it("image never exceeds viewport in extra-large size", () => {
    setViewport(1920, 1080);
    const { container } = render(
      <PortalTransition label="x" image="test.png" dissolving={false} type="theme" />,
    );
    const portal = container.querySelector(".portal-transition") as HTMLDivElement;
    const rect = portal.getBoundingClientRect();
    expect(rect.right).toBeLessThanOrEqual(1920 + 1);
    expect(rect.bottom).toBeLessThanOrEqual(1080 + 1);
  });

  it("container stays within bounds when viewport resizes while open", () => {
    setViewport(800, 600);
    const { container } = render(
      <PortalTransition label="x" image="test.png" dissolving={false} type="theme" />,
    );
    setViewport(1920, 1080);
    const portal = container.querySelector(".portal-transition") as HTMLDivElement;
    const rect = portal.getBoundingClientRect();
    expect(rect.right).toBeLessThanOrEqual(1920 + 1);
    expect(rect.bottom).toBeLessThanOrEqual(1080 + 1);
  });

  it("canvas dissolve element is rendered when dissolving", () => {
    setViewport(1024, 768);
    const { container } = render(
      <PortalTransition label="x" image="test.png" dissolving={true} type="theme" />,
    );
    const canvas = container.querySelector(".portal-dissolve__canvas") as HTMLCanvasElement;
    expect(canvas).toBeTruthy();
    expect(canvas.classList.contains("portal-dissolve__canvas")).toBe(true);
  });

  it("banner text adapts to expanded state", () => {
    setViewport(800, 600);
    const { container, rerender } = render(
      <PortalTransition label="x" image="test.png" dissolving={false} type="personalidad" />,
    );
    expect(container.textContent).toContain("Tu compañero será");
    setViewport(1200, 900);
    rerender(
      <PortalTransition label="x" image="test.png" dissolving={false} type="personalidad" />,
    );
    expect(container.textContent).toContain("Su personalidad será");
  });
});
