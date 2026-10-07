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