import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import logo from "../assets/mamar-logo.svg";

function RegisterPage() {
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    if (!role) {
      setError("Please select your account type.");
      return;
    }

    const form = event.currentTarget;
    const fullName = form.elements.registerFullName.value.trim();
    const email = form.elements.registerEmail.value.trim().toLowerCase();
    const password = form.elements.registerPassword.value;

    const providerId = form.elements.registerProviderId?.value;

    if (
      (role === "provider" || role === "worker") &&
      (!Number.isSafeInteger(Number(providerId)) ||
        Number(providerId) < 1)
    ) {
      setError("Please enter a valid provider ID.");
      return;
    }

    if (!fullName || !email || !password) {
      setError("Please complete all required fields.");
      return;
    }

    const registration = {
      full_name: fullName,
      email,
      password,
      role,
      provider_id:
        role === "contractor" ? null : Number(providerId),
    };

    sessionStorage.setItem(
      "mamarPendingRegistration",
      JSON.stringify(registration)
    );

    if (role === "worker") {
      navigate("/register/worker-verification");
    } else {
      navigate("/register/verify");
    }
  };

  return (
    <div className="signup-page">
      <header className="signup-header">
        <Link to="/" aria-label="MAMAR Home">
          <img
            src={logo}
            alt="MAMAR Logo"
            className="signup-header-logo"
          />
        </Link>

        <nav className="signup-header-buttons">
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
        </nav>
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
              onClick={() => {
                setRole("contractor");
                setError("");
              }}
            >
              Contractor
            </button>

            <button
              type="button"
              className={`signup-role-btn ${
                role === "provider" ? "active" : ""
              }`}
              onClick={() => {
                setRole("provider");
                setError("");
              }}
            >
              Provider
            </button>

            <button
              type="button"
              className={`signup-role-btn ${
                role === "worker" ? "active" : ""
              }`}
              onClick={() => {
                setRole("worker");
                setError("");
              }}
            >
              Field Worker
            </button>
          </div>

          {role === "worker" && (
            <p className="field-worker-message">
              Enter the email address sent to you by your service
              provider.
            </p>
          )}

          <form className="signup-form" onSubmit={handleSubmit}>
            <div className="signup-field">
              <label htmlFor="registerFullName">Full name</label>

              <input
                id="registerFullName"
                name="registerFullName"
                type="text"
                autoComplete="name"
                maxLength={100}
                placeholder="Enter your full name"
                required
              />
            </div>

            {(role === "provider" || role === "worker") && (
              <div className="signup-field">
                <label htmlFor="registerProviderId">
                  Provider ID
                </label>

                <input
                  id="registerProviderId"
                  name="registerProviderId"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Enter your existing provider ID"
                  required
                />
              </div>
            )}

            <div className="signup-field">
              <label htmlFor="registerEmail">Email</label>

              <input
                id="registerEmail"
                name="registerEmail"
                type="email"
                autoComplete="email"
                placeholder="you@gmail.com"
                required
              />
            </div>

            <div className="signup-field">
              <label htmlFor="registerPassword">Password</label>

              <div className="signup-password-wrapper">
                <input
                  id="registerPassword"
                  name="registerPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Create your password"
                  minLength={6}
                  required
                />

                <button
                  type="button"
                  className="signup-eye-btn"
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  onClick={() => setShowPassword((current) => !current)}
                >
                  ◉
                </button>
              </div>
            </div>

            {error && (
              <p className="signup-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="signup-submit">
              Create Account →
            </button>
          </form>

          <p className="signup-existing">
            Already have an account?
          </p>

          <Link to="/login" className="signup-login-link">
            Sign in
          </Link>
        </section>
      </main>
    </div>
  );
}

export default RegisterPage;