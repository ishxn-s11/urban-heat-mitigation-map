"""Multi-objective optimization — real NSGA-II via pymoo.

Problem formulation (per docs/optimization.md):

maximize  cooling benefit, population benefit, heat-risk reduction
minimize  cost, implementation difficulty, feasibility penalty

…expressed as six minimization objectives in pymoo convention. The decision
vector is *real*: one canopy-share and one roof-share decision per cell,
bounded by each cell's capacity. Results are a genuine Pareto front of
evaluated solutions — every point is traceable to its decision vector.
"""

from __future__ import annotations

from typing import Any

from app.services import grid
from app.services.scenario.engine import scenario_type

# Constraint constants (documented defaults, overridable per request)
CANOPY_MAX = 0.6          # max fraction of vegetatable surface per cell
ROOF_MAX = 0.8            # max fraction of roofs treatable per cell
COST_PER_CANOPY_FRAC = 4_000.0   # USD per cell per unit canopy fraction
COST_PER_ROOF_FRAC = 2_600.0     # USD per cell per unit roof fraction
DIFFICULTY_CANOPY = 0.35
DIFFICULTY_ROOF = 0.55
FEASIBILITY_PENALTY = 40.0  # applied when budget constraint binds


def _cooling_per_cell(canopy: float, roof: float, ndbi: float, ndvi: float, f_w: float) -> float:
    """First-order cooling for one cell (same heuristic as scenario engine)."""
    headroom = max(0.0, 1.0 - ndbi)
    d_veg = 1.8 * f_w * canopy * headroom
    d_roof = ndbi * roof * 780.0 * 0.22 * 0.015
    return d_veg + d_roof


