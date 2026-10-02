# Research Model Specification

Version: 1.0
Status: IMPLEMENTATION-READY
Phase: Research definition

This document will become the authoritative Research Model Specification v1.0 before implementation of the formal research engine.

# 1. Simulation Purpose

Experimentally compare fixed and adaptive evacuation-guidance strategies under controlled dynamic building conditions.

# 2. Modeling Architecture

Simulation type:
Hybrid individual-agent and graph-based evacuation simulator

Tactical layer:
Graph-based exit selection and route decisions

Operational layer:
Continuous occupant movement with density-dependent walking speed and bottleneck constraints

Visualization:
Independent 3D presentation layer driven by research-engine state

# 3. Building

Type:
Fictional first-floor institutional / academic building

Required characteristics:

- multiple wings
- multiple exits
- alternative paths
- meaningful bottlenecks
- narrow and wide route alternatives
- configurable hazards
- configurable blockages
- multiple tactical decision points

# 4. Agent Population

Primary population:
General ambulatory adult benchmark population

Desired free-flow speed:

Mean = 1.34 m/s
SD = 0.26 m/s

Distribution:
Normal distribution with bounds to be finalized.

Nominal body width:
0.456 m

Primary pre-evacuation delay:
0 s

# 5. Congestion Model

Baseline:
Weidmann density-speed relationship

Jam density:
5.4 persons/m^2

Shape parameter:
1.913

Density measurement:
Spatial network cells

Nominal cell length:
1.0 m

Sensitivity:
0.5 m
2.0 m

# 6. Bottlenecks

Baseline specific flow:
1.3 persons/(m*s)

Sensitivity:
1.6 persons/(m*s)
1.9 persons/(m*s)

Capacity:

Q = q_s * W

# 7. Local Movement

Operational movement uses:

- route following
- occupant footprint
- overlap prevention
- density-dependent speed
- bottleneck service constraints

Full Social Force Model:
Not used in v1.0.

Exact overlap-resolution mechanism:
Pending implementation specification.

# 8. Numerical Time

Baseline timestep:

0.05 s

Numerical validation:

0.025 s
0.05 s
0.10 s

The 0.05 s timestep satisfied the convergence checks relative to the 0.025 s reference while requiring approximately half as many simulation ticks.

Status:
Frozen for Research Model v1.0.

# 9. Navigation Graph

Building navigation is represented as:

G = (V, E)

Nodes may include:

- room/zone portals
- corridor junctions
- doors
- bottlenecks
- exits
- tactical decision points

Edges maintain:

- length
- width
- density
- estimated walking speed
- estimated travel time
- hazard state
- blocked state

# 10. Core Path Solver

Primary pathfinding algorithm:
Dijkstra

Reason:
Transparent deterministic weighted pathfinding suitable for the expected graph size.

# 11. Routing Strategy 1: Nearest Exit

Target exit:

e* = argmin d_euclidean(x_i, e)

Primary information:

- agent position
- exit position

Purpose:
Simple geometric baseline.

# 12. Routing Strategy 2: Static Shortest Path

Route objective:

P* = argmin sum(L_e)

Primary information:

- network topology
- edge lengths

The route is not changed for congestion improvement.

Route recovery is permitted if the existing route becomes physically impossible.

# 13. Routing Strategy 3: Congestion-Aware

Primary objective:
Minimize current estimated evacuation time.

Edge travel time:

T_e = L_e / v(rho_e)

Bottleneck queue delay:

T_queue = N_q / Q

Approximate route cost:

C_route = sum(T_e) + sum(T_queue)

# 14. Routing Strategy 4: Hazard-Aware

# 14. Routing Strategy 4: Hazard-Aware

Hazard states:

CLEAR
RISK
BLOCKED

Hazard-Aware routing uses a safety-first lexicographic objective.

For path P:

H(P) = predicted time through currently known RISK regions

T(P) = estimated travel time

Decision order:

1. remove routes containing BLOCKED segments
2. minimize H(P)
3. among equally safe alternatives, minimize T(P)

Hazard exposure is not converted to travel time using an arbitrary numerical weight.

# 15. Routing Strategy 5: Adaptive Hybrid

Adaptive routing combines:

