import type { CSSProperties } from "react";
import logoUrl from "../../assets/splash-logo.png";
import defaultSchoolBgUrl from "../../assets/demo-school-exterior.jpg";
import { useSchoolAuth } from "../../core/context/SchoolAuthContext";
import "../home/HomeScreen.css";
import "./AdminScreens.css";

/** Owner de un colegio aún pending: no entra al home hasta que admin acepte. */
export function WaitingApprovalScreen() {
  const { primarySchool, signOut } = useSchoolAuth();
  const schoolName = primarySchool?.name?.trim() || "Tu colegio";

  return (
    <div
      className="home home--waiting"
      style={{ "--home-bg-image": `url(${defaultSchoolBgUrl})` } as CSSProperties}
    >
      <header className="home__header">
        <div className="home__logo-area">
          <img className="home__logo-img" src={logoUrl} alt="EduColor" />
          <div className="home__title-area">
            <h1 className="home__app-name">EduColor</h1>
            <p className="home__school-name">{schoolName}</p>
          </div>
        </div>
        <div className="home__header-right">
          <button type="button" className="home__sign-out" onClick={() => void signOut()}>
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="home__main home__main--waiting">
        <section className="admin__waiting" aria-labelledby="waiting-title">
          <p className="admin__waiting-badge">Pendiente de aceptación</p>
          <h2 id="waiting-title">Solicitud en revisión</h2>
          <p className="admin__waiting-school">{schoolName}</p>
          <p className="admin__waiting-copy">
            El administrador de EduColor está revisando el alta de tu colegio. Una vez aceptada, se
            pondrá en contacto contigo y podrás entrar con el mismo email y contraseña que te has
            registrado.
          </p>
          <button
            type="button"
            className="admin__btn admin__btn--ghost admin__waiting-btn"
            onClick={() => void signOut()}
          >
            Cerrar Sesión
          </button>
        </section>
      </main>
    </div>
  );
}
