import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getSession, logout, verifySession } from "../services/auth";

const SESSION_ENDED = "Your session has ended. Please sign in again.";
const SIGN_IN_FIRST = "Please sign in to continue.";

export default function ProtectedRoute({ children, roles }) {
  const [ended, setEnded] = useState(false);
  const session = getSession();
  const expiresAt = session?.expiresAt;
  const token = session?.access_token;

  useEffect(() => {
    if (!expiresAt) return;

    const timer = setTimeout(() => {
      logout();
      setEnded(true);
    }, Math.max(0, expiresAt - Date.now()));

    return () => clearTimeout(timer);
  }, [expiresAt]);

  useEffect(() => {
    if (!token) return;

    let active = true;

    verifySession().then((valid) => {
      if (active && !valid) setEnded(true);
    });

    return () => {
      active = false;
    };
  }, [token]);

  if (ended) {
    return <Navigate to="/login" replace state={{ message: SESSION_ENDED }} />;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ message: SIGN_IN_FIRST }} />;
  }

  if (!roles.includes(session.user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}