- current feasibility
- hazard state
- congestion-adjusted travel time
- bottleneck delay
- current target
- decision history
- route-switching inertia

Safety-response priority:

1. check route feasibility
2. reduce predicted hazard exposure when a safer feasible alternative exists
3. if safety is equivalent, compare congestion-adjusted travel time
4. apply normal rerouting inertia to time-only improvements

A safety-improving reroute is not required to satisfy the normal time-improvement threshold.

# 16. Route Reevaluation

Normal reevaluation:
At tactical decision nodes.

Examples:

- corridor junction
- door
- major intersection
- zone transition

Forced reevaluation:

- target exit becomes unavailable
- current route becomes blocked
- current route becomes unacceptable because of hazard

Congestion alone does not automatically force a mid-edge reroute.

# 17. Rerouting Inertia

Relative improvement:

I = (C_current - C_alternative) / C_current

Voluntary switch occurs if:

I >= theta

Development candidates evaluated:

0.00
0.10
0.20
0.30

Selected value:

theta = 0.10

The selected threshold was calibrated on Layout A using controlled congestion-only development scenarios. Theta = 0.10 was the lowest candidate that rejected all demonstrated harmful low-benefit voluntary reroutes.

Safety-improving and forced reroutes remain independent of the normal time-improvement threshold.

Status:
Frozen before holdout evaluation.
# 18. Information Model

All strategies operate on current simulation state.

Future knowledge is prohibited.

Nearest Exit may use:
- position
- exit positions

Static Shortest may use:
- network
- current route feasibility

Congestion-Aware may use:
- network
- density
- queues
- exit availability

Hazard-Aware may use:
- network
- current hazard
- current route availability

Adaptive Hybrid may use:
- network
- density
- queues
- current hazard
- exit availability
- current route
- decision history

# 19. Interpretation of Dynamic Routing

Dynamic routing strategies represent system-level evacuation-guidance policies.

They do not claim that unaided human occupants possess perfect global information.

# 20. Decision Trace

Significant route decisions will produce structured records.

Planned fields:

- decision ID
- agent ID
- simulation time
- decision node
- strategy
- current target exit
- current predicted cost
- best alternative exit
- alternative predicted cost
- relative improvement
- threshold
- trigger
- action
- reason code

# 21. Decision Reason Codes

Initial codes:

INITIAL_ROUTE
NEAREST_EXIT
STATIC_SHORTEST
CONGESTION_IMPROVEMENT
HAZARD_AVOIDANCE
EXIT_UNAVAILABLE
ROUTE_BLOCKED
DECISION_NODE_REVIEW
REROUTE_THRESHOLD_MET
REROUTE_THRESHOLD_NOT_MET
NO_FEASIBLE_ALTERNATIVE

# 22. Route-Stability Metrics

Planned:

- reroutes per occupant
- fraction of occupants rerouted
- exit target changes
- route reversal events



# 23. Hazard and Disruption Model

The simulation represents hazards and disruptions as controlled changes to routing conditions.

The model does not simulate physical fire development, smoke transport, temperature, toxicity, visibility degradation, or physiological tenability. Hazard conditions are experimental routing-state variables used to evaluate how evacuation-guidance strategies respond when environmental conditions change.

## 23.1 Hazard States

Each relevant building zone can occupy one of three states:

CLEAR

RISK

BLOCKED

### CLEAR

Normal traversal is permitted.

No hazard exposure is accumulated while an occupant moves through the zone.

### RISK

Traversal remains physically permitted.

Occupants traveling through the affected region accumulate hazard-exposure time.

Routing strategies that use hazard information may choose a safer alternative route.

### BLOCKED

Traversal is prohibited.

Navigation edges associated with the blocked region are removed from the currently feasible routing network.

A route that becomes blocked triggers forced reevaluation because the existing route is no longer physically feasible.

## 23.2 Hazard Exposure Metric

Individual hazard exposure is defined as accumulated time spent traversing regions currently classified as RISK.

For occupant i:

H_i = integral I_risk,i(t) dt

where:

- H_i = individual hazard-exposure duration
- I_risk,i(t) = 1 while occupant i is within a RISK region and 0 otherwise

Unit:

seconds

Population hazard exposure is:

H_total = sum(H_i)

