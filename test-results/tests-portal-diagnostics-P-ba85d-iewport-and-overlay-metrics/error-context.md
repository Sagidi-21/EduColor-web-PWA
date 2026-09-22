# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\portal-diagnostics.spec.ts >> Portal Transition Diagnostics at different zoom levels >> Zoom 1.25x - capture viewport and overlay metrics
- Location: tests\portal-diagnostics.spec.ts:18:5

# Error details

```
Error: expect(received).toBeLessThan(expected)

Expected: < 2
Received:   320
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - button "Zoom 1" [ref=e3] [cursor=pointer]
    - button "Zoom 1.25" [ref=e4] [cursor=pointer]
    - button "Zoom 1.5" [ref=e5] [cursor=pointer]
    - button "Toggle Portal" [ref=e6] [cursor=pointer]
    - button "Capture" [ref=e7] [cursor=pointer]
  - generic [ref=e8]: "{ \"timestamp\": \"2026-09-22T18:00:28.058Z\", \"zoom\": 1, \"windowInnerWidth\": 1280, \"windowInnerHeight\": 720, \"visualViewport\": { \"width\": 1280, \"height\": 720, \"scale\": 1 }, \"devicePixelRatio\": 1, \"overlayRect\": { \"x\": 0, \"y\": 0, \"width\": 0, \"height\": 0, \"right\": 0, \"bottom\": 0 }, \"imageRect\": { \"x\": 0, \"y\": 0, \"width\": 0, \"height\": 0, \"right\": 0, \"bottom\": 0 }, \"portalComputedZoom\": \"1\", \"portalStyle\": { \"display\": \"none\", \"position\": \"fixed\", \"width\": \"1280px\", \"height\": \"720px\", \"zoom\": \"1\" }, \"imgStyle\": { \"width\": \"100%\", \"height\": \"100%\", \"objectFit\": \"contain\" } }"
  - generic: Has seleccionado el portal de Espacio
```

# Test source

```ts
  8   | test.describe('Portal Transition Diagnostics at different zoom levels', () => {
  9   |   test.beforeAll(() => {
  10  |     if (!fs.existsSync(OUTPUT_DIR)) {
  11  |       fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  12  |     }
  13  |   });
  14  | 
  15  |   const zoomLevels = [1, 1.25, 1.5];
  16  | 
  17  |   for (const zoom of zoomLevels) {
  18  |     test(`Zoom ${zoom}x - capture viewport and overlay metrics`, async ({ page }) => {
  19  |       await page.goto(`file://${DIAGNOSTIC_FILE}`);
  20  | 
  21  |       // Wait for page to load and initial diagnostics
  22  |       await page.waitForLoadState('networkidle');
  23  | 
  24  |       // Set body zoom
  25  |       await page.evaluate((z) => {
  26  |         document.body.style.zoom = String(z);
  27  |       }, zoom);
  28  | 
  29  |       // Show portal
  30  |       await page.evaluate(() => {
  31  |         const portal = document.getElementById('portal');
  32  |         portal.style.display = 'flex';
  33  |       });
  34  | 
  35  |       // Wait for layout
  36  |       await page.waitForTimeout(200);
  37  | 
  38  |       // Capture diagnostics
  39  |       const diagnostics = await page.evaluate(() => {
  40  |         const bodyStyle = getComputedStyle(document.body);
  41  |         const bodyZoom = parseFloat(bodyStyle.zoom) || 1;
  42  |         const portal = document.getElementById('portal');
  43  |         const overlayRect = portal.getBoundingClientRect();
  44  |         const img = document.getElementById('portalImg');
  45  |         const imageRect = img.getBoundingClientRect();
  46  | 
  47  |         return {
  48  |           timestamp: new Date().toISOString(),
  49  |           zoom: bodyZoom,
  50  |           windowInnerWidth: window.innerWidth,
  51  |           windowInnerHeight: window.innerHeight,
  52  |           visualViewport: window.visualViewport ? {
  53  |             width: window.visualViewport.width,
  54  |             height: window.visualViewport.height,
  55  |             scale: window.visualViewport.scale,
  56  |           } : null,
  57  |           devicePixelRatio: window.devicePixelRatio,
  58  |           overlayRect: {
  59  |             x: overlayRect.left,
  60  |             y: overlayRect.top,
  61  |             width: overlayRect.width,
  62  |             height: overlayRect.height,
  63  |             right: overlayRect.right,
  64  |             bottom: overlayRect.bottom,
  65  |           },
  66  |           imageRect: {
  67  |             x: imageRect.left,
  68  |             y: imageRect.top,
  69  |             width: imageRect.width,
  70  |             height: imageRect.height,
  71  |             right: imageRect.right,
  72  |             bottom: imageRect.bottom,
  73  |           },
  74  |           portalComputedStyle: {
  75  |             position: getComputedStyle(portal).position,
  76  |             width: getComputedStyle(portal).width,
  77  |             height: getComputedStyle(portal).height,
  78  |             zoom: getComputedStyle(portal).zoom,
  79  |             display: getComputedStyle(portal).display,
  80  |           },
  81  |           imgComputedStyle: {
  82  |             width: getComputedStyle(img).width,
  83  |             height: getComputedStyle(img).height,
  84  |             objectFit: getComputedStyle(img).objectFit,
  85  |             objectPosition: getComputedStyle(img).objectPosition,
  86  |           },
  87  |         };
  88  |       });
  89  | 
  90  |       // Save diagnostics
  91  |       const outputFile = path.join(OUTPUT_DIR, `diagnostics-zoom-${zoom}.json`);
  92  |       fs.writeFileSync(outputFile, JSON.stringify(diagnostics, null, 2));
  93  | 
  94  |       // Log to console for visibility
  95  |       console.log(`\n=== DIAGNOSTICS ZOOM ${zoom}x ===`);
  96  |       console.log(JSON.stringify(diagnostics, null, 2));
  97  | 
  98  |       // Basic assertions
  99  |       expect(diagnostics.zoom).toBeCloseTo(zoom, 2);
  100 |       expect(diagnostics.overlayRect.width).toBeGreaterThan(0);
  101 |       expect(diagnostics.overlayRect.height).toBeGreaterThan(0);
  102 |       expect(diagnostics.portalComputedStyle.position).toBe('fixed');
  103 | 
  104 |       // Check if overlay covers full viewport (accounting for zoom)
  105 |       const expectedWidth = diagnostics.windowInnerWidth;
  106 |       const expectedHeight = diagnostics.windowInnerHeight;
  107 |       // Allow small tolerance
> 108 |       expect(Math.abs(diagnostics.overlayRect.width - expectedWidth)).toBeLessThan(2);
      |                                                                       ^ Error: expect(received).toBeLessThan(expected)
  109 |       expect(Math.abs(diagnostics.overlayRect.height - expectedHeight)).toBeLessThan(2);
  110 | 
  111 |       // Check image is contained (object-fit: contain)
  112 |       expect(diagnostics.imgComputedStyle.objectFit).toBe('contain');
  113 |     });
  114 |   }
  115 | });
```