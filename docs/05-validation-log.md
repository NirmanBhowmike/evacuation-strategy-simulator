# Validation Log

This document records verification and validation activities for the 3D Emergency Evacuation Strategy Simulator.

The research engine is developed and tested independently from the future 3D rendering layer. Validation therefore focuses first on deterministic simulation behavior, numerical behavior, movement and flow logic, routing behavior, disruption handling, reproducibility, and experimental integrity.

## Current Validation Status

As of October 2, 2026:

- 40 test files passed
- 330 tests passed
- 0 tests failed
- Core simulation engine tests are passing
- Routing-strategy tests are passing
- Headless simulation tests are passing
- Experiment-engine tests are passing
- Dedicated validation suites are passing

The dedicated Phase 5 validation tests are stored under:

`tests/validation/`

Current validation files:

- `coreEngineValidation.test.ts`
- `behavioralModelValidation.test.ts`
- `finalEngineValidation.test.ts`

These validation tests are separate from the normal unit tests so that research-validation evidence can be identified independently.

---

## 1. Single-Agent Analytical Validation

### Purpose

Verify that a simple evacuation result agrees with an analytically calculated free-flow travel time.

### Test Case

A single agent travels along a 5 m route at a desired speed of 1.34 m/s.

Analytical continuous travel time:

`5 / 1.34 = approximately 3.7313 seconds`

The validation simulation uses a fixed timestep of 0.1 s. Therefore, evacuation should be registered on the first simulation boundary at or after the analytical arrival time:

`ceil(3.7313 / 0.1) × 0.1 = 3.8 seconds`

### Result

Passed.

The headless simulation produced the expected discrete evacuation time and a traveled distance of 5 m.

### Interpretation

The basic relationship between distance, walking speed, fixed timestep, and evacuation completion is behaving as expected.

---

## 2. Known Shortest-Path Validation

### Purpose

Verify the routing solver against graphs with known analytical shortest paths.

### Validation

A reference graph included both a direct high-cost route and a multi-edge lower-cost route.

Expected shortest path:

`a → b → c → exit`

Expected total network cost:

`4`

### Result

Passed.

The Dijkstra implementation selected the expected minimum-cost route rather than the geometrically direct but more expensive alternative.

---

## 3. Independent Routing Reference Validation

### Purpose

Check the Dijkstra implementation against an independently implemented reference method.

### Method

A separate exhaustive simple-path enumeration routine was implemented for a small validation graph.

This routine does not call the project Dijkstra implementation.

The independently calculated minimum path cost was compared with the Dijkstra result.

### Result

Passed.

Both methods produced a minimum path cost of 4 and selected the same minimum-cost route.

### Note

Python was not required for this particular validation because a separate exhaustive reference algorithm provided an independent comparison within the test environment.

---

## 4. Blocked-Route Validation

### Purpose

Verify that routes through dynamically blocked corridors are removed from feasible routing alternatives.

### Test Case

The shorter route to the primary exit was blocked at simulation time zero using a `CORRIDOR_BLOCK` event.

### Result

Passed.

The agent did not use the blocked route and evacuated through the alternative exit.

### Interpretation

Dynamic corridor blockage correctly changes the traversable navigation network.

---

## 5. Unreachable-Agent Validation

### Purpose

Verify that agents are not falsely classified as evacuated when no feasible exit remains.

### Test Case

All routes from the agent's starting node to available exits were blocked at simulation time zero.

### Result

Passed.

The agent was classified:

`UNREACHABLE`

The run terminated as:

`ALL_RESOLVED`

with:

- 0 evacuated agents
- 1 unreachable agent
- completion rate = 0

### Interpretation

Unreachable occupants are explicitly represented rather than silently counted as evacuated.

---

## 6. Same-Seed Reproducibility

### Purpose

Verify deterministic replay.

### Method

Identical scenario inputs, seed, parameters, layout, and strategy were executed more than once.

### Result

Passed.

Repeated runs produced identical simulation results.

### Interpretation

The deterministic simulation architecture supports exact same-scenario replay when configuration and software state are unchanged.

---

## 7. Density-Speed Validation

### Purpose

Verify qualitative and boundary behavior of the selected Weidmann speed-density relationship.

### Expected Behavior

- Density = 0 → free-flow speed
- Increasing density → decreasing walking speed
- Density approaching jam density → speed approaches zero
- Density at or above jam density → speed = 0

Baseline values currently implemented:

- Free-flow reference speed = 1.34 m/s
- Lambda = 1.913
- Jam density = 5.4 persons/m²

### Result

Passed.

The tested relationship decreased monotonically across the selected density values and returned zero speed at jam density.

---

## 8. Independent Weidmann Equation Check

### Purpose

