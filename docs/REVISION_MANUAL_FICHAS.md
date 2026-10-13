# Revisión manual de fichas (Fase 8)

Marca con `[x]` cada actividad cuando hayas comprobado en el navegador:

1. Vista previa alumno (`/ficha-preview?activity=ID&mode=alumno`)
2. Vista previa soluciones (`mode=soluciones`)
3. Print preview / PDF se ve correcto en A4

**Progreso:** 58 / 62 _(conteo de `[x]` en el checklist; pendientes de OK en navegador — ver «Pasada paridad pizarra» abajo)_

> Cómo marcar: cambia `- [ ]` por `- [x]` y, si quieres, añade fecha u observación al final de la línea.
> Ejemplo: `- [x] **suma** — La suma _(2026-10-09: OK)_`
>
> Si el profesor marca una actividad como revisada/OK, se da por **completa**: alumno, soluciones, print A4 y Word = preview (todas las casillas `[x]` en la tabla de regresión).

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

| ID                    | Actividad                     | Alumno | Soluciones | Print A4 | Word = preview | Notas / baseline                                                                                                                          |
| --------------------- | ----------------------------- | ------ | ---------- | -------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `counting`            | Contamos objetos              | [x]    | [x]        | [x]      | [ ]            | OK ficha 2026-10-09: objetos+pregunta, 10/hoja, soluciones con número. **Revalidar Word=preview.**                                        |
| `comparison`          | Mayor y menor                 | [x]    | [x]        | [x]      | [x]            | OK 2026-10-09: fila A\|B, sin +N, hard/expert con iguales, soluciones sin dibujos, **Word=vista previa** ya anotado.                      |
| `relacionar`          | Relacionar número y cantidad  | [x]    | [x]        | [x]      | [ ]            | OK ficha 2026-10-09: líneas+figuras; soluciones número→letra; paginación por nivel. **Revalidar Word=preview.**                           |
| `ordenar`             | Ordenar números               | [x]    | [x]        | [x]      | [ ]            | OK ficha 2026-10-09 alumno/print. **Baseline Word≠preview (2026-10-09):** ver hallazgos abajo.                                            |
| `amigos10`            | Los amigos del 10             | [x]    | [x]        | [x]      | [x]            | OK 2026-10-10: ten-frame + operación a la derecha, casilla de respuesta, soluciones solo número, **Word=vista previa**.                   |
| `shapes`              | Formas y tamaños              | [x]    | [x]        | [x]      | [x]            | OK 2026-10-10: figura/foto + opciones texto como pizarra, soluciones solo nombre, PDF alineado (○ tipográfico).                           |
| `suma`                | La suma                       | [x]    | [x]        | [x]      | [ ]            | OK 2026-10-10: imágenes izq. + algoritmo der., sin casillas discontinuas, 32px bajo línea, thumbs scoped. **Revalidar Word.**             |
| `resta`               | La resta                      | [x]    | [x]        | [x]      | [ ]            | OK 2026-10-10: mismo layout que suma (objetos tachados en resta). **Revalidar Word=preview.**                                             |
| `posicionesAula`      | Posiciones en el aula         | [x]    | [x]        | [x]      | [ ]            | OK 2026-10-10: escena aula SVG + ○ opciones, soluciones solo respuesta. **Revalidar Word=preview.**                                       |
| `numeracion1119`      | Números del 11 al 19          | [x]    | [x]        | [x]      | [ ]            | OK 2026-10-10: easy/expert identify con opciones; medium+ enunciado bajo imagen; huecos dobles solo ficha. **Revalidar Word.**            |
| `numeracion4059`      | Números del 40 al 59          | [x]    | [x]        | [x]      | [x]            | OK 2026-10-11: visual como 1119; identify MC sin • (stack); medium/hard/jump bloques en fila; huecos dobles; soluciones solo respuesta.   |
| `numeracion6099`      | Números del 60 al 99          | [x]    | [x]        | [x]      | [x]            | OK 2026-10-11: misma visual que 4059; `word` MC sin bloques; jump/units/sequence en fila.                                                 |
| `igualdad`            | El signo igual                | [x]    | [x]        | [x]      | [ ]            | OK 2026-10-10: enunciados por tipo; imágenes+op en fila (easy); centrado sin imágenes; hard opciones en línea con •. **Revalidar Word.**  |
| `lineTypes`           | Tipos de líneas               | [x]    | [x]        | [x]      | [ ]            | OK 2026-10-10: SVG + opciones •; hint «(redondea la correcta)»; gap 120px línea↔opciones. **Revalidar Word.**                             |
| `rectaNumerica`       | Coloca el número en la recta  | [x]    | [x]        | [x]      | [ ]            | OK 2026-10-10: sin flecha/recuadro; hard/expert 1/fila; soluciones con recta + marca vertical. **Revalidar Word.**                        |
| `laberintoMatematico` | Laberinto matemático (1.º)    | [x]    | [x]        | [x]      | [x]            | OK 2026-10-10: tablero grande color de clase; nodo INICIO soft; soluciones con casillas rellenas (sin enunciado); modal ficha afinado.    |
| `capacidad`           | Capacidad y litros            | [x]    | [x]        | [x]      | [x]            | OK 2026-10-11: easy opciones centradas; medium/hard pregunta izq. + medida dcha. y casilla grande; plural vaso/vasos; expert por tipo.    |
| `ordinales`           | Números ordinales             | [x]    | [x]        | [x]      | [x]            | OK 2026-10-11: mismo emoji+anillo; LTR; identify redondea; easy 2/fila; hard/expert casilla dcha.; flecha+hint; emojis variados.          |
| `problemas`           | Problemas con una operación   | [x]    | [x]        | [x]      | [x]            | OK 2026-10-12: easy/medium enunciado+op columna; hard/expert centrado+hueco; números color clase (salvo expert); sin recuadro respuesta.  |
| `tresSumandosColumna` | Sumas en columna (3 sumandos) | [x]    | [x]        | [x]      | [x]            | OK 2026-10-12: D·U sin casillas; hueco bajo la línea; caja algcol.                                                                        |
| `restaColumna`        | Resta en columna              | [x]    | [x]        | [x]      | [x]            | OK 2026-10-12: mismo layout que algoritmoVertical (−); sin casillas; 3/fila; hueco bajo la línea.                                         |
| `elLitro`             | El litro                      | [x]    | [x]        | [x]      | [x]            | OK 2026-10-12: 2/fila; artículo El/La; classify con opciones+hint; compare sin opciones; expert sin ref.; nombres con mayúscula.          |
| `elKilo`              | El kilo                       | [x]    | [x]        | [x]      | [x]            | OK 2026-10-12: alineado a elLitro — 2/fila; El/La/Las+pesa/pesan; classify opciones+hint; compare sin opciones+hint; expert sin ref.      |
| `reloj`               | El reloj                      | [x]    | [x]        | [x]      | [x]            | OK 2026-10-12: easy centrado+hint+aguja min color; medium sin digital duplicado; hard read aside; expert dibujar sin digital; hora color. |
| `relojPonerHora`      | Pon la hora                   | [x]    | [x]        | [x]      | [x]            | OK 2026-10-12: esfera vacía para dibujar; hora objetivo en enunciado (color clase) + digital; soluciones solo respuesta.                  |
| `monedasBilletes`     | Monedas y billetes            | [x]    | [x]        | [x]      | [x]            | OK 2026-10-12: easy/medium centrado+opciones; hard opciones; expert 2 filas más separadas; gap opciones amplio.                           |
| `inventarProblema`    | Laboratorio de problemas      | [x]    | [x]        | [x]      | [x]            | OK 2026-10-13: easy A/B + redondea la letra; barato/caro color; medium/hard precios color; medium+ iconos izq.; expert sin color.         |
| `balanza`             | La balanza y el peso          | [x]    | [x]        | [x]      | [x]            | OK 2026-10-12: easy MC+artículo mayúsc.; medium/hard MENOS/IGUAL/MÁS; hard sin inclinación (vs); expert sandía+pesas y «escribe el nº».   |
| `balanzaEquilibra`    | Equilibra la balanza          | [x]    | [x]        | [x]      | [x]            | OK 2026-10-12: sin ?/Pongo; hueco en platillo; expert 2 huecos+soluciones con ambos tipos (                                               | ); iconos fiables. |

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

