import { useCallback, useEffect, useState, type CSSProperties } from "react";
import logoUrl from "../../assets/splash-logo.png";
import schoolBgUrl from "../../assets/school-bg.jpg";
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

export type AdminView = "hub" | "pending";

export function AdminHubScreen({
  view,
  onChangeView,
}: {
  view: AdminView;
  onChangeView: (v: AdminView) => void;
}) {
  const { signOut, enterSchoolAsAdmin } = useSchoolAuth();
  const [schools, setSchools] = useState<AdminSchoolRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [securityOk, setSecurityOk] = useState(true);
  const [secFails, setSecFails] = useState(0);
  const [secLockouts, setSecLockouts] = useState(0);

  const reload = useCallback(async () => {
    setError("");
    const [list, events] = await Promise.all([adminListSchools(), adminListSecurityEvents(80)]);
    setSchools(list);
    const summary = summarizeSecurity(events);
    setSecurityOk(summary.ok);
    setSecFails(summary.fails);
    setSecLockouts(summary.lockouts);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [list, events] = await Promise.all([adminListSchools(), adminListSecurityEvents(80)]);
      if (cancelled) return;
      setSchools(list);
      const summary = summarizeSecurity(events);
      setSecurityOk(summary.ok);
      setSecFails(summary.fails);
      setSecLockouts(summary.lockouts);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pending = schools.filter((s) => s.status === "pending");
  const active = schools.filter((s) => s.status === "active");
  const acceptedCount = schools.filter(
    (s) => s.status === "active" || s.status === "disabled",
  ).length;

  const confirmAction = (message: string) => window.confirm(message);

  const onDisable = async (school: AdminSchoolRow) => {
    if (
      !confirmAction(
        `¿Desactivar el colegio «${school.name}»?\nEl centro no podrá entrar hasta que lo reactive.`,
      )
    ) {
      return;
    }
    setBusyId(school.id);
    const result = await adminSetSchoolStatus(school.id, "disabled");
    setBusyId(null);
    if (!result.ok) setError(result.message ?? "No se pudo desactivar");
    else await reload();
  };

  const onEnable = async (school: AdminSchoolRow) => {
    if (!confirmAction(`¿Reactivar el colegio «${school.name}»?`)) return;
    setBusyId(school.id);
    const result = await adminSetSchoolStatus(school.id, "active");
    setBusyId(null);
    if (!result.ok) setError(result.message ?? "No se pudo reactivar");
    else await reload();
  };

  const onDelete = async (school: AdminSchoolRow) => {
    if (
      !confirmAction(
        `¿ELIMINAR permanentemente «${school.name}»?\nEsta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    if (!confirmAction(`Confirmación final: borrar «${school.name}» y todos sus datos de staff.`)) {
      return;
    }
    setBusyId(school.id);
    const result = await adminDeleteSchool(school.id);
    setBusyId(null);
    if (!result.ok) setError(result.message ?? "No se pudo eliminar");
    else await reload();
  };

  const onApprove = async (school: AdminSchoolRow) => {
    if (!confirmAction(`¿Aceptar el colegio «${school.name}»?`)) return;
    setBusyId(school.id);
    const result = await adminSetSchoolStatus(school.id, "active");
    setBusyId(null);
    if (!result.ok) setError(result.message ?? "No se pudo aceptar");
    else {
      await reload();
      onChangeView("hub");
    }
  };

  const onReject = async (school: AdminSchoolRow) => {
    if (!confirmAction(`¿Rechazar y eliminar la solicitud de «${school.name}»?`)) return;
    setBusyId(school.id);
    const result = await adminDeleteSchool(school.id);
    setBusyId(null);
    if (!result.ok) setError(result.message ?? "No se pudo rechazar");
    else {
      await reload();
      onChangeView("hub");
    }
  };

  const showSecurityHint = () => {
    window.alert(
      `Resumen 24 h (nuestras tablas):\n` +
        `· Fallos de login: ${secFails}\n` +
        `· Lockouts: ${secLockouts}\n\n` +
        `Detalle fino → panel de Supabase (Authentication / Logs).\n` +
        `No montamos consola de ciberataques propia.`,
    );
  };

  const showErrorsHint = () => {
    window.alert(
      `Roturas de la app: usaremos Sentry (gratis) + avisos de Netlify.\n` +
        `Esta chip solo avisa el estado; aún no hay telemetría conectada → Sin Fallos.`,
    );
  };

  return (
    <div
      className="home home--admin"
      style={{ "--home-bg-image": `url(${schoolBgUrl})` } as CSSProperties}
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
            className={`admin__chip ${pending.length ? "admin__chip--warn" : ""}`}
            onClick={() => onChangeView("pending")}
          >
            Pendientes {pending.length}
          </button>
          <span className="admin__chip admin__chip--muted">Aceptados {acceptedCount}</span>
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
          {view !== "hub" ? (
            <button type="button" className="admin__chip" onClick={() => onChangeView("hub")}>
              ← Colegios
            </button>
          ) : null}
        </div>
      </header>

      <main className="home__main">
        {error ? (
          <p className="admin__error" role="alert">
            {error}
          </p>
        ) : null}

        {view === "hub" ? (
          <>
            <h2 className="home__section-title">Colegios activos</h2>
            <p className="admin__hint">
              Pulsa un colegio para entrar como OW. Desactivar / eliminar piden confirmación.
            </p>
            <div className="home__class-grid">
              {active.length === 0 ? (
                <p className="admin__empty">No hay colegios activos todavía.</p>
              ) : (
                active.map((school) => (
                  <div key={school.id} className="home__class-card admin__school-card">
                    <button
                      type="button"
                      className="admin__school-enter"
                      disabled={busyId === school.id}
                      onClick={() =>
                        enterSchoolAsAdmin({
                          id: school.id,
                          name: school.name,
                          slug: school.slug,
                          created_at: school.created_at,
                          updated_at: school.created_at,
                        })
                      }
                    >
                      <span className="home__class-name">{school.name}</span>
                      <span className="admin__school-meta">{school.owner_email ?? "—"}</span>
                    </button>
                    <div className="admin__school-actions">
                      <button
                        type="button"
                        className="admin__btn admin__btn--warn"
                        disabled={busyId === school.id}
                        onClick={() => void onDisable(school)}
                      >
                        Desactivar
                      </button>
                      <button
                        type="button"
                        className="admin__btn admin__btn--danger"
                        disabled={busyId === school.id}
                        onClick={() => void onDelete(school)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {schools.some((s) => s.status === "disabled") ? (
              <>
                <h2 className="home__section-title">Desactivados</h2>
                <div className="home__class-grid">
                  {schools
                    .filter((s) => s.status === "disabled")
                    .map((school) => (
                      <div
                        key={school.id}
                        className="home__class-card admin__school-card admin__school-card--disabled"
                      >
                        <div className="admin__school-enter">
                          <span className="home__class-name">{school.name}</span>
                          <span className="admin__school-meta">Desactivado</span>
                        </div>
                        <div className="admin__school-actions">
                          <button
                            type="button"
                            className="admin__btn"
                            disabled={busyId === school.id}
                            onClick={() => void onEnable(school)}
                          >
                            Reactivar
                          </button>
                          <button
                            type="button"
                            className="admin__btn admin__btn--danger"
                            disabled={busyId === school.id}
                            onClick={() => void onDelete(school)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </>
            ) : null}
          </>
        ) : null}

        {view === "pending" ? (
          <>
            <h2 className="home__section-title">Solicitudes pendientes</h2>
            <div className="home__class-grid">
              {pending.length === 0 ? (
                <p className="admin__empty">No hay colegios pendientes.</p>
              ) : (
                pending.map((school) => (
                  <div key={school.id} className="home__class-card admin__school-card">
                    <div className="admin__school-enter">
                      <span className="home__class-name">{school.name}</span>
                      <span className="admin__school-meta">{school.owner_email ?? "—"}</span>
                    </div>
                    <div className="admin__school-actions">
                      <button
                        type="button"
                        className="admin__btn admin__btn--ok"
                        disabled={busyId === school.id}
                        onClick={() => void onApprove(school)}
                      >
                        Aceptar
                      </button>
                      <button
                        type="button"
                        className="admin__btn admin__btn--danger"
                        disabled={busyId === school.id}
                        onClick={() => void onReject(school)}
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
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
    </div>
  );
}
