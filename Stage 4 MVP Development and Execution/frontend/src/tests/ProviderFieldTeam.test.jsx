import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProviderFieldTeam from "../pages/Providers/ProviderFieldTeam";
import {
  assignProviderWorker,
  useFieldWorkerRegistration,
  useProviderFieldWorkers,
  useWorkerAssignmentProjects,
} from "../services/providers/api";

vi.mock("../services/providers/api", () => ({
  assignProviderWorker: vi.fn(),
  useFieldWorkerRegistration: vi.fn(),
  useProviderFieldWorkers: vi.fn(),
  useWorkerAssignmentProjects: vi.fn(),
}));

vi.mock("../services/auth", () => ({
  getSession: () => ({ user: { full_name: "Provider User" } }),
}));

vi.mock("../components/ProviderSidebar", () => ({
  default: () => <nav aria-label="Provider sidebar" />,
}));

vi.mock("../components/NotificationBell", () => ({
  default: () => null,
}));

vi.mock("../components/Turnstile", () => ({
  default: () => <div>Verification challenge</div>,
}));

const workers = [
  {
    id: 24,
    name: "Abdullah",
    email: "abdullah@tcmksa.com",
    phone: "0500000000",
    project: "",
    status: "Available",
    activity: " �",
  },
  {
    id: 23,
    name: "Jana",
    email: "jana@tcmksa.com",
    project: "Road Maintenance",
    status: "Active",
    activity: "Today",
  },
  {
    id: 22,
    name: "Razan",
    email: "razan@tcmksa.com",
    project: "",
    status: "On Leave",
    activity: "Yesterday",
  },
];

const assignmentProjects = [
  {
    id: 65,
    name: "Bridge Works",
    status: "Active",
    dates: "20 �25 Nov",
  },
];

let registration;

function useWorkersFixture() {
  const [items, setItems] = useState(workers);
  return {
    workers: items,
    setWorkers: setItems,
    loadingWorkers: false,
    workersError: "",
  };
}

function workerTable() {
  return within(screen.getByRole("table", { name: "Field workers" }));
}

async function openAvailableWorker(user) {
  const row = screen.getByText("Abdullah").closest("tr");
  await user.click(
    within(row).getByRole("button", { name: /^Assign/ })
  );
}

async function openAddForm(user) {
  await user.click(
    screen.getByRole("button", { name: "+ Add Field Worker" })
  );
}

