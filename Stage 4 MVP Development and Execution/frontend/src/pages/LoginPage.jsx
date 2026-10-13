import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import logo from "../assets/mamar-logo.svg";

function LoginPage() {
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!role) {
      alert("Please select your account type.");
      return;
    }

    const email = event.target.loginEmail.value.trim().toLowerCase();
    const password = event.target.loginPassword.value;

    const savedUsers = JSON.parse(
      localStorage.getItem("mamarUsers") || "[]"
    );

    const user = savedUsers.find(
      (savedUser) =>
        savedUser.email === email &&
        savedUser.password === password
    );

    if (!user) {
      alert("Invalid email or password.");
      return;
    }

    if (user.role !== role) {
      alert("The selected account type does not match your account.");
      return;
    }

    if (user.role === "contractor") {
      navigate("/contractor-dashboard");
      return;
    }

    if (user.role === "provider") {
      navigate("/provider-dashboard");
      return;
    }

    if (user.role === "field-worker") {
      alert("Field Worker dashboard will be added later.");
      return;
    }
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <Link to="/">
          <img
            src={logo}
            alt="MAMAR Logo"
            className="login-header-logo"
          />
        </Link>

        <div className="login-header-buttons">
          <Link
            to="/login"
            className="login-nav-btn signin-btn"
          >
            Sign in →
          </Link>

          <Link
            to="/register"
            className="login-nav-btn start-btn"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="login-main">
        <section className="login-card">
          <img
            src={logo}
            alt="MAMAR"
            className="login-logo"
          />

          <h1>Welcome back</h1>

          <div className="role-buttons">
            <button
              type="button"
              className={`role-btn ${
                role === "contractor" ? "active" : ""
              }`}
              onClick={() => setRole("contractor")}
            >
              Contractor
            </button>

            <button
              type="button"
              className={`role-btn ${
                role === "provider" ? "active" : ""
              }`}
              onClick={() => setRole("provider")}
            >
              Provider
            </button>

            <button
              type="button"
              className={`role-btn ${
                role === "field-worker" ? "active" : ""
              }`}
              onClick={() => setRole("field-worker")}
            >
              Field Worker
            </button>
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
                    setShowPassword(!showPassword)
                  }
                >
                  ◉
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-submit"
            >
              Login now
            </button>
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
