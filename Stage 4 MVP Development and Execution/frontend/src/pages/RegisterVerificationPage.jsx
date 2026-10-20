import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import logo from "../assets/mamar-logo.svg";


function RegisterVerificationPage() {
  const navigate = useNavigate();

  const [role, setRole] = useState("contractor");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("mamarPendingRegistration");

    if (!saved) {
      navigate("/register", { replace: true });
      return;
    }

    try {
      const registration = JSON.parse(saved);

      if (
        registration.role !== "contractor" &&
        registration.role !== "provider"
      ) {
        navigate("/register", { replace: true });
        return;
      }

      setRole(registration.role);
    } catch {
      navigate("/register", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    if (!passcode.trim()) {
      setError("Please enter your passcode.");
      return;
    }

    // Backend passcode verification will be connected later.
    setError(
      "Passcode verification is not connected yet. Please try again later."
    );
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setPasscode("");
    setError("");

    const saved = sessionStorage.getItem("mamarPendingRegistration");

    if (saved) {
      try {
        const registration = JSON.parse(saved);

        registration.role = newRole;
        registration.provider_id = null;

        sessionStorage.setItem(
          "mamarPendingRegistration",
          JSON.stringify(registration)
        );
      } catch {
        navigate("/register");
      }
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
        <section className="signup-card verification-card">
          <h1>Create Account</h1>

          <p className="signup-subtitle">
            Enter the Passcode that was sent to your email address
          </p>

          <div className="verification-role-buttons">
            <button
              type="button"
              className={`signup-role-btn ${
                role === "contractor" ? "active" : ""
              }`}
              onClick={() => handleRoleChange("contractor")}
            >
              Contractor
            </button>

            <button
              type="button"
              className={`signup-role-btn ${
                role === "provider" ? "active" : ""
              }`}
              onClick={() => handleRoleChange("provider")}
            >
              Provider
            </button>
          </div>

          <form className="signup-form" onSubmit={handleSubmit}>
            <div className="signup-field">
              <label htmlFor="verificationPasscode">Passcode</label>

              <input
                id="verificationPasscode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter your passcode"
                value={passcode}
                onChange={(event) => setPasscode(event.target.value)}
                required
              />
            </div>

            {error && (
              <p className="signup-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="signup-submit">
              Create Account →
            </button>

            <button
              type="button"
              className="verification-back"
              onClick={() => navigate("/register")}
            >
              Go back
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default RegisterVerificationPage;