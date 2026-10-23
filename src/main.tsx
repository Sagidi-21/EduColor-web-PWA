import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initSentry, Sentry } from "./platform/sentry";
import App from "./App";
import "./styles.css";
import { registerSW } from "./platform/serviceWorkerRegistration";

initSentry();
registerSW();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<p>Ha ocurrido un error. Recarga la página.</p>}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
