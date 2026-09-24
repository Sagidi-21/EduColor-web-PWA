# Plan: Popup estilo pizarra para filtros del catálogo (Materia / Curso / Bloque)

## Contexto
- Proyecto: EduColor-web-PWA (React + TypeScript + Vite)
- Archivo principal afectado: `src/features/matematicas/CatalogFilterBar.tsx`
- Estilo de referencia: popup de selección de niveles en `MatematicasCatalogScreen.tsx` (`.mat__popup-backdrop` + `.mat__popup`)
- El usuario tiene una imagen PNG horizontal de pizarra (`pizarra.png`) que ya está dibujada completa (marco + superficie)
- Requisitos:
  1. Reemplazar los 3 dropdowns absolutos (`.filter-dropdown`) por **un único popup modal centrado**
  2. Tamaño igual al popup de niveles: `max-width: 780px`, `max-height: 90vh`, `padding: 32px`, `border-radius: 24px`
  3. Fondo = imagen de pizarra del usuario (cubre todo el popup)
  4. Opciones escritas **directamente sobre la pizarra con efecto tiza** (sin tarjetas blancas de fondo)
  5. Modal con backdrop oscuro (click en backdrop NO cierra, solo cierra al seleccionar opción o botón cerrar)

## Cambios necesarios

### 1. Asset de la pizarra
- Guardar la imagen del usuario en: `src/assets/pizarra.png`
- Importar en `CatalogFilterBar.tsx`:
  ```tsx
  import pizarraImg from "../assets/pizarra.png";
  ```

### 2. Fuente manuscrita para efecto tiza
- En `src/styles.css` añadir import de Google Font:
  ```css
  @import url("https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700&display=swap");
  ```
- Definir variable CSS:
  ```css
  --font-chalk: "Caveat", cursive;
  ```
- Usar en `.chalk-text` (ver CSS sección 4)

### 3. Refactor JSX en `CatalogFilterBar.tsx`
- Eliminar los 3 bloques `{openColumn === "..." && <div className="filter-dropdown">...}` (líneas 98-134, 175-212, 249-307)
- Añadir **un único modal condicional** después de las 3 columnas:
  ```tsx
  {openColumn && (
    <div className="filter-modal-backdrop" aria-hidden="true">
      <div
        className="filter-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-modal-title"
        style={{ backgroundImage: `url(${pizarraImg})` }}
      >
        <button
          className="filter-modal-close"
          onClick={closeAll}
          aria-label="Cerrar"
        >×</button>
        <h2 id="filter-modal-title" className="filter-modal-title">
          {openColumn === "materia" && "SELECCIONA LA MATERIA"}
          {openColumn === "curso" && "SELECCIONA EL CURSO"}
          {openColumn === "bloque" && "SELECCIONA EL BLOQUE"}
        </h2>
        <div className="filter-modal-options" ref={optionsRef}>
          {/* Renderizado dinámico según openColumn - ver sección 4 */}
        </div>
        <button className="filter-modal-footer" onClick={closeAll}>Cerrar</button>
      </div>
    </div>
  )}
  ```
- **Eliminar el `useEffect` de `mousedown` en `document`** (líneas 41-51) — el modal tiene cierre explícito (botones ×, Cerrar, y click en opción). No hace falta listener global.
- Añadir `useRef` para `optionsRef` y `useEffect` para **foco inicial** y **tecla Escape**:
  ```tsx
  const optionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openColumn) {
      // Foco en la primera opción al abrir
      const firstOption = optionsRef.current?.querySelector<HTMLButtonElement>('.chalk-option');
      firstOption?.focus();

      // Escape para cerrar
      function onKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape') closeAll();
      }
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }
  }, [openColumn, closeAll]);
  ```

### 4. Renderizado de opciones dentro del modal
JSX condicional dentro de `filter-modal-options` según `openColumn`:

