# 3D Emergency Evacuation Strategy Simulator

A research-oriented simulation platform for experimentally evaluating fixed and adaptive evacuation-routing strategies under dynamic building conditions.

The project combines a deterministic research engine, seeded stochastic scenario generation, multiple routing policies, dynamic disruption events, automated experiments, and an interactive 3D replay interface. The quantitative simulation engine is the authoritative research artifact; the 3D environment visualizes simulation state and results but does not determine research outcomes.

## Research Objective

**Central research question:** How do fixed and adaptive evacuation-routing strategies differ in performance when congestion, hazards, exit availability, occupancy, and route conditions change during an evacuation?

The simulator is designed for controlled, reproducible comparison rather than visual demonstration alone.

## Current Research Configuration

The current environment uses **Architecture V2**, a fictional first-floor institutional / academic building with multiple wings, four exterior exits, alternative circulation paths, bottlenecks, tactical decision points, configurable hazards, corridor blocks, and exit failures. Occupants originate from room locations and move through an explicit navigation network toward available exits.

The building is intentionally fictional and is not presented as a digital twin of a real facility.

## Routing Strategies

Five routing strategies are implemented:

- **Nearest Exit** — geometric nearest-exit baseline.
- **Static Shortest Path** — shortest feasible network route with recovery when the route becomes physically infeasible.
- **Congestion-Aware** — uses current density, queueing, and estimated travel-time effects.
- **Hazard-Aware** — safety-first routing that treats blocked infrastructure as infeasible and traversable hazard regions as exposure-bearing `RISK` areas.
- **Adaptive Hybrid** — combines feasibility, hazard state, congestion-adjusted travel time, bottleneck delay, exit availability, route history, and rerouting inertia.

The frozen Adaptive Hybrid voluntary rerouting threshold is:

```text
theta = 0.10
```

## Formal Research Conditions

| Condition | Description |
|---|---|
| **D0** | Baseline, no disruption |
| **D1** | Main-spine hazard activation at 12 s |
| **D2** | South-central exit block at 18 s |
| **D3** | Main-central corridor block at 12 s |
| **D4** | Main-spine hazard at 12 s + south-central exit block at 18 s |

These D0–D4 definitions are treated as frozen research conditions. New demonstration scenarios are not silently added to the formal experiment.

## Occupancy Levels

```text
LOW     = 14 occupants
MEDIUM  = 42 occupants
HIGH    = 70 occupants
```

An 84-occupant condition is retained as a stress-test condition rather than a primary factorial level.

## Dynamic Disruptions

The engine supports scheduled events including:

```text
HAZARD_ACTIVATE
HAZARD_EXPAND
CORRIDOR_BLOCK
EXIT_BLOCK
```

A hazard is a traversable `RISK` condition. Occupants may still pass through it and accumulate hazard-exposure time. A blocked corridor or exit is unavailable and can trigger forced route recovery.

Strategies respond only after an event has occurred; future disruption information is not exposed to routing policies.

## Reproducibility

Formal stochastic experiments use recorded pseudorandom seeds and common random numbers. The same scenario and seed are presented to competing strategies so strategy comparisons are not confounded by different randomized populations.

The current formal design uses 40 paired replication seeds.

## Simulation Architecture

### Tactical layer
- exit selection
- route generation
- dynamic route evaluation
- disruption response
- rerouting decisions

### Operational layer
- continuous occupant movement
- density-dependent walking speed
- bottleneck service constraints
- queueing effects
- route traversal
- evacuation completion

### Visualization layer
- 3D building and occupant rendering
- disruption visualization
- route tracing
- replay
- selected-agent inspection
- research metrics display

The visualization consumes authoritative simulation output rather than independently calculating research behavior.

## Baseline Numerical Parameters

```text
Simulation timestep:        0.05 s
Density-cell baseline:      1.0 m
Specific flow baseline:     1.3 persons/m/s
Adaptive threshold:         0.10
```

## Research Outputs

Primary interface metrics:

- evacuated occupants
- completion percentage
- total evacuation time
- reroute count

Additional research metrics:

- P95 evacuation time
- peak local density
- hazard exposure
- queue exposure

Hazard exposure is reported in **person-seconds** and represents simulated time spent in regions classified as `RISK`. It must not be interpreted as injury probability, smoke dose, physiological tenability, or mortality risk.

## 3D Research Interface

The interface includes:

- light and dark modes
- reusable camera presets
- manual rotate, pan, and zoom
- responsive presentation mode
- playback timeline and scrubber
- Play / Pause / Replay controls
- visible disruptions
- selected-agent tracking
- route visualization
- multi-agent selection
- agent inspector
- research metrics
- reproducible seed display
- scenario configuration controls

Selected-agent routes use cyan for currently usable segments and amber for segments passing through active traversable hazards.

