import { Link } from "react-router-dom";

const AuthLayout = ({
  children,
  title,
  subtitle,
  showBackToLogin = false,
}) => {
  return (
    <div className="auth-page">
      {/* Left branding panel */}
      <div className="auth-brand-panel">
        <div className="auth-brand-content">
          <Link to="/login" className="auth-brand">
            <div className="auth-brand-icon">
              🌱
            </div>

            <div>
              <div className="auth-brand-name">
                AgriWatch
              </div>

              <div className="auth-brand-tagline">
                Smart Crop Monitoring
              </div>
            </div>
          </Link>

          <div className="auth-brand-message">
            <span className="auth-eyebrow">
              SMART AGRICULTURE
            </span>

            <h2>
              Monitor your crops.
              <br />
              Protect your harvest.
            </h2>

            <p>
              AgriWatch helps farmers monitor tomato
              crop conditions, receive alerts, and make
              better farming decisions.
            </p>

            <div className="auth-features">
              <div className="auth-feature">
                <span className="auth-feature-icon">✓</span>
                <span>Smart crop monitoring</span>
              </div>

              <div className="auth-feature">
                <span className="auth-feature-icon">✓</span>
                <span>Real-time crop alerts</span>
              </div>

              <div className="auth-feature">
                <span className="auth-feature-icon">✓</span>
                <span>Data-driven insights</span>
              </div>
            </div>
          </div>

          <div className="auth-brand-footer">
            AgriWatch © 2026
          </div>
        </div>
      </div>

      {/* Right authentication panel */}
      <div className="auth-form-panel">
        <div className="auth-mobile-brand">
          <Link to="/login" className="auth-brand">
            <div className="auth-brand-icon">
              🌱
            </div>

            <div>
              <div className="auth-brand-name">
                AgriWatch
              </div>

              <div className="auth-brand-tagline">
                Smart Crop Monitoring
              </div>
            </div>
          </Link>
        </div>

        <div className="auth-card">
          {showBackToLogin && (
            <Link
              to="/login"
              className="auth-back-link"
            >
              ← Back to login
            </Link>
          )}

          <div className="auth-heading">
            <h1>{title}</h1>

            {subtitle && (
              <p>{subtitle}</p>
            )}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;