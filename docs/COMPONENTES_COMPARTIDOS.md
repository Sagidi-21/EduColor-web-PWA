# Componentes compartidos

Catálogo del **mobiliario común de una actividad**: las piezas que ya existen y que
hay que reutilizar en lugar de reescribir. Es la segunda mitad de la fuente de verdad,
junto a `electron-reference/`, que dice **qué** se migra, y este documento, que dice
**con qué** se construye en la PWA.

Las dos reglas que lo rigen:

- Si una pieza de esta lista no te sirve tal cual, **no la clones**: extiende la
  compartida o crea la tuya al lado y aplícala al catálogo. Ver
  [AGENT_RULES.md](./AGENT_RULES.md) §17, "Regla de unificación".
- Si creas una pieza nueva que dos activities van a usar, **añádela aquí el mismo día**.
  Un componente compartido que no está en este documento se acaba duplicando.

Las decisiones de **por qué** cada pieza es como es están en
[DECISIONES.md](./DECISIONES.md). Este documento es el **cómo se usa**.

---

## Índice

| Pieza                                    | Fichero                                             | Decisión                 |
| ---------------------------------------- | --------------------------------------------------- | ------------------------ |
| Cabecera de actividad                    | `ActivityHeader.tsx`                                | —                        |
| Botones reintentar / siguiente           | `ActivityActionButtons.tsx`                         | [D-018](./DECISIONES.md) |
| Numpad                                   | `shared/components/Numpad.tsx`                      | —                        |
| Casillas de cifras                       | `DigitBoxes.tsx` + `useDigitBoxes.ts`               | [D-017](./DECISIONES.md) |
| Casilla de escritura a mano              | `shared/DigitCell` (`LazyDigitCell`)                | —                        |
| Selector de modo de entrada              | `shared/components/InputModeToggle.tsx`             | —                        |
| Resumen final                            | `SummaryScreen.tsx`                                 | —                        |
| Elección de nivel y dificultad           | `DifficultyReveal.tsx`                              | —                        |
| Aspa de cerrar modal                     | `shared/components/ModalCloseButton.tsx`            | —                        |
| Barrera de error y aviso de sesión vacía | `ActivityErrorBoundary.tsx`, `NoExerciseNotice.tsx` | —                        |
| Feedback sonoro                          | `shared/audioFeedback.ts`                           | —                        |
| Layout base de pantalla                  | `operations/OperationsScreen.css`                   | —                        |

---

## 1. Cabecera — `ActivityHeader`

Sustituye a `ExerciseHeader` de Electron. Lleva salir, título de la unidad, avatar de la
mascota, estrellas de dificultad y el progreso `3/12`.

El `InputModeToggle` va **como hijo** del `ActivityHeader`, nunca suelto al lado.

## 2. Botones de reintentar y siguiente — `ActionButtons`

```tsx
import { ActionButtons } from "../components/ActivityActionButtons";

{
  /* Solo cuando el ejercicio falla, y siempre en este orden */
}
{
  session.answerState === "wrong" && <ActionButtons onRetry={handleRetry} onNext={handleNext} />;
}
```

- **Es el único par de botones de la app.** Antes había también `WrongFeedback`, que
  pintaba una tarjeta roja con botones pequeños; se borró al unificar (D-018). Si
  necesitas otro aspecto, se ajusta aquí para todas, no se crea otro componente.
- Textos fijos: `🔄 Reintentar` y `Siguiente →`.
- Se muestran **al fallar**, no al acertar. Al acertar se pasa al siguiente
  ejercicio con el temporizador de avance que ya usa cada pantalla.
- `OrderingScreen` es la excepción conocida: no los muestra, porque el fallo se agota
  solo. Si otro ejercicio necesita ese comportamiento, se documenta aquí.

### Tamaño según dónde caigan

`.activity-action` mide 160×52 px, pensado para la barra inferior y para el modo
lienzo. En la **columna lateral del numpad** ese tamaño no cabe (ver §9) y hay que
apilarlos, pero **ese ajuste ya está hecho en `OperationsScreen.css`**: si los botones
caen dentro de `.ops__body--with-numpad .ops__footer`, se estrechan solos. No añadas
una variante a mano.

## 3. Numpad — `Numpad`

```tsx
import { Numpad } from "../../shared/components/Numpad";
```

