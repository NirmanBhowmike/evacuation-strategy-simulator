# Development History

This document records major implementation milestones for the **3D Emergency Evacuation Strategy Simulator**.

The project was developed iteratively. Research-model decisions, simulation-engine implementation, validation, visualization, and interface refinement were treated as related but separate workstreams.

The purpose of this log is to preserve major development stages without reconstructing unsupported hour-by-hour details.

---

## Project Establishment

The project began as a research-oriented evacuation simulation system rather than a visual demonstration alone.

Early decisions included:

- using a fictional institutional / academic building
- treating the simulation engine as the authoritative research artifact
- separating visualization from simulation logic
- using deterministic and reproducible experiments
- supporting multiple routing strategies
- preserving software and parameter provenance through Git

The repository, Node.js project, TypeScript configuration, testing infrastructure, and documentation structure were established during this phase.

---

## Research Model Definition

The research model was developed before the final visualization layer.

Major model decisions included:

- graph-based tactical routing
- continuous agent movement
- density-dependent walking speed
- bottleneck constraints
- seeded stochastic desired walking speeds
- dynamic hazard and blockage events
- explicit route reevaluation rules
- a reproducible scenario-generation process

Five routing strategies were defined:

1. Nearest Exit
2. Static Shortest Path
3. Congestion-Aware
4. Hazard-Aware
5. Adaptive Hybrid

The Adaptive Hybrid strategy introduced rerouting inertia so that small predicted improvements would not cause excessive switching.

A rerouting threshold of:

```text
theta = 0.10
```

---

## Interactive Demo Mode and Scenario Builder

A separate **Interactive Demo Mode** was added so that manual disruption scenarios can be demonstrated without changing the frozen formal research design.

The application now has two clearly separated operating modes:

- **Research Mode** uses the frozen Architecture V2 formal research configuration and the predefined D0-D6 conditions.
- **Interactive Demo Mode** allows manual disruptions to be introduced during a simulation run.
- Demo events are recorded with their disruption type, target, and simulation activation time.
- Demo runs remain reproducible when the same seed and event log are used.
- Manual Demo events are not treated as formal research conditions and are not included in the formal factorial experiment design.

The Interactive Demo scenario builder supports:

- main-spine hazard activation
- blocking one or multiple exits
- blocking one calibrated corridor segment
- combining hazard, exit-block, and corridor-block events at the same simulation time
- demonstration presets and fully custom scenarios
- timestamped event logging
- deterministic replay using the same seed and recorded event sequence
- clearing Demo events without modifying the formal research configuration

The interface was also redesigned so Research Mode and Interactive Demo Mode are visually distinct. Research Mode retains a restrained cyan/teal technical identity, while Interactive Demo Mode uses a separate violet/indigo identity. Both dark and light themes preserve this distinction.

---

## D6 Corridor Visualization Correction

The D6 east-main-to-southeast corridor disruption was already being applied by the simulation engine, but its dedicated research corridor zone was not initially recognized by the visualization layer.

The disruption visualization was updated to recognize the D6 blockable zone. D6 now displays the same visible closure treatment used for other blocked corridor segments, including the blocked-region overlay and event label.

This was a visualization correction only. The frozen D6 research model and calibrated simulation behavior were not changed.

---

## Interactive Demo Validation Checkpoint

The Interactive Demo implementation was validated before being committed.

Validation results:

```text
Test Files: 66 passed
Tests: 455 passed
TypeScript validation: passed
Production build: passed
git diff --check: passed
```

The Interactive Demo regression tests verify that:

- a Demo replay with no manual events matches the formal D0 baseline behavior
- multiple unique exit blocks are supported
- manual event logs remain deterministic and reproducible
- duplicate blocking of the same exit target is rejected

The implementation checkpoint was committed as:

```text
df2d7aa feat: add interactive demo mode and disruption scenario builder
```

The Interactive Demo checkpoint preceded formal v1.2 execution. The completed formal study is recorded below.

## Formal v1.2 execution

The Architecture V2 v1.2 factorial study was executed from the frozen simulation checkpoint:

```text
Git commit:        1a84923664c028f3b6b15c5ec93ddaf9b7905095
Software version:  1.2.0
Design:            architecture-v2-formal-factorial-v3
Parameter set:     architecture-v2-research-v1.2-frozen
Seed bank:         architecture-v2-formal-seed-bank-v1
```

Four 1,050-run batches produced the final 4,200-run dataset. All runs completed without timeout or unreachable-present outcomes.

## Analysis and results package

Stage A verified dataset structure, pairing, and descriptive summaries. Stage B compared Adaptive Hybrid with the four comparator strategies using paired common-seed analysis.

The public curated package under `results/formal-v1.2/` contains the canonical CSV, descriptive tables, inferential outputs, figures, provenance records, and integrity hashes.

The main result is a speed-exposure tradeoff rather than universal dominance by Adaptive Hybrid.

## Production deployment

The browser application was deployed to Cloudflare Workers from GitHub `main`.

Production URL:

https://evacuation-strategy-simulator.nirman-bhowmike.workers.dev

A WebGL capability guard was added after a restricted browser environment exposed blank-screen behavior when WebGL could not initialize. The deployed application now presents a visible fallback instead.

## Responsive interface

A responsive phone layer was developed separately and merged only after regression checks confirmed that the validated desktop application code remained protected.

Landscape is the preferred mobile viewing mode. Portrait retains route tracing while suppressing the detailed Agent Inspector. Present mode is not exposed on phone layouts, and Reset Views is hidden in phone portrait.

The remaining extreme portrait zoom-out behavior is recorded as a non-blocking visualization limitation.

## Final software checkpoint

```text
66 test files passed
455 tests passed
TypeScript validation passed
Production build passed
```

Software implementation and public-facing repository documentation are considered closed for the current academic release. Later work should focus on figures, report writing, presentation material, and clearly versioned research extensions.
