import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import AuthLayout from "../../components/auth/AuthLayout";

import {
  verifyEmail,
  resendVerification,
} from "../../services/authService";

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const params =
    new URLSearchParams(
      location.search
    );

  const initialEmail =
    params.get("email") || "";

  const [email, setEmail] =
    useState(initialEmail);

  const [otp, setOtp] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [resending, setResending] =
    useState(false);

  const [
    countdown,
    setCountdown,
  ] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(
        (previous) =>
          previous - 1
      );
    }, 1000);

    return () =>
      clearInterval(timer);
  }, [countdown]);

  const handleOtpChange = (
    event
  ) => {
    const value =
      event.target.value
        .replace(/\D/g, "")
        .slice(0, 6);

    setOtp(value);
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await verifyEmail({
        email,
        otp,
      });

      setSuccess(
        "Your email has been verified successfully."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Invalid or expired verification code."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    setError("");
    setSuccess("");
    setResending(true);

    try {
      await resendVerification({
        email,
      });

      setSuccess(
        "A new verification code has been sent to your email."
      );

      setCountdown(60);
      setOtp("");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to resend the verification code."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="We've sent a 6-digit verification code to your email address."
      showBackToLogin
    >
      <div className="otp-icon">
        ✉
      </div>

      <div className="otp-email">
        <span>Code sent to</span>
        <strong>{email}</strong>
      </div>

      {error && (
        <div className="auth-error">
          <span>!</span>
          {error}
        </div>
      )}

      {success && (
        <div className="auth-success">
          <span>✓</span>
          {success}
        </div>
      )}

      <form
        className="auth-form"
        onSubmit={handleSubmit}
      >
        <div className="auth-input-group">
          <label htmlFor="otp">
            Verification code
          </label>

          <input
            id="otp"
            name="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            onChange={handleOtpChange}
            placeholder="000000"
            maxLength={6}
            className="otp-input"
            required
          />
        </div>

        <button
          type="submit"
          className="auth-button"
          disabled={
            loading ||
            otp.length !== 6
          }
        >
          {loading ? (
            <>
              <span className="button-spinner" />
              Verifying...
            </>
          ) : (
            "Verify email"
          )}
        </button>
      </form>

      <div className="resend-section">
        <p>
          Didn't receive the code?
        </p>

        <button
          type="button"
          className="text-button"
          onClick={handleResend}
          disabled={
            resending ||
            countdown > 0
          }
        >
          {resending
            ? "Sending..."
            : countdown > 0
            ? `Resend code in ${countdown}s`
            : "Resend verification code"}
        </button>
      </div>

      <p className="auth-footer">
        Wrong email?{" "}
        <Link
          to="/signup"
          className="auth-link"
        >
          Create a new account
        </Link>
      </p>
    </AuthLayout>
  );
};

export default VerifyEmail;