**Nunca un numpad local**, por muy bloqueante que parezca en el renderer original de
Electron. Props: `onDigit`, `onDelete`, `onConfirm` y `disabled`.

Solo se monta en modo numpad. Cuando el modo es lienzo, en su lugar van las casillas
de escritura a mano (§5).

## 4. Casillas de cifras — `DigitBoxes` + `useDigitBoxes`

La entrada numérica estándar. **Una casilla por cada cifra que la operación requiera,
ni una más**, con avance automático y validación al completar la última.

```tsx
import { DigitBoxes } from "../components/DigitBoxes";
import { useDigitBoxes } from "../components/useDigitBoxes";

const boxes = useDigitBoxes({ length: casillas, answer: String(current.answer), order: "ltr", onValid: ... });

<DigitBoxes
  length={casillas}
  values={boxes.values}
  activeIndex={boxes.activeIndex}
  order="ltr"
  state={session.answerState}
  mode={mode}
  onSelect={boxes.onSelect}
  onDigit={boxes.onDigit}
  onDelete={boxes.onDelete}
  canvasKey={canvasKey}
  correctText={String(current.answer)}
/>
```

### La dirección depende de cómo se ve el ejercicio, no del nombre (D-017)

| Cómo se ve el ejercicio             | `order`                                         | Ejemplos                                                   |
| ----------------------------------- | ----------------------------------------------- | ---------------------------------------------------------- |
| **En vertical**, como una operación | `"rtl"` (derecha a izquierda, unidades primero) | `sumaLlevando`, `tresSumandosColumna`, `algoritmoVertical` |
| **Cualquier otro caso**             | `"ltr"` (izquierda a derecha)                   | `numeracion1119`, `numeracion4059`, `numeracion6099`       |

> `La suma` y `La resta` van en vertical y escriben de derecha a izquierda: está
> confirmado en pizarra, no lo cambies por el nombre de la actividad.

`numeracion999` no monta nada de esto: sus cuatro tipos se resuelven con botones.

## 5. Escritura a mano — `LazyDigitCell`

Sustituye a `DrawableAnswerBox` de Electron. Carga TensorFlow.js (~890 kB) en diferido,
así que **siempre** se importa en lazy. Envuélvelo en `ActivityErrorBoundary` (§8): si
ese trozo falla, la pantalla se queda vacía.

## 6. Selector de modo — `InputModeToggle` + `useInputMode`

Alterna numpad y lienzo. Muestra y oculta con la misma condición que usen el resto de
activities de la familia.

## 7. Resumen final — `SummaryScreen`

Siempre el compartido. No copies el resumen inline que tengan algunos renderers
originales de Electron.

## 8. Pantalla de nivel y dificultad — `DifficultyReveal`

**Única** pantalla de selección de nivel, con su animación de revelación, las cartas
de dificultad, las estrellas y el botón de empezar. Se usa ya en todo el catálogo: no
la reimplementes ni la pintes en un renderer. El aspa de cerrar es `ModalCloseButton`
(§8b), no un botón local.

## 8b. Aspa de cerrar modal — `ModalCloseButton`

```tsx
import { ModalCloseButton } from "../../shared/components/ModalCloseButton";

<ModalCloseButton onClick={onClose} />;
```

Botón circular con icono SVG y hover rojo. **Una sola** implementación para todos los
modales:

- `DifficultyReveal` (selección de nivel / dificultad en pizarra)
- `FichaModal` (configuración de ficha imprimible)

Props: `onClick`, `ariaLabel` (por defecto «Cerrar») y `className` opcional si el
modal necesita ajustar solo la posición (como `.ficha-modal__close`). No clones el
SVG ni el hover en CSS local.

## 9. Barrera de error y sesión vacía

- Toda actividad se monta dentro de `ActivityErrorBoundary`, que captura tanto los
  errores de render como el rechazo de un `React.lazy`.
- Si no hay ejercicio que mostrar, se usa `NoExerciseNotice`, que avisa y ofrece
  volver al catálogo.

**Nunca** devuelvas `null` para "no hay nada que pintar" en un renderer: es
literalmente la pantalla en blanco que nos pasó. Usa `NoExerciseNotice`.

