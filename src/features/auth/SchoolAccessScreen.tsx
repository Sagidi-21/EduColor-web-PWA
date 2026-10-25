import { useEffect, useState, type FormEvent } from "react";
import welcomeBgUrl from "../../assets/welcome-bg.png";
import logoMarkUrl from "../../assets/logo_sin texto.png";
import { useSchoolAuth } from "../../core/context/SchoolAuthContext";
import { requestNewPassword, signInWithPassword, signUpOwner } from "../../platform/supabase/auth";
import {
  EMAIL_MAX_LEN,
  isAuthEmailValid,
  isAuthPasswordValid,
  PASSWORD_MAX_LEN,
  PASSWORD_MIN_LEN,
  sanitizeEmailInput,
  sanitizePlainText,
  SCHOOL_NAME_MAX_LEN,
} from "../../platform/supabase/formLimits";
import { clearInviteSuccessFlash, peekInviteSuccessFlash } from "./inviteUrl";
import "./SchoolAccessScreen.css";

/** Errores del enlace de confirmación (caducado / ya usado / inválido). */
function consumeAuthCallbackError(): string | null {
  try {
    const rawHash = window.location.hash.replace(/^#/, "");
    const rawSearch = window.location.search.replace(/^\?/, "");
    const params = new URLSearchParams(rawHash || rawSearch);
    const error = params.get("error");
    const code = (params.get("error_code") ?? "").toLowerCase();
    const desc = (params.get("error_description") ?? "").replace(/\+/g, " ").toLowerCase();
    if (!error && !code && !desc) return null;

    window.history.replaceState({}, document.title, window.location.pathname);

    if (desc.includes("expired") || code.includes("otp_expired") || code.includes("expired")) {
      return "El enlace de confirmación ha caducado (válido 1 hora). Vuelve a registrar el colegio con el mismo email o contacta soporte.";
    }
    if (
      desc.includes("invalid") ||
      desc.includes("already") ||
      code.includes("otp") ||
      error === "access_denied"
    ) {
      return "Este enlace ya no es válido. Si ya confirmaste la cuenta, inicia sesión. Si no, registra de nuevo el colegio.";
    }
    return "No se pudo completar la confirmación del email. Inténtalo de nuevo.";
  } catch {
    return null;
  }
}

interface SchoolAccessScreenProps {
  onAuthenticated: () => void;
  /** Entra en modo DEMO (catálogo limitado, sin configuración). */
  onContinueLocal?: () => void;
  /** Abrir en «Entrar al Colegio» (p. ej. tras Registrar Docente). */
  initialLoginMode?: boolean;
  /** Mensaje de error inicial (p. ej. enlace recovery ya usado). */
  initialStatus?: string;
  onStatusConsumed?: () => void;
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5L4 8V6l8 5 8-5v2z"
      />
    </svg>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
      />
    </svg>
  );
}

function IconEye({ off }: { off?: boolean }) {
  if (off) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
      />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path fill="currentColor" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
    </svg>
  );
}

function IconArrowLeft() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </svg>
  );
}

