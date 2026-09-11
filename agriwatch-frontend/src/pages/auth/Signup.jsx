import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

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

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleChange = (
    event
  ) => {
    setForm({
      ...form,
      [event.target.name]:
        event.target.value,
    });
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await registerUser(form);

      navigate(
        `/verify-email?email=${encodeURIComponent(
          form.email
        )}`
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to create your account."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start monitoring your tomato crops with AgriWatch."
    >
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
          label="Full name"
          name="full_name"
          value={form.full_name}
          onChange={handleChange}
          placeholder="Enter your full name"
          autoComplete="name"
        />

        <AuthInput
          label="Email address"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
        />

        <PasswordInput
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Create a password"
          autoComplete="new-password"
        />

        <PasswordStrength
          password={form.password}
        />

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

export default Signup;