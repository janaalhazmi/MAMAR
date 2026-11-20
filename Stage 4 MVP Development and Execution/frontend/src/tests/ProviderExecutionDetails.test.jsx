import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProviderExecutionDetails from "../pages/Providers/ProviderExecutionDetails";
import { useProviderProjectDetails } from "../services/providers/api";

vi.mock("../services/providers/api", () => ({
  useProviderProjectDetails: vi.fn(),
}));

vi.mock("../services/api", () => ({
  API_BASE_URL: "https://api.example.com",
}));

vi.mock("../services/projectFlow", () => ({
  formatDate: (value) => `Date: ${value}`,
}));

vi.mock("../services/ai", () => ({
  useSafetyChecks: vi.fn(() => ({})),
}));

vi.mock("../components/ProviderSidebar", () => ({
  default: () => null,
}));

vi.mock("../components/NotificationBell", () => ({
  default: () => null,
}));

vi.mock("../components/MamarMap", () => ({
  default: () => <div aria-label="Work zone map" />,
}));

vi.mock("../components/WeatherCard", () => ({
  default: () => <div>Weather component</div>,
}));

vi.mock("../components/TrafficCard", () => ({
  default: () => <div>Traffic component</div>,
}));

vi.mock("../components/TeamOnSiteCard", () => ({
  default: () => <div>Attendance component</div>,
}));

vi.mock("../components/AiDailySummary", () => ({
  default: () => <div>AI summary component</div>,
}));

vi.mock("../components/SiteQrCard", () => ({
  default: () => <div>Site QR component</div>,
}));

vi.mock("../components/DeviceQrCard", () => ({
  default: () => <div>Device QR component</div>,
}));

vi.mock("../components/SafetyBadge", () => ({
  default: () => null,
}));

const project = {
  project_id: 22,
  project_name: "Road Maintenance",
  start_date: "2026-11-20",
  end_date: "2026-11-25",
  services: ["Road Signs", "Traffic Barriers"],
  work_zone: [[46.67, 24.71], [46.68, 24.72]],
};

