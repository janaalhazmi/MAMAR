import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProviderProjects from "../pages/Providers/ProviderProjects";
import { useProviderProjects } from "../services/providers/api";

vi.mock("../services/providers/api", () => ({
  useProviderProjects: vi.fn(),
}));

vi.mock("../components/ProviderSidebar", () => ({
  default: () => <nav aria-label="Provider sidebar" />,
}));

const projects = [
  {
    id: 22,
    name: "Road Maintenance",
    reference: "PRJ-022",
    location: "Riyadh",
    dateLabel: "20 Nov to 22 Nov 2026",
    status: "active",
    progress: 50,
  },
  {
    id: 23,
    name: "Bridge Works",
    reference: "PRJ-023",
    location: "Jeddah",
    status: "upcoming",
    progress: 0,
  },
  {
    id: 24,
    name: "Sign Installation",
    reference: "PRJ-024",
    location: "Dammam",
    status: "completed",
    progress: 100,
  },
];

function renderProjects() {
  return render(
    <MemoryRouter initialEntries={["/provider/projects"]}>
      <Routes>
        <Route
          path="/provider/projects"
          element={<ProviderProjects />}
        />
        <Route
          path="/provider/projects/:projectId"
          element={<h1>Execution details destination</h1>}
        />
      </Routes>
    </MemoryRouter>
  );
}

function projectTable() {
  return within(
    screen.getByRole("table", { name: "Assigned projects" })
  );
}

describe("ProviderProjects", () => {
  beforeEach(() => {
    useProviderProjects.mockReset();
    useProviderProjects.mockReturnValue({
      projects,
      loading: false,
      loadError: "",
    });
  });

  it("shows assigned projects and status counts", () => {
    renderProjects();

    expect(
      screen.getByRole("heading", { name: "My Projects" })
    ).toBeInTheDocument();

    for (const project of projects) {
      expect(projectTable().getByText(project.name)).toBeInTheDocument();
    }

    for (const name of [
      "All Projects (3)",
      "Active (1)",
      "Upcoming (1)",
      "Completed (1)",
    ]) {
      expect(
        screen.getByRole("button", { name })
      ).toBeInTheDocument();
    }

    expect(
      screen.getByText("Showing 3 of 3 assigned projects")
    ).toBeInTheDocument();
  });

  it.each([
    ["Active", "Road Maintenance"],
    ["Upcoming", "Bridge Works"],
    ["Completed", "Sign Installation"],
  ])("filters projects by %s status", async (status, expectedName) => {
    const user = userEvent.setup();
    renderProjects();

    const button = screen.getByRole("button", {
      name: `${status} (1)`,
    });

    await user.click(button);

    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(projectTable().getByText(expectedName)).toBeInTheDocument();

    for (const project of projects) {
      if (project.name !== expectedName) {
        expect(
          projectTable().queryByText(project.name)
        ).not.toBeInTheDocument();
      }
    }

    expect(
      screen.getByText("Showing 1 of 3 assigned projects")
    ).toBeInTheDocument();
  });

  it("restores all projects when All Projects is selected", async () => {
    const user = userEvent.setup();
    renderProjects();

    await user.click(screen.getByRole("button", { name: "Active (1)" }));
    await user.click(
      screen.getByRole("button", { name: "All Projects (3)" })
    );

    for (const project of projects) {
      expect(projectTable().getByText(project.name)).toBeInTheDocument();
    }
  });

  it.each([
    ["  ROAD maintenance  ", "Road Maintenance"],
    ["prj-023", "Bridge Works"],
    ["dammam", "Sign Installation"],
  ])("searches by name, reference or location: %s", async (query, expectedName) => {
    const user = userEvent.setup();
    renderProjects();

    await user.type(
      screen.getByRole("searchbox", { name: "Search projects" }),
      query
    );

    expect(projectTable().getByText(expectedName)).toBeInTheDocument();
    expect(
      screen.getByText("Showing 1 of 3 assigned projects")
    ).toBeInTheDocument();
  });

  it("combines the search and status filter", async () => {
    const user = userEvent.setup();
    renderProjects();

    await user.click(screen.getByRole("button", { name: "Active (1)" }));
    await user.type(
      screen.getByRole("searchbox", { name: "Search projects" }),
      "Jeddah"
    );

    expect(
      screen.getByText("No projects match your search or filter.")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Showing 0 of 3 assigned projects")
    ).toBeInTheDocument();
  });

  it("shows the loading message", () => {
    useProviderProjects.mockReturnValue({
      projects: [],
      loading: true,
      loadError: "",
    });

    renderProjects();

    expect(
      screen.getByText("Loading your projects…")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("No assigned projects yet")
    ).not.toBeInTheDocument();
  });

  it("shows a loading error", () => {
    useProviderProjects.mockReturnValue({
      projects: [],
      loading: false,
      loadError: "Could not load your projects.",
    });

    renderProjects();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Could not load your projects."
    );
    expect(
      screen.getByText("Please refresh the page to try again.")
    ).toBeInTheDocument();
  });

  it("shows the empty state when there are no assigned projects", () => {
    useProviderProjects.mockReturnValue({
      projects: [],
      loading: false,
      loadError: "",
    });

    renderProjects();

    expect(
      screen.getByText("No assigned projects yet")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Showing 0 of 0 assigned projects")
    ).toBeInTheDocument();
  });

  it("opens the selected project from View Details", async () => {
    const user = userEvent.setup();
    renderProjects();

    const row = screen.getByText("Road Maintenance").closest("tr");
    const link = within(row).getByRole("link", {
      name: /View Details/,
    });

    expect(link).toHaveAttribute("href", "/provider/projects/22");

    await user.click(link);

    expect(
      screen.getByRole("heading", {
        name: "Execution details destination",
      })
    ).toBeInTheDocument();
  });

  it("offers View Summary for completed projects", () => {
    renderProjects();

    const row = screen.getByText("Sign Installation").closest("tr");

    expect(
      within(row).getByRole("link", { name: /View Summary/ })
    ).toHaveAttribute("href", "/provider/projects/24");
  });

  it("shows project dates and progress", () => {
    renderProjects();

    expect(
      screen.getByText("20 Nov to 22 Nov 2026")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("progressbar", {
        name: "Road Maintenance progress",
      })
    ).toHaveAttribute("value", "50");

    expect(screen.getByText("Not started")).toBeInTheDocument();
    expect(screen.getByText("100% complete")).toBeInTheDocument();
  });
});
