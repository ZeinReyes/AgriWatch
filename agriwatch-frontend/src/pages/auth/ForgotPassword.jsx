import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import AuthInput from "../../components/auth/AuthInput";
import AuthLayout from "../../components/auth/AuthLayout";

import { forgotPassword } from "../../services/authService";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await forgotPassword({
        email,
      });

      navigate(
        `/verify-reset-otp?email=${encodeURIComponent(
          email
        )}`
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to process your request."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a verification code to reset your password."
      showBackToLogin
    >
      <div className="otp-icon">
        🔐
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
        <AuthInput
          label="Email address"
          type="email"
          name="email"
          value={email}
          onChange={(event) =>
            setEmail(
              event.target.value
            )
          }
          placeholder="you@example.com"
        />

        <button
          type="submit"
          className="auth-button"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="button-spinner" />
              Sending code...
            </>
          ) : (
            "Send verification code"
          )}
        </button>
      </form>

      <p className="auth-footer">
        Remember your password?{" "}
        <Link
          to="/login"
          className="auth-link"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default ForgotPassword;