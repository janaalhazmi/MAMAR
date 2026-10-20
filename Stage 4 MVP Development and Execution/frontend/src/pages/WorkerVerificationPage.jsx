import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import logo from "../assets/mamar-logo.svg";


function WorkerVerificationPage() {
  const navigate = useNavigate();

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

      if (registration.role !== "worker") {
        navigate("/register", { replace: true });
      }
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

    // Backend worker verification will be connected later.
    setError(
      "Passcode verification is not connected yet. Please try again later."
    );
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
        <section className="signup-card verification-card worker-verification-card">
          <h1>Create Account</h1>

          <span className="worker-role-badge">Field Worker</span>

          <p className="signup-subtitle">
            Enter the Passcode that was sent to your email address by your
            service provider.
          </p>

          <form className="signup-form" onSubmit={handleSubmit}>
            <div className="signup-field">
              <label htmlFor="workerPasscode">Passcode</label>

              <input
                id="workerPasscode"
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

export default WorkerVerificationPage;