Unit:

person-seconds

Hazard exposure is a simulation metric only.

It must not be interpreted as:

- injury probability
- toxic dose
- fractional effective dose
- smoke exposure
- heat exposure
- physiological tenability
- mortality risk

## 23.3 Dynamic Disruption Events

Environmental changes are represented through deterministic scheduled events.

Supported event types are:

HAZARD_ACTIVATE

HAZARD_EXPAND

CORRIDOR_BLOCK

EXIT_BLOCK

### HAZARD_ACTIVATE

Changes the target zone from CLEAR to RISK.

Traversal remains possible.

Hazard exposure begins accumulating for occupants who traverse the affected zone.

### HAZARD_EXPAND

Changes an additional target zone from CLEAR to RISK.

This supports later scenarios in which an existing hazard expands to another region.

### CORRIDOR_BLOCK

Changes the target corridor zone to BLOCKED.

Edges associated with the blocked corridor become non-traversable.

Occupants whose remaining routes depend on the blocked segment must recover through another feasible route when one exists.

### EXIT_BLOCK

Makes the target exit unavailable.

Occupants currently targeting that exit must select another reachable exit.

## 23.4 Event Information

All routing strategies operate using only the current simulation state.

Future disruption information is prohibited.

A strategy may respond to an event only after that event has been applied to the simulation.

This prevents the routing policies from receiving advance knowledge of future hazards, corridor closures, or exit failures.

## 23.5 Route Reevaluation Under Disruptions

Dynamic events may trigger route reevaluation.

Forced reevaluation occurs when:

- the current target exit becomes unavailable
- the remaining route contains a blocked segment
- the current route is otherwise physically infeasible

Hazard activation may also trigger reevaluation when the currently planned route becomes exposed to a newly identified RISK region.

A safety-improving reroute is not required to satisfy the normal time-improvement threshold used for congestion-only rerouting.

Congestion alone does not force a mid-edge route change.

## 23.6 Formal Experimental Disruption Conditions

The primary experiment uses five disruption conditions.

These conditions form the disruption factor in the formal:

5 routing strategies × 3 occupancy levels × 5 disruption conditions

experimental design.

### D0 - Baseline

No disruption events are applied.

Purpose:

Provide the reference condition for evaluating changes in evacuation performance, congestion, route stability, and hazard exposure.

Schedule:

No events.

### D1 - Hazard

Event:

HAZARD_ACTIVATE

Target:

corridor-main-spine

Activation time:

6.65 s

Purpose:

Introduce an early RISK condition on a highly relevant circulation region while retaining physical traversability.

This condition allows comparison between strategies that explicitly account for hazard exposure and strategies that continue to prioritize geometric or travel-time objectives.

Calibration showed that early activation produced meaningful hazard-exposure differentiation while retaining complete evacuation.

### D2 - Exit Block

Event:

EXIT_BLOCK

Target:

exit-south-central

Activation time:

13.25 s

Purpose:

Create a dynamic route-recovery problem after occupants have already begun evacuation and some have committed to routes.

The selected mid-run timing produced a measurable evacuation-time effect and route reversals while maintaining complete evacuation with no unreachable or timeout occupants.

### D3 - Corridor Block

Event:

CORRIDOR_BLOCK

Target:

corridor-main-east-blockable

Associated navigation edge:

edge-main-east-end

Activation time:

6.65 s

Purpose:

Remove a calibrated corridor segment while preserving alternative paths through the building.

The selected segment and timing create a measurable detour without structurally disconnecting occupied portions of the layout from all exits.

### D4 - Combined

The combined condition contains two sequential events.

First event:

HAZARD_ACTIVATE

Target:

corridor-main-spine

Activation time:

6.65 s

Second event:

EXIT_BLOCK

Target:

exit-south-central

Activation time:

13.25 s

Purpose:

Create a multi-stage dynamic condition in which occupants first encounter a safety-related routing challenge and later lose an available exit.

This condition allows evaluation of both hazard-sensitive response and later route recovery within the same scenario.

The selected combined schedule retained complete evacuation while producing meaningful differences in evacuation time, hazard exposure, rerouting behavior, and route stability across strategies.

## 23.7 Timing Basis

The primary timing anchors established during Layout A development calibration are:

