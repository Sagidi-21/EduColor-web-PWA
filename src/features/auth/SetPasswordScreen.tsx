import { useState, type FormEvent } from "react";
import welcomeBgUrl from "../../assets/welcome-bg.png";
import logoMarkUrl from "../../assets/logo_sin texto.png";
import { clearLoginGuardAfterPasswordChange, signOut } from "../../platform/supabase/auth";
import { getSupabase } from "../../platform/supabase/client";
import {
  isAuthPasswordValid,
  PASSWORD_MAX_LEN,
  PASSWORD_MIN_LEN,
} from "../../platform/supabase/formLimits";
import { setInviteSuccessFlash } from "./inviteUrl";
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

interface SetPasswordScreenProps {
  /** lockout | forgot | recovery */
  source?: string;
  onDone: () => void;
}

/**
 * D-036/D-037: misma UX que crear contraseña del invite (token recovery de Auth).
 */
export function SetPasswordScreen({ source = "forgot", onDone }: SetPasswordScreenProps) {
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const passwordFails = password.length > 0 && !isAuthPasswordValid(password);
  const passwordsMismatch = password2.length > 0 && password !== password2;
  const formValid = isAuthPasswordValid(password) && password === password2 && !busy;

  const subtitle =
    source === "lockout"
      ? "Hemos detectado varios accesos fallidos. Define una contraseña nueva para tu cuenta."
      : "Elige una contraseña nueva para volver a Entrar al Colegio.";

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!formValid) return;
    setError("");
    setBusy(true);
    try {
      const { error: updateError } = await getSupabase().auth.updateUser({ password });
      if (updateError) {
        setError(
          updateError.message.toLowerCase().includes("password")
            ? "La contraseña no cumple con las restricciones."
            : "No se pudo guardar la contraseña. Inténtalo de nuevo.",
        );
        return;
      }
      await clearLoginGuardAfterPasswordChange();
      setInviteSuccessFlash();
      try {
        await signOut();
      } catch {
        // ignore
      }
      clearSetPasswordFromUrl();
      onDone();
    } finally {
      setBusy(false);
    }
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
          </div>
        </div>
        <div className="sa__card-wrap">
          <div className="sa__card">
            <div className="sa__pane sa__pane--register">
              <div className="sa__pane-head sa__pane-head--invite">
                <h2 className="sa__pane-title sa__pane-title--invite">Nueva contraseña</h2>
                <p className="sa__pane-sub">{subtitle}</p>
              </div>
              <form className="sa__form" onSubmit={(e) => void onSubmit(e)} noValidate>
                <label className="sa__field sa__field--pwd-tip">
                  Contraseña
                  <span className="sa__input-icon sa__input-icon--eye-only">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="educolor-new-password"
                      className={passwordFails ? "sa__input--pwd-invalid" : undefined}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value.slice(0, PASSWORD_MAX_LEN))}
                      required
                      minLength={PASSWORD_MIN_LEN}
                      maxLength={PASSWORD_MAX_LEN}
                      autoComplete="new-password"
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
                  <span className="sa__pwd-tip" role="tooltip">
                    <strong>Contraseña Segura</strong>
                    <ul>
                      <li>
                        Contraseña entre {PASSWORD_MIN_LEN}-{PASSWORD_MAX_LEN} caracteres.
                      </li>
                      <li>Debe contener letras minúsculas y mayúsculas, números y símbolos.</li>
                    </ul>
                  </span>
                </label>
                <label className="sa__field">
                  Repetir contraseña
                  <span className="sa__input-icon sa__input-icon--eye-only">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="educolor-new-password2"
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
                  <button type="submit" className="sa__btn sa__btn--primary" disabled={!formValid}>
                    {busy ? "Espera…" : "Guardar contraseña"}
                  </button>
                </div>
              </form>
              {error ? (
                <div className="sa__status" role="alert">
                  {error}
                </div>
              ) : null}
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
        </div>
      </div>
    </div>
  );
}

export function readSetPasswordFromUrl(): { active: boolean; source: string } {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("setPassword") === "1") {
      return { active: true, source: params.get("src")?.trim() || "forgot" };
    }
  } catch {
    // ignore
  }
  return { active: false, source: "forgot" };
}

export function clearSetPasswordFromUrl(): void {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("setPassword") && !url.searchParams.has("src")) return;
    url.searchParams.delete("setPassword");
    url.searchParams.delete("src");
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, document.title, next || "/");
  } catch {
    // ignore
  }
}
