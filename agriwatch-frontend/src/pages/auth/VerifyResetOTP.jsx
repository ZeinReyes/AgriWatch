import { useState } from "react";
import {
  Link,
  useLocation,
} from "react-router-dom";

import AuthLayout from "../../components/auth/AuthLayout";

import {
  verifyResetOTP,
} from "../../services/authService";

const VerifyResetOTP = () => {
  const location = useLocation();

  const params = new URLSearchParams(
    location.search
  );

  const email = params.get("email") || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOtpChange = (event) => {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 6);

    setOtp(value);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!email) {
      setError(
        "Email address is missing. Please request a new verification code."
      );
      return;
    }

    if (otp.length !== 6) {
      setError(
        "Please enter the complete 6-digit verification code."
      );
      return;
    }

    setLoading(true);

    try {
      await verifyResetOTP({
        email,
        otp,
      });

      /*
       * Store the verified reset information.
       */
      sessionStorage.setItem(
        "agriwatch_reset_otp",
        otp
      );

      sessionStorage.setItem(
        "agriwatch_reset_email",
        email
      );

      /*
       * Navigate using a full page navigation.
       *
       * This guarantees that ResetPassword.jsx
       * is mounted immediately instead of requiring
       * a manual browser refresh.
       */
      window.location.assign(
        `/reset-password?email=${encodeURIComponent(
          email
        )}`
      );

    } catch (error) {
      console.error(
        "OTP verification error:",
        error
      );

      setError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Invalid or expired verification code."
      );

      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Enter verification code"
      subtitle="Enter the 6-digit code sent to your email address."
      showBackToLogin
    >
      <div className="otp-icon">
        🔢
      </div>

      <div className="otp-email">
        <span>Code sent to</span>

        <strong>
          {email}
        </strong>
      </div>

      {error && (
        <div className="auth-error">
          <span>!</span>
          {error}
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
            autoFocus
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
            "Verify code"
          )}
        </button>
      </form>

      <p className="auth-footer">
        Need a new code?{" "}

        <Link
          to="/forgot-password"
          className="auth-link"
        >
          Request another code
        </Link>
      </p>
    </AuthLayout>
  );
};

export default VerifyResetOTP;