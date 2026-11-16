import { describe, it, expect, vi, beforeEach } from "vitest";
import { getNotifications, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead } from "../notifications";
import { authed } from "../api";
import { getSession } from "../auth";

vi.mock("../auth", () => ({ getSession: vi.fn(() => ({ access_token: "token-1" })) }));
vi.mock("../api", () => ({ authed: vi.fn(() => Promise.resolve([])) }));

describe("notifications service", () => {
  beforeEach(() => { vi.clearAllMocks(); getSession.mockReturnValue({ access_token: "token-1" }); });
  it("loads notifications", async () => {
    await getNotifications();
    expect(authed).toHaveBeenCalledWith("/notifications", "token-1");
  });
  it("loads unread count", async () => {
    await getUnreadNotificationCount();
    expect(authed).toHaveBeenCalledWith("/notifications/unread-count", "token-1");
  });
  it("marks one notification as read", async () => {
    await markNotificationAsRead(17);
    expect(authed).toHaveBeenCalledWith("/notifications/17/read", "token-1", { method: "PATCH" });
  });
  it("marks all notifications as read", async () => {
    await markAllNotificationsAsRead();
    expect(authed).toHaveBeenCalledWith("/notifications/read-all", "token-1", { method: "PATCH" });
  });
  it("requires an authenticated session", () => {
    getSession.mockReturnValue(null);
    expect(() => getNotifications()).toThrow("Please sign in");
  });
});

