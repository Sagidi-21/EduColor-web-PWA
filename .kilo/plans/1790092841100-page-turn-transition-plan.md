# Plan — Page-Turn (book-leaf) navigation transition

## Goal
Replace/extend the navigation transition so it behaves like **turning a physical book page**
(3D hinge on a side edge, dynamic shadow, reveal of the destination page behind the turning page),
forward (`A → B`) and backward (`B → A`), as a new selectable theme in Settings. Must also fix the
known "next screen flashes before the animation finishes" bug.

## Stack reality (verified)
- React 18 + TypeScript + Vite 7.
- Transitions live in `src/core/transition/ViewTransition.tsx` + `ViewTransition.css`.
- `navigate(view, direction?)` — `direction` is `"right"` (forward/next, default) or `"left"`
  (backward). App wires `onBack` → `navigate("home","left")`; forward calls omit direction → `"right"`.
- `ConfiguracionScreen` renders `THEMES` (from `ViewTransition.tsx`) and calls `setTheme(value)`,
  persisted to `localStorage["vt_theme"]`, default `"cube"`. Adding a theme value here auto-appears
  in the Settings selector (no new UI code needed).
- Tests run in `happy-dom` (`vite.config.ts`), fake timers supported (see `PortalTransition.test.tsx`).
  CSS-driven `animationend` is **not** auto-fired by happy-dom → tests dispatch it manually.

## 1 — How navigation currently works (analysis)
`ViewTransition` keeps `current` (the view key to render) and, during a transition, `exiting` (the
previous view key) + `exitDirection`. Render tree (current code):

```tsx
<div className="vt-wrapper">
  <div className="vt-panel vt-panel--active">{views[current]?.(api)}</div>        // NEW view, visible NOW
  {hasTransition && <div className="vt-panel vt-panel--exiting …">{views[exiting]?.(api)}</div>}
  {hasTransition && <div className="vt-panel vt-panel--entering …">{views[current]?.(api)}</div>} // NEW view AGAIN
</div>
```

## 2 — Root cause of the "premature show" bug
`views[current]` (the **new** screen) is mounted and placed on a `vt-panel--active` layer that is
`visibility: visible; z-index: 1` **immediately**, with no animation gating it. The "entering" layer
animates it again, redundantly. For slide themes the exiting page slides away first, which exposes
the already-visible new (active) layer before the entering animation even starts → flash.

## 3 — Fix architecture (evolves `ViewTransition`, no parallel system)
Single page-turn model with two layers only during transition:

```
<vt-wrapper>                            /* perspective + transform-style: preserve-3d */
  <vt-page vt-page--back>               /* destination (B): z-index:1, ALWAYS behind */
    {views[current]}
  </vt-page>
  <vt-page vt-page--front vt-page--turn-{dir}>   /* current (A): z-index:2, rotating page */
    <vt-page__content>{views[exiting ?? current]}</vt-page__content>
    <vt-page__shadow/>                  /* dynamic shadow overlay (travels with the front face) */
  </vt-page>
</vt-wrapper>
```

Stacking order is **explicit via `z-index`** (`vt-page--back` = 1, `vt-page--front` = 2);
`translateZ` is used only as a 3D aid to place the back strictly behind the rotating front inside the
`preserve-3d` scene, never relied on alone — so compositor/browser differences cannot flip the order.

Front-page internal layering (addresses the `backface-visibility` concern):
- The rotating plane `.vt-page--front` carries `backface-visibility: hidden` and turns only within
  `[0, ±90deg]` (the easing never overshoots past 90, so the front face never back-faces away mid-turn).
- Screen content lives in `.vt-page__content` and the shadow in `.vt-page__shadow`; both are
  children on the front face, so they recede geometrically as the page turns (natural page-turn)
  and never "disappear" abruptly near 90deg. The shadow additionally fades via its own
  opacity keyframe (0→1→0, peak at ~50%) so it is already dim near 90deg — no vanishing/ghost flash.

- **Idle** (`exiting===null`): front = `views[current]`, no back layer, no turn class. Single mount
  (no double render, like today).
