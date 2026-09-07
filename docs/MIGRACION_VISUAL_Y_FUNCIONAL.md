# Migración visual y funcional desde Electron

## Principio aprobado

La aplicación de `Colegio` es la referencia canónica de EduColor. La PWA no
rediseña su experiencia: conserva sus pantallas, recursos, textos, flujos y
funciones, sustituyendo únicamente las integraciones que dependen de Electron
por equivalentes web cuando sea necesario.

## Primera entrega de base visual

- Vídeo de apertura original.
- Pantalla de inicio con fondo, logotipo, selección de aula y tarjetas de
  acceso originales.
- Configuración de aula persistida localmente: nombre, color, mascota subida,
  altas y bajas de aula y tamaño de interfaz.
- Biblioteca completa de recursos originales: 244 archivos (≈39 MB) copiados
  a `src/assets` para que los renderizadores no usen sustitutos visuales.

## Compatibilidad del vídeo de apertura

Los navegadores bloquean habitualmente el inicio automático de vídeo con audio.
La PWA inicia el vídeo silenciado para que se reproduzca al abrirla y, si el
navegador no permite ese arranque, muestra el botón **Iniciar presentación**.
No se cambia el archivo original ni el flujo posterior de “Toca para
continuar”.

## Pendiente de trasladar sin simular disponibilidad

- Catálogo y ejecución de actividades de pizarra digital.
- Generador de fichas e impresión.
- Pantallas de actividad, resultados y flujos de retorno.
- Tarjeta de reconocimiento y uso del modelo ya entrenado.
- Adaptaciones web de las acciones que hoy usan IPC, sistema de archivos o
  funcionalidades propias de Electron.

Una tarjeta se muestra como disponible solo después de que su pantalla y su
función estén migradas y verificadas.
