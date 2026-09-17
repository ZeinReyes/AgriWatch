import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Leaf,
  ShieldCheck,
  Sprout,
} from "lucide-react";

const AuthLayout = ({
  children,
  title,
  subtitle,
  showBackToLogin = false,
}) => {
  return (
    <div className="auth-page">
      {/* Left branding panel */}
      <aside className="auth-brand-panel">
        <div className="auth-brand-decoration auth-decoration-top" />
        <div className="auth-brand-decoration auth-decoration-bottom" />

        <div className="auth-brand-grid" />

        <div className="auth-brand-content">
          <Link to="/login" className="auth-brand">
            <div className="auth-brand-icon" aria-hidden="true">
              <Leaf size={23} strokeWidth={2} />
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
            <div className="auth-eyebrow">
              <span className="auth-eyebrow-line" />
              SMART AGRICULTURE
            </div>

            <h2>
              Monitor your crops.
              <br />
              Protect your harvest.
            </h2>

            <p>
              AgriWatch helps farmers monitor tomato crop
              conditions, identify potential risks, and stay
              informed through timely alerts and insights.
            </p>

            <div className="auth-features">
              <div className="auth-feature">
                <span
                  className="auth-feature-icon"
                  aria-hidden="true"
                >
                  <CheckCircle2 size={15} strokeWidth={2} />
                </span>

                <span>Smart crop monitoring</span>
              </div>

              <div className="auth-feature">
                <span
                  className="auth-feature-icon"
                  aria-hidden="true"
                >
                  <CheckCircle2 size={15} strokeWidth={2} />
                </span>

                <span>Real-time crop alerts</span>
              </div>

              <div className="auth-feature">
                <span
                  className="auth-feature-icon"
                  aria-hidden="true"
                >
                  <CheckCircle2 size={15} strokeWidth={2} />
                </span>

                <span>Data-driven insights</span>
              </div>
            </div>

            <div className="auth-brand-status">
              <div className="auth-brand-status-icon">
                <Sprout size={17} strokeWidth={1.9} />
              </div>

              <div>
                <span className="auth-brand-status-label">
                  CROP MONITORING
                </span>

                <strong>
                  Your farm, connected
                </strong>
              </div>
            </div>
          </div>

          <div className="auth-brand-footer">
            <ShieldCheck size={14} strokeWidth={1.8} />
            <span>AgriWatch © 2026</span>
          </div>
        </div>
      </aside>

      {/* Right authentication panel */}
      <main className="auth-form-panel">
        <div className="auth-mobile-brand">
          <Link to="/login" className="auth-brand">
            <div className="auth-brand-icon" aria-hidden="true">
              <Leaf size={21} strokeWidth={2} />
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
              <ArrowLeft size={15} strokeWidth={2} />
              <span>Back to login</span>
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
      </main>
    </div>
  );
};

export default AuthLayout;