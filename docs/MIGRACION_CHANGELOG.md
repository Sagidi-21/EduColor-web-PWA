# Migration Changelog

Registro de decisiones donde la PWA diverge intencionalmente del proyecto original (Electron).

| Componente Original | Cambio | Motivo | Impacto | Responsable | Fecha |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `window.api.playCorrect` | Sustituido por Web Audio API pura | PWA no tiene acceso a IPC ni archivos del sistema | Generación de audio 100% en navegador | Agente | 2026-09-11 |
| Vídeo de intro (autoplay) | Iniciado en 'muted', se reproduce audio al primer gesto | Políticas restrictivas de autoplay en navegadores | Mismo flujo visual, previene bloqueo | Agente | 2026-09-11 |
