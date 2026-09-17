import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  CheckCircle2,
  CircleAlert,
  LockKeyhole,
} from "lucide-react";

import AuthInput from "../../components/auth/AuthInput";
import PasswordInput from "../../components/auth/PasswordInput";
import PasswordStrength from "../../components/auth/PasswordStrength";
import AuthLayout from "../../components/auth/AuthLayout";

import { resetPassword } from "../../services/authService";

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const email = params.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!email) {
      setError(
        "Your reset session is incomplete. Please request a new verification code."
      );
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    const otp = sessionStorage.getItem("agriwatch_reset_otp");

    if (!otp) {
      setError(
        "Your password reset session has expired. Please request a new verification code."
      );
      return;
    }

    setLoading(true);

    try {
      await resetPassword({
        email,
        otp,
        password,
      });

      sessionStorage.removeItem("agriwatch_reset_otp");
      sessionStorage.removeItem("agriwatch_reset_email");

      setSuccess(
        "Your password has been reset successfully. Redirecting you to sign in..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to reset your password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Create a new password for your AgriWatch account."
      showBackToLogin
    >
      <div className="otp-icon" aria-hidden="true">
        <LockKeyhole size={28} strokeWidth={1.8} />
      </div>

      {error && (
        <div className="auth-error" role="alert">
          <CircleAlert size={18} strokeWidth={2} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="auth-success" role="status">
          <CheckCircle2 size={18} strokeWidth={2} />
          <span>{success}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <AuthInput
          label="Email address"
          type="email"
          name="email"
          value={email}
          disabled
          autoComplete="email"
        />

        <PasswordInput
          name="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Create a new password"
          autoComplete="new-password"
        />

        <PasswordStrength password={password} />

        <div className="auth-input-group">
          <label htmlFor="confirmPassword">
            Confirm new password
          </label>

          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
            placeholder="Re-enter your new password"
            autoComplete="new-password"
            disabled={loading}
            required
          />
        </div>

        <button
          type="submit"
          className="auth-button"
          disabled={loading || Boolean(success)}
        >
          {loading ? (
            <>
              <span className="button-spinner" />
              Resetting password...
            </>
          ) : (
            "Reset password"
          )}
        </button>
      </form>

      <p className="auth-footer">
        Remember your password?{" "}
        <Link to="/login" className="auth-link">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default ResetPassword;