Verify the implementation against a separately calculated equation value.

### Method

For density = 2 persons/m², the reference speed was calculated directly from:

`v(rho) = 1.34 × [1 - exp(-1.913 × (1/rho - 1/5.4))]`

The independently evaluated value was compared with `calculateWeidmannSpeedMps()`.

### Result

Passed to numerical tolerance.

---

## 9. Bottleneck-Flow Validation

### Purpose

Verify the width-based capacity relationship and discrete admission behavior.

Current model:

`Q = q_s × W`

where:

- `Q` = persons/s
- `q_s` = specific flow in persons/(m·s)
- `W` = usable width in meters

### Test Case

With:

- specific flow = 1.3 persons/(m·s)
- width = 2 m

Expected capacity:

`Q = 1.3 × 2 = 2.6 persons/s`

### Result

Passed.

The controller produced the expected capacity, deterministic admissions, fractional carry while demand remained queued, and discarded unused service capacity after the queue cleared.

An additional boundary test confirmed exact whole-person admission when the available capacity budget was exactly one person.

---

## 10. Zero-Hazard Exposure Validation

### Purpose

Verify that the hazard-exposure metric remains exactly zero when no hazard is active.

### Result

Passed.

For a complete evacuation under CLEAR conditions:

- population hazard exposure = 0 person-seconds
- mean hazard exposure = 0 seconds
- individual agent hazard exposure = 0 seconds

### Interpretation

The hazard metric is not accumulating exposure in CLEAR regions.

---

## 11. Routing-Response Validation

### Purpose

Verify that routing strategies respond according to their intended information and objective functions.

### Congestion-Aware Validation

Under uncongested conditions, the shorter route was selected.

After heavy density was introduced on the shorter route, Congestion-Aware routing selected the longer but currently faster alternative.

Result: Passed.

### Hazard-Aware Validation

When the shorter route was classified `RISK` and the longer alternative remained `CLEAR`, Hazard-Aware routing selected the longer CLEAR route.

Predicted risk exposure for the selected route was zero.

Result: Passed.

### Interpretation

The strategies respond differently to current state according to their defined routing objectives rather than behaving as duplicate shortest-path policies.

---

## 12. Adaptive Rerouting Validation

### Purpose

Verify rerouting inertia and the safety override.

### Relative Improvement Rule

`I = (C_current - C_alternative) / C_current`

### Threshold Test

A candidate route provided a 20% predicted travel-time improvement.

With:

`theta = 0.25`

the current route was retained.

With:

`theta = 0.20`

the candidate route was accepted.

### Safety Override Test

The current route was then classified as RISK while the alternative remained CLEAR.

Even with:

`theta = 1.00`

the safer alternative was accepted.

### Result

Passed.

### Interpretation

Normal route switching respects the inertia threshold, while a meaningful safety improvement can override the normal time-improvement threshold.

---

## 13. Numerical Boundary Validation

Dedicated tests were performed for important numerical boundaries.

### Fixed-Step Clock

A 0.025 s timestep advanced for 1,000 ticks.

Expected time:

`25 seconds`

Result: Passed.

### Exact Edge Arrival

An agent traveling exactly the remaining edge distance during a timestep arrived at the destination without overshoot.

Result: Passed.

### Density-Cell Boundary

An agent positioned exactly on a density-cell boundary was deterministically assigned to the following cell.

Result: Passed.

### Exact Bottleneck Admission Boundary

A capacity budget equal to exactly one person admitted one person and retained the second occupant in the queue.

Result: Passed.

---

## 14. Performance and Stress Validation

### Purpose

Detect failures in agent accounting, termination, and simulation stability under a substantially larger population than the small analytical tests.

### Test Case

A headless run was executed with:

- 250 agents
- fixed timestep = 0.1 s
- bounded simulation window = 1 s
- high bottleneck service capacity to isolate engine execution behavior

### Acceptance Criteria

The test required:

- no crash
- complete preservation of the 250-agent population
- valid simulation termination
- consistent status accounting
- execution within a generous 10,000 ms regression guard

### Result

Passed.

The simulation retained all 250 agents and completed within the regression guard.

### Limitation

This is a regression-oriented stress test, not a formal performance benchmark. Formal computation-time comparisons should record hardware, operating environment, software version, and Git commit.

---

## 15. Integrated Headless Simulation Validation

The headless runner has been tested for:

- complete single-agent evacuation
- deterministic repeated execution
- time-zero exit blockage
- constrained bottleneck queues
- timeout behavior
- future disruptions not being used before activation
- invalid spawn-position rejection
- blocked-route response
- unreachable-agent classification

Result: Passed.

---

## 16. Experiment and Reproducibility Validation

The experiment engine has been tested for:

- Scenario × Strategy batch execution
- identical ScenarioInstance reuse across strategies
- scenario IDs
- parameter-set IDs
- seed preservation
- deterministic run IDs
- software-version provenance
- Git-commit provenance
- experiment-registry records
- JSON reproducibility configuration
- CSV research output
- automatic strategy-level metric aggregation
- run-status recording

Result: Passed.

---

## 17. Current Test Summary

Current automated test status:

- Test files: 40 passed
- Tests: 330 passed
- Failed tests: 0

Dedicated validation tests:

- Core engine validation: 5 tests
- Behavioral-model validation: 5 tests
- Final engine validation: 7 tests
- Total dedicated Phase 5 validation tests: 17

These operate in addition to the broader unit and integration test suite.

---## Occupancy Calibration

### Purpose

Determine LOW, MEDIUM, and HIGH occupancy levels from observed Layout A congestion behavior rather than assign arbitrary population counts.

### Calibration Conditions

The calibration used:

- Layout A
- Static Shortest Path
- no dynamic disruption
- desired speed = 1.34 m/s for all occupants
- timestep = 0.05 s
- density cell length = 1.0 m
- specific bottleneck flow = 1.3 persons/(m*s)

Candidate populations:

- 12
- 24
- 36
- 48
- 60
- 72
- 96
- 120

### Key Results

12 occupants:
- completion rate = 1.00
- maximum density = 2.286 persons/m²
- queue exposure = 9.15 person-seconds

36 occupants:
- completion rate = 1.00
- maximum density = 3.429 persons/m²
- queue exposure = 42.75 person-seconds

48 occupants:
- completion rate = 1.00
- maximum density = 4.571 persons/m²
- queue exposure = 65.45 person-seconds

60 occupants:
- completion rate = 0.90
- maximum density = 6.857 persons/m²
- 6 occupants reached TIMEOUT

### Decision

Primary occupancy regimes:

- LOW = 12 occupants
- MEDIUM = 36 occupants
- HIGH = 48 occupants

Occupancies of 60 and above are retained for overload or stress testing rather than the primary experiment.

### Interpretation

The selected regimes create progressively stronger congestion while retaining complete evacuation in the baseline case. The transition between 48 and 60 occupants identifies a useful practical boundary because the 60-person case exceeds the current 5.4 persons/m² jam-density reference and begins producing unresolved occupants.

## 18. Validation Items Still Open

### Visual vs Headless Result Consistency

Status: Pending.

Reason:

The 3D rendering layer has not yet been implemented. The visualization must later be verified against the same underlying simulation state to confirm that rendered agent positions, routes, hazards, exits, and events do not diverge from headless simulation results.

This validation will be performed after the Phase 6 visualization layer exists.

### Numerical Timestep Convergence

Status: Pending.

Current primary candidate timestep:

`0.05 s`

Planned comparison:

- 0.025 s
- 0.05 s
- 0.10 s

The production timestep will be frozen only after convergence testing.

### Occupancy Calibration

Status: Pending.

LOW, MEDIUM, and HIGH occupancy regimes have been conceptually defined. Exact occupant counts remain to be calibrated using the actual development building geometry and congestion response.

### Dynamic Disruption Timing

Status: Pending.

The disruption-event mechanism is implemented and tested. Exact activation, expansion, corridor-blockage, and exit-blockage timings for the experimental scenario families remain to be frozen.

### Adaptive Rerouting Threshold

Status: Pending.

Candidate values:

- 0.00
- 0.10
- 0.20
- 0.30

The threshold will be tuned using development scenarios only. After selection, it will be frozen before holdout-layout evaluation.

---

## 19. Validation Scope and Limitations

The current validation establishes internal consistency, deterministic behavior, reference agreement for selected mathematical components, and correct implementation of the defined research model.

It does not establish real-world predictive validity for emergency evacuation behavior.

The current model does not simulate:

- fire physics
- smoke transport
- temperature
- toxic gas concentrations
- visibility degradation
- physiological tenability
- injury probability
- detailed microscopic human collision forces
- complete unaided human decision behavior

Hazard exposure represents time spent in regions classified `RISK`. It must not be interpreted as injury, dose, fractional effective dose, or mortality probability.

The current building environment is an original fictional research layout and is not claimed to reproduce a real building exactly.

---

## 20. Next Validation Actions

The next research-engine calibration sequence is:

1. Run numerical timestep convergence testing.
2. Calibrate LOW, MEDIUM, and HIGH occupancy counts.
3. Establish experimental disruption timings.
4. Tune the Adaptive Hybrid rerouting threshold on development scenarios.
5. Freeze the calibrated parameter set.
6. Record the frozen Git commit and parameter-set version.
7. Later validate 3D visualization against headless simulation state.