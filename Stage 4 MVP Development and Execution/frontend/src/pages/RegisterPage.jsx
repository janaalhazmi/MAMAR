import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { registerUser } from "../services/api";
import logo from "../assets/mamar-logo.svg";

function RegisterPage() {
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setError("");
    if (!role) {
      setError("Please select your account type.");
      return;
    }
    const form = event.currentTarget;
    const providerId = form.elements.registerProviderId?.value;
    if (role !== "contractor" &&
        (!Number.isSafeInteger(Number(providerId)) || Number(providerId) < 1)) {
      setError("Please enter a valid provider ID.");
      return;
    }
    const user = {
      full_name: form.registerFullName.value.trim(),
      email: form.registerEmail.value.trim().toLowerCase(),
      password: form.registerPassword.value,
      role,
      provider_id: role === "contractor" ? null : Number(providerId),
    };
    setLoading(true);
    try {
      await registerUser(user);
      localStorage.removeItem("mamarUsers");
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="signup-page">
      <header className="signup-header">
        <Link to="/">
          <img
            src={logo}
            alt="MAMAR Logo"
            className="signup-header-logo"
          />
        </Link>

        <div className="signup-header-buttons">
          <Link
            to="/login"
            className="signup-nav-btn signup-signin"
          >
            Sign in →
          </Link>

          <Link
            to="/register"
            className="signup-nav-btn signup-start"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="signup-main">
        <section className="signup-card">
          <h1>Create Account</h1>

          <p className="signup-subtitle">
            Get started with MAMAR
          </p>

          <div className="signup-role-buttons">
            <button
              type="button"
              className={`signup-role-btn ${
                role === "contractor" ? "active" : ""
              }`}
              onClick={() => setRole("contractor")}
            >
              Contractor
            </button>

            <button
              type="button"
              className={`signup-role-btn ${
                role === "provider" ? "active" : ""
              }`}
              onClick={() => setRole("provider")}
            >
              Provider
            </button>

            <button
              type="button"
              className={`signup-role-btn ${
                role === "worker" ? "active" : ""
              }`}
              onClick={() => setRole("worker")}
            >
              Field Worker
            </button>
          </div>

          {role === "worker" && (
            <p className="field-worker-message">
              Enter the email address sent to you by your service provider.
            </p>
          )}

          <form
            className="signup-form"
            onSubmit={handleSubmit}
          >
            <div className="signup-field">
              <label htmlFor="registerFullName">Full name</label>
              <input id="registerFullName" name="registerFullName"
                type="text" autoComplete="name" maxLength={100}
                placeholder="Enter your full name" required />
            </div>

            {(role === "provider" || role === "worker") && (
              <div className="signup-field">
                <label htmlFor="registerProviderId">Provider ID</label>
                <input id="registerProviderId" name="registerProviderId"
                  type="number" min="1" step="1" required
                  placeholder="Enter your existing provider ID" />
              </div>
            )}

            <div className="signup-field">
              <label htmlFor="registerEmail">
                Email
              </label>

              <input
                id="registerEmail"
                name="registerEmail"
                type="email"
                placeholder="you@gmail.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="signup-field">
              <label htmlFor="registerPassword">
                Password
              </label>

              <div className="signup-password-wrapper">
                <input
                  id="registerPassword"
                  name="registerPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create your password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                />

                <button
                  type="button"
                  className="signup-eye-btn"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  ◉
                </button>
              </div>
            </div>

            {error && <p role="alert">{error}</p>}
            <button
              disabled={loading}
              type="submit"
              className="signup-submit"
            >
              {loading ? "Creating account..." : "Create Account →"}
            </button>
          </form>

          <p className="signup-existing">
            Already have an account?
          </p>

          <Link
            to="/login"
            className="signup-login-link"
          >
            Sign in
          </Link>
        </section>
      </main>
    </div>
  );
}

export default RegisterPage;