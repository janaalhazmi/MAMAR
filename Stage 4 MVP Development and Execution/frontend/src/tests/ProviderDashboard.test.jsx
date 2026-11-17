import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProviderDashboard from "../pages/Providers/ProviderDashboard";
import {
  useProviderDashboard,
  providerProfileService,
} from "../services/providers/api";
import { getSession } from "../services/auth";

vi.mock("../services/providers/api", () => ({
  useProviderDashboard: vi.fn(),
  providerProfileService: {
    fetchMyProfile: vi.fn(),
  },
}));

vi.mock("../services/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("../services/providers/providerQuotes", () => ({
  getProviderDashboard: vi.fn(),
}));

vi.mock("../services/projectFlow", () => ({
  formatDate: (value) => `Date: ${value}`,
}));

vi.mock("../components/ProviderSidebar", () => ({
  default: () => <nav aria-label="Provider sidebar" />,
}));

vi.mock("../components/NotificationBell", () => ({
  default: () => <span aria-label="Notification bell" />,
}));

const dashboardData = {
  stats: {
    assigned: 8,
    active: 4,
    upcoming: 3,
    completed: 1,
  },
  newRequests: [
    {
      id: 5,
      name: "New Road Request",
      type: "Road Maintenance",
      location: "Riyadh",
      startDate: "2026-11-20",
      endDate: "2026-11-22",
      status: "Awaiting Your Quote",
      services: ["Road Signs", "Traffic Barriers"],
    },
  ],
  newProject: {
    id: 22,
    name: "Assigned Bridge Project",
    subtitle: "Jeddah · November 2026",
    status: "Ready to Start",
  },
  activeProjects: [
    {
      id: 23,
      name: "Active Tunnel Project",
      city: "Dammam",
      progress: 50,
    },
  ],
  overview: {
    workersActive: 6,
    sitesActive: 2,
  },
};

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={["/provider-dashboard"]}>
      <Routes>
        <Route
          path="/provider-dashboard"
          element={<ProviderDashboard />}
        />
        <Route
          path="/provider/quotation"
          element={<h1>Quotation destination</h1>}
        />
        <Route
          path="/provider/projects/:projectId"
          element={<h1>Project details destination</h1>}
        />
        <Route
          path="/provider/projects"
          element={<h1>Projects destination</h1>}
        />
        <Route
          path="/provider/profile"
          element={<h1>Profile destination</h1>}
        />
      </Routes>
    </MemoryRouter>
  );
}