- **Transition** (`exiting=A`, `current=B`): front = page `A` (turns away), back = page `B` (occluded
  by the opaque front until the turn reveals it). B is never independently visible → **bug fixed**.
- **End** (`onAnimationEnd` of the front turn → `setExiting(null)`): front becomes `views[current]`
  (B); back unmounts. B's element is reused (stable `key`) → no remount flash.

Direction semantics (asymmetric, NOT a mirrored `scaleX`):
- Forward (`"right"`): hinge = **left** edge → `transform-origin: 0% 50%`, `rotateY(0 → -90deg)`.
- Backward (`"left"`): hinge = **right** edge → `transform-origin: 100% 50%`, `rotateY(0 → +90deg)`.

This guarantees the curling edge and the revealed side move opposite directions on the way back.

## 4 — Files to modify
1. `src/core/transition/ViewTransition.tsx` — add `"pageTurn"` to `TransitionTheme`; add it to
   `THEMES` (label `"Volteo página"`, icon optional); change `defaultTheme = "pageTurn"`; rewrite
   render to front/back model; keep `navigate` guard that ignores input while `exiting!==null`
   (rapid taps dropped, not queued — current behavior, documented); ensure correct React `key`s.
2. `src/core/transition/ViewTransition.css` —
   - `vt-wrapper`: add `transform-style: preserve-3d` (keep `perspective: 1500px`).
   - New `.vt-page` base (absolute, inset 0, `backface-visibility:hidden`,
     `transform-style:preserve-3d`).
   - `.vt-page--back` = `z-index:1`; `.vt-page--front` = `z-index:2` (explicit stacking; never rely on
     `translateZ` alone for ordering). Back may also use `translateZ(-2px)` as a 3D aid.
   - `.vt-page--front` internal layers: `.vt-page__content` (screen A) + `.vt-page__shadow`
     (absolute overlay), so content/shadow recede geometrically and the shadow fades separately —
     prevents `backface-visibility` vanishing/ghosting near 90deg.
   - 3D page-turn keyframes `vt-pageTurn-right` (rotateY -90, left hinge) and `vt-pageTurn-left`
     (rotateY +90, right hinge). Duration **600ms**, easing `cubic-bezier(0.55, 0.08, 0.25, 0.99)`
     (natural paper feel). Only `transform`/`opacity` animated → GPU-friendly; no width/height/top/left.
   - `.vt-page__shadow`: absolute overlay, radial gradient, `pointer-events:none`, opacity via a
     parallel keyframe `vt-pageShadow` `0→1→0` over the same 600ms (appears, peaks mid-turn, fades;
     travels with the front page so it naturally inverts per direction).
   - Keep existing `@media (prefers-reduced-motion: reduce)` → `animation-duration:0.01ms`.
   - Keep all other existing themes intact (cube/carousel/fall/newspaper) — purely additive.

   No hardcoded `width`/`height`/px offsets; pages use `inset:0`/100%. Works under the app's
   `zoom` 1/1.25/1.5 (scales uniformly); `perspective` is px but that is intentional and stable.
3. `src/core/transition/index.ts` — no change needed (themes auto-exported via `THEMES`/type).
   *Unless* a typed constant `PAGE_TURN_THEME = "pageTurn"` is wanted for tests — optional.

No new dependencies. No changes to screen components (they stay unaware of the animation).

## 5 — Accessibility & responsiveness
- `prefers-reduced-motion: reduce` → instant duration (CSS); the front/back occlusion means no flash.
- Responsive: sizes derive from the viewport container; zoom levels 1/1.25/1.5 unaffected
  (verified `App.tsx` sets `document.body.style.zoom` + `--zoom`).
- `overflow:hidden` on wrapper prevents page-edge showing during rotation.

## 6 — Data flow / edge cases (validated)
- `A→B`, `B→A`, `A→B→C`, `…→C→B→A`: handled — transition resets `exiting=null` on end before next
  navigate resolves; direction taken from the `navigate` call.
