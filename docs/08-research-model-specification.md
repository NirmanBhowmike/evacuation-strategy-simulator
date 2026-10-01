# Research Model Specification

Version: 0.7
Status: PROVISIONAL
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

Primary objective:
Find a feasible route that avoids currently unacceptable hazard conditions.

Exact hazard penalties and route-unavailability rules:
Research Pass 3.

Status:
Partially defined.

# 15. Routing Strategy 5: Adaptive Hybrid

Adaptive routing combines:

- current feasibility
- hazard state
- congestion-adjusted travel time
- bottleneck delay
- current target
- decision history
- route-switching inertia

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

Representation:
Abstract dynamic spatial risk and route availability.

Physical fire/smoke simulation:
Not included.

Exact hazard severity and blocking logic:
Research Pass 3.

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

# 28. Remaining Research Before v1.0

Research Pass 3:
Hazard and disruption model

Research Pass 4:
Experimental design, replication, metrics, and statistical analysis

Still provisional from earlier passes:

- simulation timestep
- exact density-cell length
- exact bottleneck capacity parameter
- local overlap-resolution implementation
- exact adaptive rerouting threshold
- exact hazard-routing rules

Version 1.0 must not be frozen until these items are resolved or explicitly classified as sensitivity parameters.