- [x] **suma** — La suma _(2026-10-10: OK — imágenes a la izquierda + operación vertical a la derecha, sin casillas discontinuas, espacio 32px bajo la línea, tamaño thumbs en `.ficha-operation`)_
- [x] **resta** — La resta _(2026-10-10: OK — mismo layout que suma; objetos tachados)_
- [x] **tresSumandos** — Sumas con tres sumandos _(2026-10-10: OK — easy imágenes+op más grandes; gap imágenes/op; medium+ operación centrada)_
- [x] **algoritmoVertical** — Sumas en columna _(2026-10-10: OK — operación centrada; sin casillas; 3/fila; números grandes; caja alta)_
- [x] **tresSumandosColumna** — Sumas en columna (3 sumandos) _(2026-10-12: OK — D·U sin casillas; hueco bajo la línea; caja algcol)_
- [x] **sumaLlevando** — Sumamos llevando _(2026-10-12: OK — 3/fila; sin casillas resultado; operación centrada; números+llevada más grandes)_
- [x] **restaColumna** — Resta en columna _(2026-10-12: OK — mismo layout que Sumas en columna (−); sin casillas; 3/fila; hueco bajo la línea)_
- [x] **algoritmo3cifras** — Algoritmo de tres cifras _(2026-10-13: OK — 3/fila; sin casillas resultado; hueco bajo la línea; casillas llevar/prestar)_
- [x] **igualdad** — El signo igual _(2026-10-10: OK — enunciados por tipo; easy imágenes+op misma línea; medium/hard centrados; hard opciones en línea con •; color de clase; soluciones solo respuesta)_
- [x] **relacionSumaResta** — Familia de operaciones _(2026-10-12: OK — 3 ops en vertical D·U; enunciado Total/partes + «realiza todas las operaciones»)_
- [ ] **multiplicacion** — Multiplicación
- [x] **dobleYMitad** — El doble y la mitad _(2026-10-13: OK — easy cajas+color clase+opciones spread+redondea; medium+ × vertical / ÷ casita L + hueco sin opciones ni recuadros)_
- [x] **amigos10** — Los amigos del 10 _(2026-10-10: OK — ten-frame como en pizarra + operación a la derecha con casilla, toggle imágenes, soluciones solo número)_

