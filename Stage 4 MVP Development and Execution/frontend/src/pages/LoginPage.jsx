import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { loginUser } from "../services/api";
import { logout, saveSession } from "../services/auth";
import Header from "../components/Header";
import Button from "../components/Button";
import logo from "../assets/mamar-logo.svg";

const roles = [
  {
    id: "contractor",
    label: "Contractor",
  },
  {
    id: "provider",
    label: "Provider",
  },
  {
    id: "worker",
    label: "Field Worker",
  },
];

const dashboardRoutes = {
  contractor: "/contractor-dashboard",
  provider: "/provider-dashboard",
};

function LoginPage() {
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  // A message from the page that opened the login page, for example after
  // creating an account or when the session has ended.
  const notice = useLocation().state?.message;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setError("");
    if (!role) {
      setError("Please select your account type.");
      return;
    }
    const form = event.currentTarget;
    const email = form.loginEmail.value.trim().toLowerCase();
    const password = form.loginPassword.value;
    setLoading(true);
    try {
      logout();
      const data = await loginUser(email, password);
      if (data.user.role !== role) {
        throw new Error("The selected account type does not match your account.");
      }
      if (!dashboardRoutes[data.user.role]) {
        throw new Error("The Field Worker dashboard is not available yet.");
      }
      saveSession(data);
      navigate(dashboardRoutes[data.user.role], { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="login-page">
      <Header />

      <main className="login-main">
        <section className="login-card">
          <img
            src={logo}
            alt="MAMAR"
            className="login-logo"
          />

          <h1>Welcome back</h1>

          <div className="role-buttons">
            {roles.map((accountRole) => (
              <button
                key={accountRole.id}
                type="button"
                className={`role-btn ${
                  role === accountRole.id ? "active" : ""
                }`}
                onClick={() => setRole(accountRole.id)}
              >
                {accountRole.label}
              </button>
            ))}
          </div>

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >
            <div className="login-field">
              <label htmlFor="loginEmail">
                Email
              </label>

              <input
                id="loginEmail"
                name="loginEmail"
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
            </div>

            <div className="login-field">
              <div className="password-heading">
                <label htmlFor="loginPassword">
                  Password
                </label>

                <a href="#forgot-password">
                  Forgot?
                </a>
              </div>

              <div className="password-input">
                <input
                  id="loginPassword"
                  name="loginPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="eye-btn"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                >
                  ◉
                </button>
              </div>
            </div>

            {error && <p role="alert">{error}</p>}
            {!error && notice && <p role="status">{notice}</p>}
            <Button
              disabled={loading}
              type="submit"
              className="login-submit"
            >
              {loading ? "Signing in..." : "Login now"}
            </Button>
          </form>

          <div className="login-or">
            Or
          </div>

          <Link
            to="/register"
            className="create-account"
          >
            Create account
          </Link>
        </section>
      </main>
    </div>
  );
}

export default LoginPage;
