# Plan: Migración de Transiciones a Framer Motion

## Resumen

Este plan describe la migración del sistema actual de transiciones basado en CSS puro a un nuevo sistema basado en Framer Motion. El objetivo es solucionar los problemas de renderizado actuales (pantalla destino aparece detrás de la animación) y permitir transiciones 3D fluidas.

**Enfoque gradual:** Primero limpiamos el código actual eliminando las transiciones problemáticas, manteniendo el selector de configuración para uso futuro. Luego instalamos Framer Motion e implementamos las nuevas transiciones.

---

## Estado Actual

### Arquitectura de Transiciones Actual

- **ViewTransition.tsx**: Componente principal que maneja la navegación entre vistas
- **vtThemes.ts**: Define los temas disponibles (cube, flip, carousel, fall, newspaper, pageTurn)
- **ConfiguracionScreen.tsx**: Selector de temas usando `useTransitionTheme()`
- **Almacenamiento**: Tema guardado en `localStorage` con clave `vt_theme`

### Problemas Identificados

1. **Renderizado incorrecto**: La pantalla destino se renderiza detrás de la animación durante las transiciones
2. **CSS complejo**: La implementación actual usa múltiples capas de CSS (front page, back page, sombras) que son difíciles de mantener
3. **Falta de 3D real**: Las transiciones 3D actuales son simulaciones CSS limitadas

---

## Plan de Implementación

### Fase 1: Limpieza del Código Actual

#### 1.1 Simplificar ViewTransition.tsx

**Objetivo:** Eliminar toda la lógica de transiciones CSS complejas y dejar solo navegación básica sin animaciones.

**Cambios a realizar:**

1. Eliminar toda la lógica de `pageTurn` (front page, back page, sombras)
2. Eliminar la renderización condicional basada en `isPageTurn`
3. Simplificar a renderizado directo de la vista actual sin animaciones
4. Mantener el contexto `ViewTransitionContext` y `TransitionThemeContext` para compatibilidad
5. Mantener la función `navigate` y la API expuesta

**Código resultante esperado:**

```tsx
// ViewTransition.tsx simplificado
export function ViewTransition({ views, initialView }: ViewTransitionProps) {
  const [current, setCurrent] = useState(initialView);

  const navigate = (nextView: string) => {
    if (views[nextView]) {
      setCurrent(nextView);
    }
  };

  const api: ViewTransitionApi = { navigate };

  // Mantener contexto para compatibilidad
  return (
    <ViewTransitionContext.Provider value={api}>
      <div className="vt-wrapper">{views[current]?.(api)}</div>
    </ViewTransitionContext.Provider>
  );
}
```

**Archivos modificados:**

- `src/core/transition/ViewTransition.tsx`

#### 1.2 Actualizar ConfiguracionScreen.tsx

**Objetivo:** Mantener el selector de temas visible pero indicar que las transiciones están temporalmente deshabilitadas.

**Cambios a realizar:**

1. Mantener el selector de temas actual
2. Añadir indicador visual de "Próximamente" o "Deshabilitado temporalmente"
3. Opcionalmente deshabilitar la interactividad del selector
4. Añadir texto explicativo sobre la migración en curso

**Código esperado:**

```tsx
// En ConfiguracionScreen.tsx, sección de tema de transición
<section className="cfg__section">
  <h2 className="cfg__section-title">Tema de transición</h2>
  <p className="cfg__section-desc">
    Elige el efecto de animación al navegar entre pantallas.
    <strong> Nota:</strong> Las transiciones están temporalmente deshabilitadas mientras
    actualizamos el sistema de animaciones.
  </p>
  <div className="cfg__transition-grid" style={{ opacity: 0.6, pointerEvents: "none" }}>
    {THEMES.map((t) => (
      <button
        key={t.value}
        className={`cfg__transition-card ${theme === t.value ? "cfg__transition-card--active" : ""}`}
        disabled
      >
        <span className="cfg__transition-name">{t.label}</span>
        {theme === t.value && <span className="cfg__transition-badge">Próximamente</span>}
      </button>
    ))}
  </div>
</section>
```

**Archivos modificados:**

- `src/features/configuracion/ConfiguracionScreen.tsx`

#### 1.3 Verificar CSS necesario

**Objetivo:** Limpiar CSS de transiciones que ya no se usan.

**Archivos a revisar:**

