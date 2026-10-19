import type { CSSProperties } from "react";
import logoUrl from "../../assets/splash-logo.png";
import schoolBgUrl from "../../assets/school-bg.jpg";
import { useSchoolAuth } from "../../core/context/SchoolAuthContext";
import "../home/HomeScreen.css";
import "./AdminScreens.css";

/** Owner de un colegio aún pending: no entra al home hasta que admin acepte. */
export function WaitingApprovalScreen() {
  const { primarySchool, signOut } = useSchoolAuth();

  return (
    <div className="home" style={{ "--home-bg-image": `url(${schoolBgUrl})` } as CSSProperties}>
      <header className="home__header">
        <div className="home__logo-area">
          <img className="home__logo-img" src={logoUrl} alt="EduColor" />
          <div className="home__title-area">
            <h1 className="home__app-name">EduColor</h1>
            <p className="home__school-name">{primarySchool?.name ?? "Colegio"}</p>
          </div>
        </div>
      </header>
      <main className="home__main">
        <div className="admin__waiting">
          <h2>Solicitud en revisión</h2>
          <p>
            Tu colegio está pendiente de aceptación por el administrador de EduColor. Te avisaremos
            cuando puedas entrar.
          </p>
          <button type="button" className="admin__btn" onClick={() => void signOut()}>
            Cerrar Sesión
          </button>
        </div>
      </main>
    </div>
  );
}
