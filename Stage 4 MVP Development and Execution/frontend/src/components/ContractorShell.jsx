import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/mamar-logo.svg";
import { getSession } from "../services/auth";
import { getNotifications } from "../services/Contractor/Contractor";
import Sidebar from "./Sidebar";
import Icon from "./Icons";

const NAV = [
  { key: "dashboard", path: "/contractor-dashboard", icon: "dashboard", label: "Dashboard" },
  { key: "projects", path: "/my-projects", icon: "projects", label: "My Projects" },
  { key: "create", path: "/create-project", icon: "create", label: "Create Project" },
  { key: "providers", path: "/providers", icon: "providers", label: "Providers" },
  { key: "quotations", path: "/quotations", icon: "quotations", label: "Quotations" },
];

function playNotificationSound() {
  try {
    const AudioContext =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) return;

    const audio = new AudioContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();

    oscillator.connect(gain);
    gain.connect(audio.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audio.currentTime);

    gain.gain.setValueAtTime(0.15, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audio.currentTime + 0.35
    );

    oscillator.start();
    oscillator.stop(audio.currentTime + 0.35);

    oscillator.onended = () => audio.close();
  } catch (error) {
    console.log("Notification sound unavailable.", error);
  }
}

function ContractorShell({ activeKey, children }) {
  const sessionUser = getSession()?.user;
  const rawName = sessionUser?.full_name || sessionUser?.name || "";

  const displayName =
    (typeof rawName === "string" ? rawName.trim() : "") || "there";

  const userInitial = displayName.charAt(0).toUpperCase();

  const [hasUnread, setHasUnread] = useState(
    () => getNotifications().some((notification) => !notification.read)
  );

  const previousIds = useRef(
    getNotifications().map((notification) => notification.id)
  );

  useEffect(() => {
    const checkNotifications = () => {
      const notifications = getNotifications();

      const currentIds = notifications.map(
        (notification) => notification.id
      );

      const newNotification = notifications.some(
        (notification) =>
          !previousIds.current.includes(notification.id)
      );

      if (newNotification) {
        playNotificationSound();
      }

      previousIds.current = currentIds;

      setHasUnread(
        notifications.some((notification) => !notification.read)
      );
    };

    const interval = setInterval(checkNotifications, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="cd-page">
      <header className="cd-header">
        <Link to="/contractor-dashboard" className="cd-header-logo">
          <img src={logo} alt="MAMAR" />
        </Link>

        <div className="cd-header-actions">
          <Link
            to="/notifications"
            className="cd-notification-button"
            aria-label="Notifications"
            title="Notifications"
          >
            <Icon name="bell" size={21} />

            {hasUnread && (
              <span className="cd-notification-dot" />
            )}
          </Link>

          <div className="cd-user">
            <div className="cd-user-avatar">{userInitial}</div>

            <div className="cd-user-info">
              <strong>{displayName}</strong>
              <span>Contractor</span>
            </div>
          </div>
        </div>
      </header>

      <div className="cd-body">
        <Sidebar items={NAV} activeKey={activeKey} />

        <main className="cd-main pf-main">
          {children}
        </main>
      </div>
    </div>
  );
}

export default ContractorShell;
