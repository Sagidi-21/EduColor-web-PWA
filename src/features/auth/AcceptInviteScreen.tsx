import { useEffect, useState, type FormEvent } from "react";
import welcomeBgUrl from "../../assets/welcome-bg.png";
import logoMarkUrl from "../../assets/logo_sin texto.png";
import { useSchoolAuth } from "../../core/context/SchoolAuthContext";
import { getSupabase } from "../../platform/supabase/client";
import {
  isAuthPasswordValid,
  PASSWORD_MAX_LEN,
  PASSWORD_MIN_LEN,
} from "../../platform/supabase/formLimits";
import {
  acceptTeacherInvite,
  peekTeacherInvite,
  type InvitePreview,
} from "../../platform/supabase/teachers";
import { clearInviteFromUrl, setInviteSuccessFlash } from "./inviteUrl";
import "./SchoolAccessScreen.css";

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

interface AcceptInviteScreenProps {
  token: string;
  /** D-029: tras crear contraseña → pantalla Entrar al Colegio. */
  onGoToLogin: () => void;
}

export function AcceptInviteScreen({ token, onGoToLogin }: AcceptInviteScreenProps) {
  const { signOut } = useSchoolAuth();
  const [preview, setPreview] = useState<Extract<InvitePreview, { ok: true }> | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void peekTeacherInvite(token).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (!result.ok) {
        setLoadError(result.message);
        return;
      }
      setPreview(result);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const passwordFails = password.length > 0 && !isAuthPasswordValid(password);
  const passwordsMismatch = password2.length > 0 && password !== password2;
  const formValid =
    Boolean(preview) && isAuthPasswordValid(password) && password === password2 && !busy;

  const finishToLogin = async () => {
    clearInviteFromUrl();
    setInviteSuccessFlash();
    try {
      await getSupabase().auth.signOut();
    } catch {
      // ignore
    }
    try {
      await signOut();
    } catch {
      // ignore
    }
    onGoToLogin();
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!formValid) return;
    setError("");
    setBusy(true);
    try {
      const result = await acceptTeacherInvite(token, password);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      // Mantener el token en App state para no desmontar esta pantalla;
      // solo limpiamos la URL. El popup se muestra aquí.
      clearInviteFromUrl();
      setRegistered(true);
    } finally {
      setBusy(false);
    }
  };

  const goToLogin = () => {
    void finishToLogin();
  };

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
            Te han invitado al cuerpo docente de tu colegio.
            <br />
            Crea tu contraseña para acceder a EduColor.
          </p>
        </div>

        <div className="sa__card-wrap">
          {/* Misma tarjeta que acceso colegio, panel registro (D-029). */}
          <div className="sa__card">
            <div className="sa__pane sa__pane--register">
              <div className="sa__pane-head sa__pane-head--invite">
                <h2 className="sa__pane-title sa__pane-title--invite">Registrar Docente</h2>
                <p className="sa__pane-sub">
                  {preview
                    ? `Invitación de ${preview.schoolName}. El enlace ya verifica tu email.`
                    : "Completa tu acceso con una contraseña segura."}
                </p>
              </div>

              {loading ? (
                <p className="sa__pane-sub">Comprobando invitación…</p>
              ) : loadError ? (
                <div className="sa__submit-block">
                  <p className="sa__pane-sub" role="alert">
                    {loadError}
                  </p>
                  <button type="button" className="sa__btn sa__btn--primary" onClick={onGoToLogin}>
                    Ir a Entrar al Colegio
                  </button>
                </div>
              ) : preview ? (
                <form
                  className="sa__form"
                  onSubmit={(e) => void onSubmit(e)}
                  noValidate
                  autoComplete="off"
                >
                  <label className="sa__field">
                    Nombre y apellidos
                    <input
                      type="text"
                      value={
                        [preview.firstName, preview.lastName1, preview.lastName2]
                          .filter(Boolean)
                          .join(" ") || "—"
                      }
                      readOnly
                      tabIndex={-1}
                    />
                  </label>
                  <label className="sa__field">
                    Email
                    <input type="email" value={preview.email} readOnly tabIndex={-1} />
                  </label>

                  <label className="sa__field sa__field--pwd-tip">
                    Contraseña
                    <span className="sa__input-icon sa__input-icon--eye-only">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="educolor-teacher-password"
                        className={passwordFails ? "sa__input--pwd-invalid" : undefined}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value.slice(0, PASSWORD_MAX_LEN))}
                        required
                        minLength={PASSWORD_MIN_LEN}
                        maxLength={PASSWORD_MAX_LEN}
                        autoComplete="new-password"
                        aria-describedby="invite-pwd-requirements"
                        aria-invalid={passwordFails}
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
                    <span className="sa__pwd-tip" id="invite-pwd-requirements" role="tooltip">
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

                  <label className="sa__field">
                    Repetir contraseña
                    <span className="sa__input-icon sa__input-icon--eye-only">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="educolor-teacher-password2"
                        className={passwordsMismatch ? "sa__input--pwd-invalid" : undefined}
                        placeholder="••••••••"
                        value={password2}
                        onChange={(e) => setPassword2(e.target.value.slice(0, PASSWORD_MAX_LEN))}
                        required
                        minLength={PASSWORD_MIN_LEN}
                        maxLength={PASSWORD_MAX_LEN}
                        autoComplete="new-password"
                        aria-invalid={passwordsMismatch}
                      />
                    </span>
                  </label>

                  <div className="sa__submit-block">
                    <button
                      type="submit"
                      className="sa__btn sa__btn--primary"
                      disabled={!formValid}
                    >
                      {busy ? "Espera…" : "Registrar Docente"}
                    </button>
                  </div>
                </form>
              ) : null}

              <div className="sa__mobile-switch">
                <button type="button" className="sa__text-link" onClick={onGoToLogin}>
                  ¿Ya tienes cuenta? Entrar al Colegio
                </button>
              </div>
            </div>

            <div className="sa__pane sa__pane--login" aria-hidden="true" />

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
                <p className="sa__slider-sub">
                  Impulsa el aprendizaje digital en tus aulas con herramientas intuitivas.
                </p>
              </div>
            </div>
          </div>

          {error ? (
            <div className="sa__status" role="alert">
              {error}
            </div>
          ) : null}
        </div>
      </div>

      {registered ? (
        <div
          className="sa__modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-ok-title"
        >
          <div className="sa__modal-card">
            <div className="sa__modal-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 id="invite-ok-title" className="sa__modal-title">
              Registro completado
            </h2>
            <p className="sa__modal-text">
              Tu cuenta de docente está lista. Entra al colegio con tu email y la contraseña que
              acabas de crear.
            </p>
            <button type="button" className="sa__btn sa__btn--primary" onClick={goToLogin}>
              Entrar al Colegio
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
