import logoUrl from "../../assets/welcome-logo-bg.png";
import bgUrl from "../../assets/welcome-bg.png";
import "./WelcomeScreen.css";

interface WelcomeScreenProps {
  onEnterWithVideo: () => void;
  onEnterWithoutVideo: () => void;
}

export function WelcomeScreen({ onEnterWithVideo, onEnterWithoutVideo }: WelcomeScreenProps) {
  return (
    <div className="welcome" style={{ backgroundImage: `url(${bgUrl})` }}>
      <img className="welcome__logo" src={logoUrl} alt="EduColor logo" />

      <div className="welcome__actions">
        <p className="welcome__tagline">
          Aprender también
          <br />
          puede ser una aventura
        </p>

        <button
          className="welcome__btn-primary"
          onClick={onEnterWithVideo}
          id="welcome-enter-video-btn"
        >
          <span className="welcome__btn-primary-icon">▶</span>
          Entrar con Video
        </button>

        <button
          className="welcome__btn-secondary"
          onClick={onEnterWithoutVideo}
          id="welcome-enter-no-video-btn"
        >
          <span className="welcome__btn-secondary-arrow">→</span>
          Entrar sin Video
        </button>
      </div>
    </div>
  );
}
