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

The full planned Architecture V2 formal experiment remains separate from this checkpoint. The planned 4,200-run formal experiment has not yet been executed.