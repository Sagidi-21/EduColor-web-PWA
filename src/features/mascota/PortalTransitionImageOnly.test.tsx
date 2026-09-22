import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { PortalTransitionImageOnly } from "./PortalTransitionImageOnly";

describe("PortalTransitionImageOnly - Fixed positioning test", () => {
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

  it("should have proper fixed positioning covering entire viewport in normal size (800×600)", () => {
    setViewport(800, 600);
    const { container } = render(
      <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
        <PortalTransitionImageOnly label="Espacio" image="test.png" type="theme" />
      </div>,
    );
    const overlay = container.querySelector(".portal-transition") as HTMLDivElement;
    expect(overlay).toBeTruthy();
    const style = getComputedStyle(overlay);
    expect(style.position).toBe("fixed");
    expect(style.top).toBe("0px");
    expect(style.left).toBe("0px");
    // El componente usa píxeles calculados: window.innerWidth / bodyZoom
    expect(style.width).toBe("800px");
    expect(style.height).toBe("600px");
  });

  it("should have proper fixed positioning in large size (1200×900)", () => {
    setViewport(1200, 900);
    const { container } = render(
      <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
        <PortalTransitionImageOnly label="Espacio" image="test.png" type="theme" />
      </div>,
    );
    const overlay = container.querySelector(".portal-transition") as HTMLDivElement;
    expect(overlay).toBeTruthy();
    const style = getComputedStyle(overlay);
    expect(style.position).toBe("fixed");
    expect(style.width).toBe("1200px");
    expect(style.height).toBe("900px");
  });

  it("should have proper fixed positioning in extra-large size (1920×1080)", () => {
    setViewport(1920, 1080);
    const { container } = render(
      <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
        <PortalTransitionImageOnly label="Espacio" image="test.png" type="theme" />
      </div>,
    );
    const overlay = container.querySelector(".portal-transition") as HTMLDivElement;
    expect(overlay).toBeTruthy();
    const style = getComputedStyle(overlay);
    expect(style.position).toBe("fixed");
    expect(style.width).toBe("1920px");
    expect(style.height).toBe("1080px");
  });

  it("should maintain fixed positioning after viewport resize", () => {
    setViewport(800, 600);
    const { container, rerender } = render(
      <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
        <PortalTransitionImageOnly label="Espacio" image="test.png" type="theme" />
      </div>,
    );
    const overlay = container.querySelector(".portal-transition") as HTMLDivElement;
    expect(overlay).toBeTruthy();

    setViewport(1920, 1080);
    rerender(
      <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
        <PortalTransitionImageOnly label="Espacio" image="test.png" type="theme" />
      </div>,
    );
    const style = getComputedStyle(overlay);
    expect(style.position).toBe("fixed");
    expect(style.width).toBe("1920px");
    expect(style.height).toBe("1080px");
  });
});
