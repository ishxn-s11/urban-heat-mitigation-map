# Optimization

## Formulation

Real multi-objective optimization via **pymoo NSGA-II** (`app/services/optimization/optimizer.py`).
The decision vector is *real*: one canopy share + one roof share per analysis
cell (40×40 demo grid → 3200 variables), bounded per cell:

- canopy ≤ 0.6 × (1 − NDBI) — vegetation needs unbuilt surface
- roof ≤ 0.8 × NDBI — roofs only exist where buildings do

## Objectives (pymoo minimization convention)

```text
minimize:
  −total cooling          (maximize cooling benefit)
  −population benefit     (maximize person-°C exposure relief)
  −extreme cells recovered(maximize heat-risk reduction)
  +cost                   (minimize implementation cost)
  +difficulty             (minimize implementation difficulty)
  +feasibility penalty    (penalize implausible per-cell overshoot)
```

Constraints: `cost ≤ budget` (g1 ≤ 0); runs are deterministic per seed so
API responses are reproducible.

## Output

A genuine Pareto front (≥ 20 non-dominated solutions in default settings),
each solution traceable to its decision vector (`decision_vector_hash`) with:

- total & mean cooling (°C·cells / °C per cell)
- cost (USD, from the same unit costs as the scenario engine)
- population benefited
- extreme cells recovered (cells pushed below the EXTREME threshold)
- feasibility score and difficulty
- intervention mix (canopy/roof shares)

## Recommendation (no hard-coding)

`recommendation_from_front` selects the **knee point** by cooling-per-$M
among budget-feasible solutions — a derived rule over real evaluated
solutions, never a fixed answer.

## UI

`/explore/:aoiId/optimize` renders cost (x) vs cooling (y), bubble size =
population; clicking a solution selects it and shows its mix. The
recommendation panel explains the knee-point choice. Demo runs are flagged
`DEMO`; the algorithm label ("NSGA-II (pymoo)") is always shown.

## Separation of duties

RAG proposes candidate interventions (evidence) → scenario engine estimates
thermal response (physics) → NSGA-II allocates spatially (optimization) →
RAG explains trade-offs. The LLM never overwrites numerical output (spec §175).
