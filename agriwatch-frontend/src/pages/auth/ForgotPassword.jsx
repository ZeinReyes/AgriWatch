import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CircleAlert, KeyRound } from "lucide-react";

import AuthInput from "../../components/auth/AuthInput";
import AuthLayout from "../../components/auth/AuthLayout";

import { forgotPassword } from "../../services/authService";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await forgotPassword({
        email: email.trim(),
      });

      navigate(
        `/verify-reset-otp?email=${encodeURIComponent(email.trim())}`
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to process your request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email address and we'll send you a verification code to reset your password."
      showBackToLogin
    >
      <div className="otp-icon" aria-hidden="true">
        <KeyRound size={28} strokeWidth={1.8} />
      </div>

      {error && (
        <div className="auth-error" role="alert">
          <CircleAlert size={18} strokeWidth={2} />
          <span>{error}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <AuthInput
          label="Email address"
          type="email"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
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
        <Link to="/login" className="auth-link">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default ForgotPassword;