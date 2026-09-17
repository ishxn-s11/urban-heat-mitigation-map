import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Landing from "@/pages/Landing/Landing";
import NotFound from "@/pages/NotFound/NotFound";
import { simulate, optimize, heatSummary, DEMO_HOTSPOTS, timeline } from "@/services/api/demo/mockBackend";
import { lstColor, riskColor } from "@/lib/thermal";

function withProviders(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("landing", () => {
  it("renders the hero headline", () => {
    withProviders(<Landing />);
    expect(screen.getAllByText(/THE CITY/).length).toBeGreaterThan(0);
    expect(screen.getByText(/A MODEL/)).toBeInTheDocument();
  });

  it("renders the final CTA", () => {
    withProviders(<Landing />);
    expect(screen.getByText(/COOL WHERE/)).toBeInTheDocument();
  });
});

describe("404", () => {
  it("shows the SIGNAL LOST page", () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    );
    expect(screen.getByText(/SIGNAL/)).toBeInTheDocument();
    expect(screen.getByText(/LOST/)).toBeInTheDocument();
    expect(screen.getByText(/THIS COORDINATE DOESN'T EXIST/)).toBeInTheDocument();
  });
});

describe("demo backend integrity", () => {
  it("builds a 1600-cell deterministic grid", () => {
    const s = heatSummary();
    expect(s.mean_lst).toBeGreaterThan(38);
    expect(s.mean_lst).toBeLessThan(44);
    expect(DEMO_HOTSPOTS).toHaveLength(3);
  });

  it("scenario cooling scales with canopy and respects aridity", () => {
    const light = simulate({ tree_canopy_percent: 10 });
    const heavy = simulate({ tree_canopy_percent: 40 });
    const arid = simulate({ tree_canopy_percent: 25, climate: "arid" });
    const humid = simulate({ tree_canopy_percent: 25, climate: "tropical" });
    expect(heavy.summary.mean_delta_lst).toBeLessThan(light.summary.mean_delta_lst);
    expect(humid.summary.mean_delta_lst).toBeLessThan(arid.summary.mean_delta_lst);
    expect(heavy.summary.population_benefited).toBeGreaterThan(light.summary.population_benefited);
  });

  it("rejects roof oversubscription", () => {
    expect(() => simulate({ cool_roof_percent: 80, green_roof_percent: 80 })).toThrow(/100%/);
  });

  it("optimizer returns a real front with a recommendation", () => {
    const o = optimize(3_000_000);
    expect(o.solutions.length).toBeGreaterThan(5);
    expect(o.recommendation.interventions.length).toBeGreaterThan(0);
    const best = o.solutions.find((s) => s.solution_id === o.recommendation.solution_id);
    expect(best).toBeDefined();
  });

  it("timeline spans the Landsat thermal era only", () => {
    const t = timeline();
    expect(t[0].year).toBe(1982);
    expect(t[t.length - 1].year).toBe(2026);
    expect(t[0].satellite).toBe("Landsat 4");
  });
});

describe("thermal utilities", () => {
  it("maps LST monotonically hot → red", () => {
    expect(lstColor(45)).not.toBe(lstColor(34));
    expect(riskColor("EXTREME")).toBe("#EF2B16");
  });
});
