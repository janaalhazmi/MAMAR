import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import PrepareQuotation from "../pages/Providers/PrepareQuotation";
import {
  declineProviderRequest,
  getOpenRequestById,
  submitProviderQuotation,
} from "../services/providers/providerQuotes";

vi.mock("../components/NotificationBell", () => ({
  default: () => null,
}));

vi.mock("../components/MamarMap", () => ({
  default: () => <div>Work zone map</div>,
}));

vi.mock("../services/providers/api", () => ({
  useQuotationRequest: () => ({
    requestDetails: {
      project_id: 22,
      project_name: "Razan",
    },
    realRequest: {
      title: "Razan",
      projectId: 22,
      location: "Riyadh",
      startDate: "2026-11-20",
      endDate: "2026-11-22",
    },
    workZone: null,
    workZoneError: "",
  }),
}));

vi.mock("../services/providers/providerQuotes", () => ({
  declineProviderRequest: vi.fn(),
  getOpenRequestById: vi.fn(),
  submitProviderQuotation: vi.fn(),
}));


function DashboardDestination() {
  const location = useLocation();

  return (
    <div>
      <h1>Provider dashboard destination</h1>
      <p>{location.state?.successMessage}</p>
    </div>
  );
}

function renderQuotation(url = "/provider/quotation?requestId=5") {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/provider/quotation" element={<PrepareQuotation />} />
        <Route
          path="/provider-dashboard"
          element={<DashboardDestination />}
        />
      </Routes>
    </MemoryRouter>
  );
}

function submitButton() {
  return screen.getByRole("button", { name: /submit quotation/i });
}

describe("PrepareQuotation", () => {
  beforeEach(() => {
    vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.spyOn(window, "confirm").mockReturnValue(true);

    getOpenRequestById.mockReset();
    submitProviderQuotation.mockReset();
    declineProviderRequest.mockReset();

    getOpenRequestById.mockResolvedValue({
      requestId: 5,
      projectId: 22,
      title: "Razan",
      startDate: "2026-11-20",
      endDate: "2026-11-22",
      services: ["road-signs"],
    });

    submitProviderQuotation.mockResolvedValue({ quote_id: 101 });
    declineProviderRequest.mockResolvedValue({ request_id: 5 });
  });

  it("shows the project supplied by the request", () => {
    renderQuotation();

    expect(
      screen.getByRole("heading", { name: "Razan" })
    ).toBeInTheDocument();
    expect(screen.getByText("Project #22")).toBeInTheDocument();
  });

  it("blocks submission without a request ID", async () => {
    const user = userEvent.setup();
    renderQuotation("/provider/quotation");

    await user.click(submitButton());

    expect(window.alert).toHaveBeenCalledWith(
      "Open this quotation from a service request."
    );
    expect(submitProviderQuotation).not.toHaveBeenCalled();
  });

  it.each([
    ["quantity", 0],
    ["unit price", 1],
  ])("blocks submission when a service %s is zero", async (_, index) => {
    const user = userEvent.setup();
    renderQuotation();

    fireEvent.change(screen.getAllByRole("spinbutton")[index], {
      target: { value: "0" },
    });

    await user.click(submitButton());

    expect(window.alert).toHaveBeenCalledWith(
      "Please enter a valid quantity and unit price for all services."
    );
    expect(submitProviderQuotation).not.toHaveBeenCalled();
  });

  it("submits the calculated total and returns to the dashboard", async () => {
    const user = userEvent.setup();
    localStorage.setItem("providerQuotationDraft", "existing draft");
    renderQuotation();

    await user.click(submitButton());

    await waitFor(() => {
      expect(submitProviderQuotation).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.objectContaining({ projectId: 22 }),
          price: 6000,
          durationDays: 3,
          notes: expect.stringContaining("Delivery: SAR 1200"),
        })
      );
    });

    expect(
      await screen.findByRole("heading", {
        name: "Provider dashboard destination",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText("Quotation submitted successfully.")
    ).toBeInTheDocument();

    expect(window.alert).not.toHaveBeenCalled();
    expect(localStorage.getItem("providerQuotationDraft")).toBeNull();
  });

  it("shows a submission error and preserves the draft", async () => {
    const user = userEvent.setup();
    submitProviderQuotation.mockRejectedValue(new Error("Service unavailable"));
    localStorage.setItem("providerQuotationDraft", "existing draft");
    renderQuotation();

    await user.click(submitButton());

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Service unavailable");
    });

    expect(
      screen.getByRole("heading", { name: "Prepare Quotation" })
    ).toBeInTheDocument();
    expect(localStorage.getItem("providerQuotationDraft")).toBe("existing draft");
  });

  it("blocks submission when project dates are invalid", async () => {
    const user = userEvent.setup();
    getOpenRequestById.mockResolvedValue({
      projectId: 22,
      startDate: "invalid",
      endDate: "invalid",
    });
    renderQuotation();

    await user.click(submitButton());

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "The request needs valid start and end dates."
      );
    });

    expect(submitProviderQuotation).not.toHaveBeenCalled();
  });

  it("saves the quotation draft and shows confirmation", async () => {
    const user = userEvent.setup();
    renderQuotation();

    await user.click(screen.getByRole("button", { name: /save draft/i }));

    const draft = JSON.parse(localStorage.getItem("providerQuotationDraft"));

    expect(draft).toEqual(
      expect.objectContaining({
        requestId: "5",
        subtotal: 4800,
        delivery: 1200,
        total: 6000,
      })
    );
    expect(window.alert).toHaveBeenCalledWith(
      "Quotation draft saved successfully."
    );
    expect(submitProviderQuotation).not.toHaveBeenCalled();
  });

  it("keeps the request when decline confirmation is cancelled", async () => {
    const user = userEvent.setup();
    window.confirm.mockReturnValue(false);
    renderQuotation();

    await user.click(screen.getByRole("button", { name: /decline request/i }));

    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(declineProviderRequest).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "Prepare Quotation" })
    ).toBeInTheDocument();
  });

  it("declines the request and shows a success message on the dashboard", async () => {
    const user = userEvent.setup();
    renderQuotation();

    await user.click(screen.getByRole("button", { name: /decline request/i }));

    expect(declineProviderRequest).toHaveBeenCalledWith("5");
    expect(
      await screen.findByRole("heading", {
        name: "Provider dashboard destination",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Request declined successfully.")
    ).toBeInTheDocument();
  });

  it("shows a decline error and stays on the quotation page", async () => {
    const user = userEvent.setup();
    declineProviderRequest.mockRejectedValue(new Error("Could not decline"));
    renderQuotation();

    await user.click(screen.getByRole("button", { name: /decline request/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Could not decline");
    });

    expect(
      screen.getByRole("heading", { name: "Prepare Quotation" })
    ).toBeInTheDocument();
  });
});
