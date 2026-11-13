import { useEffect, useState } from "react";
import NotificationBell from "./NotificationBell";
import { Link } from "react-router-dom";
import logo from "../assets/mamar-logo.svg";
import { logout, getSession } from "../services/auth";
import { getCurrentUser, API_BASE_URL } from "../services/api";
import Icon from "./Icons";

const NAV = [
  {
    key: "dashboard",
    to: "/field-worker-dashboard",
    icon: "dashboard",
    label: "Dashboard",
  },
  {
    key: "team",
    to: "/field-execution",
    icon: "providers",
    label: "Field Team",
  },
  {
    key: "attendance",
    to: "/attendance",
    icon: "clock",
    label: "Attendance",
  },
];

function getPictureUrl(user) {
  const picture =
    user?.profile_picture_url ||
    user?.profile_picture ||
    user?.avatar_url;

  if (!picture || typeof picture !== "string") return null;

  if (
    picture.startsWith("http://") ||
    picture.startsWith("https://") ||
    picture.startsWith("data:")
  ) {
    return picture;
  }

  return `${API_BASE_URL}${picture.startsWith("/") ? "" : "/"}${picture}`;
}

function FieldWorkerShell({ activeKey, children }) {
  const [user, setUser] = useState(() => getSession()?.user || null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const accessToken = getSession()?.access_token;
        if (!accessToken) return;

        const currentUser = await getCurrentUser(accessToken);

        if (mounted) {
          setUser(currentUser);
          setImageError(false);
        }
      } catch (error) {
        console.error("Could not load field worker profile:", error);
      }
    }

    loadUser();

    const handleUserUpdate = () => loadUser();
    window.addEventListener("mamar:session-user-updated", handleUserUpdate);

    return () => {
      mounted = false;
      window.removeEventListener(
        "mamar:session-user-updated",
        handleUserUpdate
      );
    };
  }, []);

  const rawName = user?.full_name || user?.name || "";
  const displayName =
    (typeof rawName === "string" ? rawName.trim() : "") || "Field Worker";
  const userInitial = displayName.charAt(0).toUpperCase();
  const pictureUrl = getPictureUrl(user);

  return (
    <div className="cd-page">
      <header className="cd-header">
        <Link
          to="/field-worker-dashboard"
          className="cd-header-logo"
          aria-label="MAMAR Dashboard"
        >
          <img src={logo} alt="MAMAR" />
        </Link>

        <div className="cd-header-actions">
          <NotificationBell />

          <Link
            to="/field-worker/profile"
            className="cd-user"
            aria-label="My Profile"
          >
            <div className="cd-user-avatar">
              {pictureUrl && !imageError ? (
                <img
                  src={pictureUrl}
                  alt={displayName}
                  onError={() => setImageError(true)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
              ) : (
                userInitial
              )}
            </div>

            <div className="cd-user-info">
              <strong>{displayName}</strong>
              <span>Field Worker</span>
            </div>
          </Link>
        </div>
      </header>

      <div className="cd-body">
        <aside className="cd-sidebar">
          <nav className="cd-nav" aria-label="Main navigation">
            {NAV.map((item) => (
              <Link
                key={item.key}
                to={item.to}
                className={item.key === activeKey ? "cd-nav-active" : undefined}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="cd-sidebar-bottom">
            <Link to="/data-disclaimer">
              <Icon name="info" />
              <span>Data Disclaimer</span>
            </Link>

            <Link to="/help">
              <Icon name="help" />
              <span>Help &amp; Support</span>
            </Link>

            <Link to="/login" onClick={logout}>
              <Icon name="logout" />
              <span>Log out</span>
            </Link>
          </div>
        </aside>

        <main className="cd-main fw-main">{children}</main>
      </div>
    </div>
  );
}

export default FieldWorkerShell;