## Conteo y comparación

- [x] **counting** — Contamos objetos _(2026-10-09: OK — objetos+pregunta, 10/hoja todos los niveles, soluciones con número)_
- [x] **comparison** — Mayor y menor _(2026-10-09: OK — fila completa A|B, sin +N, hard/expert con iguales, soluciones sin dibujos, Word=vista previa)_
- [x] **parImpar** — Pares e impares _(2026-10-12: OK — enunciado→imagen→opciones centradas; PAR/IMPAR color de clase; expert escritura sin recuadro, 1 línea, solución con todas las posibilidades)_
- [x] **capacidad** — Capacidad y litros _(2026-10-11: OK — easy opciones centradas; medium/hard pregunta izq. + medida dcha.; plural vaso/vasos; expert por tipo)_
- [x] **ordinales** — Números ordinales _(2026-10-11: OK — mismo emoji+anillo; LTR; identify redondea; easy 2/fila; hard/expert casilla dcha.; flecha+hint)_
- [x] **relacionar** — Relacionar número y cantidad _(2026-10-09: OK — alumno con líneas+figuras, soluciones solo número→letra, paginación por nivel)_
- [x] **relacionarCantidades** — Relacionar cantidades _(2026-10-13: OK — imgs 26px; columnas space-between para alinear altura izq./dcha.)_

## Numeración