**Salvedad para código ya escrito:** hay 15 ficheros que sí lo hacen y están
aceptados uno a uno en [Excepciones aceptadas](#excepciones-aceptadas), con su
motivo. La regla es para lo nuevo: si añades un renderer, no copies esa guarda.

## 10. Layout base — `OperationsScreen.css`

Si el renderer usa clases `.ops__*`, importa `../operations/OperationsScreen.css`.
Ahí viven `.ops`, `.ops__body`, `.ops__stage`, `.ops__footer` y la columna lateral.

### La columna lateral del numpad

| Dato                  | Valor                                                         |
| --------------------- | ------------------------------------------------------------- |
| Se activa a partir de | 1500 px de ancho (`@media (min-width: 1500px)`)               |
| Ancho de la columna   | 320 px                                                        |
| Padding               | 20 px por lado                                                |
| Espacio útil real     | **280 px**                                                    |
| Numpad                | `max-width: 280px`                                            |
| Botones               | se apilan a lo ancho, centrados en vertical con `safe center` |

Por debajo de 1500 px el `footer` es una barra inferior a ancho completo y todo se
mantiene igual. El centrado usa `safe center` a propósito: si no cabe, que empiece
por arriba en lugar de recortar arriba.

---

## Regla de unificación

Cuando, al migrar un motor, decidas que algo pasa a ser compartido:

1. Extrae la pieza a `src/features/matematicas/components/` o `src/features/shared/`.
2. Aplica el cambio a **todas** las pantallas que la usaban, no solo a la nueva.
3. **Añádela a este documento**, con su regla de uso.
4. **Anótala en `DECISIONES.md`**, con el porqué y a qué deuda cierra.
5. **Anótala en `AGENT_RULES.md` §17**, en la tabla de mapeo, para que se vea al
   migrar y no solo al leer este catálogo.
6. Comprueba con `npm test` que nada se rompió, y revisa en pizarra al menos una de
   las pantallas afectadas.

El paso 3 es el que se olvida. Si un componente compartido no está en este documento,
en dos meses habrá dos versiones y ninguna correcta.

## El test que vigila esto

`src/features/matematicas/components/SharedComponents.test.ts` recorre `src/` en cada
`npm test` y **avisa** (por `stderr`, para que se vea aunque el test pase) si encuentra:

- un `Numpad` definido fuera del compartido;
- botones de reintentar que no sean `ActionButtons`;
- una pantalla de nivel que no sea `DifficultyReveal`;
- una guarda `if (!current) return null` en un renderer, que deja la pantalla en blanco
  sin avisar.

**No rompe la build**: avisa y sigue, porque breaking el patrón puede ser legítimo en un
ejercicio concreto. Si ese es el caso, se documenta aquí y se añade el fichero a la
lista `EXCEPCIONES` del test, con el motivo al lado.

Lo único que sí hace fallar el test es que **desaparezca** una pieza compartida, que sí
sería un error de verdad.

## Excepciones aceptadas

El vigilante avisa de las guardas `if (!current) return null` que existen en 15
ficheros: 14 renderers y `ExerciseView`. **No son un fallo** y están en la lista
`EXCEPCIONES.returnNull` del test, con su motivo escrito al lado. Se aceptan por
esto:

- El avance de la sesión comprueba `if (next >= total)` y, en vez de avanzar, muestra
  el resumen. El contador nunca pasa del último ejercicio, así que `current` nunca es
  `undefined` y la guarda no llega a dispararse.
- Como el código funciona, no se toca: AGENT_RULES §4 dice que un refactor que cambie
  el resultado educativo no es aceptable, y aquí no hay ningún resultado que mejorar.

Afecta a 14 renderers: `AlgoritmoColumnaScreen`, `IgualdadScreen`, `LeftRightScreen`,
`ProblemaScreen`, `RectaNumericaScreen`, `RelacionarScreen`, `RelacionSumaRestaScreen`,
`RepartoIgualScreen`, `ShapesScreen`, `SumaLlevandoScreen`, `TresSumandosScreen`,
`TresSumandosColumnaScreen`, `VecinosScreen` y `WeekDaysScreen`. Más
`ExerciseView`, que va aparte porque el motivo es otro: ahí la sesión viene de un contexto
de React, no de un índice. Tampoco se dispara hoy, porque la vista de ejercicio solo se
monta tras pasar por el catálogo, que es quien crea la sesión. **Es la más frágil de
las dos** y la primera candidata a pasar a `NoExerciseNotice` cuando se toque ese
fichero.

Si alguna vez se rompe el avance de una de esas sesiones, esta lista es lo primero que
hay que quitar: el aviso volvería a aparecer solo.