def run_optimization(
    budget_usd: float = 4_000_000,
    f_w: float = 0.7,
    pop_size: int = 80,
    n_gen: int = 60,
    seed: int = 42,
) -> dict[str, Any]:
    """Run NSGA-II over the active grid (demo or live); full Pareto front.

    Deterministic given the same seed, so API responses are reproducible.
    """
    from pymoo.algorithms.moo.nsga2 import NSGA2
    from pymoo.core.problem import Problem
    from pymoo.optimize import minimize
    from pymoo.operators.crossover.sbx import SBX
    from pymoo.operators.mutation.pm import PM
    from pymoo.operators.sampling.rnd import FloatRandomSampling
    import numpy as np

    grid.ensure_grid()
    n = grid.grid_size()
    n_cells = n * n
    FIELDS = grid.fields()

    lst = np.array(FIELDS["lst"])
    ndbi = np.array(FIELDS["ndbi"])
    ndvi = np.array(FIELDS["ndvi"])
    pop = np.array(FIELDS["population"], dtype=float)

    class UrbanFluxProblem(Problem):
        def __init__(self) -> None:
            # Decision vars: canopy fraction + roof fraction per cell
            super().__init__(n_var=n_cells * 2, n_obj=6, n_constr=2)
            xl = np.zeros(n_cells * 2)
            xu = np.concatenate([
                np.array([CANOPY_MAX * max(0.0, 1.0 - ndbi[i]) for i in range(n_cells)]),
                np.array([ROOF_MAX * ndbi[i] for i in range(n_cells)]),
            ])
            self.xl = xl
            self.xu = np.maximum(xu, xl + 1e-6)

        def _evaluate(self, X, out, *args, **kwargs):
            canopy = X[:, :n_cells]
            roof = X[:, n_cells:]

            headroom = np.maximum(0.0, 1.0 - ndbi[None, :])
            cooling = (
                1.8 * f_w * canopy * headroom
                + ndbi[None, :] * roof * 780.0 * 0.22 * 0.015
            )  # per-cell °C reduction

            total_cooling = cooling.sum(axis=1)
            mean_cooling = cooling.mean(axis=1)

            cost = (canopy * COST_PER_CANOPY_FRAC + roof * COST_PER_ROOF_FRAC).sum(axis=1)
            difficulty = (
                (canopy * DIFFICULTY_CANOPY + roof * DIFFICULTY_ROOF).sum(axis=1) / n_cells
            )
            benefited = (cooling * pop[None, :]).sum(axis=1) / 1000.0  # person-°C, thousands

            # Heat-risk reduction: cells pushed below the HOT threshold.
            sim = lst[None, :] - cooling
            risk_reduction = ((lst[None, :] >= 43.5) & (sim < 43.5)).sum(axis=1)

            # Feasibility: penalize cooling claims that exceed plausible caps.
            overshoot = np.maximum(0.0, cooling - 6.0).sum(axis=1)

            f1 = -total_cooling          # maximize total cooling
            f2 = -benefited              # maximize population benefit
            f3 = -risk_reduction         # maximize cells leaving EXTREME class
            f4 = cost                    # minimize cost
            f5 = difficulty              # minimize difficulty
            f6 = overshoot * FEASIBILITY_PENALTY  # feasibility penalty

            g1 = cost - budget_usd      # ≤ 0
            g2 = -total_cooling + 0.0   # dummy keep-alive (non-binding)

            out["F"] = np.column_stack([f1, f2, f3, f4, f5, f6])
            out["G"] = np.column_stack([g1, g2])

    algorithm = NSGA2(
        pop_size=pop_size,
        sampling=FloatRandomSampling(),
        crossover=SBX(prob=0.9, eta=15),
        mutation=PM(eta=20),
    )

    res = minimize(UrbanFluxProblem(), algorithm, ("n_gen", n_gen), seed=seed, verbose=False)

    solutions = []
    F = res.F
    X = res.X
    if X.ndim == 1:
        X = X[None, :]
        F = F[None, :]
    for k in range(len(F)):
        canopy = X[k, :n_cells]
        roof = X[k, n_cells:]
        cooling = np.array([
            _cooling_per_cell(canopy[i], roof[i], ndbi[i], ndvi[i], f_w) for i in range(n_cells)
        ])
        total_cooling = float(cooling.sum())
        cost = float(canopy.sum() * COST_PER_CANOPY_FRAC + roof.sum() * COST_PER_ROOF_FRAC)
        benefited = int((cooling * pop).sum())
        sim = lst - cooling
        risk_cells = int(((lst >= 43.5) & (sim < 43.5)).sum())
        solutions.append({
            "solution_id": f"sol_{k:03d}",
            "total_cooling_deg_c": round(total_cooling, 1),
            "mean_cooling_deg_c": round(float(cooling.mean()), 2),
            "cost_usd": round(cost, 0),
            "population_benefited": benefited,
            "extreme_cells_recovered": risk_cells,
            "feasibility": round(float(1.0 - min(F[k, 5] / 100.0, 1.0)), 2),
            "difficulty": round(float(F[k, 4]), 3),
            "canopy_total_fraction": round(float(canopy.sum()), 2),
            "roof_total_fraction": round(float(roof.sum()), 2),
            "intervention_mix": {
                "TREE_CANOPY": round(float(canopy.sum()) / n_cells, 3),
                "COOL_ROOFS": round(float(roof.sum()) / n_cells, 3),
            },
            "decision_vector_hash": hash(X[k].tobytes()) % 10**12,
        })

    prov = grid.thermal_provenance()
    return {
        "n_solutions": len(solutions),
        "solutions": solutions,
        "objectives": [
            "total_cooling (max)", "population_benefit (max)", "extreme_cells_recovered (max)",
            "cost (min)", "implementation_difficulty (min)", "feasibility_penalty (min)",
        ],
        "algorithm": "NSGA-II (pymoo)",
        "generations": n_gen,
        "population_size": pop_size,
        "seed": seed,
        "scenario_type": scenario_type(),
        "grid_provider": grid.provider(),
        "provenance": {
            "source_dataset": prov["dataset"],
            "satellite": prov["satellite"],
            "sensor": prov["sensor"],
            "model": f"NSGA-II over {grid.provider().lower()} grid with energy-balance response",
        },
    }


def recommendation_from_front(
    front: dict[str, Any],
    budget_usd: float,
) -> dict[str, Any]:
    """Derive a recommendation from a real Pareto front — no hard-coded solutions."""
    sols = front["solutions"]
    if not sols:
        raise ValueError("empty Pareto front")
    affordable = [s for s in sols if s["cost_usd"] <= budget_usd]
    pool = affordable or sols
    # Knee-point heuristic: best cooling per $1M among affordable solutions.
    best = max(pool, key=lambda s: s["total_cooling_deg_c"] / max(s["cost_usd"] / 1e6, 0.1))
    return {
        "interventions": [k for k, v in best["intervention_mix"].items() if v > 0.01],
        "mean_cooling_deg_c": best["mean_cooling_deg_c"],
        "cost_usd": best["cost_usd"],
        "population_benefited": best["population_benefited"],
        "feasibility": best["feasibility"],
        "solution_id": best["solution_id"],
        "scenario_type": front["scenario_type"],
    }
