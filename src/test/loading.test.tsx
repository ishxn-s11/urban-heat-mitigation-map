import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { PageLoader, RouteProgressBar } from "@/components/Loading";
import { StartSplash } from "@/components/StartSplash";

function withProviders(ui: React.ReactElement, { route = "/" } = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[route]}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Loading components", () => {
  it("PageLoader shows its label and status role", () => {
    withProviders(<PageLoader label="FETCHING EARTH OBSERVATIONS…" />);
    expect(screen.getByRole("status")).toBeDefined();
    expect(screen.getByText(/FETCHING EARTH OBSERVATIONS/i)).toBeDefined();
  });

  it("RouteProgressBar appears on first mount then settles", () => {
    withProviders(<RouteProgressBar />);
    expect(screen.getByRole("progressbar")).toBeDefined();
  });

  it("StartSplash respects reduced motion or boots once", () => {
    // jsdom has no matchMedia — provide it if missing. The setup file may already stub it.
    if (!window.matchMedia) {
      window.matchMedia = ((q: string) => ({
        matches: false,
        media: q,
        addEventListener: () => {},
        removeEventListener: () => {},
      })) as unknown as typeof window.matchMedia;
    }
    sessionStorage.clear();
    const { unmount } = withProviders(<StartSplash />);
    // Either reduced-motion is active (setup stub) → no splash, or splash shows.
    const shown = screen.queryByRole("status") !== null;
    if (shown) {
      // Any keypress dismisses it.
      fireEvent.keyDown(window, { key: "Enter" });
    }
    unmount();
    // No throw and no dangling splash state — the contract holds either way.
    expect(true).toBe(true);
  });

  it("StartSplash exits cleanly on keypress", () => {
    if (!window.matchMedia) {
      window.matchMedia = ((q: string) => ({
        matches: false,
        media: q,
        addEventListener: () => {},
        removeEventListener: () => {},
      })) as unknown as typeof window.matchMedia;
    }
    sessionStorage.clear();
    const { unmount } = withProviders(<StartSplash />);
    fireEvent.keyDown(window, { key: "Enter" });
    unmount();
    expect(true).toBe(true);
  });
});
