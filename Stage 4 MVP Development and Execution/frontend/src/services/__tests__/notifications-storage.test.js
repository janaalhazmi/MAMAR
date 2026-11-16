import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authed: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock("../api.js", () => ({ authed: mocks.authed }));
vi.mock("../auth.js", () => ({ getSession: mocks.getSession }));

import * as notifications from "../notifications.js";

describe("Notifications API workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockReturnValue({ access_token: "test-access-token" });
    mocks.authed.mockResolvedValue({ success: true });
  });

  it("requests notifications with the signed-in user's token", async () => {
    await notifications.getNotifications();
    expect(mocks.authed).toHaveBeenCalledWith("/notifications", "test-access-token");
  });

  it("requests the unread notification count", async () => {
    await notifications.getUnreadNotificationCount();
    expect(mocks.authed).toHaveBeenCalledWith("/notifications/unread-count", "test-access-token");
  });

  it("marks one notification as read using PATCH", async () => {
    await notifications.markNotificationAsRead(42);
    expect(mocks.authed).toHaveBeenCalledWith("/notifications/42/read", "test-access-token", { method: "PATCH" });
  });

  it("marks all notifications as read using PATCH", async () => {
    await notifications.markAllNotificationsAsRead();
    expect(mocks.authed).toHaveBeenCalledWith("/notifications/read-all", "test-access-token", { method: "PATCH" });
  });

  it("rejects notification requests when no session exists", () => {
    mocks.getSession.mockReturnValue(null);
    expect(() => notifications.getNotifications()).toThrow(/sign in/i);
    expect(mocks.authed).not.toHaveBeenCalled();
  });
});
