# Research Model Specification

Version: 0.5
Status: PROVISIONAL
Phase: Research definition

This document will become the authoritative Research Model Specification v1.0 before implementation of the formal research engine.

# 1. Simulation Purpose

The simulator will experimentally compare fixed and adaptive evacuation-routing strategies under controlled dynamic building conditions.

# 2. Modeling Architecture

Simulation type:
Hybrid individual-agent and graph-based evacuation simulator

Tactical layer:
Graph-based route and exit decisions

Operational layer:
Continuous occupant movement with density-dependent walking speed and bottleneck constraints

Visualization:
Independent 3D presentation layer driven by simulation state

# 3. Building

Type:
Fictional first-floor institutional / academic building

Design requirements:

- multiple wings
- multiple exits
- alternative routes
- at least one meaningful bottleneck
- both short/narrow and longer/wider path alternatives
- configurable blocked routes
- configurable hazard regions

# 4. Agent Population

Primary population:
General ambulatory adult benchmark population

Free-flow desired speed:

Mean = 1.34 m/s
SD = 0.26 m/s

Distribution:
Normal distribution with implementation bounds to be finalized.

Nominal body width:
0.456 m

Pre-evacuation delay:
0 s in primary routing experiments

# 5. Congestion Model

Baseline density-speed relationship:
Weidmann fundamental diagram

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

Sensitivity values:
1.6 persons/(m*s)
1.9 persons/(m*s)

Capacity formulation:

Q = q_s * W

where W is usable opening width.

# 7. Local Movement

Primary movement approach:

- route following
- agent footprint
- overlap prevention
- density-dependent speed
- bottleneck service constraints

Full Social Force Model:
Not used in Research Model v1.0.

Exact overlap-resolution logic:
Pending implementation specification.

# 8. Numerical Time

Nominal candidate timestep:
0.05 s

Validation values:
0.025 s
0.10 s

Status:
Not frozen until convergence testing.

# 9. Hazard Model

Hazard representation:
Abstract dynamic spatial risk and route availability.

Physical fire/smoke model:
Not included.

Hazard exposure metric:
Person-time within active hazard regions.

Exact hazard function:
Research Pass 3.

# 10. Routing Strategies

Planned:

1. Nearest Exit
2. Static Shortest Path
3. Congestion-Aware
4. Hazard-Aware
5. Adaptive Hybrid

Exact route-cost and rerouting logic:
Research Pass 2.

# 11. Randomness

All formal stochastic variables will use recorded pseudorandom seeds.

Identical seed sets will be used across competing routing strategies.

# 12. Primary Metrics

Planned metrics include:

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
- strategy computation time

Exact definitions:
To be finalized during Research Pass 4.

# 13. Verification and Validation

Required tests include:

- single-agent travel time
- known shortest-path cases
- blocked-route behavior
- unreachable-region handling
- free-flow walking speed
- density-speed consistency
- bottleneck throughput
- same-seed reproducibility
- timestep convergence
- hazard-free zero-exposure test
- strategy response tests
- visual/headless consistency

# 14. Known Scope Limitations

The simulator will not initially model:

- pre-evacuation behavioral variation
- physical fire spread
- smoke dynamics
- toxicity
- panic psychology
- explicit social groups
- mobility-impaired populations
- stair evacuation
- elevators
- exact real-building geometry

These may become later extensions.

# 15. Remaining Research Before Version 1.0

Research Pass 2:
Navigation, route choice, and adaptive rerouting

Research Pass 3:
Hazard and disruption model

Research Pass 4:
Experimental design, replication, metrics, and statistical analysis

Version 1.0 must not be frozen until these passes are complete.