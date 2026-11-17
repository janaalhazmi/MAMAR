import { act, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import NotificationBell from "../components/NotificationBell";
import { getNotifications } from "../services/notifications";

vi.mock("../services/notifications", () => ({
  getNotifications: vi.fn(),
}));

function renderBell() {
  return render(
    <MemoryRouter>
      <NotificationBell />
    </MemoryRouter>
  );
}

async function finishRefresh() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getNotifications.mockReset();
    getNotifications.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("links to the notifications page", async () => {
    renderBell();
    await finishRefresh();

    expect(
      screen.getByRole("link", { name: "Notifications" })
    ).toHaveAttribute("href", "/notifications");
  });

  it("shows the unread indicator for unread notifications", async () => {
    getNotifications.mockResolvedValue([
      { id: 1, read: false },
      { id: 2, read: true },
    ]);

    const { container } = renderBell();
    await finishRefresh();

    expect(
      container.querySelector(".cd-notification-dot")
    ).toBeInTheDocument();
  });

  it("hides the indicator when all notifications are read", async () => {
    getNotifications.mockResolvedValue([
      { id: 1, read: true },
    ]);

    const { container } = renderBell();
    await finishRefresh();

    expect(
      container.querySelector(".cd-notification-dot")
    ).not.toBeInTheDocument();
  });

  it("hides the indicator when there are no notifications", async () => {
    const { container } = renderBell();
    await finishRefresh();

    expect(
      container.querySelector(".cd-notification-dot")
    ).not.toBeInTheDocument();
  });

  it("refreshes after 10 seconds and updates the unread indicator", async () => {
    getNotifications
      .mockResolvedValueOnce([{ id: 1, read: false }])
      .mockResolvedValueOnce([{ id: 1, read: true }]);

    const { container } = renderBell();
    await finishRefresh();

    expect(
      container.querySelector(".cd-notification-dot")
    ).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });

    expect(getNotifications).toHaveBeenCalledTimes(2);
    expect(
      container.querySelector(".cd-notification-dot")
    ).not.toBeInTheDocument();
  });

  it("keeps the notification link available when loading fails", async () => {
    const error = new Error("Notifications unavailable");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    getNotifications.mockRejectedValue(error);

    renderBell();
    await finishRefresh();

    expect(
      screen.getByRole("link", { name: "Notifications" })
    ).toBeInTheDocument();

    expect(consoleError).toHaveBeenCalledWith(
      "Unable to load notifications:",
      error
    );
  });

  it("stops refreshing after the component is unmounted", async () => {
    const { unmount } = renderBell();
    await finishRefresh();

    expect(getNotifications).toHaveBeenCalledTimes(1);

    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20000);
    });

    expect(getNotifications).toHaveBeenCalledTimes(1);
  });
});
