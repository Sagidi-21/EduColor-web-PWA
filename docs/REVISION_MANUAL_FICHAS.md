# Revisión manual de fichas (Fase 8)

Marca con `[x]` cada actividad cuando hayas comprobado en el navegador:

1. Vista previa alumno (`/ficha-preview?activity=ID&mode=alumno`)
2. Vista previa soluciones (`mode=soluciones`)
3. Print preview / PDF se ve correcto en A4

**Progreso:** 5 / 62

> Cómo marcar: cambia `- [ ]` por `- [x]` y, si quieres, añade fecha u observación al final de la línea.
> Ejemplo: `- [x] **suma** — La suma _(2026-10-09: OK)_`

---

## Paridad vista previa ↔ Word (Fase 0 — criterio de éxito)

Objetivo: la vista previa debe ser una representación fiel de lo que se guarda en Word
(mismos ejercicios, misma disposición, mismos tamaños de imagen y márgenes equivalentes).

### Qué cuenta como «igual»

| Criterio          | Descripción                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------ |
| Mismo contenido   | Misma semilla → mismos enunciados y respuestas                                             |
| Misma disposición | 2 columnas (o full-width cuando aplique); mismo orden de ejercicios por página             |
| Mismos tamaños    | Imágenes, cajas de ejercicio y tipografía equivalentes (no «otra maquetación»)             |
| Márgenes / página | Caja A4 y márgenes equivalentes; tolerancia mínima solo por límites del motor HTML de Word |

**No es objetivo:** igualdad pixel-perfect absoluta con Microsoft Word (imposible al 100 %).

### Protocolo de comparación (baseline)

Usar **siempre** la misma semilla y parámetros:

```
/ficha-preview?activity=ID&mode=alumno&difficulty=easy&count=10&seed=42
/ficha-preview?activity=ID&mode=soluciones&difficulty=easy&count=10&seed=42
```

1. Abrir vista previa alumno y soluciones con `seed=42`.
2. Guardar Word desde el modal con **la misma** actividad, dificultad, count y seed (cuando Fase 1 lo permita; hasta entonces, anotar si el seed diverge).
3. Abrir el `.doc` en Word o LibreOffice.
4. Comparar lado a lado: columnas, tamaños de imagen, márgenes, saltos de página.
5. Marcar cada ítem del checklist de regresión abajo.

### Checklist de regresión (fichas ya validadas)

Estas son las únicas actividades marcadas OK en la revisión manual de fichas a 2026-10-10.
Sirven de **baseline obligatorio** antes/después de unificar preview y Word.

| ID           | Actividad                    | Alumno | Soluciones | Print A4 | Word = preview | Notas / baseline                                                                                                                   |
| ------------ | ---------------------------- | ------ | ---------- | -------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `counting`   | Contamos objetos             | [x]    | [x]        | [x]      | [ ]            | OK ficha 2026-10-09: objetos+pregunta, 10/hoja, soluciones con número. **Revalidar Word=preview.**                                 |
| `comparison` | Mayor y menor                | [x]    | [x]        | [x]      | [x]            | OK 2026-10-09: fila A\|B, sin +N, hard/expert con iguales, soluciones sin dibujos, **Word=vista previa** ya anotado.               |
| `relacionar` | Relacionar número y cantidad | [x]    | [x]        | [x]      | [ ]            | OK ficha 2026-10-09: líneas+figuras; soluciones número→letra; paginación por nivel. **Revalidar Word=preview.**                    |
| `ordenar`    | Ordenar números              | [x]    | [x]        | [x]      | [ ]            | OK ficha 2026-10-09 alumno/print. **Baseline Word≠preview (2026-10-09):** ver hallazgos abajo.                                     |
| `amigos10`   | Los amigos del 10            | [x]    | [x]        | [x]      | [ ]            | OK ficha 2026-10-10: ten-frame + operación a la derecha, casilla de respuesta, soluciones solo número. **Revalidar Word=preview.** |

### Hallazgos baseline — `ordenar` (2026-10-09)

Comparación captura vista previa vs Word (misma actividad «Ordenar números»). **No son iguales.**

| Aspecto                      | Vista previa                                            | Word                                                           |
| ---------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| Caja de cada ejercicio       | Borde gris claro + `border-radius` visible              | Contenedor más débil / bordes redondeados perdidos o aplanados |
| Tarjetas de números y huecos | Esquinas redondeadas (`border-radius: 6px`)             | Esquinas cuadradas (Word ignora `border-radius`)               |
| Márgenes / caja A4           | Página ancha, padding generoso (`print/print-base.css`) | Márgenes laterales más anchos / contenido más comprimido       |
| Espaciado vertical           | Entre ejercicios y dentro de la tarjeta más «aireado»   | Más apretado; tipografía y pesos distintos                     |
| Tipografía                   | `system-ui` / Segoe UI del CSS                          | Fuente por defecto de Word (Calibri u otra)                    |
| Cabecera / logo / título     | Layout web (logo absoluto + `transform`)                | Aproximación; línea y tamaños no coinciden del todo            |

**Causa probable (no es bug del renderer de ordenar):** mismo HTML/CSS en teoría (`OrderingRenderer` + `OrderingRenderer.print.css`), pero el motor HTML de Word no respeta grid/flex/`border-radius`/`@page` como el navegador. Encaja con Fase 2 (layout Word-safe) y Fase 3 (preview = HTML canónico). Ver D-026.

**Estado Fase 0 para `ordenar`:** fallo documentado — sirve de caso de regresión obligatorio tras las fases 1–4.