```tsx
{openColumn === "materia" && subjects.map(subject => (
  <button
    key={subject.id}
    className={`chalk-option ${subject.id === subjectId ? "chalk-option--active" : ""}`}
    onClick={() => { onSubjectChange(subject.id); closeAll(); }}
  >
    <span className="chalk-text">{subject.title}</span>
    {subject.id === subjectId && <span className="chalk-check">✓</span>}
  </button>
))}

{openColumn === "curso" && grades.map(grade => (
  <button
    key={grade.id}
    className={`chalk-option ${grade.id === gradeId ? "chalk-option--active" : ""}`}
    onClick={() => { onGradeChange(grade.id); closeAll(); }}
  >
    <span className="chalk-text">{grade.title}</span>
    {grade.id === gradeId && <span className="chalk-check">✓</span>}
  </button>
))}

{openColumn === "bloque" && (
  <>
    <button
      className={`chalk-option ${blockId === "" ? "chalk-option--active" : ""}`}
      onClick={() => { onBlockChange(""); closeAll(); }}
    >
      <span className="chalk-text">Todas las unidades</span>
      {blockId === "" && <span className="chalk-check">✓</span>}
    </button>
    {blocks.map(block => (
      <button
        key={block.id}
        className={`chalk-option ${block.id === blockId ? "chalk-option--active" : ""}`}
        onClick={() => { onBlockChange(block.id); closeAll(); }}
      >
        <span className="chalk-text">{block.description} - {block.title}</span>
        {block.id === blockId && <span className="chalk-check">✓</span>}
      </button>
    ))}
  </>
)}
```

### 5. CSS nuevo en `CatalogFilterBar.css` (añadir al final)

```css
/* ===== POPUP ESTILO PIZARRA ===== */

.filter-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 24px;
  backdrop-filter: blur(2px);
  /* NO onClick — el backdrop no cierra el modal */
}

.filter-modal {
  /* Fondo: imagen de pizarra via style prop */
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 24px;
  padding: 32px;
  width: 100%;
  max-width: 780px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.25);
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
  color: #f5f0e1;
  font-family: var(--font-fredoka);
  /* Sin overlay oscuro: se prueba con la imagen real y se ajusta text-shadow si hace falta */
}

.filter-modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.4);
  background: rgba(0,0,0,0.2);
  color: #f5f0e1;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  backdrop-filter: blur(2px);
}
.filter-modal-close:hover {
  background: rgba(255,255,255,0.15);
  color: #fff;
  transform: rotate(90deg);
}

.filter-modal-title {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 800;
  text-align: center;
  text-shadow:
    0 1px 2px rgba(0,0,0,0.6),
    0 0 8px rgba(0,0,0,0.4);
  letter-spacing: 0.02em;
}

.filter-modal-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
}

/* Opción estilo tiza - SIN tarjeta blanca */
.chalk-option {
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 14px 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  font-family: var(--font-fredoka);
  font-size: 17px;
  font-weight: 600;
  color: #f5f0e1;
  width: 100%;
  text-align: left;
  transition: all 0.15s ease;
  position: relative;
}
.chalk-option:hover {
  background: rgba(255,255,255,0.06);
  color: #fffef7;
  transform: translateX(4px);
}
.chalk-option:active {
  transform: translateX(2px) scale(0.99);
}
.chalk-option--active {
  color: #fff9c4;
  background: rgba(255, 237, 111, 0.12);
}
.chalk-option--active .chalk-text {
  font-weight: 800;
  text-shadow:
    0 1px 2px rgba(0,0,0,0.6),
    0 0 10px rgba(255, 237, 111, 0.5);
}

/* Texto con fuente manuscrita + sombra tiza */
.chalk-text {
  flex: 1;
  display: block;
  font-family: var(--font-chalk);
  font-size: 1.15em;
  font-weight: 600;
  /* Sombra estilo tiza: suave, con "polvo" */
  text-shadow:
    0 1px 1px rgba(0,0,0,0.5),
    0 0 2px rgba(0,0,0,0.3),
    0 0 6px rgba(0,0,0,0.15);
}

.chalk-check {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #1a1a1a;
  font-size: 16px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow:
    0 2px 4px rgba(0,0,0,0.4),
    inset 0 1px 1px rgba(255,255,255,0.2);
  animation: popCheck 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes popCheck {
  0% { transform: scale(0); }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

.filter-modal-footer {
  margin-top: 8px;
  padding: 12px 20px;
  text-align: center;
  background: rgba(0,0,0,0.25);
  color: rgba(255,255,255,0.8);
  border: none;
  border-radius: 14px;
  font-family: var(--font-fredoka);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: all 0.15s;
}
.filter-modal-footer:hover {
  background: rgba(255,255,255,0.1);
  color: #fff;
}

/* Animación de entrada (igual que popup de niveles) */
@keyframes popModal {
  0% { opacity: 0; transform: scale(0.92) translateY(12px); }
  60% { transform: scale(1.02) translateY(0); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
.filter-modal {
  animation: popModal 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

/* Scrollbar tema pizarra */
.filter-modal::-webkit-scrollbar { width: 10px; }
.filter-modal::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 6px; }
.filter-modal::-webkit-scrollbar-thumb {
  background: rgba(245, 158, 11, 0.5);
  border-radius: 6px;
  border: 2px solid transparent;
  background-clip: padding-box;
}
.filter-modal::-webkit-scrollbar-thumb:hover { background: rgba(245, 158, 11, 0.8); background-clip: padding-box; }
.filter-modal-options::-webkit-scrollbar { width: 8px; }
.filter-modal-options::-webkit-scrollbar-track { background: transparent; }
.filter-modal-options::-webkit-scrollbar-thumb { background: rgba(245, 158, 11, 0.4); border-radius: 4px; }

/* Respeta prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .chalk-option, .filter-modal-close, .filter-modal-footer, .chalk-check, .filter-modal {
    animation: none !important;
    transition: none !important;
  }
}

/* Responsive móvil */
@media (max-width: 600px) {
  .filter-modal {
    max-width: 100%;
    padding: 20px 16px;
    border-radius: 16px;
  }
  .chalk-option { padding: 12px 16px; font-size: 16px; }
  .chalk-text { font-size: 1.05em; }
}
```

