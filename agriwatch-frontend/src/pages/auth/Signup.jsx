import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CircleAlert } from "lucide-react";

import AuthInput from "../../components/auth/AuthInput";
import PasswordInput from "../../components/auth/PasswordInput";
import PasswordStrength from "../../components/auth/PasswordStrength";
import AuthLayout from "../../components/auth/AuthLayout";

import { registerUser } from "../../services/authService";

const Signup = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await registerUser({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      navigate(
        `/verify-email?email=${encodeURIComponent(
          form.email.trim()
        )}`
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to create your account. Please review your information and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Set up your AgriWatch account to monitor your farm and crops."
    >
      {error && (
        <div className="auth-error" role="alert">
          <CircleAlert size={18} strokeWidth={2} />
          <span>{error}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <AuthInput
          label="Full name"
          name="full_name"
          value={form.full_name}
          onChange={handleChange}
          placeholder="Enter your full name"
          autoComplete="name"
          required
        />

        <AuthInput
          label="Email address"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        <PasswordInput
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Create a password"
          autoComplete="new-password"
        />

        <PasswordStrength password={form.password} />

        <button
          type="submit"
          className="auth-button"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="button-spinner" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <p className="auth-footer">
        Already have an account?{" "}
        <Link to="/login" className="auth-link">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Signup;