# Validation Record

## Current checkpoint

```text
Test files:        66 passed
Tests:             455 passed
Failed tests:      0
TypeScript:        passed
Production build:  passed
```

This checkpoint follows the v1.2 formal experiment, statistical analysis, production deployment, and responsive-interface pass.

The automated suite verifies software behavior and internal model consistency. It does not establish real-world predictive validity.

## Coverage

| Area | Examples |
|---|---|
| Core numerical behavior | fixed timestep, movement, density, bottleneck capacity, termination |
| Routing | Dijkstra, Nearest Exit, Static, Congestion-Aware, Hazard-Aware, Adaptive Hybrid |
| Dynamic scenarios | hazard activation, exit blocks, corridor blocks, D0-D6 regression |
| Experimental integrity | seed preservation, common random numbers, run IDs, manifests, formal output |
| Presentation consistency | replay, visual/headless agreement, Demo reproducibility |

Small analytical cases are checked against known values, including free-flow travel time, known shortest paths, an independent path reference, Weidmann speed-density values, bottleneck capacity, and zero hazard exposure under clear conditions.

Routing tests also verify that the policies remain behaviorally distinct. Congestion-Aware responds to current delay, Hazard-Aware prefers safer routes, and Adaptive Hybrid applies the frozen `0.10` voluntary rerouting threshold while retaining its safety override.

## Reproducibility

Identical configuration, seed, parameter set, and source state produce identical formal simulation output.

Common random numbers are preserved across strategies so each comparison uses the same randomized scenario.

Formal records include scenario, seed, strategy, parameter-set version, software version, and Git provenance.

## Architecture V2.1 jam-release correction

The first large Architecture V2 execution exposed an absorbing HIGH-occupancy gridlock case. Ten runs timed out in the pre-correction dataset, with seed `100025` providing a reproducible diagnostic case.

Extending the simulation horizon did not resolve the affected occupants. The behavior was traced to the movement/density implementation, not to legitimate slow evacuation.

The correction introduced downstream receiving/jam-release behavior without adding an arbitrary minimum-speed floor.

Regression coverage confirms that the previously locked cases resolve, ordinary lower-density behavior remains stable, and the corrected v1.1 3,000-run experiment completed with 0 timeout and 0 unreachable.

Pre-correction data are retained as historical validation evidence and are not mixed with the final v1.2 dataset.

## Formal v1.2 execution integrity

```text
5 strategies
x 3 occupancies
x 7 conditions
x 40 paired seeds
= 4,200 runs
```

Validated structure:

```text
4,200 records
4,200 unique run IDs
840 pair keys
105 cells
40 formal seeds
5 strategies
7 conditions
3 occupancy levels
```

Run status:

```text
COMPLETED:             4,200
UNREACHABLE_PRESENT:   0
TIMEOUT:               0
```

Provenance:

```text
Software version:  1.2.0
Git commit:        1a84923664c028f3b6b15c5ec93ddaf9b7905095
Design:            architecture-v2-formal-factorial-v3
Parameter set:     architecture-v2-research-v1.2-frozen
Seed bank:         architecture-v2-formal-seed-bank-v1
```

The four 1,050-run batches were checked independently before being merged into the canonical dataset.

## Visual and headless consistency

The 3D interface does not maintain a second evacuation model.

Regression tests compare renderer-facing replay data with authoritative headless results, including scenario, seed, strategy, simulation time, termination state, evacuation metrics, hazard exposure, disruption records, agent state, routes, exits, and environment geometry.

## D5 and D6

```text
D5  West exit block at 18 s
D6  East-main to southeast corridor block at 12 s
```

Dedicated regression tests exercise both conditions across all five routing strategies.

Calibration runs used to select these conditions remain validation evidence. They are not substituted for the 40-seed formal dataset.

## Statistical-analysis checks

Analysis Stage A verified dataset readiness, cell structure, pairing, and descriptive summaries.

Stage B retained the common-seed pairing and evaluated Adaptive Hybrid against four comparators for:

- total evacuation time
- population simulated hazard exposure

The analysis used paired two-sided t-tests, Cohen's `dz`, exact two-sided sign tests as a sensitivity check, and Holm correction across 168 tests.

Because the inferential plan was finalized after execution, it is reported as post-execution multiplicity-controlled analysis rather than preregistered confirmatory analysis.

## Production smoke testing

Production URL:

https://evacuation-strategy-simulator.nirman-bhowmike.workers.dev

The deployed application was checked separately from the repository build.

A restricted browser environment without WebGL originally produced a blank visualization. The application now shows a visible fallback when WebGL cannot be initialized.

A normal Chrome browser with WebGL available was used to verify the actual 3D application, including building and occupant rendering, playback, Research / Demo switching, camera views, themes, disruption display, agent selection, and route tracing.

Responsive phone testing covered portrait and landscape layouts. Landscape supports the detailed Agent Inspector. Portrait keeps route tracing while suppressing the full inspector. Mobile Present mode is hidden, and Reset Views is hidden in phone portrait.

One accepted presentation limitation remains: extreme manual zoom-out in portrait can reveal a large dark area around the finite scene ground. This does not change simulation state or research output.

## Interpretation limits

Validation establishes implementation consistency for the defined model. It does not establish certified accuracy for real evacuations.

The model does not include fire or smoke physics, toxic gas concentration, temperature, visibility degradation, physiological tenability, injury probability, mortality probability, empirical human-subject validation, or a calibrated microscopic collision model.

Hazard exposure is simulated time in `RISK` regions, reported in person-seconds. It is not FED, injury, dose, or mortality.

The building is fictional and is not a validated digital twin.

## Verification commands

```bash
npm run typecheck:all
npm run build
npm test
git diff --check
```

Formal research execution additionally requires a clean tracked worktree and captured Git/software provenance.