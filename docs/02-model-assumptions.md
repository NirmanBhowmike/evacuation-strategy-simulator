> **Historical assumption record**
>
> This file preserves assumptions recorded during Research Model v1.0 and Layout A development. Values such as 12/36/48 occupancy, the five-condition D0-D4 design, early provisional timing, and holdout-layout planning are historical where they differ from the completed Architecture V2 v1.2 study.
>
> Current formal values are 14/42/70 occupants, D0-D6, 40 paired seeds per cell, and 4,200 runs. Current versioned code, regression tests, formal manifests, and `results/formal-v1.2/` take precedence.

# Model Assumptions

## Purpose

This document records assumptions introduced into the evacuation model. Each assumption should remain visible so that implementation convenience is not mistaken for empirical evidence.

## A-001: Experimental Building

The simulated building will be fictional and designed specifically for controlled routing experiments.

It will resemble a realistic institutional or academic building but will not represent an exact real facility.

Status: Locked

Reason:
The research concerns evacuation-routing strategies rather than architectural reconstruction.

## A-002: Primary Population

Research Model v1.0 will initially represent a general ambulatory adult pedestrian population.

Special populations such as children, mobility-impaired occupants, wheelchair users, and explicitly elderly populations will not be included in the primary experiment.

Status: Locked for primary experiment

Reason:
Each additional population would require separate empirical movement and behavioral assumptions.

## A-003: Free-Flow Speed

Baseline desired walking speeds will initially follow a normal distribution with:

Mean = 1.34 m/s
SD = 0.26 m/s

Status: Baseline selected; implementation bounds pending

Limitation:
This is a benchmark distribution and does not represent every population or context.

## A-004: Pre-Evacuation Delay

Primary routing experiments will use a pre-evacuation delay of 0 s.

Status: Locked for primary experiment

Reason:
The purpose is to isolate routing and movement effects.

Limitation:
Real occupants may have substantial and heterogeneous response delays.

## A-005: Congestion

Walking speed will decrease as local pedestrian density increases.

The Weidmann fundamental diagram will be the baseline density-speed relationship.

Status: Baseline locked

Limitation:
Pedestrian fundamental diagrams vary among populations, geometries, and measurement methods.

## A-006: Density Discretization

Corridor density will initially be calculated using 1.0 m longitudinal spatial cells.

Status: Provisional

Sensitivity:
0.5 m and 2.0 m cells will also be tested.

## A-007: Bottleneck Capacity

Baseline specific bottleneck flow will initially be 1.3 persons/(m*s).

Sensitivity cases will include:

1.6 persons/(m*s)
1.9 persons/(m*s)

Status: Provisional baseline with required sensitivity analysis

## A-008: Occupant Width

Nominal occupant shoulder width will initially be approximately 0.456 m.

Status: Baseline selected

Purpose:
Spacing, doorway admission, overlap prevention, and visual scale.

## A-009: Local Movement

A full Social Force Model will not be used in the primary research engine.

Local motion will combine route following, physical footprint, overlap prevention, density-sensitive speed, and bottleneck constraints.

Status: Architectural decision locked

Implementation details:
Pending.

## A-010: Hazard Physics

Hazards will be represented as abstract dynamic risk and route-availability conditions.

The model will not predict:

- fire spread
- smoke movement
- temperature
- toxic gas concentration
- visibility
- injury probability

Status: Locked

## A-011: Timestep

Baseline timestep:

dt = 0.05 s

Status: Locked for the primary experiment after numerical convergence testing.

Validation:

The baseline was compared against:

- 0.025 s fine reference
- 0.05 s production candidate
- 0.10 s coarse sensitivity case

The 0.05 s timestep preserved the qualitative evacuation outcome, remained within the predefined convergence tolerance relative to the 0.025 s reference, and reduced the required simulation ticks by approximately half relative to the fine reference.

Sensitivity cases:

- 0.025 s
- 0.10 s

These values remain available for later numerical sensitivity analysis.

## A-012: Determinism and Randomness

All stochastic behavior used in formal experiments will be driven by recorded pseudorandom seeds.

The same scenario seed will be used when comparing routing strategies.

Status: Locked

## A-013: Model Purpose

The software is an experimental evacuation-routing simulator.

It is not intended for:

- regulatory evacuation certification
- life-safety approval
- operational emergency planning
- prediction of injury or mortality
- exact representation of a particular real building

Status: Locked
## A-014: Navigation Representation

The building will use a weighted navigation graph for tactical routing decisions.

Status: Locked

The graph will remain separate from the 3D rendering representation.

## A-015: Core Path Solver

Dijkstra's algorithm will be used as the primary path solver.

Status: Locked

Reason:
The building graph is expected to be moderate in size and requires transparent, deterministic weighted-path calculations.

## A-016: Nearest-Exit Baseline

Nearest Exit will select the exit with minimum Euclidean distance from the occupant.

Status: Locked

Purpose:
Provide a deliberately simple geometric baseline.

## A-017: Static Shortest-Path Baseline

Static Shortest Path will minimize total network distance.