- [x] **numeracion1119** — Números del 11 al 19 _(2026-10-10: OK — redondea + opciones sin ○; medium/hard imagen+enunciado; huecos dobles; expert con MC en identify)_
- [x] **numeracion4059** — Números del 40 al 59 _(2026-10-11: OK — visual como 1119; identify MC sin • (decenas en columna); medium/hard/jump bloques en fila; huecos dobles; soluciones solo respuesta)_
- [x] **numeracion6099** — Números del 60 al 99 _(2026-10-11: OK — misma visual que 4059; word MC sin bloques; jump/units/sequence en fila)_
- [x] **numeracion999** — Numeración hasta 999 _(2026-10-13: OK — cifras enunciado color clase; opciones horizontales space-between bajo el número)_
- [x] **tablaNumerica** — La tabla de los números _(2026-10-12: OK — easy tabla hasta respuesta+10; medium 4–10 símbolos / busca 2–4; hard/expert color de clase; ficha iconos+recuadros)_
- [x] **lecturaNumeros** — Lectura de números _(2026-10-10: OK — enunciado ½ + número dcha.; color de clase; hint redondea; opciones space-between; hard/expert 1/fila y display más pequeño)_
- [x] **ordenar** — Ordenar números _(2026-10-09: OK — alumno+soluciones, impresión A4, cabecera/logo)_
- [x] **seriesNumericas** — Series numéricas _(2026-10-13: OK — 1.º y 2.º; secuencia+hueco; pista de salto solo easy/medium; soluciones solo número)_
- [x] **series3cifras** — Series de 3 cifras _(2026-10-13: OK — cajas anchas 3 cifras; pista salto easy/medium; soluciones solo número)_
- [x] **vecinosNumero** — Vecinos del número _(2026-10-10: OK — color de clase en «el número»; centrado; hint redondea; hard/expert con guion; opciones space-between)_
- [x] **rectaNumerica** — Coloca el número en la recta _(2026-10-10: OK — número sin recuadro; hard/expert 1/fila recta ancha; soluciones con recta + marca vertical; sin flecha)_
- [x] **redondeo** — Redondeo a la decena _(2026-10-13: OK — easy sin badge + opciones space-between; medium/hard/expert opciones centradas; hard sin extremos; expert solo badge color clase; soluciones solo respuesta)_
- [x] **abaco3cifras** — Ábaco de tres cifras _(2026-10-13: OK — find sin badge + color clase + redondea; valor sin revelar bolitas; 2/fila por tipo)_

## Geometría

- [x] **poligonos** — Los polígonos _(2026-10-12: OK — redondea la correcta; expert sin figura ref.; easy sin mayúscula tras coma)_
- [x] **shapes** — Formas y tamaños _(2026-10-10: OK — figura/foto + opciones como pizarra, soluciones solo nombre, PDF alineado)_
- [x] **simetria** — Simetría _(2026-10-13: OK — color de clase; hint redondea; which-shape con figuras A–D dibujadas)_
- [x] **cuerpos3d** — Cuerpos geométricos _(2026-10-13: OK — figura centrada color de clase; opciones horizontales space-between; hint redondea)_
- [ ] **circuloCircunferencia** — Círculo y circunferencia
- [x] **lineTypes** — Tipos de líneas _(2026-10-10: OK — SVG + • opciones; hint «(redondea la correcta)» 14px; gap 120px; soluciones solo respuesta)_

## Problemas

- [x] **problemas** — Problemas con una operación _(2026-10-12: OK — easy/medium enunciado izq. + op en columna; hard/expert enunciado centrado + hueco debajo; números color de clase salvo expert; sin recuadro de respuesta)_
- [ ] **problemas2pasos** — Problemas de 2 pasos
- [x] **datosInnecesarios** — Desechar datos inútiles _(2026-10-12: OK — instrucción de tachar primero y dominante; pregunta como contexto; color de clase en tarea/números; soluciones solo respuesta)_
- [x] **inventarProblema** — Laboratorio de problemas _(2026-10-13: OK — easy A/B + redondea la letra; MÁS BARATO/CARO color; medium/hard precios color; medium+ iconos izq.; expert sin color)_

## Medidas y tiempo