async function finishProfileLoad() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("ProviderDashboard", () => {
  beforeEach(() => {
    useProviderDashboard.mockReset();
    providerProfileService.fetchMyProfile.mockReset();
    getSession.mockReset();

    getSession.mockReturnValue({
      user: { full_name: "Ahmed Ali" },
    });

    providerProfileService.fetchMyProfile.mockResolvedValue({});

    useProviderDashboard.mockReturnValue({
      displayName: "Ahmed Ali",
      initials: "AA",
      data: dashboardData,
      loading: false,
      error: "",
    });
  });

  it("shows the provider name and initials", async () => {
    renderDashboard();
    await finishProfileLoad();

    expect(
      screen.getByRole("heading", { name: "Provider Dashboard" })
    ).toBeInTheDocument();

    expect(screen.getByText("Ahmed Ali")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open my profile" })
    ).toHaveTextContent("AA");
  });

  it("shows the dashboard statistics", async () => {
    renderDashboard();
    await finishProfileLoad();

    const expectedCounts = {
      "Assigned Projects": "8",
      "Active Execution": "4",
      Upcoming: "3",
      "Completed Projects": "1",
    };

    for (const [label, count] of Object.entries(expectedCounts)) {
      const card = screen.getByText(label).closest("article");
      expect(within(card).getByText(count)).toBeInTheDocument();
    }
  });

  it("shows loading messages while dashboard data is loading", async () => {
    useProviderDashboard.mockReturnValue({
      displayName: "Ahmed Ali",
      initials: "AA",
      data: null,
      loading: true,
      error: "",
    });

    renderDashboard();
    await finishProfileLoad();

    expect(screen.getByText("Loading requests…")).toBeInTheDocument();
    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(
      screen.queryByText("No active projects.")
    ).not.toBeInTheDocument();
  });

  it("shows a dashboard loading error", async () => {
    useProviderDashboard.mockReturnValue({
      displayName: "Ahmed Ali",
      initials: "AA",
      data: null,
      loading: false,
      error: "Could not load your dashboard.",
    });

    renderDashboard();
    await finishProfileLoad();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Could not load your dashboard."
    );
  });

  it("shows empty states when no projects or requests exist", async () => {
    useProviderDashboard.mockReturnValue({
      displayName: "Ahmed Ali",
      initials: "AA",
      data: null,
      loading: false,
      error: "",
    });

    renderDashboard();
    await finishProfileLoad();

    expect(
      screen.getByText(/No new service requests right now/)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/No new assigned projects/)
    ).toBeInTheDocument();

    expect(screen.getByText("No active projects.")).toBeInTheDocument();
    expect(screen.getByText("0 Workers Active")).toBeInTheDocument();
    expect(screen.getByText("0 Sites Active")).toBeInTheDocument();
  });

  it("shows the service request details", async () => {
    renderDashboard();
    await finishProfileLoad();

    const card = screen
      .getByRole("heading", { name: "New Road Request" })
      .closest("article");

    for (const text of [
      "Road Maintenance",
      "Riyadh",
      "Date: 2026-11-20",
      "Date: 2026-11-22",
      "Awaiting Your Quote",
      "Road Signs",
      "Traffic Barriers",
    ]) {
      expect(within(card).getByText(text)).toBeInTheDocument();
    }
  });

  it("opens Prepare Quotation for the selected request", async () => {
    const user = userEvent.setup();
    renderDashboard();
    await finishProfileLoad();

    const link = screen.getByRole("link", {
      name: /Prepare Quotation/,
    });

    expect(link).toHaveAttribute(
      "href",
      "/provider/quotation?requestId=5"
    );

    await user.click(link);

    expect(
      screen.getByRole("heading", { name: "Quotation destination" })
    ).toBeInTheDocument();
  });

  it("shows the accepted project and opens its details", async () => {
    const user = userEvent.setup();
    renderDashboard();
    await finishProfileLoad();

    expect(screen.getByText("QUOTE ACCEPTED")).toBeInTheDocument();
    expect(screen.getByText("Ready to Start")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /View Project/ });

    expect(link).toHaveAttribute("href", "/provider/projects/22");

    await user.click(link);

    expect(
      screen.getByRole("heading", {
        name: "Project details destination",
      })
    ).toBeInTheDocument();
  });

  it("shows active project progress and execution counts", async () => {
    renderDashboard();
    await finishProfileLoad();

    expect(screen.getByText("Active Tunnel Project")).toBeInTheDocument();
    expect(screen.getByText("Dammam")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("6 Workers Active")).toBeInTheDocument();
    expect(screen.getByText("2 Sites Active")).toBeInTheDocument();
  });

  it.each(["View All", /View Execution Details/])(
    "opens Projects from %s",
    async (label) => {
      const user = userEvent.setup();
      renderDashboard();
      await finishProfileLoad();

      await user.click(screen.getByRole("link", { name: label }));

      expect(
        screen.getByRole("heading", { name: "Projects destination" })
      ).toBeInTheDocument();
    }
  );

  it("opens the profile when the avatar is clicked", async () => {
    const user = userEvent.setup();
    renderDashboard();
    await finishProfileLoad();

    await user.click(
      screen.getByRole("link", { name: "Open my profile" })
    );

    expect(
      screen.getByRole("heading", { name: "Profile destination" })
    ).toBeInTheDocument();
  });

  it("displays the profile picture returned by the service", async () => {
    providerProfileService.fetchMyProfile.mockResolvedValue({
      avatar_url: "https://example.com/provider-avatar.png",
    });

    renderDashboard();

    expect(await screen.findByRole("img", { name: "Profile" }))
      .toHaveAttribute(
        "src",
        "https://example.com/provider-avatar.png"
      );
  });

  it("updates the avatar when a session user update is received", async () => {
    renderDashboard();
    await finishProfileLoad();

    act(() => {
      window.dispatchEvent(
        new CustomEvent("mamar:session-user-updated", {
          detail: {
            avatar_url: "https://example.com/updated-avatar.png",
          },
        })
      );
    });

    expect(screen.getByRole("img", { name: "Profile" }))
      .toHaveAttribute(
        "src",
        "https://example.com/updated-avatar.png"
      );
  });
});
