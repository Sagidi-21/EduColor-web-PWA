import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const DIAGNOSTIC_FILE = path.resolve("diagnostic-portal.html");
const OUTPUT_DIR = path.resolve("test-results/playwright-diagnostics");

test.describe("Portal Transition Diagnostics at different zoom levels", () => {
  test.beforeAll(() => {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
  });

  const zoomLevels = [1, 1.25, 1.5];

  for (const zoom of zoomLevels) {
    test(`Zoom ${zoom}x - capture viewport and overlay metrics`, async ({ page }) => {
      await page.goto(`file://${DIAGNOSTIC_FILE}`);

      // Wait for page to load and initial diagnostics
      await page.waitForLoadState("networkidle");

      // Set body zoom
      await page.evaluate((z) => {
        document.body.style.zoom = String(z);
      }, zoom);

      // Show portal
      await page.evaluate(() => {
        const portal = document.getElementById("portal");
        portal.style.display = "flex";
      });

      // Wait for layout
      await page.waitForTimeout(200);

      // Capture diagnostics
      const diagnostics = await page.evaluate(() => {
        const bodyStyle = getComputedStyle(document.body);
        const bodyZoom = parseFloat(bodyStyle.zoom) || 1;
        const portal = document.getElementById("portal");
        const overlayRect = portal.getBoundingClientRect();
        const img = document.getElementById("portalImg");
        const imageRect = img.getBoundingClientRect();

        return {
          timestamp: new Date().toISOString(),
          zoom: bodyZoom,
          windowInnerWidth: window.innerWidth,
          windowInnerHeight: window.innerHeight,
          visualViewport: window.visualViewport
            ? {
                width: window.visualViewport.width,
                height: window.visualViewport.height,
                scale: window.visualViewport.scale,
              }
            : null,
          devicePixelRatio: window.devicePixelRatio,
          overlayRect: {
            x: overlayRect.left,
            y: overlayRect.top,
            width: overlayRect.width,
            height: overlayRect.height,
            right: overlayRect.right,
            bottom: overlayRect.bottom,
          },
          imageRect: {
            x: imageRect.left,
            y: imageRect.top,
            width: imageRect.width,
            height: imageRect.height,
            right: imageRect.right,
            bottom: imageRect.bottom,
          },
          portalComputedStyle: {
            position: getComputedStyle(portal).position,
            width: getComputedStyle(portal).width,
            height: getComputedStyle(portal).height,
            zoom: getComputedStyle(portal).zoom,
            display: getComputedStyle(portal).display,
          },
          imgComputedStyle: {
            width: getComputedStyle(img).width,
            height: getComputedStyle(img).height,
            objectFit: getComputedStyle(img).objectFit,
            objectPosition: getComputedStyle(img).objectPosition,
          },
        };
      });

      // Save diagnostics
      const outputFile = path.join(OUTPUT_DIR, `diagnostics-zoom-${zoom}.json`);
      fs.writeFileSync(outputFile, JSON.stringify(diagnostics, null, 2));

      // Log to console for visibility
      console.log(`\n=== DIAGNOSTICS ZOOM ${zoom}x ===`);
      console.log(JSON.stringify(diagnostics, null, 2));

      // Basic assertions
      expect(diagnostics.zoom).toBeCloseTo(zoom, 2);
      expect(diagnostics.overlayRect.width).toBeGreaterThan(0);
      expect(diagnostics.overlayRect.height).toBeGreaterThan(0);
      expect(diagnostics.portalComputedStyle.position).toBe("fixed");

      // Check if overlay covers full viewport (accounting for zoom)
      const expectedWidth = diagnostics.windowInnerWidth;
      const expectedHeight = diagnostics.windowInnerHeight;
      // Allow small tolerance
      expect(Math.abs(diagnostics.overlayRect.width - expectedWidth)).toBeLessThan(2);
      expect(Math.abs(diagnostics.overlayRect.height - expectedHeight)).toBeLessThan(2);

      // Check image is contained (object-fit: contain)
      expect(diagnostics.imgComputedStyle.objectFit).toBe("contain");
    });
  }
});
