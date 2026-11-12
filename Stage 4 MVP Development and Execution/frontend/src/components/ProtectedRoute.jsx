import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  getSession,
  logout,
  verifySession,
  requestSession,
} from "../services/auth";

const SESSION_ENDED = "Your session has ended. Please sign in again.";
const SIGN_IN_FIRST = "Please sign in to continue.";

export default function ProtectedRoute({ children, roles }) {
  const [ended, setEnded] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [, setSessionVersion] = useState(0);

  const hadSession = useRef(false);

  const session = getSession();
  const expiresAt = session?.expiresAt;
  const token = session?.access_token;

  // Request an existing session from other open tabs.
  useEffect(() => {
    let active = true;

    requestSession().finally(() => {
      if (active) {
        setCheckingSession(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  // Listen for logout and account changes from other tabs.
  useEffect(() => {
    function handleLogout() {
      setEnded(true);
    }

    function handleSessionUpdate() {
      setSessionVersion((version) => version + 1);
    }

    window.addEventListener("mamar:logout", handleLogout);
    window.addEventListener(
      "mamar:session-user-updated",
      handleSessionUpdate
    );

    return () => {
      window.removeEventListener("mamar:logout", handleLogout);
      window.removeEventListener(
        "mamar:session-user-updated",
        handleSessionUpdate
      );
    };
  }, []);

  // Remember whether this tab previously had a session.
  useEffect(() => {
    if (session) {
      hadSession.current = true;
    }
  }, [token]);

  // Detect manual deletion of sessionStorage while the page is open.
  useEffect(() => {
    const interval = setInterval(() => {
      if (hadSession.current && !getSession()) {
        setEnded(true);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Logs out when the token expires.
  useEffect(() => {
    if (!expiresAt) return;

    const timer = setTimeout(() => {
      logout();
      setEnded(true);
    }, Math.max(0, expiresAt - Date.now()));

    return () => clearTimeout(timer);
  }, [expiresAt]);

  // Verify the token with the backend.
  useEffect(() => {
    if (!token) return;

    let active = true;

    verifySession().then((valid) => {
      if (active && !valid) {
        setEnded(true);
      }
    });

    return () => {
      active = false;
    };
  }, [token]);

  // Wait until other tabs have had a chance to share their session.
  if (checkingSession) {
    return null;
  }

  if (ended) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ message: SESSION_ENDED }}
      />
    );
  }

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ message: SIGN_IN_FIRST }}
      />
    );
  }

  if (!roles.includes(session.user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}