- [x] **elLitro** — El litro _(2026-10-12: OK — 2/fila; artículo El/La; classify opciones+hint; which-more/less sin opciones; expert sin referencia; nombres mayúscula)_
- [x] **elKilo** — El kilo _(2026-10-12: OK — alineado a elLitro: 2/fila; El/La/Las + pesa/pesan; classify opciones+hint; compare sin opciones+hint; expert sin ref.)_
- [x] **cintaMetrica** — Cinta métrica _(2026-10-13: OK — easy/medium Elige cm/m + icono + frase sin cinta; hard estimación con gaps claros; expert mezcla; iconos coherentes)_
- [x] **reloj** — El reloj _(2026-10-12: OK — easy centrado+hint+aguja min color clase; medium sin digital duplicado+hint; hard digital_read opciones aside; expert dibujar sin digital; hora/digital color clase)_
- [x] **relojPonerHora** — Pon la hora _(2026-10-12: OK — esfera vacía; hora en enunciado color clase + digital; soluciones solo respuesta)_
- [x] **intervalosTiempo** — Intervalos de tiempo _(2026-10-13: OK — barras color de clase; opciones • centradas con gap; classify-hora Más/Menos + hint redondea)_
- [x] **weekDays** — Días de la semana _(2026-10-10: OK — enunciado→tira→opciones; color de clase en día; gap 18px; recuadros 32px)_
- [x] **monedasBilletes** — Monedas y billetes _(2026-10-12: OK — easy/medium centrado+opciones+hint; hard opciones; expert 2 filas separadas; gap opciones amplio)_
- [x] **menuCafeteria** — En la cafetería _(2026-10-13: OK — precios enunciado color clase easy–hard; remarcado carta easy accent / medium negro / hard+expert sin; medium presupuesto; hard mezcla suma y ¿me alcanza? sin total dado; opciones centradas + hint redondea)_
- [x] **balanza** — La balanza y el peso _(2026-10-12: OK — easy redondea+artículo mayúsc.; medium/hard MENOS/IGUAL/MÁS; hard grupo vs pesa sin inclinación; expert sandía+pesas y «escribe el nº»; sin `?`)_
- [x] **balanzaEquilibra** — Equilibra la balanza _(2026-10-12: OK — sin ?/Pongo; respuesta en platillo; expert 2 huecos 1kg/2kg; soluciones con ambos tipos separadas por \|; iconos fiables)_

## Otros

- [x] **leftRight** — Izquierda y derecha _(2026-10-10: OK — opciones centradas; hint redondea; expert char-click con hint «x» en recuadro)_
- [x] **posicionesAula** — Posiciones en el aula _(2026-10-10: OK — escena SVG + ○ opciones, soluciones solo respuesta)_
- [x] **rutaCuadricula** — Taller de programación _(2026-10-12: OK — iconos 🚶🏫🌳 como pizarra; easy con 1 obstáculo; soluciones = tablero con camino ejemplo + «Ej.: …»)_
- [x] **repartoIgual** — Repartos en partes iguales _(2026-10-13: OK — easy/medium puntos+cajas grupo; hard/expert casilla; números color de clase)_
- [x] **laberintoMatematico** — Laberinto matemático (1.º) _(2026-10-10: OK — tablero grande color de clase; INICIO soft; soluciones con casillas rellenas; modal ficha)_
- [x] **laberintoMatematico2** — Laberinto matemático (2.º) _(2026-10-13: OK)_
- [ ] **probabilidad** — Probabilidad
- [x] **graficoBarras** — Gráfico de barras _(2026-10-12: OK — eje Y con líneas de 1 en 1; easy/medium/hard etiquetan valores de columna; expert de 5 en 5; sin números encima de barras)_

---

## Atajos de preview

Sustituye `ID` por el identificador en negrita (ej. `suma`):

```
/ficha-preview?activity=ID&mode=alumno&difficulty=easy&count=10&seed=42
/ficha-preview?activity=ID&mode=soluciones&difficulty=easy&count=10&seed=42
```

---

## Pasada paridad pizarra (2026-10-10) — código, sin OK navegador

### Mejoradas en esta pasada (listas para revisar en preview)