EARLY = 6.65 s

MID = 13.25 s

LATE = 19.90 s

These values were derived relative to the observed medium-occupancy baseline evacuation behavior.

They are experimental timing parameters.

They are not intended to represent validated physical fire-development times.

Different disruption types are not required to use the same timing anchor because their operational effects depend on where occupants are located when the event occurs.

## 23.8 Calibration Results Supporting the Selected Conditions

The medium-occupancy baseline total evacuation time was:

26.50 s

The selected D1 hazard condition produced a measurable difference in hazard exposure between the safety-aware and non-safety-aware routing strategies.

The selected D2 exit-block condition increased evacuation time while preserving:

- completion rate = 1.00
- unreachable occupants = 0
- timeout occupants = 0

The selected D3 corridor-block condition increased total evacuation time from:

26.50 s

to:

33.45 s

while preserving:

- completion rate = 1.00
- unreachable occupants = 0
- timeout occupants = 0
- route reversals = 0

The selected D4 combined condition also retained complete evacuation with no unreachable or timeout occupants while producing both evacuation-performance and hazard-exposure effects.

A more severe three-event combined development candidate was evaluated but was not selected for the primary factorial experiment because it created substantially greater route instability and severity than required for the formal comparison.

## 23.9 Experimental Interpretation

The disruption conditions are designed as controlled experimental challenges.

They are intended to test:

- route recovery
- congestion response
- hazard-aware routing
- safety-performance tradeoffs
- rerouting stability
- exit reassignment
- response to changing environmental information

They are not intended to reproduce a specific real emergency event.

The fictional Layout A environment and its disruption schedules exist to support repeatable comparison of routing strategies under identical controlled conditions.

## 23.10 Frozen Research Model v1.0 Disruption Set

The formal Research Model v1.0 disruption factor is frozen as:

- D0 = no disruption
- D1 = main-spine hazard at 6.65 s
- D2 = south-central exit block at 13.25 s
- D3 = main-east corridor block at 6.65 s
- D4 = main-spine hazard at 6.65 s followed by south-central exit block at 13.25 s

The corresponding parameter definitions are centralized in:

`src/scenario/researchParameterSet.ts`

These conditions must remain unchanged during the formal primary experiment unless a methodological revision is explicitly documented and versioned.

Status:

Frozen for Research Model v1.0.
# 24. Randomness

All formal stochastic variables use recorded pseudorandom seeds.

Identical seed sets are used when strategies are compared.

# 25. Primary Metrics

Planned:

- total evacuation time
- mean occupant evacuation time
- 95th-percentile evacuation time
- evacuation completion rate
- maximum local density
- congestion / queue exposure
- hazard exposure
- travel distance
- reroute count
- exit utilization
- route reversals
- strategy computation time

Exact definitions:
Research Pass 4.

# 26. Validation Requirements

Required tests include:

- single-agent travel time
- known shortest paths
- nearest-exit versus network-shortest disagreement
- congestion-induced route change
- blocked-route recovery
- unavailable-exit recovery
- rerouting-threshold behavior
- no-feasible-route handling
- density-speed consistency
- bottleneck throughput
- same-seed reproducibility
- timestep convergence
- hazard-free zero-exposure test
- strategy decision-log correctness
- visual/headless consistency
- zero-hazard exposure test
- known-duration hazard exposure test
- activation-while-occupied test
- blocked-corridor exclusion test
- blocked-exit forced-reroute test
- safety-first route-choice test
- all-routes-blocked UNREACHABLE test
- disruption-sequence reproducibility test
# 27. Known Scope Limitations

The initial model does not attempt to reproduce:

- pre-evacuation behavioral variation
- physical fire spread
- smoke dynamics
- toxicity
- panic psychology
- complete social-group behavior
- mobility-impaired populations
- stair evacuation
- elevators
- exact real-building geometry
- complete unaided human exit-choice psychology

# 28. Formal Experimental Design

Primary factors:

Routing Strategy:
5 levels

Occupancy:
3 calibrated congestion regimes

Disruption:
5 conditions

Total experimental cells:

5 x 3 x 5 = 75

Minimum ScenarioInstances per cell:

40

Minimum initial formal runs:

75 x 40 = 3000