- Rapid taps: ignored while `exiting!==null` (current guard kept). Document as non-queueing.
- `navigate` to the same view: already guarded (`nextView===current`); retained.
- No `setTimeout` used anywhere to mask timing; completion relies solely on the real
  `onAnimationEnd` of the front page turn (mirrors today's pattern, now on the correct element).

## 7 — Tests (`src/core/transition/ViewTransition.test.tsx`, new file)
Patterns from `PortalTransition.test.tsx` (vitest, happy-dom, fake timers). Use markers in views
so we can assert which screen renders where.
- **Forward start**: `navigate("b","right")` → front panel content = A, back panel content = B,
  front has `vt-page--turn-right` class, back has `vt-page--back`, exactly one front page.
- **Backward start**: `navigate("a","left")` (from B) → front has `vt-page--turn-left`, correct hinge.
- **No premature show**: during transition the destination B appears ONLY inside the back layer
  (`.vt-page--back`), never as a standalone active/visible layer; front A still occludes.
- **Transition end** (dispatch `animationend` on the front panel) → `exiting` clears; back layer
  removed; only current (B) rendered; no leftover exiting classes.
- **Rapid navigation**: calling `navigate` twice while `exiting!==null` is a no-op (second ignored);
  final state consistent.
- **Reduced motion** (optional, may be environment-limited): mock `window.matchMedia`
  `(prefers-reduce-motion: reduce)` and assert transition is not blocked — keep lightweight; if
  happy-dom makes it flaky, mark as best-effort and verify visually.

## 8 — Validation commands
```
npx tsc -b
npx eslint src/core/transition src/features/configuracion
npx vitest run src/core/transition
```

### 8.1 — Manual visual verification (run dev, slow DevTools animation)
With DevTools → Rendering "Emulate CSS media" off and animation playback slowed (~20–30%), step
through one forward turn and assert the visual contract:
- **0%**: page A fully covers B (B not visible).
- **~25%**: A begins to curl away from its hinge; B remains correctly behind (no peek ahead of curl).
- **~50%**: A ≈ perpendicular (edge-on at the hinge line); B starts to become visible behind.
- **~75%**: B dominates visually; A finishing its exit.
- **100%**: only B remains, mounted as the current screen (no leftover A, no double layers).

Repeat once in each direction (forward/backward); the hinge and curl edge must flip sides and the
shadow must move to the curling edge automatically (it travels with the front page).

### 8.2 — Manual matrix
- `npm run dev` → Settings shows "Volteo página" (new theme selectable + default for fresh install).
- Verify in each cell:
  - zoom 1 / 1.25 / 1.5 (levels from Settings "Tamaño de interfaz");
  - navegación hacia delante (→) and hacia atrás (←);
  - navegación rápida: tap several back/forward in <1s → no stuck/overlapping layers, final view correct;
  - toggle `prefers-reduced-motion: reduce` (DevTools → Rendering) → instant switch, no flash;
  - existing themes (Cubo/Carrusel/Caída/Newspaper) still animate after the refactor (regression check).

## 9 — Rollout / migration
- Non-breaking: existing `vt_theme` localStorage values (cube/flip/carousel/fall/newspaper) still
  valid (unchanged enum members + new one). New installs default to `pageTurn`.
- To make page-turn the enforced default only when not previously chosen, set
  `defaultTheme="pageTurn"` in `ViewTransition` (done).

## 10 — Open decisions (locked)
- D1 (locked): page-turn is a **new theme** (`pageTurn`), additive, becomes default.
- D2 (locked): asymmetric hinges (left/right) + opposite rotation signs per direction.
- D3 (locked): shadow is an opacity-driven overlay on the front page (GPU-friendly), not `box-shadow`.
- D4 (locked): navigation during transition is dropped (current behavior); no queueing/interrupt.
- D5 (locked): no external animation library.
- D6 (locked): stacking driven by explicit `z-index` (front > back); `translateZ` only a 3D aid.
- D7 (locked): front page content + shadow live in internal child layers so `backface-visibility`
  never causes mid-turn content disappearance; turn range clamped to ±90deg with no overshoot.