| ID                    | Cambio principal                                         |
| --------------------- | -------------------------------------------------------- |
| `suma` / `resta`      | Algoritmo vertical con casillas de cifra                 |
| `tresSumandos`        | OK navegador 2026-10-10 — ver checklist Operaciones      |
| `algoritmoVertical`   | OK navegador 2026-10-10 — ver checklist Operaciones      |
| `restaColumna`        | OK navegador 2026-10-12 — ver checklist Operaciones      |
| `tresSumandosColumna` | OK navegador 2026-10-12 — ver checklist Operaciones      |
| `igualdad`            | OK navegador 2026-10-10 — ver checklist Operaciones      |
| `relacionSumaResta`   | Tres ecuaciones con hueco                                |
| `dobleYMitad`         | OK navegador 2026-10-13 — ver checklist Operaciones      |
| `parImpar`            | ○ Par/Impar (o opciones del motor)                       |
| `ordinales`           | «Desde la derecha», etiquetas 1º…, casilla               |
| `poligonos`           | ○ opciones de texto (como shapes)                        |
| `lineTypes`           | OK navegador 2026-10-10 — ver checklist Geometría        |
| `series3cifras`       | OK navegador 2026-10-13 — ver checklist Numeración       |
| `vecinosNumero`       | OK navegador 2026-10-10 — ver checklist Numeración       |
| `problemas`           | OK navegador 2026-10-12 — ver checklist Problemas        |
| `datosInnecesarios`   | OK navegador 2026-10-12 — ver checklist Problemas        |
| `inventarProblema`    | OK navegador 2026-10-12 — ver checklist Problemas        |
| `weekDays`            | OK navegador 2026-10-10 — ver checklist Medidas y tiempo |
| `reloj`               | OK navegador 2026-10-12 — ver checklist Medidas y tiempo |
| `relojPonerHora`      | OK navegador 2026-10-12 — ver checklist Medidas y tiempo |
| `monedasBilletes`     | OK navegador 2026-10-12 — ver checklist Medidas y tiempo |
| `elKilo` / `elLitro`  | OK navegador 2026-10-12 — ver checklist Medidas          |
| `problemas2pasos`     | Solución: `correctAnswer` (antes vacío/mal)              |

### Ya alineadas (código) — candidatos a marcar OK tras mirar preview

_(ninguna pendiente de esta lista)_

### 2ª vuelta (2026-10-10) — decisiones del profesor aplicadas

| #   | ID                                                                 | Decisión                                    | Estado código                       |
| --- | ------------------------------------------------------------------ | ------------------------------------------- | ----------------------------------- |
| 1   | `multiplicacion`                                                   | Emparejar columnas                          | Hecho                               |
| 2   | `sumaLlevando`                                                     | Casilla de llevada                          | Hecho                               |
| 3   | `algoritmo3cifras`                                                 | C·D·U + llevar/prestar                      | Hecho                               |
| 4   | `rectaNumerica`                                                    | SVG de recta                                | OK navegador                        |
| 5   | `tablaNumerica`                                                    | Rejilla 10×10 real                          | Hecho                               |
| 6   | `numeracion1119/4059/6099`                                         | Bloques decenas/unidades                    | OK navegador (4059/6099 2026-10-11) |
| 7   | `abaco3cifras` / `lecturaNumeros` / `redondeo` (+ `numeracion999`) | Visuales pizarra                            | Hecho                               |
| 8   | `repartoIgual` / `problemas2pasos`                                 | Diagramas                                   | Hecho                               |
| 9   | laberinto, ruta, posiciones, probabilidad, capacidad               | Dibujar escena                              | Hecho                               |
| 10  | simetría / cuerpos3d / círculo                                     | SVG + ○                                     | Hecho                               |
| 11  | `reloj`                                                            | Digital si aplica; analógico con/sin agujas | Hecho                               |
| 12  | menu / balanzaEquilibra / leftRight hard                           | Extras pizarra                              | Hecho                               |

**Nota Word:** muchas escenas usan SVG inline; en vista previa/PDF deberían verse bien; Word puede degradar SVG.

Pendiente de OK manual en navegador (marcar `[x]` arriba tras preview con `seed=42`).
