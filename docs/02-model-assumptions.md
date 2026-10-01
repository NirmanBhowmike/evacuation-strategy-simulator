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

Nominal timestep:

dt = 0.05 s

Status: Provisional

Required validation:
Compare against 0.025 s and 0.10 s before freezing.

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

Voluntary rerouting will require a minimum relative improvement:

I = (C_current - C_alternative) / C_current

A route switch occurs when:

I >= theta

Status: Mechanism locked; theta not frozen

Candidate development values:

0.00
0.10
0.20
0.30

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