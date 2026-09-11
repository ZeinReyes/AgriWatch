import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
        "Your password reset session has expired. Please request a new OTP."
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

      setSuccess(
        "Your password has been reset successfully. You can now log in."
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
    <AuthLayout>
      <div className="auth-form-container">
        <div className="auth-header">
          <h1>Reset Password</h1>

          <p>
            Create a new password for your AgriWatch account.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          {success && (
            <div className="auth-success">
              {success}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">
              Email Address
            </label>

            <input
              id="email"
              type="email"
              value={email}
              disabled
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              New Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Enter your new password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              Confirm New Password
            </label>

            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Resetting Password..." : "Reset Password"}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login">
            Back to Login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;