Additional replications are added in batches of 10 when convergence criteria are not satisfied.

# 29. Scenario Pairing

A random seed generates an immutable ScenarioInstance before routing strategy execution.

The same ScenarioInstance is supplied to every competing routing strategy.

ScenarioInstances include:

- occupant positions
- desired walking speeds
- stochastic occupant attributes
- hazard schedule
- disruption schedule
- layout configuration

# 30. Development and Holdout Design

Layout A:
Development, calibration, threshold tuning, and sensitivity analysis.

Layout B:
Holdout evaluation.

Adaptive parameters must be frozen before Layout B is evaluated.

## 31. Occupancy Calibration

Primary Layout A occupancy regimes:

LOW = 12 occupants
MEDIUM = 36 occupants
HIGH = 48 occupants

The selected conditions retain complete evacuation in the baseline calibration while producing progressively stronger congestion.

Occupancy of 60 or greater is treated as overload/stress behavior rather than a primary experimental factor level.

Status:
Frozen for the primary experiment.
# # 32. Adaptive Threshold Calibration

Candidate values evaluated:

theta = 0.00
theta = 0.10
theta = 0.20
theta = 0.30

Selected value:

theta = 0.10

Selection used Layout A development scenarios only.

The selected value is the lowest candidate that suppressed all demonstrated harmful low-benefit voluntary reroutes while avoiding unnecessary additional routing inertia.

Status:
Frozen before Layout B holdout evaluation.
# 33. Replication and Convergence

Minimum initial replications:

40 ScenarioInstances per cell

Additional batch:

10

Convergence assessment considers:

- total evacuation time
- P95 evacuation time
- maximum density
- exit utilization
- queue exposure
- hazard exposure when applicable

Primary continuous outcomes will initially target a 95% confidence-interval half-width approximately no greater than 5% of the estimated mean.

Near-zero outcomes may require absolute or batch-stability criteria.

# 34. Outcome Hierarchy

Co-primary:

- total evacuation time
- population hazard exposure in hazard scenarios

Key secondary:

- P95 occupant evacuation time
- maximum local density
- queue exposure
- evacuation completion rate
- unreachable count

Diagnostic:

- mean travel distance
- exit utilization
- reroutes
- percentage rerouted
- exit target changes
- route reversals
- strategy computation time

# 35. Statistical Framework

Strategies are compared using matched ScenarioInstances.

Primary factorial structure:

Strategy x Occupancy x Disruption

Important interactions:

Strategy x Occupancy

Strategy x Disruption

Analysis should emphasize:

- paired differences
- confidence intervals
- effect sizes
- interaction effects

ScenarioInstance/seed should be treated as a matched block.

The exact statistical model may vary by outcome distribution.

# 36. Simulation Termination

Normal completion:

All occupants are EVACUATED or UNREACHABLE.

Defensive runtime ceiling:

Produces explicit TIMEOUT status.

Timeout occupants are not counted as evacuated.

# # 37. Validation-Gated Parameters

The principal Research Model v1.0 calibration parameters required before the formal experiment have now been resolved.

Frozen primary values:

- simulation timestep = 0.05 s
- density-cell length = 1.0 m
- bottleneck specific flow = 1.3 persons/(m*s)
- LOW occupancy = 12
- MEDIUM occupancy = 36
- HIGH occupancy = 48
- Adaptive Hybrid rerouting threshold = 0.10
- D1 hazard activation = corridor-main-spine at 6.65 s
- D2 exit block = exit-south-central at 13.25 s
- D3 corridor block = corridor-main-east-blockable at 6.65 s
- D4 combined = hazard at 6.65 s followed by exit block at 13.25 s

Sensitivity values remain available for later robustness analysis.

The major validation item still dependent on future implementation is visual-versus-headless state consistency after the 3D presentation layer is built.

# 38. Version 1.0 Freeze Meaning

Version 1.0 is implementation-ready.

It freezes:

- research scope
- model architecture
- routing strategy definitions
- hazard representation
- experimental structure
- calibration procedures
- validation requirements
- reproducibility rules
- outcome hierarchy

It does not claim that implementation-dependent calibration values have already been validated.

Any later methodological change must be recorded in the decision log and produce a new model-specification version.