import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DeviceVerification from "../pages/FieldWorker/DeviceVerification";
import {
  captureCurrentLocation,
  distanceInMeters,
  getDevice,
  saveDeviceVerification,
} from "../services/FieldWorker/FieldWorker";

vi.mock("../components/FieldWorkerShell", () => ({
  default: ({ children }) => <main>{children}</main>,
}));

vi.mock("../components/MamarMap", () => ({
  default: () => <div aria-label="Work zone map" />,
}));

vi.mock("../components/Icons", () => ({
  default: () => null,
}));

vi.mock("../services/FieldWorker/FieldWorker", () => ({
  MAX_DISTANCE_METERS: 50,
  captureCurrentLocation: vi.fn(),
  distanceInMeters: vi.fn(),
  formatDistance: (meters) => `${meters} m`,
  getDevice: vi.fn(),
  saveDeviceVerification: vi.fn(),
}));

const planned = {
  latitude: 24.7136,
  longitude: 46.6753,
};

const position = {
  latitude: 24.7137,
  longitude: 46.6754,
  accuracy: 5,
};

const device = {
  id: "TC-014",
  name: "Installed Device",
  projectId: 22,
  projectName: "Road Maintenance",
  status: "Pending Verification",
  planned,
};

function renderPage(
  path = "/device-verification?deviceId=TC-014&projectId=22"
) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <DeviceVerification />
    </MemoryRouter>
  );
}

async function captureLocation(user) {
  await user.click(
    await screen.findByRole("button", {
      name: "Capture Current Location",
    })
  );
}

describe("Field Worker DeviceVerification", () => {
  beforeEach(() => {
    getDevice.mockReset();
    captureCurrentLocation.mockReset();
    distanceInMeters.mockReset();
    saveDeviceVerification.mockReset();

    getDevice.mockResolvedValue(device);
    captureCurrentLocation.mockResolvedValue(position);
    distanceInMeters.mockReturnValue(15);
    saveDeviceVerification.mockResolvedValue({ status: "verified" });
  });

  it("shows loading while the device is being fetched", async () => {
    let resolveDevice;
    getDevice.mockReturnValue(
      new Promise((resolve) => {
        resolveDevice = resolve;
      })
    );

    renderPage();

    expect(screen.getByText("Loading device…")).toBeInTheDocument();

    await act(async () => {
      resolveDevice(device);
    });

    expect(
      screen.getByRole("heading", { name: "Device Verification" })
    ).toBeInTheDocument();
  });

  it("loads the device and project from the page address", async () => {
    renderPage();

    expect(
      await screen.findByText("Road Maintenance")
    ).toBeInTheDocument();

    expect(getDevice).toHaveBeenCalledWith("TC-014", "22");
    expect(screen.getByText("Device ID · TC-014")).toBeInTheDocument();
    expect(screen.getByText("Pending Verification")).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /Back to Field Execution/ })
    ).toHaveAttribute("href", "/field-execution?projectId=22");
  });

  it("shows an error when the device cannot be loaded", async () => {
    getDevice.mockRejectedValue(new Error("Network unavailable"));

    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not load this device."
    );
  });

  it("blocks verification when the project has no planned location", async () => {
    getDevice.mockResolvedValue({ ...device, planned: null });

    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The contractor has not saved a location for Road Maintenance yet"
    );

    expect(
      screen.queryByRole("button", { name: "Save Verification" })
    ).not.toBeInTheDocument();
  });

  it("disables saving until a location is captured", async () => {
    renderPage();

    expect(
      await screen.findByRole("button", { name: "Save Verification" })
    ).toBeDisabled();

    expect(screen.getByText("Not captured yet.")).toBeInTheDocument();
  });

  it("captures the location and enables saving within range", async () => {
    const user = userEvent.setup();
    renderPage();

    await captureLocation(user);

    expect(captureCurrentLocation).toHaveBeenCalledWith(planned);
    expect(distanceInMeters).toHaveBeenCalledWith(position, planned);

    expect(
      screen.getByText("24.713700, 46.675400")
    ).toBeInTheDocument();

    expect(screen.getByText("15 m")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save Verification" })
    ).toBeEnabled();
  });

  it("blocks saving when the worker is outside the allowed range", async () => {
    distanceInMeters.mockReturnValue(75);

    const user = userEvent.setup();
    renderPage();

    await captureLocation(user);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "You are 75 m from the planned location."
    );

    expect(
      screen.getByRole("button", { name: "Save Verification" })
    ).toBeDisabled();

    expect(saveDeviceVerification).not.toHaveBeenCalled();
  });

  it("allows verification at exactly the 50 metre boundary", async () => {
    distanceInMeters.mockReturnValue(50);

    const user = userEvent.setup();
    renderPage();

    await captureLocation(user);

    expect(
      screen.getByRole("button", { name: "Save Verification" })
    ).toBeEnabled();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows location errors and keeps saving disabled", async () => {
    captureCurrentLocation.mockRejectedValue(
      new Error("Location permission was denied.")
    );

    const user = userEvent.setup();
    renderPage();

    await captureLocation(user);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Location permission was denied."
    );

    expect(
      screen.getByRole("button", { name: "Save Verification" })
    ).toBeDisabled();
  });

  it("saves the verification and displays success", async () => {
    const user = userEvent.setup();
    renderPage();

    await captureLocation(user);
    await user.click(
      screen.getByRole("button", { name: "Save Verification" })
    );

    expect(saveDeviceVerification).toHaveBeenCalledTimes(1);
    expect(saveDeviceVerification).toHaveBeenCalledWith({
      deviceId: "TC-014",
      projectId: 22,
      planned,
      captured: position,
      distanceMeters: 15,
    });

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Location verified and saved."
    );

    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save Verification" })
    ).toBeDisabled();
  });

  it("shows save errors and allows retrying", async () => {
    saveDeviceVerification.mockRejectedValue(
      new Error("Could not reach the server.")
    );

    const user = userEvent.setup();
    renderPage();

    await captureLocation(user);
    await user.click(
      screen.getByRole("button", { name: "Save Verification" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not reach the server."
    );

    expect(
      screen.getByRole("button", { name: "Save Verification" })
    ).toBeEnabled();

    expect(screen.queryByText("Verified")).not.toBeInTheDocument();
  });
});