**Regla de cierre de las fases 1–4:** no dar por cerrada la unificación preview↔Word hasta que las filas de la tabla de regresión tengan `Word = preview` en `[x]` con `seed=42`.

Cuando se valide una actividad nueva de la lista general, añadirla también a esta tabla de regresión si aporta un caso de layout distinto (imágenes densas, SVG, full-width, etc.).

### Estado de implementación

| Fase                                  | Estado | Notas                                                              |
| ------------------------------------- | ------ | ------------------------------------------------------------------ |
| 0 — Criterio + checklist              | Hecha  | Baseline `ordenar` Word≠preview documentado                        |
| 1 — Seed único + `buildFichaDocument` | Hecha  | Misma seed en modal (preview y export); builder canónico           |
| 2 — Layout Word-safe                  | Hecha  | Tabla 2 cols, cabecera tabla, clases explícitas, ordenar en tablas |
| 3 — Preview = HTML canónico           | Hecha  | Preview pinta `buildFichaDocument().html` + mismo CSS              |
| 4 — Guardar PDF (sin impresora)       | Hecha  | Descarga `.pdf` con html2canvas+jsPDF; no `window.print()`         |

---

## Operaciones

- [ ] **suma** — La suma
- [ ] **resta** — La resta
- [ ] **tresSumandos** — Sumas con tres sumandos
- [ ] **algoritmoVertical** — Sumas en columna
- [ ] **tresSumandosColumna** — Sumas en columna (3 sumandos)
- [ ] **sumaLlevando** — Sumamos llevando
- [ ] **restaColumna** — Resta en columna
- [ ] **algoritmo3cifras** — Algoritmo de tres cifras
- [ ] **igualdad** — El signo igual
- [ ] **relacionSumaResta** — Familia de operaciones
- [ ] **multiplicacion** — Multiplicación
- [ ] **dobleYMitad** — El doble y la mitad
- [x] **amigos10** — Los amigos del 10 _(2026-10-10: OK — ten-frame como en pizarra + operación a la derecha con casilla, toggle imágenes, soluciones solo número)_

## Conteo y comparación

- [x] **counting** — Contamos objetos _(2026-10-09: OK — objetos+pregunta, 10/hoja todos los niveles, soluciones con número)_
- [x] **comparison** — Mayor y menor _(2026-10-09: OK — fila completa A|B, sin +N, hard/expert con iguales, soluciones sin dibujos, Word=vista previa)_
- [ ] **parImpar** — Pares e impares
- [ ] **capacidad** — Capacidad y litros
- [ ] **ordinales** — Números ordinales
- [x] **relacionar** — Relacionar número y cantidad _(2026-10-09: OK — alumno con líneas+figuras, soluciones solo número→letra, paginación por nivel)_
- [ ] **relacionarCantidades** — Relacionar cantidades

## Numeración

- [ ] **numeracion1119** — Números del 11 al 19
- [ ] **numeracion4059** — Números del 40 al 59
- [ ] **numeracion6099** — Números del 60 al 99
- [ ] **numeracion999** — Numeración hasta 999
- [ ] **tablaNumerica** — La tabla de los números
- [ ] **lecturaNumeros** — Lectura de números
- [x] **ordenar** — Ordenar números _(2026-10-09: OK — alumno+soluciones, impresión A4, cabecera/logo)_
- [ ] **seriesNumericas** — Series numéricas
- [ ] **series3cifras** — Series de 3 cifras
- [ ] **vecinosNumero** — Vecinos del número
- [ ] **rectaNumerica** — Coloca el número en la recta
- [ ] **redondeo** — Redondeo a la decena
- [ ] **abaco3cifras** — Ábaco de tres cifras

## Geometría

- [ ] **poligonos** — Los polígonos
- [ ] **shapes** — Formas y tamaños
- [ ] **simetria** — Simetría
- [ ] **cuerpos3d** — Cuerpos geométricos
- [ ] **circuloCircunferencia** — Círculo y circunferencia
- [ ] **lineTypes** — Tipos de líneas

## Problemas

- [ ] **problemas** — Problemas con una operación
- [ ] **problemas2pasos** — Problemas de 2 pasos
- [ ] **datosInnecesarios** — Desechar datos inútiles
- [ ] **inventarProblema** — Laboratorio de problemas

## Medidas y tiempo

- [ ] **elLitro** — El litro
- [ ] **elKilo** — El kilo
- [ ] **cintaMetrica** — Cinta métrica
- [ ] **reloj** — El reloj
- [ ] **relojPonerHora** — Pon la hora
- [ ] **intervalosTiempo** — Intervalos de tiempo
- [ ] **weekDays** — Días de la semana
- [ ] **monedasBilletes** — Monedas y billetes
- [ ] **menuCafeteria** — En la cafetería
- [ ] **balanza** — La balanza y el peso
- [ ] **balanzaEquilibra** — Equilibra la balanza

## Otros

- [ ] **leftRight** — Izquierda y derecha
- [ ] **posicionesAula** — Posiciones en el aula
- [ ] **rutaCuadricula** — Taller de programación
- [ ] **repartoIgual** — Repartos en partes iguales
- [ ] **laberintoMatematico** — Laberinto matemático (1.º)
- [ ] **laberintoMatematico2** — Laberinto matemático (2.º)
- [ ] **probabilidad** — Probabilidad
- [ ] **graficoBarras** — Gráfico de barras

---

## Atajos de preview

Sustituye `ID` por el identificador en negrita (ej. `suma`):

```
/ficha-preview?activity=ID&mode=alumno&difficulty=easy&count=10&seed=42
/ficha-preview?activity=ID&mode=soluciones&difficulty=easy&count=10&seed=42
```
