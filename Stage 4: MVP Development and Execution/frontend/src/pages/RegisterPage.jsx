import { useState } from "react";
import { Link } from "react-router-dom";

import logo from "../assets/mamar-logo.svg";

function RegisterPage() {
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!role) {
      alert("Please select your account type.");
      return;
    }

    // FastAPI register integration will be added later.
    console.log("Register role:", role);
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
                role === "field-worker" ? "active" : ""
              }`}
              onClick={() => setRole("field-worker")}
            >
              Field Worker
            </button>

          </div>


          {role === "field-worker" && (
            <p className="field-worker-message">
              Enter the email address sent to you by your service provider.
            </p>
          )}


          <form
            className="signup-form"
            onSubmit={handleSubmit}
          >

            <div className="signup-field">

              <label htmlFor="registerEmail">
                Email
              </label>

              <input
                id="registerEmail"
                type="email"
                placeholder="you@gmail.com"
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
                  type={showPassword ? "text" : "password"}
                  placeholder="Create your password"
                  required
                />

                <button
                  type="button"
                  className="signup-eye-btn"
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
              className="signup-submit"
            >
              Create Account →
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
