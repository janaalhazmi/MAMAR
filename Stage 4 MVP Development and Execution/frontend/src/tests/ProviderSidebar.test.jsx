import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProviderSidebar from "../components/ProviderSidebar";
import { logout } from "../services/auth";

vi.mock("../services/auth", () => ({
  logout: vi.fn(),
}));

function renderSidebar() {
  return render(
    <MemoryRouter initialEntries={["/provider/projects"]}>
      <ProviderSidebar />
      <Routes>
        <Route
          path="/provider/projects"
          element={<h1>Projects destination</h1>}
        />
        <Route
          path="/provider/profile"
          element={<h1>Profile destination</h1>}
        />
        <Route
          path="/login"
          element={<h1>Login destination</h1>}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProviderSidebar", () => {
  it("marks Projects as the active page", () => {
    renderSidebar();

    expect(
      screen.getByRole("link", { name: "Projects" })
    ).toHaveAttribute("aria-current", "page");

    expect(
      screen.getByRole("link", { name: "My Profile" })
    ).not.toHaveAttribute("aria-current");
  });

  it("opens My Profile when clicked", async () => {
    const user = userEvent.setup();
    renderSidebar();

    await user.click(
      screen.getByRole("link", { name: "My Profile" })
    );

    expect(
      screen.getByRole("heading", { name: "Profile destination" })
    ).toBeInTheDocument();
  });

  it("logs out and opens the login page", async () => {
    const user = userEvent.setup();
    renderSidebar();

    await user.click(
      screen.getByRole("link", { name: /log out/i })
    );

    expect(logout).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("heading", { name: "Login destination" })
    ).toBeInTheDocument();
  });
});