### 6. Limpieza CSS (opcional, tras validar)
Eliminar reglas ya no usadas: `.filter-dropdown`, `.dropdown-header`, `.dropdown-list`, `.dropdown-item`, `.dropdown-footer`, `.active-badge`, `.active-stars`, `.active-check`, `.enter-btn`, variables `--dropdown-border-color` y estilos de tema específicos del dropdown.

## Validación
1. Verificar que `pizarra.png` está en `src/assets/` y se importa correctamente
2. Abrir catálogo → click en cada trigger (Materia/Curso/Bloque) → abre popup centrado con pizarra de fondo
3. Opciones se ven escritas en tiza sobre la pizarra, legibles (ajustar `text-shadow` si la imagen lo requiere)
4. Click en opción → selecciona y cierra popup
5. Click en × o "Cerrar" → cierra popup
6. Click en backdrop → **NO cierra** popup
7. **Teclado**: Tab navega opciones, Enter/Espacio selecciona, **Escape cierra** (implementado)
8. **Foco inicial**: al abrir, la primera opción recibe foco (implementado via `optionsRef`)
9. **Accesibilidad**: `aria-modal="true"`, `aria-labelledby`, `role="dialog"` en el modal
10. Responsive: en móvil `< 600px` el popup se adapta (media query incluida)

## Riesgos / Decisiones pendientes
- **Legibilidad texto sobre pizarra**: depende de la imagen del usuario. La solución base usa `text-shadow` multicapa y fuente Caveat. Si la imagen tiene zonas muy claras/oscuras, ajustar sombras o añadir `::before` semitransparente *solo si hace falta tras probar*.
- **Click en backdrop no cierra**: confirmado por requisito "no hay interacción con el fondo". Si se cambiara de opinión, añadir `onClick={closeAll}` al backdrop.
- **Animación de entrada**: incluida (`popModal` keyframe) igual que popup de niveles.

## Archivos a modificar
1. `src/assets/pizarra.png` (nuevo - lo pone el usuario)
2. `src/styles.css` (añadir import Google Font Caveat + variable `--font-chalk`)
3. `src/features/matematicas/CatalogFilterBar.tsx` (refactor JSX + import + refs + useEffect foco/Escape)
4. `src/features/matematicas/CatalogFilterBar.css` (añadir estilos modal pizarra)

## Orden de ejecución sugerido
1. Usuario coloca `pizarra.png` en `src/assets/`
2. Añadir fuente Caveat en `src/styles.css`
3. Implementar JSX del modal en `CatalogFilterBar.tsx` (con refs y useEffect foco/Escape)
4. Añadir CSS en `CatalogFilterBar.css`
5. Probar y ajustar `text-shadow`/colores según imagen real
5. Limpiar CSS obsoleto