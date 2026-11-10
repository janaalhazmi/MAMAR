import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { getNotifications } from "../services/notifications";

export default function NotificationBell() {
  const [unread, setUnread] = useState(false);
  const previousIds = useRef(null);

  useEffect(() => {
    let active = true;

    async function refresh() {
      try {
        const notifications = await getNotifications();
        if (!active) return;

        const unreadItems = notifications.filter((item) => !item.read);
        const ids = unreadItems.map((item) => item.id);

        if (
          previousIds.current !== null &&
          ids.some((id) => !previousIds.current.includes(id))
        ) {
          try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
              const audio = new AudioContext();
              const oscillator = audio.createOscillator();
              const gain = audio.createGain();
              oscillator.connect(gain);
              gain.connect(audio.destination);
              oscillator.frequency.value = 880;
              gain.gain.value = 0.12;
              oscillator.start();
              oscillator.stop(audio.currentTime + 0.2);
              oscillator.onended = () => audio.close();
            }
          } catch {
            // Browsers may block audio before user interaction.
          }
        }

        previousIds.current = ids;
        setUnread(ids.length > 0);
      } catch (error) {
        console.error("Unable to load notifications:", error);
      }
    }

    refresh();
    const interval = setInterval(refresh, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <Link
      to="/notifications"
      className="cd-notification-button"
      aria-label="Notifications"
      title="Notifications"
      style={{ position: "relative" }}
    >
      <Bell size={21} />
      {unread && <span className="cd-notification-dot" />}
    </Link>
  );
}
