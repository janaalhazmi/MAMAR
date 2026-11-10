import { authed } from "./api";
import { getSession } from "./auth";

function token() {
  const session = getSession();

  if (!session) {
    throw new Error("Please sign in to view notifications.");
  }

  return session.access_token;
}

export function getNotifications() {
  return authed("/notifications", token());
}

export function getUnreadNotificationCount() {
  return authed("/notifications/unread-count", token());
}

export function markNotificationAsRead(id) {
  return authed(`/notifications/${id}/read`, token(), {
    method: "PATCH",
  });
}

export function markAllNotificationsAsRead() {
  return authed("/notifications/read-all", token(), {
    method: "PATCH",
  });
}
