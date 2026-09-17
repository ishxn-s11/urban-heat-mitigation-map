# Frontend

## Stack

React 18 · TypeScript (strict) · Vite 6 · Tailwind CSS 4 (`@tailwindcss/vite`) ·
React Router 6 (nested routes) · TanStack Query 5 · Zustand · MapLibre GL 4 ·
Recharts · GSAP + ScrollTrigger · React Three Fiber + Drei · Lenis · Lucide.

## Routes

```text
/                          editorial landing (hero + WebGL thermal disc + scroll story)
/explore                   SEARCH THE PLANET (geocode, coordinates, demo cities)
/explore/:aoiId            workspace (persistent header + sidebar nav)
  ├── overview             THERMAL PROFILE + provenance
  ├── heat                 map-first + hotspot sync panel
  ├── history              timeline scrubber + eras + chart + A/B compare
  ├── layers               all data layers with sources
  ├── drivers              WHY IS THIS PLACE HOT? (attributions + methodology)
  ├── model                model card + applicability + physics check
  ├── scenario             intervention builder + before/after + simulated map
  ├── optimize             Pareto frontier + solution selection
  ├── solutions            ASK UrbanFlux (RAG + citations)
  └── report               printable decision report
/datasets                  mission catalogue + availability matrix
/models                    model registry
/research                  methodology
/about                     positioning + limitations
*                          404 — SIGNAL LOST
```

## Design system

| Token | Value | Use |
| --- | --- | --- |
| `--color-heat` | #FF5A1F | primary action, warming |
| `--color-thermal` | #EF2B16 | extreme heat |
| `--color-solar` | #FFD43B | emphasis, selected |
| `--color-veg` | #4CAF50 | vegetation, cooling contexts |
| `--color-water` | #1677FF | water, cooling factors |
| `--color-bone` | #F2F0E8 | text on dark |
| `--color-ink` | #111111 | background |

Typography: Archivo Black (display) · Archivo (headings) · Space Grotesk
(body) · JetBrains Mono (data/labels). Color is never the sole encoding —
badges, text labels, numeric values, and pattern watermarks accompany ramps.

## Badges (scientific integrity)

`.badge-observed` (satellite-derived) · `.badge-predicted` ·
`.badge-simulated` (scenario) · `.badge-demo` (DEMO SCENARIO) ·
`.badge-model` (MODEL-ESTIMATED). Every mock-derived value is marked;
the before/after slider is captioned as illustrative banding.

## Demo mode

`VITE_DEMO_MODE=true` (default) routes all data access through
`services/api/demo/mockBackend.ts`, an in-memory mirror of the FastAPI
surface (same deterministic formulas). `false` switches `services/api/client.ts`
to the live backend. Components are adapter-agnostic — no redesign on switch.

## Map architecture

`features/maps/HeatMap.tsx` — MapLibre with a GeoJSON grid source;
layers: LST, heat-risk, NDVI, NDBI, NDWI, albedo, population; scenario mode
renders ΔLST diverging colors. Controls: layer tabs (role=tablist), legend
with numeric endpoints, DATA SOURCES dialog, pixel-inspector dialog on cell
click. Hotspot markers are buttons (keyboard reachable) syncing the store.

## Thermal disc

`features/thermal-disc/ThermalDisc.tsx` — R3F cylinder with canvas-generated
textures (LST/NDVI/NDBI/NDWI/OPTIMIZED/CORRUPTED), idle rotation + pointer
tilt, lazy WebGL activation after first paint, CSS-gradient fallback for
reduced motion / no WebGL (keyboard/AT never depends on WebGL).

## Accessibility

Semantic landmarks + ARIA labels on all controls · focus-visible outlines ·
keyboard-operable slider/compare (arrow keys) · risk classes labelled by
name and threshold · `prefers-reduced-motion` disables Lenis, GSAP reveals,
disc rotation, playback.

## State

Zustand (`stores/useAppStore.ts`): selected city/hotspot/layers/climate/
solution/scenario/timeline year. Server state lives in TanStack Query hooks
(`hooks/queries.ts`) — presentational components never fetch directly.
