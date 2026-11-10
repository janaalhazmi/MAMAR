import NotificationBell from "./NotificationBell";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/mamar-logo.svg";
import { getSession } from "../services/auth";
import { getNotifications } from "../services/notifications";
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

  const [hasUnread, setHasUnread] = useState(false);
  const previousIds = useRef(null);

  useEffect(() => {
    let active = true;
    let checking = false;

    const checkNotifications = async () => {
      if (checking) return;
      checking = true;

      try {
        const notifications = await getNotifications();
        if (!active) return;

        const unread = notifications.filter(
          (notification) => !notification.read
        );

        const currentIds = unread.map(
          (notification) => notification.id
        );

        if (
          previousIds.current !== null &&
          currentIds.some((id) => !previousIds.current.includes(id))
        ) {
          playNotificationSound();
        }

        previousIds.current = currentIds;
        setHasUnread(unread.length > 0);
      } catch (error) {
        console.error("Unable to load notifications:", error);
      } finally {
        checking = false;
      }
    };

    checkNotifications();

    const interval = setInterval(checkNotifications, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="cd-page">
      <header className="cd-header">
        <Link to="/contractor-dashboard" className="cd-header-logo">
          <img src={logo} alt="MAMAR" />
        </Link>

        <div className="cd-header-actions">
          <NotificationBell />

          <Link to="/profile" className="cd-user">
            <div className="cd-user-avatar">{userInitial}</div>

            <div className="cd-user-info">
              <strong>{displayName}</strong>
              <span>Contractor</span>
            </div>
          </Link>
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
