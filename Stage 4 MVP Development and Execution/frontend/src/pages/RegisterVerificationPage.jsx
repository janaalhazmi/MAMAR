import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import logo from "../assets/mamar-logo.svg";
import {
  registerAccount,
  sendPasscode,
} from "../services/api";

function RegisterVerificationPage() {
  const navigate = useNavigate();

  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

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
      }
    } catch {
      navigate("/register", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;

    const timer = setTimeout(() => {
      setResendSeconds((seconds) => seconds - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendSeconds]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!/^\d{6}$/.test(passcode)) {
      setError("Please enter the 6-digit passcode.");
      return;
    }

    const saved = sessionStorage.getItem("mamarPendingRegistration");

    if (!saved) {
      navigate("/register", { replace: true });
      return;
    }

    setIsSubmitting(true);

    try {
      const registration = JSON.parse(saved);

      await registerAccount(registration, passcode);

      sessionStorage.removeItem("mamarPendingRegistration");

      navigate("/login", {
        replace: true,
        state: {
          message: "Account created successfully. Please sign in.",
        },
      });
    } catch (requestError) {
      setError(requestError.message || "Unable to create your account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendPasscode = async () => {
    if (resendSeconds > 0 || isResending) return;

    const saved = sessionStorage.getItem("mamarPendingRegistration");

    if (!saved) {
      navigate("/register", { replace: true });
      return;
    }

    setError("");
    setSuccess("");
    setIsResending(true);

    try {
      const registration = JSON.parse(saved);

      await sendPasscode(registration.email);

      setResendSeconds(60);
      setSuccess("A new passcode has been sent to your email.");
    } catch (requestError) {
      setError(requestError.message || "Unable to resend the passcode.");
    } finally {
      setIsResending(false);
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
          <Link to="/login" className="signup-nav-btn signup-signin">
            Sign in →
          </Link>

          <Link to="/register" className="signup-nav-btn signup-start">
            Get Started
          </Link>
        </nav>
      </header>

      <main className="signup-main">
        <section className="signup-card verification-card">
          <h1>Create Account</h1>

          <p className="signup-subtitle">
            Enter the passcode that was sent to your email address.
          </p>

          <form className="signup-form" onSubmit={handleSubmit}>
            <div className="signup-field">
              <label htmlFor="verificationPasscode">Passcode</label>

              <input
                id="verificationPasscode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter your 6-digit passcode"
                value={passcode}
                onChange={(event) =>
                  setPasscode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                maxLength={6}
                required
              />
            </div>

            {error && (
              <p className="signup-error" role="alert">
                {error}
              </p>
            )}

            {success && (
              <p className="signup-success" role="status">
                {success}
              </p>
            )}

            <button
              type="submit"
              className="signup-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Create Account →"}
            </button>

            <button
              type="button"
              className="verification-back"
              onClick={handleResendPasscode}
              disabled={resendSeconds > 0 || isResending}
            >
              {isResending
                ? "Sending..."
                : resendSeconds > 0
                  ? `Resend passcode in ${resendSeconds}s`
                  : "Resend Passcode"}
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