- `src/core/transition/ViewTransition.css` - Revisar si se pueden eliminar estilos
- `src/features/configuracion/ConfiguracionScreen.css` - Añadir estilos para estado deshabilitado

### Fase 2: Instalación de Framer Motion

#### 2.1 Instalar dependencia

```bash
npm install framer-motion
```

**Verificación:**

- Verificar que `framer-motion` aparece en `package.json` dependencies
- Verificar que la instalación no rompe el build actual

### Fase 3: Implementación de Transiciones con Framer Motion

#### 3.1 Crear nuevo ViewTransition con Framer Motion

**Objetivo:** Reimplementar ViewTransition.tsx usando Framer Motion con soporte para transición de cubo 3D.

**Características a implementar:**

1. **AnimatePresence** con modo `wait` para evitar superposición de vistas
2. **Transición de cubo 3D** usando `rotateY` y `perspective`
3. **Detección de dirección** (izquierda/derecha) para la rotación del cubo
4. **Soporte para todos los temas** definidos en `vtThemes.ts`

**Estructura del componente:**

```tsx
// Nuevo ViewTransition.tsx con Framer Motion
import { AnimatePresence, motion } from 'framer-motion';

export function ViewTransition({ views, initialView, defaultTheme }: ViewTransitionProps) {
  const [current, setCurrent] = useState(initialView);
  const [direction, setDirection] = useState<TransitionDirection>('right');
  const { theme } = useTransitionTheme();

  const navigate = (nextView: string, dir: TransitionDirection = 'right') => {
    setDirection(dir);
    setCurrent(nextView);
  };

  // Variantes de animación según el tema
  const variants = {
    cube: {
      enter: (dir: TransitionDirection) => ({
        rotateY: dir === 'right' ? 90 : -90,
        opacity: 0,
        zIndex: 0,
      }),
      center: {
        rotateY: 0,
        opacity: 1,
        zIndex: 1,
      }),
      exit: (dir: TransitionDirection) => ({
        rotateY: dir === 'right' ? -90 : 90,
        opacity: 0,
        zIndex: 0,
      }),
    },
    // ... otros temas
  };

  return (
    <ViewTransitionContext.Provider value={{ navigate }}>
      <TransitionThemeContext.Provider value={{ theme, setTheme }}>
        <div className="vt-wrapper" style={{ perspective: 1000 }}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              variants={variants[theme] || variants.cube}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {views[current]?.({ navigate })}
            </motion.div>
          </AnimatePresence>
        </div>
      </TransitionThemeContext.Provider>
    </ViewTransitionContext.Provider>
  );
}
```

**Consideraciones técnicas:**

1. **Modo `wait` de AnimatePresence**: Esto asegura que la vista de salida complete su animación antes de que la vista de entrada comience, eliminando el problema de superposición.

2. **Perspective y preserve-3d**: Necesarios para las transformaciones 3D del cubo.

3. **Custom prop en variants**: Permite pasar la dirección (izquierda/derecha) a las variantes de animación.

4. **Z-index en variants**: Controla qué vista está adelante durante la transición.

#### 3.2 Actualizar ConfiguracionScreen.tsx

**Objetivo:** Reactivar el selector de temas una vez las transiciones con Framer Motion funcionen.

**Cambios:**

1. Remover el overlay de "Próximamente"
2. Restaurar la interactividad del selector
3. Opcional: Añadir preview animado de cada tema

#### 3.3 Crear variantes de animación adicionales

Además del cubo, implementar las demás transiciones definidas en `vtThemes.ts`:

1. **flip**: Rotación vertical (rotateX)
2. **carousel**: Desplazamiento horizontal con scale
3. **fall**: Animación de caída con opacidad
4. **newspaper**: Escala desde centro con rotación ligera
5. **pageTurn**: Similar al actual pero con Framer Motion

### Fase 4: Testing y Verificación

#### 4.1 Tests manuales

Verificar que:

- [ ] La navegación entre pantallas funciona sin errores
- [ ] Las transiciones 3D se ven correctamente (perspectiva, rotación)
- [ ] No hay problemas de superposición de vistas
- [ ] El selector de temas funciona y cambia la transición
- [ ] La dirección (izquierda/derecha) afecta correctamente la animación

#### 4.2 Tests automáticos

Si existen tests de ViewTransition, actualizarlos o crear nuevos tests para:

