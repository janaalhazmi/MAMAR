import { useState } from "react";
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
} from "../../services/Contractor/Contractor";

function NotificationsPage() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState(getNotifications);

  const [filter, setFilter] = useState("all");

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const visibleNotifications = notifications.filter((notification) => {
    if (filter === "unread") return !notification.read;
    return true;
  });

  function markAsRead(id) {
    setNotifications(markNotificationAsRead(id));
  }

  function markAllAsRead() {
    setNotifications(markAllNotificationsAsRead());
  }

  function openNotification(notification) {
    markAsRead(notification.id);

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
                    <span>{notification.date}</span>
                    <span>·</span>
                    <span>{notification.time}</span>
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