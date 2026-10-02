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

Nominal candidate timestep:
0.05 s

Validation:
0.025 s
0.10 s

Status:
Not frozen.

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

Candidate development thresholds:

0.00
0.10
0.20
0.30

Final theta:
Not frozen.

Selection procedure:
Tune on development scenarios and freeze before holdout experiments.

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

# 23. Hazard Model

# 23. Hazard and Disruption Model

Hazard states:

CLEAR
RISK
BLOCKED

CLEAR:
Normal traversal.

RISK:
Traversal remains possible and exposure time accumulates.

BLOCKED:
Traversal is prohibited and the affected edge or region is removed from feasible routing.

Hazard evolution:
Deterministic scheduled scenario events.

Supported events:

HAZARD_ACTIVATE
HAZARD_EXPAND
CORRIDOR_BLOCK
EXIT_BLOCK

Individual hazard exposure:

H_i = integral I_risk,i(t) dt

Unit:
seconds

Population hazard exposure:

H_total = sum(H_i)

Unit:
person-seconds

Hazard exposure is a simulation metric and does not represent injury, toxicity, or physiological tenability.

Physical fire and smoke simulation:
Not included.

Future hazard knowledge:
Prohibited.

Exact event timing and location:
Research Pass 4.

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

# 31. Occupancy Calibration

Low, medium, and high occupancy represent distinct congestion regimes.

Exact occupant counts are calibration-gated and will be established using Layout A after implementation of the movement and bottleneck models.

# 32. Adaptive Threshold Calibration

Candidate values:

theta = 0.00
theta = 0.10
theta = 0.20
theta = 0.30

Selection uses Layout A development scenarios only.

Selection priorities:

1. hazard exposure
2. evacuation performance
3. routing stability

The selected value is frozen before holdout evaluation.

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

# 37. Validation-Gated Parameters

Research Model Specification v1.0 freezes the model architecture and calibration procedures.

The following parameters remain validation- or calibration-gated:

- final simulation timestep
- final density-cell length
- final bottleneck-capacity parameter
- exact local overlap-resolution behavior
- exact low/medium/high occupancy counts
- final adaptive rerouting threshold
- exact disruption locations
- exact normalized disruption timings

These values must be resolved according to the procedures defined in this specification before formal experiments are executed.

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