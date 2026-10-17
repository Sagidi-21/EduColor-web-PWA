import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useSchoolAuth } from "../../core/context/SchoolAuthContext";
import {
  EMAIL_MAX_LEN,
  PERSON_NAME_MAX_LEN,
  sanitizeEmailInput,
  sanitizePlainText,
} from "../../platform/supabase/formLimits";
import {
  cancelTeacherInvite,
  createTeacherInvite,
  listSchoolStaff,
  removeTeacher,
  setTeacherActive,
  type AcceptedTeacherRow,
  type PendingInviteRow,
} from "../../platform/supabase/teachers";
import "./ProfesoradoScreen.css";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function initials(first?: string | null, last?: string | null): string {
  const a = (first ?? "").trim().charAt(0);
  const b = (last ?? "").trim().charAt(0);
  const value = `${a}${b}`.toUpperCase();
  return value || "?";
}

function hoursUntil(iso: string): { hours: number; urgent: boolean } {
  const ms = new Date(iso).getTime() - Date.now();
  const hours = Math.max(0, Math.ceil(ms / 3_600_000));
  return { hours, urgent: hours <= 6 };
}

function avatarTone(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash + seed.charCodeAt(i) * (i + 1)) % 4;
  return hash;
}

export function ProfesoradoScreen({ onBack }: { onBack: () => void }) {
  const { primarySchool, isOwner, loading: authLoading } = useSchoolAuth();
  const schoolId = primarySchool?.id ?? null;
  const schoolName = primarySchool?.name ?? "Colegio";

  const [pending, setPending] = useState<PendingInviteRow[]>([]);
  const [accepted, setAccepted] = useState<AcceptedTeacherRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [lastInviteUrl, setLastInviteUrl] = useState("");
  const [filter, setFilter] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName1, setLastName1] = useState("");
  const [lastName2, setLastName2] = useState("");
  const [email, setEmail] = useState("");

  const inviteValid =
    firstName.trim().length >= 1 &&
    lastName1.trim().length >= 1 &&
    email.includes("@") &&
    email.trim().length >= 5;

  const activeCount = useMemo(() => accepted.filter((row) => row.is_active).length, [accepted]);

  const filteredAccepted = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return accepted;
    return accepted.filter((row) => {
      const hay = [row.first_name, row.last_name_1, row.last_name_2, row.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [accepted, filter]);

  const refresh = useCallback(async () => {
    if (!schoolId) return;
    const lists = await listSchoolStaff(schoolId);
    setPending(lists.pending);
    setAccepted(lists.accepted);
  }, [schoolId]);

  useEffect(() => {
    if (!authLoading && (!isOwner || !schoolId)) {
      onBack();
      return;
    }
    if (!schoolId) return;
    let cancelled = false;
    void listSchoolStaff(schoolId).then((lists) => {
      if (cancelled) return;
      setPending(lists.pending);
      setAccepted(lists.accepted);
    });
    return () => {
      cancelled = true;
    };
  }, [authLoading, isOwner, schoolId, onBack]);

  const onInvite = async (event: FormEvent) => {
    event.preventDefault();
    if (!schoolId || !inviteValid) return;
    setError("");
    setInfo("");
    setLastInviteUrl("");
    setBusy(true);
    try {
      const result = await createTeacherInvite({
        schoolId,
        email,
        firstName,
        lastName1,
        lastName2,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setLastInviteUrl(result.inviteUrl);
      setInfo(
        "Invitación enviada con éxito. El docente recibirá un correo con su enlace provisional (mientras el servidor de correo no esté activo, copia el enlace abajo).",
      );
      setFirstName("");
      setLastName1("");
      setLastName2("");
      setEmail("");
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  if (authLoading || !isOwner || !schoolId) {
    return (
      <div className="prof">
        <header className="prof__nav">
          <div className="prof__nav-inner">
            <button type="button" className="prof__back" onClick={onBack}>
              <svg
                className="prof__icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Configuración
            </button>
          </div>
        </header>
        <p className="prof__muted">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="prof">
      <header className="prof__nav">
        <div className="prof__nav-inner">
          <div className="prof__nav-left">
            <button type="button" className="prof__back" onClick={onBack}>
              <svg
                className="prof__icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Configuración
            </button>
            <span className="prof__nav-sep" aria-hidden>
              |
            </span>
            <span className="prof__school-pill">
              <span className="prof__dot prof__dot--ok" />
              {schoolName}
            </span>
          </div>
        </div>
      </header>

      <main className="prof__main">
        <div className="prof__container">
          <section className="prof__page-header">
            <div>
              <h1 className="prof__title">Profesorado</h1>
              <p className="prof__subtitle">
                Administra el cuerpo docente institucional, envía invitaciones seguras por correo
                electrónico y gestiona credenciales de acceso.
              </p>
            </div>
            <div className="prof__stats">
              <div className="prof__stat">
                <span className="prof__dot prof__dot--warn" />
                <span className="prof__stat-label">Pendientes:</span>
                <span className="prof__stat-value">{pending.length}</span>
              </div>
              <div className="prof__stat">
                <span className="prof__dot prof__dot--ok" />
                <span className="prof__stat-label">Activos:</span>
                <span className="prof__stat-value">{activeCount}</span>
              </div>
            </div>
          </section>

          <section className="prof__card">
            <div className="prof__card-head">
              <div className="prof__card-title-row">
                <div className="prof__card-icon" aria-hidden>
                  <svg
                    className="prof__icon-lg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="prof__section-title">Invitar profesor</h2>
                  <p className="prof__section-desc">
                    Añade los datos del nuevo docente para habilitar su acceso al campus virtual.
                  </p>
                </div>
              </div>
              <div className="prof__hint-badge">
                <svg
                  className="prof__icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  Máximo <strong>4 invitaciones por hora</strong>. El enlace caduca a las{" "}
                  <strong>72 horas</strong>.
                </span>
              </div>
            </div>

            <form
              className="prof__invite-form"
              onSubmit={(e) => void onInvite(e)}
              autoComplete="off"
            >
              <div className="prof__invite-grid">
                <label className="prof__field">
                  <span className="prof__label">
                    Nombre <span className="prof__req">*</span>
                  </span>
                  <input
                    value={firstName}
                    maxLength={PERSON_NAME_MAX_LEN}
                    placeholder="Ej. María"
                    onChange={(e) =>
                      setFirstName(sanitizePlainText(e.target.value, PERSON_NAME_MAX_LEN))
                    }
                    required
                  />
                </label>
                <label className="prof__field">
                  <span className="prof__label">
                    1.er apellido <span className="prof__req">*</span>
                  </span>
                  <input
                    value={lastName1}
                    maxLength={PERSON_NAME_MAX_LEN}
                    placeholder="Ej. Gómez"
                    onChange={(e) =>
                      setLastName1(sanitizePlainText(e.target.value, PERSON_NAME_MAX_LEN))
                    }
                    required
                  />
                </label>
                <label className="prof__field">
                  <span className="prof__label">2.º apellido</span>
                  <input
                    value={lastName2}
                    maxLength={PERSON_NAME_MAX_LEN}
                    placeholder="Ej. Serrano"
                    onChange={(e) =>
                      setLastName2(sanitizePlainText(e.target.value, PERSON_NAME_MAX_LEN))
                    }
                  />
                </label>
                <label className="prof__field prof__field--email">
                  <span className="prof__label">
                    Email institucional <span className="prof__req">*</span>
                  </span>
                  <span className="prof__input-wrap">
                    <input
                      type="email"
                      value={email}
                      maxLength={EMAIL_MAX_LEN}
                      placeholder="m.gomez@colegio.es"
                      onChange={(e) => setEmail(sanitizeEmailInput(e.target.value))}
                      required
                    />
                    <svg
                      className="prof__input-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </span>
                </label>
                <div className="prof__field prof__field--submit">
                  <button type="submit" className="prof__submit" disabled={busy || !inviteValid}>
                    <svg
                      className="prof__icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                    {busy ? "Enviando…" : "Enviar invitación"}
                  </button>
                </div>
              </div>

              {error ? (
                <div className="prof__feedback prof__feedback--error" role="alert">
                  {error}
                </div>
              ) : null}
              {info ? (
                <div className="prof__feedback prof__feedback--ok">
                  <div className="prof__feedback-main">
                    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{info}</span>
                  </div>
                  <button
                    type="button"
                    className="prof__feedback-close"
                    onClick={() => {
                      setInfo("");
                      setLastInviteUrl("");
                    }}
                    aria-label="Cerrar"
                  >
                    ✕
                  </button>
                </div>
              ) : null}
              {lastInviteUrl ? (
                <div className="prof__link-box">
                  <code className="prof__link">{lastInviteUrl}</code>
                  <button
                    type="button"
                    className="prof__ghost-btn"
                    onClick={() => void navigator.clipboard.writeText(lastInviteUrl)}
                  >
                    Copiar enlace
                  </button>
                </div>
              ) : null}
            </form>
          </section>

          <section className="prof__block">
            <div className="prof__block-head">
              <div className="prof__block-title-row">
                <h2 className="prof__section-title">Invitaciones pendientes</h2>
                <span className="prof__chip prof__chip--warn">
                  {pending.length} pendiente{pending.length === 1 ? "" : "s"}
                </span>
              </div>
              <span className="prof__block-note">
                Los enlaces caducan automáticamente tras 72 horas
              </span>
            </div>

            <div className="prof__table-card">
              <div className="prof__table-scroll">
                <table className="prof__table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>1.er apellido</th>
                      <th>2.º apellido</th>
                      <th>Email</th>
                      <th>Fecha envío</th>
                      <th>Vigencia</th>
                      <th className="prof__th-actions">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="prof__empty">
                          No hay invitaciones pendientes.
                        </td>
                      </tr>
                    ) : (
                      pending.map((row) => {
                        const vig = hoursUntil(row.expires_at);
                        return (
                          <tr key={row.id}>
                            <td>
                              <div className="prof__name-cell">
                                <span
                                  className={`prof__avatar prof__avatar--t${avatarTone(row.email)}`}
                                >
                                  {initials(row.first_name, row.last_name_1)}
                                </span>
                                <span className="prof__name">{row.first_name}</span>
                              </div>
                            </td>
                            <td className="prof__strong">{row.last_name_1}</td>
                            <td className="prof__muted-cell">{row.last_name_2 || "—"}</td>
                            <td className="prof__email">{row.email}</td>
                            <td className="prof__muted-cell">{formatDate(row.sent_at)}</td>
                            <td>
                              <span
                                className={`prof__vigencia ${vig.urgent ? "prof__vigencia--urgent" : ""}`}
                              >
                                <svg
                                  className="prof__icon-xs"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  aria-hidden
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                Expira en {vig.hours}h
                              </span>
                            </td>
                            <td className="prof__td-actions">
                              <button
                                type="button"
                                className="prof__icon-btn prof__icon-btn--danger"
                                title="Revocar invitación"
                                onClick={() =>
                                  void cancelTeacherInvite(row.id).then(async (r) => {
                                    if (!r.ok) setError(r.message ?? "Error");
                                    else await refresh();
                                  })
                                }
                              >
                                <svg
                                  className="prof__icon"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  aria-hidden
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="prof__block">
            <div className="prof__block-head">
              <div className="prof__block-title-row">
                <h2 className="prof__section-title">Profesores activos</h2>
                <span className="prof__chip prof__chip--ok">
                  <span className="prof__dot prof__dot--ok" />
                  {activeCount} aceptada{activeCount === 1 ? "" : "s"}
                </span>
              </div>
              <div className="prof__search">
                <svg
                  className="prof__search-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="search"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filtrar por nombre o email…"
                  aria-label="Filtrar profesores"
                />
              </div>
            </div>

            <div className="prof__table-card">
              <div className="prof__table-scroll">
                <table className="prof__table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>1.er apellido</th>
                      <th>2.º apellido</th>
                      <th>Email</th>
                      <th>Fecha aceptación</th>
                      <th>Estado</th>
                      <th className="prof__th-actions">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccepted.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="prof__empty">
                          {accepted.length === 0
                            ? "Aún no hay profesores activos."
                            : "Ningún resultado con ese filtro."}
                        </td>
                      </tr>
                    ) : (
                      filteredAccepted.map((row) => (
                        <tr
                          key={row.membership_id}
                          className={row.is_active ? undefined : "prof__row--off"}
                        >
                          <td>
                            <div className="prof__name-cell">
                              <span
                                className={`prof__avatar prof__avatar--t${avatarTone(row.email ?? row.membership_id)}`}
                              >
                                {initials(row.first_name, row.last_name_1)}
                              </span>
                              <span className="prof__name">{row.first_name ?? "—"}</span>
                            </div>
                          </td>
                          <td className="prof__strong">{row.last_name_1 ?? "—"}</td>
                          <td className="prof__muted-cell">{row.last_name_2 || "—"}</td>
                          <td className="prof__muted-cell">{row.email ?? "—"}</td>
                          <td className="prof__muted-cell">{formatDate(row.accepted_at)}</td>
                          <td>
                            {row.is_active ? (
                              <span className="prof__status prof__status--on">
                                <span className="prof__dot prof__dot--ok" />
                                Activo
                              </span>
                            ) : (
                              <span className="prof__status prof__status--off">Desactivado</span>
                            )}
                          </td>
                          <td className="prof__td-actions">
                            <div className="prof__row-actions">
                              <button
                                type="button"
                                className="prof__text-action"
                                onClick={() =>
                                  void setTeacherActive(row.membership_id, !row.is_active).then(
                                    async (r) => {
                                      if (!r.ok) setError(r.message ?? "Error");
                                      else await refresh();
                                    },
                                  )
                                }
                              >
                                {row.is_active ? "Desactivar" : "Activar"}
                              </button>
                              <button
                                type="button"
                                className="prof__icon-btn prof__icon-btn--danger"
                                title="Eliminar del colegio"
                                onClick={() => {
                                  if (
                                    !window.confirm(
                                      "¿Eliminar a este profesor del colegio? Esta acción no se puede deshacer.",
                                    )
                                  ) {
                                    return;
                                  }
                                  void removeTeacher(row.membership_id).then(async (r) => {
                                    if (!r.ok) setError(r.message ?? "Error");
                                    else await refresh();
                                  });
                                }}
                              >
                                <svg
                                  className="prof__icon"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  aria-hidden
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {accepted.length > 0 ? (
                <div className="prof__table-foot">
                  Mostrando <strong>{filteredAccepted.length}</strong> de{" "}
                  <strong>{accepted.length}</strong> profesores
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