- Renderizado correcto del componente
- Navegación entre vistas
- Cambio de temas
- Presencia de elementos en el DOM

#### 4.3 Verificación de performance

- [ ] Usar React DevTools Profiler para verificar que no hay re-renders innecesarios
- [ ] Verificar que las animaciones corren a 60fps
- [ ] Comprobar que el modo `wait` de AnimatePresence no causa delay percibible

### Fase 5: Documentación

#### 5.1 Actualizar comentarios en código

Añadir JSDoc a:

- `ViewTransition.tsx`: Explicar el uso de Framer Motion y AnimatePresence
- `vtThemes.ts`: Documentar cada tema y sus características visuales

#### 5.2 Actualizar CHANGELOG

Añadir entrada describiendo:

- Migración de transiciones CSS a Framer Motion
- Nuevas transiciones 3D disponibles
- Mejoras en performance y estabilidad

#### 5.3 Documentación de uso

Crear breve guía en docs/ explicando:

- Cómo añadir nuevas transiciones
- Cómo personalizar las existentes
- Mejores prácticas para performance

---

## Archivos Involucrados

### Archivos a Modificar

1. **src/core/transition/ViewTransition.tsx**
   - Simplificar eliminando transiciones CSS complejas
   - Preparar estructura para Framer Motion

2. **src/features/configuracion/ConfiguracionScreen.tsx**
   - Añadir indicador "Próximamente" al selector de temas
   - Deshabilitar temporalmente la interactividad

3. **src/core/transition/ViewTransition.css**
   - Revisar y limpiar estilos que ya no se usan
   - Mantener estilos base necesarios

4. **package.json**
   - Añadir dependencia: `framer-motion`

### Archivos a Crear (Fase 3)

1. **src/core/transition/ViewTransition.new.tsx** (opcional)
   - Nueva implementación con Framer Motion
   - Luego reemplazar la original

---

## Notas Técnicas

### Por qué Framer Motion

1. **AnimatePresence**: Maneja automáticamente el montaje/desmontaje de componentes con animaciones
2. **Modo `wait`**: Asegura que la vista de salida termine antes de mostrar la entrada (soluciona el problema de superposición)
3. **API declarativa**: Fácil de leer y mantener
4. **Performance**: Optimizado para 60fps con hardware acceleration
5. **Soporte 3D**: Transformaciones 3D con `rotateX`, `rotateY`, `perspective`

### Estructura de Variantes (ejemplo cubo)

```typescript
const cubeVariants = {
  enter: (dir: "left" | "right") => ({
    rotateY: dir === "right" ? 90 : -90,
    opacity: 0,
    zIndex: 0,
  }),
  center: {
    rotateY: 0,
    opacity: 1,
    zIndex: 1,
  },
  exit: (dir: "left" | "right") => ({
    rotateY: dir === "right" ? -90 : 90,
    opacity: 0,
    zIndex: 0,
  }),
};
```

### Uso de AnimatePresence

```tsx
<AnimatePresence mode="wait" custom={direction}>
  <motion.div
    key={currentView}
    custom={direction}
    variants={variants}
    initial="enter"
    animate="center"
    exit="exit"
    transition={{ duration: 0.5, ease: "easeInOut" }}
  >
    {views[currentView]}
  </motion.div>
</AnimatePresence>
```

---

## Checklist de Verificación Final

Antes de marcar el plan como completado:

- [ ] ViewTransition.tsx simplificado y sin transiciones CSS problemáticas
- [ ] Selector de temas en configuración muestra indicador "Próximamente"
- [ ] No hay errores de lint ni TypeScript
- [ ] La navegación entre pantallas funciona correctamente (sin transiciones visuales)
- [ ] framer-motion instalado como dependencia
- [ ] Plan documentado y guardado en .trae/documents/

---

## Próximos Pasos (Post-Plan)

Una vez completada la Fase 1 y 2 de este plan:

1. **Implementar transición Cube 3D** con Framer Motion
2. **Reactivar selector de temas** removiendo el indicador "Próximamente"
3. **Implementar temas restantes** (flip, carousel, fall, newspaper, pageTurn)
4. **Añadir preview animado** en el selector de temas
5. **Optimizaciones de performance** si es necesario

---

_Plan creado: 2026-09-23_
_Estado: Listo para ejecución (Fases 1-2)_