export function SchoolAccessScreen({
  onAuthenticated,
  onContinueLocal,
  initialLoginMode = false,
  initialStatus = "",
  onStatusConsumed,
}: SchoolAccessScreenProps) {
  const { configured, refreshSchools } = useSchoolAuth();
  const [authBoot] = useState(() => {
    // peek (no take): Strict Mode remonta y un consume prematuro abría registro.
    const fromInviteSuccess = peekInviteSuccessFlash();
    if (initialStatus.trim()) {
      return { login: true, error: initialStatus.trim(), info: "" };
    }
    if (fromInviteSuccess || initialLoginMode) {
      return {
        login: true,
        error: "",
        info: fromInviteSuccess ? "Cuenta creada. Entra al colegio con tu email y contraseña." : "",
      };
    }
    const callbackError = consumeAuthCallbackError();
    return { login: Boolean(callbackError), error: callbackError ?? "", info: "" };
  });
  const [isLoginMode, setIsLoginMode] = useState(authBoot.login);

  useEffect(() => {
    if (authBoot.login) clearInviteSuccessFlash();
  }, [authBoot.login]);

  useEffect(() => {
    if (initialStatus.trim()) onStatusConsumed?.();
  }, [initialStatus, onStatusConsumed]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(authBoot.error);
  const [info, setInfo] = useState(authBoot.info);

  const registerFormValid =
    schoolName.trim().length >= 2 && isAuthEmailValid(email) && isAuthPasswordValid(password);

  const passwordFailsRestrictions =
    !isLoginMode && password.length > 0 && !isAuthPasswordValid(password);

  const clearRegisterSecrets = () => {
    setEmail("");
    setPassword("");
  };

  const setAuthMode = (login: boolean) => {
    setIsLoginMode(login);
    setError("");
    setInfo("");
    // Evita autofill del alta anterior al volver a registro.
    if (!login) {
      clearRegisterSecrets();
      setSchoolName("");
    }
  };

  const toggleAuthMode = () => setAuthMode(!isLoginMode);

  const submitRegister = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setInfo("");
    if (!configured) {
      setError("Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env");
      return;
    }
    if (!registerFormValid) return;
    setBusy(true);
    try {
      const result = await signUpOwner({
        email,
        password,
        displayName: schoolName,
        schoolName,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      if (result.needsEmailConfirm) {
        setPassword("");
        setAuthMode(true);
        setInfo(
          result.message ??
            "Para completar el registro, abre el enlace enviado a tu correo. Después inicia sesión para terminar de dar de alta el colegio.",
        );
        return;
      }
      await refreshSchools();
      onAuthenticated();
    } finally {
      setBusy(false);
    }
  };

  const submitLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setInfo("");
    if (!configured) {
      setError("Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env");
      return;
    }
    setBusy(true);
    try {
      const result = await signInWithPassword(email, password);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      await refreshSchools();
      onAuthenticated();
    } finally {
      setBusy(false);
    }
  };

  const onForgotPassword = async () => {
    setError("");
    setInfo("");
    if (!configured) {
      setError("Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env");
      return;
    }
    if (!email.trim().includes("@")) {
      setError("Escribe tu correo electrónico para enviarte el enlace.");
      return;
    }
    setBusy(true);
    try {
      const result = await requestNewPassword(email);
      setInfo(result.message ?? "Si el email está registrado, recibirás un enlace.");
    } finally {
      setBusy(false);
    }
  };

  const sliderSubtext = isLoginMode
    ? "Impulsa el aprendizaje digital en tus aulas con herramientas intuitivas."
    : "Gestión centralizada para directores, docentes y alumnos de tu centro educativo.";
  const sliderPrompt = isLoginMode
    ? "¿Aún no has registrado tu centro escolar?"
    : "¿Tu colegio ya forma parte de EduColor?";
  const sliderBtnLabel = isLoginMode ? "Acceder al Registro" : "Acceder aquí";

  return (
    <div className="sa">
      <div className="sa__ambient" aria-hidden="true">
        <div className="sa__ambient-photo" style={{ backgroundImage: `url(${welcomeBgUrl})` }} />
      </div>

      <div className="sa__layout">
        <div className="sa__quote">
          <div className="sa__quote-block">
            <h1 className="sa__script">
              Aprender
              <br />
              Practicar
              <br />
              Mejorar
            </h1>
            <svg
              className="sa__swoop"
              fill="none"
              viewBox="0 0 160 16"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M3 11C35 4 105 3 157 12"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="3.5"
              />
            </svg>
          </div>
          <p className="sa__quote-sub">
            Diferentes cursos, materias, fichas y pizarras en un solo lugar.
            <br />
            Todo listo para aprender, practicar y mejorar constantemente.
          </p>
        </div>

        <div className="sa__card-wrap">
          <div className={`sa__card${isLoginMode ? " sa__card--login" : ""}`}>
            <div className="sa__pane sa__pane--register">
              <div className="sa__pane-head">
                <h2 className="sa__pane-title">Registra tu Colegio</h2>
                <p className="sa__pane-sub">Inscribe tu centro para activar las aulas virtuales.</p>
              </div>

              <form className="sa__form" onSubmit={submitRegister} noValidate autoComplete="off">
                <label className="sa__field" htmlFor="sa-register-school-name">
                  Nombre del Colegio / Institución
                  <input
                    id="sa-register-school-name"
                    type="text"
                    name="educolor-school-name"
                    placeholder="Ej. Colegio San Agustín"
                    value={schoolName}
                    onChange={(e) =>
                      setSchoolName(sanitizePlainText(e.target.value, SCHOOL_NAME_MAX_LEN))
                    }
                    required
                    minLength={2}
                    maxLength={SCHOOL_NAME_MAX_LEN}
                    autoComplete="organization"
                  />
                </label>
                <label className="sa__field" htmlFor="sa-register-email">
                  Correo Institucional del Centro
                  <input
                    id="sa-register-email"
                    type="email"
                    name="educolor-register-email"
                    placeholder="direccion@colegio.edu"
                    value={email}
                    onChange={(e) => setEmail(sanitizeEmailInput(e.target.value))}
                    required
                    maxLength={EMAIL_MAX_LEN}
                    autoComplete="off"
                  />
                </label>
                <label className="sa__field sa__field--pwd-tip" htmlFor="sa-register-password">
                  Contraseña Admin
                  <span className="sa__input-icon sa__input-icon--eye-only">
                    <input
                      id="sa-register-password"
                      type={showPassword ? "text" : "password"}
                      name="educolor-register-password"
                      className={passwordFailsRestrictions ? "sa__input--pwd-invalid" : undefined}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value.slice(0, PASSWORD_MAX_LEN))}
                      required
                      minLength={PASSWORD_MIN_LEN}
                      maxLength={PASSWORD_MAX_LEN}
                      autoComplete="new-password"
                      aria-describedby="sa-pwd-requirements"
                      aria-invalid={passwordFailsRestrictions}
                    />
                    <button
                      type="button"
                      className="sa__eye"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      <IconEye off={!showPassword} />
                    </button>
                  </span>
                  <span className="sa__pwd-tip" id="sa-pwd-requirements" role="tooltip">
                    <strong>Contraseña Segura</strong>
                    <ul>
                      <li>
                        Contraseña entre {PASSWORD_MIN_LEN}-{PASSWORD_MAX_LEN} caracteres.
                      </li>
                      <li>Debe contener letras minúsculas y mayúsculas, números y símbolos.</li>
                      <li>No uses contraseñas comunes ni filtradas (p. ej. 123456, password).</li>
                      <li>No reutilices la misma de otro servicio.</li>
                    </ul>
                  </span>
                </label>
                <div className="sa__submit-block">
                  <button
                    type="submit"
                    className="sa__btn sa__btn--primary"
                    disabled={busy || !registerFormValid}
                  >
                    {busy && !isLoginMode ? "Espera…" : "Registrar Colegio"}
                  </button>
                  {/* Absolute bajo el CTA: ocultar si hay status para no solaparse. */}
                  {!(error || info || !configured) ? (
                    <button type="button" className="sa__local" onClick={() => onContinueLocal?.()}>
                      Continuar sin cuenta (Probar DEMO)
                    </button>
                  ) : null}
                </div>
                {!isLoginMode && (error || info || !configured) && (
                  <div className="sa__status sa__status--in-pane" role={error ? "alert" : "status"}>
                    {error ||
                      info ||
                      (!configured
                        ? "Supabase no está configurado. Puedes probar la DEMO más adelante."
                        : null)}
                  </div>
                )}
              </form>

              <div className="sa__mobile-switch">
                <button type="button" className="sa__text-link" onClick={() => setAuthMode(true)}>
                  ¿Ya estás registrado? Iniciar sesión
                </button>
              </div>
            </div>

            <div className="sa__pane sa__pane--login">
              <div className="sa__login-brand">
                <h3 className="sa__login-heading">Entrar al Colegio</h3>
                <div className="sa__login-rule" aria-hidden="true" />
              </div>

              <form className="sa__form sa__form--login" onSubmit={submitLogin} noValidate>
                <div className="sa__login-fields">
                  <label className="sa__field" htmlFor="sa-login-email">
                    Correo electrónico
                    <span className="sa__input-icon">
                      <span className="sa__field-icon">
                        <IconMail />
                      </span>
                      <input
                        id="sa-login-email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(sanitizeEmailInput(e.target.value))}
                        required
                        maxLength={EMAIL_MAX_LEN}
                        autoComplete="username"
                        placeholder="tu@email.com"
                      />
                    </span>
                  </label>
                  <label className="sa__field" htmlFor="sa-login-password">
                    Contraseña
                    <span className="sa__input-icon">
                      <span className="sa__field-icon">
                        <IconLock />
                      </span>
                      <input
                        id="sa-login-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value.slice(0, PASSWORD_MAX_LEN))}
                        required
                        minLength={PASSWORD_MIN_LEN}
                        maxLength={PASSWORD_MAX_LEN}
                        autoComplete="current-password"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="sa__eye"
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        <IconEye off={!showPassword} />
                      </button>
                    </span>
                  </label>
                </div>
                <button type="submit" className="sa__btn sa__btn--primary" disabled={busy}>
                  {busy && isLoginMode ? "Espera…" : "Entrar"}
                </button>
                {isLoginMode && (error || info || !configured) && (
                  <div className="sa__status sa__status--in-pane" role={error ? "alert" : "status"}>
                    {error ||
                      info ||
                      (!configured
                        ? "Supabase no está configurado. Puedes probar la DEMO más adelante."
                        : null)}
                  </div>
                )}
                <button
                  type="button"
                  className="sa__text-link sa__forgot"
                  disabled={busy}
                  onClick={() => void onForgotPassword()}
                >
                  Olvidé la contraseña
                </button>
              </form>
            </div>

            <div className="sa__slider">
              <div className="sa__slider-photo" aria-hidden="true" />
              <div className="sa__slider-pattern" aria-hidden="true" />
              <div className="sa__slider-mid">
                <div className="sa__slider-brand">
                  <div className="sa__logo-plate">
                    <img
                      className="sa__logo-mark sa__logo-mark--lg"
                      src={logoMarkUrl}
                      alt="EduColor"
                      width={72}
                      height={72}
                    />
                  </div>
                  <h3 className="sa__slider-title">EduColor</h3>
                </div>
                <p className="sa__slider-sub">{sliderSubtext}</p>
              </div>
              <div className="sa__slider-bottom">
                <p className="sa__slider-prompt">{sliderPrompt}</p>
                <button type="button" className="sa__btn sa__btn--white" onClick={toggleAuthMode}>
                  {isLoginMode ? (
                    <>
                      <IconArrowLeft />
                      <span>{sliderBtnLabel}</span>
                    </>
                  ) : (
                    <>
                      <span>{sliderBtnLabel}</span>
                      <IconArrowRight />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