## Research Mode and Interactive Demo Mode

**Research Mode** uses predefined, reproducible, version-controlled experimental conditions. The frozen D0–D4 conditions belong here.

A separate **Interactive Demo Mode** is planned for exploratory and presentation use. It will allow manual exit blocks, corridor blocks, and hazards while remaining clearly separate from formal research conditions.

## Automated Experiments

Available npm commands include:

```bash
npm run formal:pair
npm run diagnostic:matrix
npm run formal:batch
```

Formal outputs should always be interpreted together with scenario configuration, seed, parameter-set version, and software / Git provenance.

## Verification and Validation

Stable checkpoints are expected to pass:

```bash
npm test
npm run typecheck:all
npm run build
git diff --check
```

The automated suite covers routing, deterministic replay, same-seed reproducibility, density-speed behavior, bottleneck flow, hazard exposure, rerouting behavior, Architecture V2 population generation, room-origin navigation, disruption regression behavior, timestep convergence, and visual/headless consistency.

## Technology

```text
TypeScript
React
React Three Fiber
Three.js
Vite
Vitest
```

The simulation engine is separated from rendering so experiments can execute headlessly.

## Installation

Requirements: Node.js, npm, and Git.

```bash
git clone https://github.com/NirmanBhowmike/evacuation-strategy-simulator.git
cd evacuation-strategy-simulator
npm install
npm run dev
```

Validation commands:

```bash
npm test
npm run typecheck:all
npm run build
```

## Repository Structure

```text
evacuation-strategy-simulator/
├── docs/          Research documentation and development records
├── experiments/   Experiment runners and formal execution utilities
├── research/      Literature and parameter-evidence structure
├── results/       Research-output documentation and result artifacts
├── src/           Simulation engine, strategies, application, and visualization
├── tests/         Automated verification and validation
├── README.md
├── package.json
├── tsconfig.json
└── vite.config.ts
```

See [`docs/README.md`](docs/README.md) for the documentation index.

## Current Status

The project currently includes Architecture V2, five routing strategies, deterministic seeded simulation, congestion and bottleneck modeling, dynamic disruption events, frozen D0–D4 research conditions, automated experiment infrastructure, 3D replay, selected-agent route tracking, responsive presentation mode, research-output metrics, and automated validation.

Current development is moving toward additional demonstration presets, Interactive Demo Mode, further documentation, and formal experiment analysis.

## Scope and Interpretation

This software is a research simulator. It is not a certified emergency-management system, real-time evacuation-control product, validated fire/smoke simulator, physiological injury model, or replacement for professional life-safety engineering analysis.

## License and Use

This repository is publicly viewable for academic and educational review.

No open-source license is granted. The package is marked `UNLICENSED`, and public visibility does not imply permission to copy, modify, redistribute, or incorporate the source code into another project.

## Author

**Nirman Bhowmike**

Research-oriented software project developed for graduate-level study in AI, software research, simulation, and industrial engineering.
# 3D Emergency Evacuation Strategy Simulator

A research-oriented simulation platform for experimentally evaluating fixed and adaptive evacuation-routing strategies under dynamic building conditions.

The project combines a deterministic research engine, seeded stochastic scenario generation, multiple routing policies, dynamic disruption events, automated experiments, and an interactive 3D replay interface. The quantitative simulation engine is the authoritative research artifact. The 3D environment visualizes simulation state and results but does not independently determine research outcomes.

## Research Objective

**Central research question:** How do fixed and adaptive evacuation-routing strategies differ in performance when congestion, hazards, exit availability, occupancy, and route conditions change during an evacuation?

The simulator is designed for controlled and reproducible comparison rather than visual demonstration alone.

## Current Research Configuration

The current environment uses **Architecture V2**, a fictional first-floor institutional / academic building with multiple wings, four exterior exits, alternative circulation paths, bottlenecks, tactical decision points, configurable hazards, corridor blocks, and exit failures.

Occupants originate from room locations and move through an explicit navigation network toward available exits.

The building is intentionally fictional and is not presented as a digital twin of a real facility.

## Routing Strategies

Five routing strategies are implemented:

- **Nearest Exit** — geometric nearest-exit baseline.
- **Static Shortest Path** — shortest feasible network route with recovery when the route becomes physically infeasible.
- **Congestion-Aware** — uses current density, queueing, and estimated travel-time effects.
- **Hazard-Aware** — safety-first routing that treats blocked infrastructure as infeasible and traversable hazard regions as exposure-bearing `RISK` areas.
- **Adaptive Hybrid** — combines feasibility, hazard state, congestion-adjusted travel time, bottleneck delay, exit availability, route history, and rerouting inertia.

The frozen Adaptive Hybrid voluntary rerouting threshold is:

```text
theta = 0.10