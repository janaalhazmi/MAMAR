import { describe, it, expect, vi } from "vitest";
import App from "../App";

// ArcGIS widgets require a real browser/WebGL environment. Their UI is covered
// separately; these mocks let every page module be imported in jsdom.
vi.mock("../components/MamarMap", () => ({ default: () => null }));
vi.mock("../components/AdminMap", () => ({ default: () => null }));

const pageLoaders = import.meta.glob("../pages/**/*.jsx");
const componentLoaders = import.meta.glob("../components/**/*.jsx");
const serviceLoaders = import.meta.glob("../services/**/*.js");

describe("application module smoke tests", () => {
  it("loads the main application router", () => {
    expect(App).toBeTypeOf("function");
  });
  it.each(Object.entries(pageLoaders))("loads page module %s", async (_path, load) => {
    const module = await load();
    expect(module).toBeDefined();
  });

  it.each(Object.entries(componentLoaders).filter(([path]) =>
    !path.endsWith("/MamarMap.jsx") && !path.endsWith("/AdminMap.jsx") && !path.includes("/__tests__/")
  ))("loads component module %s", async (_path, load) => {
    const module = await load();
    expect(module).toBeDefined();
  });

  it.each(Object.entries(serviceLoaders).filter(([path]) => !path.includes("/__tests__/")))(
    "loads service module %s", async (_path, load) => {
      const module = await load();
      expect(Object.keys(module).length).toBeGreaterThan(0);
    }
  );
});

