# Plan: Añadir efecto glow a las tarjetas de selección de mundo

## Objetivo

Que las tarjetas de la pantalla de selección de mundo (`MascotaScreen`, paso 1 — "El mundo de nuestra clase") tengan **el mismo efecto glow al pasar el ratón** que las tarjetas de la pantalla de selección de ejercicio de matemáticas (`MatematicasCatalogScreen`), usando la clase `.edu-glow`.

**Restricción clave del usuario**: el glow debe afectar **solo al borde** de la tarjeta. Al pulsar (estado `:active`), **los colores NO deben entrar en la imagen** — a diferencia de las tarjetas de matemáticas, donde el `:active` hace transparente la capa de cubrimiento y revela el gradiente dentro.

---

## Análisis actual

### Matemáticas — cómo funciona el glow (`MatematicasCatalogScreen.css:502-561`)

La clase `.edu-glow` usa dos pseudo-elementos:

| Pseudo-elemento | Función |
|---|---|
| `::before` | Gradiente arcoíris borroso (`blur(8px)`) que es 4 px más grande que la tarjeta y gira lentamente. Inicia oculto (`opacity: 0`, `animation-play-state: paused`). |
| `::after` | Capa opaca `var(--color-surface)` (`#fff`) que cubre todo el interior de la tarjeta, ocultando el gradiente por dentro. |

- **Hover** (`::before`): se muestra el glow alrededor del borde (el `::after` cubre el interior).
- **Click/Active** (`::after`): se vuelve `transparent`, revelando el gradiente **dentro** de la tarjeta.
- **Soon/disabled** (`.edu-glow--soon`): ambos pseudo-elementos se ocultan (`display: none`).

### Mundo — estructura actual (`MascotaScreen.tsx:297-309`, `MascotaScreen.css:135-181`)

```jsx
<button className={`theme-option ${isSelected ? "active" : ""}`}>
  <span className="theme-card">
    <img className="theme-card-image" src={tema.image} alt="" />
  </span>
  <span className="theme-label">{tema.label}</span>
</button>
```

CSS relevante:
- `.theme-card` (L147): `border: 2px solid #e2e8f0; border-radius: 16px; background: #fff; box-shadow: 0 8px 24px ...`
- `.theme-option:hover .theme-card` (L170): cambia `border-color` a primary, eleva `box-shadow`, hace `transform: translateY(-3px)`.
- `.theme-option.active .theme-card` (L176): glow púrpura persistente para la tarjeta seleccionada.

Variables CSS: `var(--color-surface)` está definida globalmente en `src/styles.css:7` como `#fff` — coincide con el fondo de `.theme-card`.

---

## Decisiones de diseño

1. **Aplicar `edu-glow` sobre `.theme-card`** (el contenedor visual de la tarjeta), no sobre `.theme-option` (el `<button>` wrapper). Esto hace que el glow rodee exactamente el mismo contenedor visual que en matemáticas.

2. **Reutilizar la clase `.edu-glow` existente** copiando las reglas CSS de `MatematicasCatalogScreen.css` a `MascotaScreen.css`. No hacer `@import` del CSS de matemáticas (561 líneas, con clases específicas como `.activity-card`, `.level-card` que no queremos arrastrar).

3. **Mantener los estilos hover existentes** (`.theme-option:hover .theme-card` — border-color, box-shadow, transform) como efectos complementarios. El glow del `::before` y el border-color cambian trabajan juntos sin conflicto.

4. **Anular el comportamiento `:active`** — La regla `.edu-glow:active:not(:disabled)::after { background: transparent }` de matemáticas NO debe aplicarse a las tarjetas de mundo. Se añadirá una regla de override más específica para mantener el `::after` opaco al pulsar.

5. **El estado `.active` (tarjeta seleccionada)** se mantiene igual (glow púrpura persistente). El glow rainbow del `::before` solo aparece al pasar el ratón, no de forma permanente.

