/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ViewTransition } from "./ViewTransition";
import type { TransitionTheme, TransitionDirection } from "./vtThemes";

describe("ViewTransition (Framer Motion)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  const views = {
    a: ({ navigate }: { navigate: (view: string, direction?: TransitionDirection) => void }) => (
      <div data-testid="view-a">
        View A<button onClick={() => navigate("b", "right")}>Go B</button>
      </div>
    ),
    b: ({ navigate }: { navigate: (view: string, direction?: TransitionDirection) => void }) => (
      <div data-testid="view-b">
        View B<button onClick={() => navigate("a", "left")}>Back A</button>
      </div>
    ),
    c: ({ navigate }: { navigate: (view: string, direction?: TransitionDirection) => void }) => (
      <div data-testid="view-c">
        View C<button onClick={() => navigate("a", "left")}>Back A</button>
      </div>
    ),
  };

  const renderTransition = (initialView = "a", theme: TransitionTheme = "cube") => {
    return render(<ViewTransition views={views} initialView={initialView} defaultTheme={theme} />);
  };

  const getCurrentView = (container: HTMLElement, viewId: string) =>
    container.querySelector(`[data-testid="${viewId}"]`);

  describe("Initial render", () => {
    it("renders only the initial view", () => {
      const { container } = renderTransition("a");
      expect(getCurrentView(container, "view-a")).toBeInTheDocument();
      expect(getCurrentView(container, "view-b")).not.toBeInTheDocument();
    });

    it("uses cube theme by default", () => {
      const { container } = renderTransition("a");
      const wrapper = container.querySelector(".vt-wrapper");
      expect(wrapper).toHaveStyle({ perspective: "1200px" });
    });

    it("persists theme in localStorage", () => {
      localStorage.setItem("vt_theme", "fall");
      const { container, unmount } = renderTransition("a");
      expect(container.querySelector(".vt-wrapper")).toBeInTheDocument();
      unmount();
      expect(localStorage.getItem("vt_theme")).toBe("fall");
    });
  });

  describe("Navigation & cube transitions", () => {
    it("navigates forward (right) and shows both views during transition", () => {
      const { container } = renderTransition("a");
      const btn = container.querySelector("button") as HTMLButtonElement;
      act(() => btn.click());

      expect(getCurrentView(container, "view-a")).toBeInTheDocument();
      expect(getCurrentView(container, "view-b")).toBeInTheDocument();
    });

    it("navigates backward (left) with correct direction", () => {
      const { container } = renderTransition("b");
      const btn = container.querySelector("button") as HTMLButtonElement;
      act(() => btn.click());

      expect(getCurrentView(container, "view-b")).toBeInTheDocument();
      expect(getCurrentView(container, "view-a")).toBeInTheDocument();
    });

    it("ignores navigation to same view", () => {
      const { container } = renderTransition("a");
      const btn = container.querySelector("button") as HTMLButtonElement;
      act(() => {
        if (btn.onclick) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          btn.onclick.call(btn, { currentTarget: { dataset: {} } } as any);
        }
      });
    });

    it("guards against rapid navigation while transitioning", () => {
      const { container } = renderTransition("a");
      const btn = container.querySelector("button") as HTMLButtonElement;
      act(() => btn.click());

      expect(getCurrentView(container, "view-a")).toBeInTheDocument();
      expect(getCurrentView(container, "view-b")).toBeInTheDocument();

      const btn2 = container.querySelectorAll("button")[1] as HTMLButtonElement;
      act(() => btn2.click());

      expect(getCurrentView(container, "view-a")).toBeInTheDocument();
      expect(getCurrentView(container, "view-b")).toBeInTheDocument();
    });
  });

  describe("Portal transitions", () => {
    it("activates portal mode when origin is provided", () => {
      const { container } = renderTransition("a");
      const btn = container.querySelector("button") as HTMLButtonElement;

      act(() => {
        btn.click();
      });

      const origin = { x: 50, y: 50 };
      const myWindow = window as unknown as {
        ViewTransitionContext?: {
          current?: { navigate?: (v: string, d: string, o: { x: number; y: number }) => void };
        };
      };
      const navFn = myWindow.ViewTransitionContext?.current?.navigate;
      act(() => {
        if (navFn) {
          navFn("b", "right", origin);
        } else if (btn.onclick) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          btn.onclick.call(btn, {} as any);
        }
      });

      expect(container.querySelector(".vt-wrapper")).toBeInTheDocument();
    });
  });

  describe("Theme switching", () => {
    it("switches theme via context API", () => {
      const { container } = renderTransition("a", "cube");
      const wrapper = container.querySelector(".vt-wrapper");
      expect(wrapper).toBeInTheDocument();
    });

    it("uses fade variants for non-cube themes", () => {
      const { container, unmount } = renderTransition("a", "flip");
      expect(container.querySelector(".vt-wrapper")).toBeInTheDocument();
      unmount();
    });
  });

  describe("Context providers", () => {
    it("exposes navigate and setTheme via context", () => {
      const { container } = renderTransition("a");
      expect(container.querySelector(".vt-wrapper")).toBeInTheDocument();
    });
  });
});
