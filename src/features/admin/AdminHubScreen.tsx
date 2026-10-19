import { useCallback, useEffect, useState, type CSSProperties } from "react";
import logoUrl from "../../assets/splash-logo.png";
import defaultSchoolBgUrl from "../../assets/demo-school-exterior.jpg";
import { useSchoolAuth } from "../../core/context/SchoolAuthContext";
import {
  adminDeleteSchool,
  adminListSchools,
  adminListSecurityEvents,
  adminSetSchoolStatus,
  summarizeSecurity,
  type AdminSchoolRow,
} from "../../platform/supabase/platformAdmin";
import "../home/HomeScreen.css";
import "./AdminScreens.css";

export type AdminView = "home" | "accepted" | "pending";

type ConfirmKind = "disable" | "enable" | "delete" | "deleteFinal" | "approve" | "reject" | "info";

interface ConfirmState {
  kind: ConfirmKind;
  school?: AdminSchoolRow;
  title: string;
  text: string;
  confirmLabel: string;
  danger?: boolean;
}

export function AdminHubScreen({
  view,
  onChangeView,
}: {
  view: AdminView;
  onChangeView: (v: AdminView) => void;
}) {
  const { signOut, enterSchoolAsAdmin } = useSchoolAuth();
  const [schools, setSchools] = useState<AdminSchoolRow[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [securityOk, setSecurityOk] = useState(true);
  const [secFails, setSecFails] = useState(0);
  const [secLockouts, setSecLockouts] = useState(0);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const reloadSecurity = useCallback(async () => {
    const events = await adminListSecurityEvents(40);
    const summary = summarizeSecurity(events);
    setSecurityOk(summary.ok);
    setSecFails(summary.fails);
    setSecLockouts(summary.lockouts);
  }, []);

  const reload = useCallback(async () => {
    setError("");
    const list = await adminListSchools();
    setSchools(list);
    setSchoolsLoading(false);
    void reloadSecurity();
  }, [reloadSecurity]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // Primero las cajas; seguridad en segundo plano (no bloquea la UI).
      const list = await adminListSchools();
      if (cancelled) return;
      setSchools(list);
      setSchoolsLoading(false);
      void reloadSecurity();
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadSecurity]);

  const pending = schools.filter((s) => s.status === "pending");
  const active = schools.filter((s) => s.status === "active");
  const disabled = schools.filter((s) => s.status === "disabled");
  const acceptedCount = active.length + disabled.length;

  const closeConfirm = () => setConfirm(null);

  const runConfirmed = async () => {
    if (!confirm) return;
    const { kind, school } = confirm;

    if (kind === "info") {
      closeConfirm();
      return;
    }
    if (!school) {
      closeConfirm();
      return;
    }

    if (kind === "delete") {
      setConfirm({
        kind: "deleteFinal",
        school,
        title: "Confirmación final",
        text: `Se borrará «${school.name}» y todos sus datos de staff. Esta acción no se puede deshacer.`,
        confirmLabel: "Eliminar definitivamente",
        danger: true,
      });
      return;
    }

    setBusyId(school.id);
    closeConfirm();
    let result: { ok: boolean; message?: string } = { ok: true };

    if (kind === "disable") result = await adminSetSchoolStatus(school.id, "disabled");
    else if (kind === "enable") result = await adminSetSchoolStatus(school.id, "active");
    else if (kind === "approve") result = await adminSetSchoolStatus(school.id, "active");
    else if (kind === "deleteFinal" || kind === "reject")
      result = await adminDeleteSchool(school.id);

    setBusyId(null);
    if (!result.ok) setError(result.message ?? "No se pudo completar la acción");
    else {
      await reload();
      if (kind === "approve" || kind === "reject") onChangeView("accepted");
    }
  };

  const askDisable = (school: AdminSchoolRow) =>
    setConfirm({
      kind: "disable",
      school,
      title: "Desactivar colegio",
      text: `¿Desactivar «${school.name}»?\nEl centro no podrá entrar hasta que lo reactives.`,
      confirmLabel: "Desactivar",
      danger: true,
    });

  const askEnable = (school: AdminSchoolRow) =>
    setConfirm({
      kind: "enable",
      school,
      title: "Reactivar colegio",
      text: `¿Reactivar «${school.name}»?`,
      confirmLabel: "Reactivar",
    });

  const askDelete = (school: AdminSchoolRow) =>
    setConfirm({
      kind: "delete",
      school,
      title: "Eliminar colegio",
      text: `¿Eliminar permanentemente «${school.name}»?`,
      confirmLabel: "Continuar",
      danger: true,
    });

  const askApprove = (school: AdminSchoolRow) =>
    setConfirm({
      kind: "approve",
      school,
      title: "Aceptar colegio",
      text: `¿Aceptar la solicitud de «${school.name}»?`,
      confirmLabel: "Aceptar",
    });

  const askReject = (school: AdminSchoolRow) =>
    setConfirm({
      kind: "reject",
      school,
      title: "Rechazar solicitud",
      text: `¿Rechazar y eliminar la solicitud de «${school.name}»?`,
      confirmLabel: "Rechazar",
      danger: true,
    });

  const showSecurityHint = () =>
    setConfirm({
      kind: "info",
      title: "Seguridad",
      text:
        `Resumen 24 h:\n· Fallos de login: ${secFails}\n· Lockouts: ${secLockouts}\n\n` +
        `Detalle fino → panel de Supabase (Authentication / Logs).`,
      confirmLabel: "Entendido",
    });

  const showErrorsHint = () =>
    setConfirm({
      kind: "info",
      title: "Estado de la app",
      text:
        "Roturas: usaremos Sentry (gratis) + avisos de Netlify.\n" +
        "De momento no hay telemetría conectada → Sin Fallos.",
      confirmLabel: "Entendido",
    });

  const enterSchool = (school: AdminSchoolRow) => {
    enterSchoolAsAdmin({
      id: school.id,
      name: school.name,
      slug: school.slug,
      created_at: school.created_at,
      updated_at: school.created_at,
      background_url: school.background_url ?? null,
      logo_ficha_url: school.logo_ficha_url ?? null,
    });
  };

  return (
    <div
      className="home home--admin"
      style={{ "--home-bg-image": `url(${defaultSchoolBgUrl})` } as CSSProperties}
    >
      <header className="home__header">
        <div className="home__logo-area">
          <img className="home__logo-img" src={logoUrl} alt="EduColor" />
          <div className="home__title-area">
            <h1 className="home__app-name">EduColor</h1>
            <p className="home__school-name">Administrador</p>
          </div>
        </div>
        <div className="home__header-right admin__chips">
          <button
            type="button"
            className={`admin__chip ${pending.length ? "admin__chip--warn" : ""} ${view === "pending" ? "admin__chip--active" : ""}`}
            onClick={() => onChangeView("pending")}
          >
            Pendientes {pending.length}
          </button>
          <button
            type="button"
            className={`admin__chip ${view === "accepted" ? "admin__chip--active" : ""}`}
            onClick={() => onChangeView("accepted")}
          >
            Aceptados {acceptedCount}
          </button>
          <button
            type="button"
            className={`admin__chip ${securityOk ? "admin__chip--ok" : "admin__chip--ko"}`}
            onClick={showSecurityHint}
          >
            Seguridad {securityOk ? "OK" : "KO"}
          </button>
          <button type="button" className="admin__chip admin__chip--ok" onClick={showErrorsHint}>
            Sin Fallos
          </button>
        </div>
      </header>

      <main className="home__main">
        {error ? (
          <p className="admin__error" role="alert">
            {error}
          </p>
        ) : null}

        {view === "home" ? (
          <section className="home__section">
            <h2 className="home__section-title">Central EduColor</h2>
            <p className="admin__hint">
              Pulsa <strong>Aceptados</strong> para ver los colegios, o <strong>Pendientes</strong>{" "}
              para revisar solicitudes.
            </p>
          </section>
        ) : null}

        {view === "accepted" ? (
          <>
            <section className="home__section">
              <h2 className="home__section-title">Colegios activos</h2>
              {schoolsLoading ? (
                <p className="admin__empty">Cargando colegios…</p>
              ) : active.length === 0 ? (
                <p className="admin__empty">No hay colegios activos todavía.</p>
              ) : (
                <div className="admin__school-grid">
                  {active.map((school) => (
                    <SchoolCard
                      key={school.id}
                      school={school}
                      busy={busyId === school.id}
                      onEnter={() => enterSchool(school)}
                      onDisable={() => askDisable(school)}
                      onDelete={() => askDelete(school)}
                    />
                  ))}
                </div>
              )}
            </section>
            {disabled.length > 0 ? (
              <section className="home__section">
                <h2 className="home__section-title">Desactivados</h2>
                <div className="admin__school-grid">
                  {disabled.map((school) => (
                    <SchoolCard
                      key={school.id}
                      school={school}
                      variant="disabled"
                      busy={busyId === school.id}
                      onEnable={() => askEnable(school)}
                      onDelete={() => askDelete(school)}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : null}

        {view === "pending" ? (
          <section className="home__section">
            <h2 className="home__section-title">Solicitudes pendientes</h2>
            {schoolsLoading ? (
              <p className="admin__empty">Cargando…</p>
            ) : pending.length === 0 ? (
              <p className="admin__empty">No hay colegios pendientes.</p>
            ) : (
              <div className="admin__school-grid">
                {pending.map((school) => (
                  <SchoolCard
                    key={school.id}
                    school={school}
                    variant="pending"
                    busy={busyId === school.id}
                    onApprove={() => askApprove(school)}
                    onReject={() => askReject(school)}
                  />
                ))}
              </div>
            )}
          </section>
        ) : null}
      </main>

      <footer className="home__footer">
        <span className="home__footer-copy">Central EduColor · Administrador</span>
        <div className="home__footer-session">
          <span
            className="home__avatar"
            style={{ backgroundColor: "#001F3F", color: "#fff" }}
            title="Administrador"
            aria-label="Sesión Administrador"
          >
            AD
          </span>
          <button type="button" className="home__sign-out" onClick={() => void signOut()}>
            Cerrar Sesión
          </button>
        </div>
      </footer>

      {confirm ? (
        <div
          className="admin__modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-modal-title"
        >
          <button
            type="button"
            className="admin__modal-backdrop"
            aria-label="Cerrar"
            onClick={closeConfirm}
          />
          <div className="admin__modal-card">
            <h3 id="admin-modal-title" className="admin__modal-title">
              {confirm.title}
            </h3>
            <p className="admin__modal-text">{confirm.text}</p>
            <div className="admin__modal-actions">
              {confirm.kind !== "info" ? (
                <button
                  type="button"
                  className="admin__btn admin__btn--ghost"
                  onClick={closeConfirm}
                >
                  Cancelar
                </button>
              ) : null}
              <button
                type="button"
                className={`admin__btn ${confirm.danger ? "admin__btn--danger" : "admin__btn--primary"}`}
                onClick={() => void runConfirmed()}
              >
                {confirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SchoolCard({
  school,
  variant = "active",
  busy,
  onEnter,
  onDisable,
  onEnable,
  onDelete,
  onApprove,
  onReject,
}: {
  school: AdminSchoolRow;
  variant?: "active" | "disabled" | "pending";
  busy?: boolean;
  onEnter?: () => void;
  onDisable?: () => void;
  onEnable?: () => void;
  onDelete?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const emoji = variant === "pending" ? "📩" : variant === "disabled" ? "⏸️" : "🏫";
  const badge =
    variant === "pending" ? "Pendiente" : variant === "disabled" ? "Desactivado" : "Activo";
  const email = school.owner_email?.trim() || "";

  const copyEmail = async () => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const header = (
    <>
      <span className="admin__school-emoji" aria-hidden>
        {emoji}
      </span>
      <span className="admin__school-badge">{badge}</span>
      <span className="admin__school-name">{school.name}</span>
    </>
  );

  return (
    <article
      className={`admin__school-card${variant === "disabled" ? " admin__school-card--disabled" : ""}${variant === "pending" ? " admin__school-card--pending" : ""}`}
    >
      {onEnter ? (
        <button type="button" className="admin__school-enter" disabled={busy} onClick={onEnter}>
          {header}
        </button>
      ) : (
        <div className="admin__school-enter">{header}</div>
      )}
      <div className="admin__school-email">
        <span className="admin__school-meta">{email || "Sin email owner"}</span>
        {email ? (
          <button
            type="button"
            className={`admin__school-copy${copied ? " admin__school-copy--done" : ""}`}
            onClick={() => void copyEmail()}
            title={copied ? "Copiado" : "Copiar email"}
            aria-label={copied ? "Email copiado" : `Copiar email ${email}`}
          >
            {copied ? (
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        ) : null}
      </div>
      <div className="admin__school-actions">
        {onApprove ? (
          <button
            type="button"
            className="admin__btn admin__btn--ok"
            disabled={busy}
            onClick={onApprove}
          >
            Aceptar
          </button>
        ) : null}
        {onReject ? (
          <button
            type="button"
            className="admin__btn admin__btn--danger"
            disabled={busy}
            onClick={onReject}
          >
            Rechazar
          </button>
        ) : null}
        {onDisable ? (
          <button
            type="button"
            className="admin__btn admin__btn--warn"
            disabled={busy}
            onClick={onDisable}
          >
            Desactivar
          </button>
        ) : null}
        {onEnable ? (
          <button
            type="button"
            className="admin__btn admin__btn--ok"
            disabled={busy}
            onClick={onEnable}
          >
            Reactivar
          </button>
        ) : null}
        {onDelete ? (
          <button
            type="button"
            className="admin__btn admin__btn--danger"
            disabled={busy}
            onClick={onDelete}
          >
            Eliminar
          </button>
        ) : null}
      </div>
    </article>
  );
}
