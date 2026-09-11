import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import AuthInput from "../../components/auth/AuthInput";
import PasswordInput from "../../components/auth/PasswordInput";
import AuthLayout from "../../components/auth/AuthLayout";

import { loginUser } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
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
      const data =
        await loginUser(form);

      login(data);

      navigate("/dashboard");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to log in. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your AgriWatch account."
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
        />

        <div className="auth-forgot-row">
          <Link
            to="/forgot-password"
            className="auth-link"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          className="auth-button"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="button-spinner" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <div className="auth-divider">
        <span>New to AgriWatch?</span>
      </div>

      <Link
        to="/signup"
        className="auth-secondary-button"
      >
        Create an account
      </Link>
    </AuthLayout>
  );
};

export default Login;