---

## Tareas

### Tarea 1: Añadir clase `edu-glow` al JSX (`MascotaScreen.tsx`)

**Archivo**: `src/features/mascota/MascotaScreen.tsx` (L305)

```diff
-                   <span className="theme-card">
+                   <span className="theme-card edu-glow">
```

### Tarea 2: Añadir las reglas CSS `edu-glow` a `MascotaScreen.css`

**Archivo**: `src/features/mascota/MascotaScreen.css`

Añadir al final del archivo (o después de las reglas de `.theme-option.active`):

```css
/* -- Glow de radio arcoíris (igual que en MatematicasCatalogScreen) -- */
.edu-glow {
  position: relative;
  z-index: 0;
}

.edu-glow::before {
  content: "";
  position: absolute;
  top: -4px;
  left: -4px;
  width: calc(100% + 8px);
  height: calc(100% + 8px);
  background: linear-gradient(120deg, #2563eb, #22c55e, #f59e0b, #ef4444, #2563eb);
  background-size: 400%;
  z-index: -1;
  filter: blur(8px);
  border-radius: inherit;
  animation: edu-glowing 16s linear infinite;
  animation-play-state: paused;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
}

.edu-glow::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background: var(--color-surface);
  border-radius: inherit;
  transition: background 0.2s ease;
}

.edu-glow:hover:not(:disabled)::before {
  opacity: 1;
  animation-play-state: running;
}

/* <-- IMPORTANTE: NO anular el ::after al pulsar (colores no entran en la imagen) --> */
.theme-card.edu-glow:active::after {
  background: var(--color-surface);
}

.edu-glow--soon::before,
.edu-glow--soon::after {
  display: none;
}

@keyframes edu-glowing {
  0% { background-position: 0% 0%; }
  100% { background-position: 400% 0%; }
}
```

**Especificidad del override**: `.theme-card.edu-glow:active::after` (2 clases + 1 pseudo-clase + 1 pseudo-elemento) tiene mayor especificidad que `.edu-glow:active:not(:disabled)::after` (1 clase + 1 pseudo-clase + 1 pseudo-elemento + 1 `:not()`), por lo que gana sin necesidad de `!important`.

### Tarea 3: Verificación visual y de linting

1. **Lint/tipado**: `npm run lint` y `npm run typecheck` (si existen en `package.json`).
2. **Verificación visual manual**:
   - Pasa el ratón por una tarjeta de mundo → debe aparecer el glow arcoíris alrededor del borde.
   - Haz clic en una tarjeta → el glow debe desaparecer (vuelve al estado normal) y **los colores no deben entrar en la imagen**.
   - La tarjeta seleccionada (`.active`) mantiene su glow púrpura persistente.
3. **Comparar** con las tarjetas de matemáticas (`MatematicasCatalogScreen`) para confirmar que el glow es idéntico en apariencia.

---

## Riesgos y consideraciones

- **Doble definición de `@keyframes edu-glowing`**: Si `MatematicasCatalogScreen.css` y `MascotaScreen.css` ambos se cargan en la misma página, la regla `@keyframes` duplicada no causa problemas (CSS ignora duplicados, usa la primera). Pero para evitar ambigüedad, se podría renombrar a `edu-glowing--theme`. Esto se marca como **aceptable** para no romper el efecto en matemáticas.
- **Efecto en dispositivos móviles**: El glow usa `filter: blur(8px)` y `animation`, que pueden tener un coste de renderizado. En móviles, el `:hover` puede no dispararse (touch). No se considera un problema crítico para este cambio.
- **Accesibilidad**: El glow es puramente decorativo y no afecta el contraste del texto. No se requieren cambios de accesibilidad.

---

## Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/features/mascota/MascotaScreen.tsx` | + `edu-glow` en `<span className="theme-card">` |
| `src/features/mascota/MascotaScreen.css` | + Reglas `.edu-glow` y override `:active` |