Status: Locked

The strategy may recompute if its route becomes physically impossible, but it will not adapt merely because another route becomes faster.

## A-018: Congestion-Aware Route Cost

Congestion-aware routing will primarily use estimated remaining evacuation time.

Edge travel time:

T_e = L_e / v(rho_e)

Bottleneck queue delay:

T_queue = N_q / Q

Status: Locked concept

Exact implementation details will be validated computationally.

## A-019: Hazard-Aware Routing

Hazard-aware routing will exclude or penalize route segments according to current hazard conditions.

Status: Provisional

Exact rules:
Research Pass 3.

## A-020: Adaptive Hybrid Strategy

Adaptive routing will combine:

- route feasibility
- hazard information
- congestion-adjusted travel time
- bottleneck queues
- rerouting inertia

Status: Architecture locked

## A-021: Decision Opportunities

Routine adaptive route reevaluation will primarily occur at decision nodes.

Status: Locked

Immediate reevaluation will occur when:

- an exit becomes unavailable
- the current route becomes blocked
- the current route becomes unacceptable due to a hazard

## A-022: Rerouting Threshold

Voluntary rerouting requires a minimum relative predicted travel-time improvement:

I = (C_current - C_alternative) / C_current

A voluntary route switch occurs when:

I >= theta

Selected value:

theta = 0.10

Candidate development values evaluated:

- 0.00
- 0.10
- 0.20
- 0.30

Calibration included controlled congestion-only development scenarios with no hazards or blocked routes so that the threshold was not bypassed by forced or safety-priority rerouting.

In valid consequential development cases, theta = 0 allowed route switches for predicted improvements of approximately:

- 0.31%
- 4.71%
- 8.73%

Those switches increased the probe occupant's realized evacuation time.

Theta values of 0.10, 0.20, and 0.30 all rejected those harmful low-benefit switches. Because the three nonzero candidates were tied on the valid consequential cases, the lowest effective threshold was selected to minimize unnecessary rerouting inertia.

Status: Locked for the primary experiment

Interpretation:

The selected value is a development-calibrated control parameter. It is not claimed to be a universally optimal human rerouting threshold.

Sensitivity:

The alternative candidate values remain available for later sensitivity analysis.

## A-023: Current-State Information

Routing strategies may use only information available at the current simulation time.

Future disruption states will not be available to the strategy before they occur.

Status: Locked

## A-024: Routing Interpretation

Dynamic strategies represent evacuation-guidance policies using system-level situational information.

They are not intended as complete predictive models of unaided human exit-choice behavior.

Status: Locked

## A-025: Decision Logging

Significant initial route choices, route reviews, and reroutes will be recorded in structured decision logs.

Status: Locked

Purpose:

- reproducibility
- debugging
- experimental analysis
- interactive explanation

## A-026: Hazard Representation

Hazard conditions will use three discrete states:

CLEAR
RISK
BLOCKED

Status: Locked

Reason:
This provides transparent route-risk and route-availability behavior without claiming unsupported physical fire severity.

## A-027: Physical Hazard Modeling

The simulator will not model:

- fire spread
- smoke transport
- heat
- toxic gas concentration
- visibility
- physiological tenability
- injury probability

Status: Locked

## A-028: Hazard Evolution

Hazards will change through deterministic scheduled scenario events.

Status: Locked

Exact event times:
Research Pass 4.

## A-029: Hazard Exposure

Individual exposure will be measured as time spent in RISK regions.

Unit:
seconds

Population exposure will be measured in:

person-seconds

Status: Locked

The metric is not interpreted as injury or toxicity.

## A-030: Hazard-Aware Route Priority

Hazard-aware routing will:

1. exclude BLOCKED routes
2. minimize currently predicted RISK exposure
3. among similarly safe alternatives, minimize travel time

Status: Locked

## A-031: Adaptive Safety Priority

The Adaptive Hybrid strategy may reroute for a meaningful reduction in hazard exposure even when the alternative route does not satisfy the normal time-improvement threshold.

Status: Locked

## A-032: Supported Dynamic Events

Research Model v1.0 will support:

- HAZARD_ACTIVATE
- HAZARD_EXPAND
- CORRIDOR_BLOCK
- EXIT_BLOCK

Status: Locked

## A-033: Corridor Blocking

A blocked corridor becomes non-traversable in the navigation graph.

Affected routes trigger immediate reevaluation.

Status: Locked

## A-034: Exit Blocking

A blocked exit becomes unavailable immediately.

Agents targeting that exit trigger immediate reevaluation.

Status: Locked

## A-035: Hazard Activation

RISK regions remain traversable unless separately transitioned to BLOCKED.

Status: Locked

This permits experiments involving travel-time versus exposure tradeoffs.

## A-036: Hazard Knowledge

Agents and routing policies may use only currently active hazard information.

Future scheduled hazard events remain unknown.

Status: Locked

## A-037: Hazard Scenario Timing

Exact hazard activation and disruption times will be treated as experimental scenario parameters.

Status: Provisional

Final values:
Research Pass 4.

