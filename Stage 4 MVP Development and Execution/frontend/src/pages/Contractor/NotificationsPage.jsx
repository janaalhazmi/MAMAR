import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Bell,
  CheckCheck,
  FileText,
  MessageSquare,
  CalendarCheck,
  Info,
} from "lucide-react";

import ContractorShell from "../../components/ContractorShell";

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../services/notifications";

function NotificationsPage() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      try {
        const data = await getNotifications();
        if (active) {
          setNotifications(data);
          setError("");
        }
      } catch (err) {
        if (active) setError(err.message);
      }
    }

    loadNotifications();

    const interval = setInterval(loadNotifications, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const visibleNotifications = notifications.filter((notification) => {
    if (filter === "unread") return !notification.read;
    return true;
  });

  async function markAsRead(id) {
    try {
      await markNotificationAsRead(id);
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      );
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function markAllAsRead() {
    try {
      await markAllNotificationsAsRead();
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, read: true }))
      );
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function openNotification(notification) {
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification.id);
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? { ...item, read: true }
              : item
          )
        );
      } catch (err) {
        setError(err.message);
        return;
      }
    }

    if (notification.link) {
      navigate(notification.link);
    }
  }

  function getNotificationIcon(type) {
    switch (type) {
      case "quotation":
        return <FileText size={20} />;

      case "project":
        return <Bell size={20} />;

      case "provider":
        return <CalendarCheck size={20} />;

      case "update":
        return <Info size={20} />;

      default:
        return <MessageSquare size={20} />;
    }
  }

  return (
    <ContractorShell activeKey="">
      <div className="notifications-page">

        {/* Heading */}
        <div className="notifications-heading">
          <div>
            <h1>Notifications</h1>
            <p>
              Stay updated with your projects and service providers.
            </p>
          </div>

          <span className="notifications-total">
            {unreadCount} Unread
          </span>
        </div>

        {error && <p role="alert">{error}</p>}

        {/* Toolbar */}
        <div className="notifications-toolbar">
          <div className="notifications-tabs">
            <button
              type="button"
              className={filter === "all" ? "active" : ""}
              onClick={() => setFilter("all")}
            >
              All
              <span>{notifications.length}</span>
            </button>

            <button
              type="button"
              className={filter === "unread" ? "active" : ""}
              onClick={() => setFilter("unread")}
            >
              Unread
              <span>{unreadCount}</span>
            </button>
          </div>

          <button
            type="button"
            className="notifications-mark-all"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck size={17} />
            Mark all as read
          </button>
        </div>

        {/* Notification List */}
        <section className="notifications-list">
          {visibleNotifications.length > 0 ? (
            visibleNotifications.map((notification) => (
              <article
                key={notification.id}
                className={`notification-card ${
                  notification.read ? "read" : "unread"
                }`}
                onClick={() => openNotification(notification)}
              >
                <div
                  className={`notification-icon ${notification.type}`}
                >
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="notification-content">
                  <div className="notification-title-row">
                    <h3>{notification.title}</h3>

                    {!notification.read && (
                      <span className="notification-unread-dot" />
                    )}
                  </div>

                  <p>{notification.message}</p>

                  <div className="notification-meta">
                    <span>{new Date(notification.created_at).toLocaleDateString("en-US")}</span>
                    <span>·</span>
                    <span>{new Date(notification.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>

                {!notification.read && (
                  <button
                    type="button"
                    className="notification-read-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      markAsRead(notification.id);
                    }}
                  >
                    Mark as read
                  </button>
                )}
              </article>
            ))
          ) : (
            <div className="notifications-empty">
              <Bell size={36} />
              <h3>No notifications</h3>
              <p>You&apos;re all caught up!</p>
            </div>
          )}
        </section>
      </div>
    </ContractorShell>
  );
}

export default NotificationsPage;