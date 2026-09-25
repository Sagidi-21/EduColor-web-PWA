import "@testing-library/jest-dom";
import { vi } from "vitest";

vi.mock("../../../platform/digit/digitModel", () => ({
  subscribeStatus: vi.fn(() => vi.fn()),
  getStatus: vi.fn(() => "ready"),
  predict: vi.fn().mockResolvedValue(null),
  CONFIDENCE_THRESHOLD: 0.85,
  triggerFinetuneNow: vi.fn().mockResolvedValue(undefined),
  getModelMetrics: vi.fn(() => ({ accuracy: null, lastFinetune: null })),
}));

vi.mock("../../../platform/digit/sampleStore", () => ({
  getAllSamples: vi.fn().mockResolvedValue([]),
  countSamples: vi.fn().mockResolvedValue(0),
  exportSamplesToJSON: vi.fn().mockResolvedValue("[]"),
  saveSample: vi.fn().mockResolvedValue(undefined),
}));

Object.defineProperty(globalThis, "requestIdleCallback", {
  value: (cb: () => void) => setTimeout(cb, 0),
  writable: true,
});