## A-038: Experimental Factor Structure

The primary formal experiment will use:

5 routing strategies
3 occupancy conditions
5 disruption conditions

Status: Locked framework

## A-039: Occupancy Levels

The primary Layout A experiment will use three occupancy conditions:

- LOW = 12 occupants
- MEDIUM = 36 occupants
- HIGH = 48 occupants

Status: Locked for the primary Layout A experiment after occupancy calibration.

Calibration method:

Occupancy candidates of 12, 24, 36, 48, 60, 72, 96, and 120 occupants were evaluated using:

- Layout A
- Static Shortest Path
- no disruption
- fixed desired walking speed of 1.34 m/s
- timestep = 0.05 s
- density cell length = 1.0 m
- specific bottleneck flow = 1.3 persons/(m*s)

Observed maximum local density:

- 12 occupants: 2.286 persons/mÂ²
- 24 occupants: 2.667 persons/mÂ²
- 36 occupants: 3.429 persons/mÂ²
- 48 occupants: 4.571 persons/mÂ²
- 60 occupants: 6.857 persons/mÂ²

Completion remained 100% through 48 occupants.

At 60 occupants, local density exceeded the 5.4 persons/mÂ² jam-density reference and completion fell to 90% because six agents reached the defensive runtime ceiling.

Reason for selected levels:

LOW, MEDIUM, and HIGH were selected to provide increasing congestion severity while retaining complete baseline evacuation.

Occupancies of 60 and above are classified as overload/stress cases rather than primary experimental conditions.

## A-040: Development Layout

Layout A will be used for development, debugging, calibration, and adaptive-threshold tuning.

Status: Locked

## A-041: Holdout Layout

Layout B will be reserved for holdout simulation evaluation and will not be used to tune the adaptive strategy.

Status: Locked

## A-042: Scenario Instances

A random seed will generate an immutable ScenarioInstance before routing strategies are executed.

All competing strategies will receive the same ScenarioInstance.

Status: Locked

## A-043: Formal Replications

Each formal experimental cell will initially use at least 40 ScenarioInstances.

Additional runs will be added in batches of 10 if convergence criteria are not met.

Status: Locked procedure

## A-044: Convergence

Replication sufficiency will be evaluated from multiple outputs rather than total evacuation time alone.

Status: Locked procedure

Initial convergence outcomes include:

- TET
- P95 evacuation time
- maximum density
- exit utilization
- queue exposure
- hazard exposure when applicable

## A-045: Primary Outcomes

Co-primary outcomes:

- total evacuation time
- population hazard exposure for hazard scenarios

Status: Locked

## A-046: Secondary Outcomes

Key secondary outcomes include:

- P95 evacuation time
- maximum local density
- queue exposure
- completion rate
- unreachable count

Status: Locked

## A-047: Adaptive Threshold Development

Candidate thresholds evaluated:

- 0.00
- 0.10
- 0.20
- 0.30

Selected threshold:

theta = 0.10

Selection rule:

First, exclude calibration cases that violate the development validity criteria, including incomplete evacuation, timeout occupants, or maximum local density at or above the 5.4 persons/mÂ² jam-density reference.

Second, identify threshold values that suppress demonstrated harmful low-benefit voluntary reroutes.

When multiple candidates satisfy those criteria with equivalent development performance, select the lowest threshold to preserve the greatest responsiveness to future meaningful improvements.

Result:

Theta = 0.10 was the lowest candidate that rejected all demonstrated harmful low-benefit reroutes in the valid consequential development cases.

Status: Locked before holdout evaluation

## A-048: Holdout Integrity

The adaptive algorithm and selected threshold will be frozen before Layout B holdout evaluation.

Holdout performance will not be used to retroactively retune the frozen model.

Status: Locked

## A-049: Disruption Timing

Exact disruption timing is defined relative to baseline evacuation behavior rather than presented as real fire-development timing.

Calibrated reference anchors:

- EARLY = 6.65 s
- MID = 13.25 s
- LATE = 19.90 s

Primary corridor-block configuration:

- Layout = Layout A
- Target zone = corridor-main-east-blockable
- Target edge = edge-main-east-end
- Activation time = 6.65 s
- Reference occupancy = 36 occupants

Calibration result:

- baseline TET = 26.50 s
- blocked TET = 33.45 s
- TET increase = 6.95 s
- completion rate = 1.00
- unreachable occupants = 0
- timeout occupants = 0

The 6.65 s condition produced a measurable dynamic-route disruption while preserving complete evacuation. Later activation times on this segment occurred after the relevant route opportunity and therefore did not produce a useful experimental effect.

Status: Corridor-block timing locked; remaining disruption-family schedules still calibration-gated
## A-050: Statistical Pairing

Routing strategies will be compared using matched ScenarioInstances.

ScenarioInstance/seed will therefore act as an experimental block.

Status: Locked

## A-051: Simulation Termination

Normal termination occurs when every occupant is EVACUATED or UNREACHABLE.

Defensive runtime ceilings will produce an explicit TIMEOUT status.

Status: Locked