describe("ProviderFieldTeam", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useProviderFieldWorkers.mockImplementation(useWorkersFixture);
    useWorkerAssignmentProjects.mockReturnValue(assignmentProjects);
    assignProviderWorker.mockReset();
    assignProviderWorker.mockResolvedValue({});

    registration = {
      worker: null,
      busy: false,
      error: "",
      created: false,
      submit: vi.fn((event) => event.preventDefault()),
      setCaptcha: vi.fn(),
      captchaReset: 0,
    };

    useFieldWorkerRegistration.mockImplementation(() => registration);
  });

  it("shows registered workers and status counts", () => {
    render(<ProviderFieldTeam />);

    for (const worker of workers) {
      expect(workerTable().getByText(worker.name)).toBeInTheDocument();
      expect(workerTable().getByText(worker.email)).toBeInTheDocument();
    }

    expect(
      screen.getByRole("button", { name: "All Workers (3)" })
    ).toBeInTheDocument();

    expect(
      screen.getByText("Showing 3 of 3 field workers")
    ).toBeInTheDocument();
  });

  it.each([
    ["abdullah", "Abdullah"],
    ["jana@tcmksa.com", "Jana"],
    ["22", "Razan"],
  ])("searches workers using %s", async (query, expected) => {
    const user = userEvent.setup();
    render(<ProviderFieldTeam />);

    await user.type(
      screen.getByRole("searchbox", { name: "Search workers" }),
      query
    );

    expect(workerTable().getByText(expected)).toBeInTheDocument();
    expect(
      screen.getByText("Showing 1 of 3 field workers")
    ).toBeInTheDocument();
  });

  it("filters workers by status", async () => {
    const user = userEvent.setup();
    render(<ProviderFieldTeam />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Worker status" }),
      "Available"
    );

    expect(workerTable().getByText("Abdullah")).toBeInTheDocument();
    expect(workerTable().queryByText("Jana")).not.toBeInTheDocument();
    expect(workerTable().queryByText("Razan")).not.toBeInTheDocument();
  });

  it("filters workers by assigned project", async () => {
    const user = userEvent.setup();
    render(<ProviderFieldTeam />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: /^Assign/ }),
      "Road Maintenance"
    );

    expect(workerTable().getByText("Jana")).toBeInTheDocument();
    expect(workerTable().queryByText("Abdullah")).not.toBeInTheDocument();
  });

  it("filters workers using the status tabs", async () => {
    const user = userEvent.setup();
    render(<ProviderFieldTeam />);

    const tab = screen.getByRole("button", { name: "On Leave (1)" });
    await user.click(tab);

    expect(tab).toHaveAttribute("aria-pressed", "true");
    expect(workerTable().getByText("Razan")).toBeInTheDocument();
    expect(workerTable().queryByText("Jana")).not.toBeInTheDocument();
  });

  it("shows a message when no workers match the search", async () => {
    const user = userEvent.setup();
    render(<ProviderFieldTeam />);

    await user.type(
      screen.getByRole("searchbox", { name: "Search workers" }),
      "Unknown worker"
    );

    expect(
      screen.getByText("No workers match these filters.")
    ).toBeInTheDocument();
  });

  it("shows the empty directory state", () => {
    useProviderFieldWorkers.mockReturnValue({
      workers: [],
      setWorkers: vi.fn(),
      loadingWorkers: false,
      workersError: "",
    });

    render(<ProviderFieldTeam />);

    expect(
      screen.getByText("No field workers to display yet.")
    ).toBeInTheDocument();
  });

  it("shows loading and disables adding a worker", () => {
    useProviderFieldWorkers.mockReturnValue({
      workers: [],
      setWorkers: vi.fn(),
      loadingWorkers: true,
      workersError: "",
    });

    render(<ProviderFieldTeam />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading field workers…"
    );
    expect(
      screen.getByRole("button", { name: "+ Add Field Worker" })
    ).toBeDisabled();
  });

  it("shows a worker loading error", () => {
    useProviderFieldWorkers.mockReturnValue({
      workers: [],
      setWorkers: vi.fn(),
      loadingWorkers: false,
      workersError: "Could not load workers.",
    });

    render(<ProviderFieldTeam />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Could not load workers."
    );
  });

  it("opens worker details and returns to the directory", async () => {
    const user = userEvent.setup();
    render(<ProviderFieldTeam />);

    await openAvailableWorker(user);

    const details = screen.getByRole("region", {
      name: "Worker details",
    });

    expect(within(details).getByText("0500000000")).toBeInTheDocument();
    expect(
      screen.queryByRole("table", { name: "Field workers" })
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Back to Field Team/ })
    );

    expect(
      screen.getByRole("table", { name: "Field workers" })
    ).toBeInTheDocument();
  });

  it("requires a project before saving an assignment", async () => {
    const user = userEvent.setup();
    render(<ProviderFieldTeam />);

    await openAvailableWorker(user);

    expect(
      screen.getByRole("button", { name: "Save Assignment" })
    ).toBeDisabled();

    expect(assignProviderWorker).not.toHaveBeenCalled();
  });

  it("assigns the selected project and updates the directory", async () => {
    const user = userEvent.setup();
    render(<ProviderFieldTeam />);

    await openAvailableWorker(user);
    await user.selectOptions(
      screen.getByRole("combobox", { name: /^Assign/ }),
      "65"
    );
    await user.click(
      screen.getByRole("button", { name: "Save Assignment" })
    );

    expect(assignProviderWorker).toHaveBeenCalledWith(65, 24);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Assigned to Bridge Works."
    );

    await user.click(
      screen.getByRole("button", { name: /Back to Field Team/ })
    );

    const row = screen.getByText("Abdullah").closest("tr");
    expect(within(row).getByText("Bridge Works")).toBeInTheDocument();
    expect(within(row).getByText("Active")).toBeInTheDocument();
  });

  it("shows assignment errors and permits retrying", async () => {
    assignProviderWorker.mockRejectedValue(
      new Error("Assignment failed.")
    );

    const user = userEvent.setup();
    render(<ProviderFieldTeam />);

    await openAvailableWorker(user);
    await user.selectOptions(
      screen.getByRole("combobox", { name: /^Assign/ }),
      "65"
    );
    await user.click(
      screen.getByRole("button", { name: "Save Assignment" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Assignment failed."
    );
    expect(
      screen.getByRole("button", { name: "Save Assignment" })
    ).toBeEnabled();
  });

  it("shows when no projects are available for assignment", async () => {
    useWorkerAssignmentProjects.mockReturnValue([]);

    const user = userEvent.setup();
    render(<ProviderFieldTeam />);

    await openAvailableWorker(user);

    expect(screen.getByText(/No open projects yet/)).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /^Assign/ })
    ).toBeDisabled();
  });

  it("opens the add worker form and cancels it", async () => {
    const user = userEvent.setup();
    render(<ProviderFieldTeam />);

    await openAddForm(user);

    expect(screen.getByLabelText("Full Name")).toBeRequired();
    expect(screen.getByLabelText("Company Email")).toBeRequired();
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "minlength",
      "6"
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.getByRole("heading", { name: "Field Team" })
    ).toBeInTheDocument();
  });

  it("blocks submitting an empty registration form", async () => {
    const user = userEvent.setup();
    render(<ProviderFieldTeam />);

    await openAddForm(user);
    await user.click(
      screen.getByRole("button", { name: "Send Verification Code" })
    );

    expect(screen.getByLabelText("Full Name")).toBeInvalid();
    expect(registration.submit).not.toHaveBeenCalled();
  });

  it("passes a completed form to the registration handler", async () => {
    const user = userEvent.setup();
    render(<ProviderFieldTeam />);

    await openAddForm(user);
    await user.type(screen.getByLabelText("Full Name"), "Ahmed Ali");
    await user.type(
      screen.getByLabelText("Company Email"),
      "ahmed@tcmksa.com"
    );
    await user.type(screen.getByLabelText("Password"), "Example123");

    await user.click(
      screen.getByRole("button", { name: "Send Verification Code" })
    );

    expect(registration.submit).toHaveBeenCalledTimes(1);
  });

  it("shows the verification code step", async () => {
    registration.worker = { email: "ahmed@tcmksa.com" };

    const user = userEvent.setup();
    render(<ProviderFieldTeam />);

    await openAddForm(user);

    expect(
      screen.getByText(/Enter the verification code sent to ahmed@tcmksa.com/)
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Verification code")).toBeRequired();
    expect(
      screen.getByRole("button", { name: "Create Worker Account" })
    ).toBeInTheDocument();
  });

  it("shows registration errors", async () => {
    registration.error = "This email is already registered.";

    const user = userEvent.setup();
    render(<ProviderFieldTeam />);

    await openAddForm(user);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "This email is already registered."
    );
  });

  it("disables form actions while registration is busy", async () => {
    registration.busy = true;

    const user = userEvent.setup();
    render(<ProviderFieldTeam />);

    await openAddForm(user);

    expect(
      screen.getByRole("button", { name: "Please wait…" })
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Cancel" })
    ).toBeDisabled();
  });

  it("shows successful registration and returns using Done", async () => {
    registration.created = true;

    const user = userEvent.setup();
    render(<ProviderFieldTeam />);

    await openAddForm(user);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Field worker account created."
    );

    await user.click(screen.getByRole("button", { name: "Done" }));

    expect(
      screen.getByRole("table", { name: "Field workers" })
    ).toBeInTheDocument();
  });
});
