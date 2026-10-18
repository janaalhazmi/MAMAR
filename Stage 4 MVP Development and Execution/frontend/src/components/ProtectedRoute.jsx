import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getSession, logout } from "../services/auth";

export default function ProtectedRoute({ children, roles }) {
  const [expired, setExpired] = useState(false);
  const session = getSession();
  const expiresAt = session?.expiresAt;

  useEffect(() => {
    if (!expiresAt) return;
    const timer = setTimeout(() => {
      logout();
      setExpired(true);
    }, Math.max(0, expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [expiresAt]);

  if (expired || !session) return <Navigate to="/login" replace />;
  if (!roles.includes(session.user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
