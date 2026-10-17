import { useState, type FormEvent } from "react";
import schoolBgUrl from "../../assets/school-bg.jpg";
import logoMarkUrl from "../../assets/logo_sin texto.png";
import { useSchoolAuth } from "../../core/context/SchoolAuthContext";
import { signInWithPassword, signUpOwner } from "../../platform/supabase/auth";
import "./SchoolAccessScreen.css";

interface SchoolAccessScreenProps {
  onAuthenticated: () => void;
  onContinueLocal: () => void;
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

export function SchoolAccessScreen({ onAuthenticated, onContinueLocal }: SchoolAccessScreenProps) {
  const { configured, refreshSchools } = useSchoolAuth();
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const setAuthMode = (login: boolean) => {
    setIsLoginMode(login);
    setError("");
    setInfo("");
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
        setInfo(result.message ?? "Revisa tu email para confirmar la cuenta.");
        setAuthMode(true);
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

  const sliderSubtext = isLoginMode
    ? "Impulsa el aprendizaje digital en tus aulas con herramientas intuitivas."
    : "Gestión centralizada para directores, docentes y alumnos de tu centro educativo.";
  const sliderPrompt = isLoginMode
    ? "¿Aún no has registrado tu centro escolar?"
    : "¿Tu colegio ya forma parte de EduColor?";
  const sliderBtnLabel = isLoginMode ? "Registrar Colegio" : "Acceder aquí";

  return (
    <div className="sa">
      <div className="sa__ambient" aria-hidden="true">
        <div className="sa__ambient-photo" style={{ backgroundImage: `url(${schoolBgUrl})` }} />
        <div className="sa__ambient-overlay" />
        <div className="sa__blob sa__blob--tl" />
        <div className="sa__blob sa__blob--br" />
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

              <form className="sa__form" onSubmit={submitRegister} noValidate>
                <label className="sa__field">
                  Nombre del Colegio / Institución
                  <input
                    type="text"
                    placeholder="Ej. Colegio San Agustín"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    required
                    minLength={2}
                    maxLength={120}
                  />
                </label>
                <label className="sa__field">
                  Correo Institucional del Centro
                  <input
                    type="email"
                    placeholder="direccion@colegio.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </label>
                <div className="sa__row">
                  <label className="sa__field">
                    Código Escolar / CIF
                    <input
                      type="text"
                      placeholder="CÓD-8823"
                      value={schoolCode}
                      onChange={(e) => setSchoolCode(e.target.value)}
                      maxLength={40}
                    />
                  </label>
                  <label className="sa__field">
                    Contraseña Admin
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </label>
                </div>
                <button type="submit" className="sa__btn sa__btn--primary" disabled={busy}>
                  {busy && !isLoginMode ? "Espera…" : "Registrar Colegio"}
                </button>
              </form>

              <div className="sa__mobile-switch">
                <button type="button" className="sa__text-link" onClick={() => setAuthMode(true)}>
                  ¿Ya estás registrado? Iniciar sesión
                </button>
              </div>
            </div>

            <div className="sa__pane sa__pane--login">
              <div className="sa__login-brand">
                <h3 className="sa__login-heading">Acceso del Colegio</h3>
                <div className="sa__login-rule" aria-hidden="true" />
              </div>

              <form className="sa__form sa__form--login" onSubmit={submitLogin} noValidate>
                <div className="sa__login-fields">
                  <label className="sa__field">
                    Correo electrónico
                    <span className="sa__input-icon">
                      <span className="sa__field-icon">
                        <IconMail />
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="username"
                        placeholder="tu@email.com"
                      />
                    </span>
                  </label>
                  <label className="sa__field">
                    Contraseña
                    <span className="sa__input-icon">
                      <span className="sa__field-icon">
                        <IconLock />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete="current-password"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="sa__eye"
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        <IconEye off={showPassword} />
                      </button>
                    </span>
                  </label>
                </div>
                <button type="submit" className="sa__btn sa__btn--primary" disabled={busy}>
                  {busy && isLoginMode ? "Espera…" : "Entrar"}
                </button>
              </form>
            </div>

            <div className="sa__slider">
              <div className="sa__slider-pattern" aria-hidden="true" />
              <div className="sa__slider-mid">
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
                <p className="sa__slider-sub">{sliderSubtext}</p>
              </div>
              <div className="sa__slider-bottom">
                <p className="sa__slider-prompt">{sliderPrompt}</p>
                <button type="button" className="sa__btn sa__btn--white" onClick={toggleAuthMode}>
                  <span>{sliderBtnLabel}</span>
                  <IconArrowRight />
                </button>
              </div>
            </div>
          </div>

          {(error || info || !configured) && (
            <div className="sa__status" role={error ? "alert" : "status"}>
              {error ||
                info ||
                (!configured
                  ? "Supabase no está configurado. Puedes continuar en modo local."
                  : null)}
            </div>
          )}

          <button type="button" className="sa__local" onClick={onContinueLocal}>
            Continuar sin cuenta (modo local)
          </button>
        </div>
      </div>
    </div>
  );
}