let state;

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/provider/projects/22"]}>
      <Routes>
        <Route
          path="/provider/projects/:projectId"
          element={<ProviderExecutionDetails />}
        />
        <Route
          path="/provider/projects"
          element={<h1>Projects destination</h1>}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProviderExecutionDetails", () => {
  beforeEach(() => {
    useProviderProjectDetails.mockReset();

    state = {
      name: "Ahmed Ali",
      initials: "AA",
      current: {},
      project,
      details: {
        status: "Active",
        progress: 50,
        site_status: "Work in Progress",
        field_team_count: 1,
        team: [{ user_id: 7, full_name: "Jana" }],
        photos: [],
        awaiting_review: false,
        completion_submitted: false,
      },
      note: "",
      setNote: vi.fn(),
      review: vi.fn(),
      reviewBusy: false,
      reviewError: "",
      reviewNotice: "",
    };

    useProviderProjectDetails.mockImplementation(() => state);
  });

  it("passes the selected project ID to the details hook", () => {
    renderPage();

    expect(useProviderProjectDetails).toHaveBeenCalledWith("22");
  });

  it("shows the project summary and site status", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { name: "Road Maintenance" })
    ).toBeInTheDocument();

    expect(screen.getByText("22")).toBeInTheDocument();
    expect(
      screen.getByText(/Date: 2026-11-20.*Date: 2026-11-25/)
    ).toBeInTheDocument();
    expect(
      screen.getByText("Road Signs, Traffic Barriers")
    ).toBeInTheDocument();
    expect(screen.getByText("Work in Progress")).toBeInTheDocument();
    expect(
      screen.getByText("1 team members assigned")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "Overall progress" })
    ).toHaveAttribute("value", "50");
  });

  it("shows loading before project details are available", () => {
    state.current = null;
    state.project = null;
    state.details = null;

    renderPage();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading project details…"
    );
  });

  it("shows a project loading error", () => {
    state.current = { error: "Could not load this project." };
    state.project = null;
    state.details = null;

    renderPage();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Could not load this project."
    );
  });

  it("returns to the project list", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole("link", { name: /Back to Projects/ })
    );

    expect(
      screen.getByRole("heading", { name: "Projects destination" })
    ).toBeInTheDocument();
  });

  it("shows the work zone map when coordinates are available", () => {
    renderPage();

    expect(screen.getByLabelText("Work zone map")).toBeInTheDocument();
  });

  it("shows a fallback when the work zone is unavailable", () => {
    state.project = { ...project, work_zone: null };

    renderPage();

    expect(
      screen.getByText("Work zone location is unavailable.")
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Work zone map")
    ).not.toBeInTheDocument();
  });

  it("shows the assigned field team", () => {
    renderPage();

    expect(screen.getByText("Jana")).toBeInTheDocument();
  });

  it("shows empty team and photo states", () => {
    state.details.team = [];
    state.details.field_team_count = 0;

    renderPage();

    expect(
      screen.getByText("No team members assigned yet.")
    ).toBeInTheDocument();
    expect(screen.getByText("No site photos yet.")).toBeInTheDocument();
  });

  it("opens the photo folder and resolves relative photo URLs", async () => {
    state.details.photos = [
      {
        photo_id: 1,
        url: "/photos/site-1.jpg",
        caption: "Installed barriers",
        created_at: "2026-11-20",
      },
    ];

    const user = userEvent.setup();
    renderPage();

    const summary = screen.getByText(/Site Photos \(1\)/);
    expect(summary.closest("details")).not.toHaveAttribute("open");

    await user.click(summary);

    expect(summary.closest("details")).toHaveAttribute("open");
    expect(
      screen.getByRole("img", { name: "Installed barriers" })
    ).toHaveAttribute("src", "https://api.example.com/photos/site-1.jpg");
  });

  it("supports absolute photo URLs and photo_url fallback", async () => {
    state.details.photos = [
      {
        photo_id: 2,
        photo_url: "https://images.example.com/site.jpg",
        caption: "Road signs",
      },
    ];

    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByText(/Site Photos \(1\)/));

    expect(
      screen.getByRole("img", { name: "Road signs" })
    ).toHaveAttribute("src", "https://images.example.com/site.jpg");
  });

  it.each([
    [-20, "0"],
    [150, "100"],
  ])("limits progress %s to %s", (input, expected) => {
    state.details.progress = input;

    renderPage();

    expect(
      screen.getByRole("progressbar", { name: "Overall progress" })
    ).toHaveAttribute("value", expected);
  });

  it("hides completion actions when no review is pending", () => {
    renderPage();

    expect(
      screen.queryByRole("heading", { name: "Completion Review" })
    ).not.toBeInTheDocument();
  });

  it.each([
    ["Send to Contractor", "submit"],
    ["Return to Field Team", "return"],
  ])("calls the review handler from %s", async (label, action) => {
    state.details.awaiting_review = true;

    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: label }));

    expect(state.review).toHaveBeenCalledWith(action);
  });

  it("passes review note changes to the hook", async () => {
    state.details.awaiting_review = true;

    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByRole("textbox", {
        name: "Note for the field team (only when returning)",
      }),
      "A"
    );

    expect(state.setNote).toHaveBeenCalledWith("A");
  });

  it("disables review actions while a review is being saved", () => {
    state.details.awaiting_review = true;
    state.reviewBusy = true;

    renderPage();

    expect(
      screen.getByRole("button", { name: "Please wait…" })
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Return to Field Team" })
    ).toBeDisabled();
  });

  it("shows review errors", () => {
    state.details.awaiting_review = true;
    state.reviewError = "Could not submit completion.";

    renderPage();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Could not submit completion."
    );
  });

  it("shows review success notices", () => {
    state.details.awaiting_review = true;
    state.reviewNotice = "Completion sent successfully.";

    renderPage();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Completion sent successfully."
    );
  });

  it("shows the waiting state after completion was submitted", () => {
    state.details.completion_submitted = true;

    renderPage();

    expect(
      screen.getByText(/Sent to the contractor.*Waiting for their review/)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Send to Contractor" })
    ).not.toBeInTheDocument();
  });

  it("opens the summary and QR tools on demand", async () => {
    const user = userEvent.setup();
    renderPage();

    const report = screen.getByText(/Today's Summary.*Open Report/);
    const tools = screen.getByText(
      /Site & Device QR Codes.*Open Tools/
    );

    expect(report.closest("details")).not.toHaveAttribute("open");
    expect(tools.closest("details")).not.toHaveAttribute("open");

    await user.click(report);
    await user.click(tools);

    expect(report.closest("details")).toHaveAttribute("open");
    expect(tools.closest("details")).toHaveAttribute("open");
    expect(screen.getByText("AI summary component")).toBeVisible();
    expect(screen.getByText("Site QR component")).toBeVisible();
    expect(screen.getByText("Device QR component")).toBeVisible();
  });
});
