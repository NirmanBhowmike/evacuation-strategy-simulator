> **Development research record**
>
> This file preserves the literature review and parameter-development passes used while the model was being built. Some sections intentionally retain future tense, provisional values, and superseded Layout A assumptions.
>
> For the current Architecture V2 v1.2 configuration, use `README.md`, `docs/05-validation-log.md`, `docs/09-master-task-checklist.md`, and `results/formal-v1.2/README.md`.

# Research Basis

## Purpose

This document records the published evidence used to define the quantitative evacuation model. Numerical values should not be treated as literature-supported unless their basis is recorded here or in the parameter-evidence directory.

## Research Pass 1: Pedestrian Movement and Flow

### 1. Modeling Approach

The simulator will use a hybrid agent-based and graph-based architecture.

Each occupant will remain an individual simulated agent. Tactical decisions such as route and exit selection will occur on a navigation graph. Operational movement will use continuous agent positions with walking speed affected by local pedestrian density and bottleneck conditions.

A full Social Force Model will not be used as the primary movement model. The main research question concerns routing and adaptive rerouting. Introducing a highly parameterized force model would add additional calibration requirements and could make routing effects harder to isolate.

### 2. Free-Flow Walking Speed

A widely used benchmark for unrestricted pedestrian walking is a normally distributed desired speed with:

Mean = 1.34 m/s
Standard deviation = 0.26 m/s

The baseline model will therefore begin with:

v0 ~ N(1.34, 0.26^2) m/s

The distribution should be bounded to prevent unrealistic simulated values. The exact implementation bounds will be confirmed before Research Model Specification v1.0 is frozen.

This distribution represents a benchmark general pedestrian population. It is not assumed to represent every age group, culture, mobility condition, or emergency behavior.

### 3. Density-Speed Relationship

The baseline congestion model will use the Weidmann pedestrian fundamental diagram:

v(rho) = 1.34 * [1 - exp(-1.913 * (1/rho - 1/5.4))]

for pedestrian density between zero and the model jam density.

The model uses approximately:

Free-flow speed = 1.34 m/s
Jam density = 5.4 persons/m^2
Shape parameter = 1.913

For heterogeneous agents, the density reduction term will be applied relative to each agent's assigned free-flow walking speed rather than forcing every occupant to use the same unrestricted speed.

The Weidmann relationship will be treated as the baseline rather than as a universal law. Sensitivity testing will be used where model conclusions may depend on the selected fundamental diagram.

### 4. Local Density

Local corridor density will initially be calculated using spatial cells along the movement network:

rho_c(t) = N_c(t) / A_c

where:

rho_c = pedestrian density in cell c
N_c = number of occupants in the cell
A_c = usable area of the cell

A nominal longitudinal cell length of 1.0 m is proposed for the first implementation.

Cell lengths of 0.5 m and 2.0 m will be examined during numerical sensitivity testing before this parameter is frozen.

The cell length is a numerical modeling choice rather than a human-behavior constant.

### 5. Bottlenecks and Doorways

Doorways and narrow connectors will be treated as explicit flow constraints.

Published pedestrian-flow studies report variation in specific bottleneck capacity. Therefore, the simulator should not assume that one specific-flow value is universally correct.

The provisional design is:

Baseline specific flow = 1.3 persons/(m*s)

Sensitivity cases:
1.6 persons/(m*s)
1.9 persons/(m*s)

For an opening with usable width W:

Q = q_s * W

where:

Q = estimated service capacity in persons/s
q_s = selected specific-flow parameter
W = usable opening width

The baseline and sensitivity values must be revisited during model validation.

### 6. Occupant Physical Footprint

A nominal occupant shoulder width of approximately 0.456 m will be used as an initial body-footprint parameter for spacing, doorway admission, collision prevention, and visualization.

This value is consistent with the default cylindrical occupant diameter documented by Pathfinder.

The footprint will not be used to create a separate force-based behavioral model.

### 7. Pre-Evacuation Time

The primary routing experiments will use:

Pre-evacuation delay = 0 s

This is a deliberate experimental control.

Pre-evacuation behavior is an important component of real evacuation modeling, but including heterogeneous response delays in the primary experiment would make it harder to isolate the effect of routing strategy.

Distributed pre-evacuation time may be studied later as a secondary experiment.

### 8. Simulation Timestep

A fixed simulation timestep is required.

Provisional value:

dt = 0.05 s

Numerical comparison values:

dt = 0.025 s
dt = 0.10 s

The 0.05 s value is not yet frozen.

The timestep will be accepted only if convergence testing shows that reducing the step to 0.025 s does not materially alter the primary experimental outputs.

### 9. Collision and Local Movement

The primary model will not use a full Social Force Model.

Local movement will instead combine:

- route following
- occupant physical footprint
- minimum-spacing / overlap prevention
- density-dependent walking speed
- bottleneck admission limits

The exact local overlap-resolution algorithm remains an implementation item and must be verified independently.

### 10. Verification and Validation

Movement-model validation should include at minimum:

- single-agent travel-time tests
- free-flow speed tests
- density-speed consistency tests
- doorway and bottleneck throughput tests
- blocked-route tests
- same-seed reproducibility tests
- timestep convergence tests
- high-density boundary-condition tests

The model should be evaluated component by component rather than accepted because the animation appears realistic.

## Key Sources

1. Ulrich Weidmann. Transporttechnik der Fussgänger. ETH Zürich. DOI: 10.3929/ethz-a-000687810.

2. Ronchi, E., Kuligowski, E., Reneke, P., Peacock, R., and Nilsson, D. The Process of Verification and Validation of Building Fire Evacuation Models. NIST Technical Note 1822. DOI: 10.6028/NIST.TN.1822.

3. JuPedSim documentation. Simulation API and pedestrian-model documentation. Used as a contemporary reference for pedestrian-simulation architecture and numerical timestep practice.

4. Pathfinder documentation. Occupant characteristics. Used as a reference for the nominal 45.58 cm occupant shoulder-width parameter.

## Status

Research Pass 1 completed.

Some parameters remain provisional until numerical and sensitivity testing:

- simulation timestep
- density-cell length
- bottleneck specific flow
- exact local overlap-resolution implementation
# Research Pass 2: Navigation, Route Choice, and Adaptive Rerouting

## 1. Research Focus

Research Pass 2 defines how evacuation guidance strategies select exits, calculate routes, respond to congestion, and reconsider decisions when building conditions change.

The routing policies are treated primarily as evacuation-guidance strategies rather than complete models of unaided human behavior. Actual human exit choice can depend on familiarity, visibility, social influence, and other behavioral factors that are outside the primary scope of this experiment.

## 2. Navigation Graph

The building will be represented as a weighted graph:

G = (V, E)

Nodes may represent:

- room or zone portals
- corridor junctions
- doors
- bottlenecks
- exits
- major decision points

Edges represent traversable corridor or connector segments.

Each edge will maintain at least:

- length
- usable width
- current density
- estimated walking speed
- estimated travel time
- hazard state
- blocked/unblocked state

The graph will represent routing logic independently from the 3D rendering geometry.

## 3. Core Pathfinding Algorithm

Dijkstra's algorithm will be used as the primary path solver.

Reasons:

- deterministic behavior
- transparent implementation
- supports positive weighted edges
- straightforward independent validation
- the same solver can support multiple strategies by changing edge costs

A more complicated search algorithm is not required for the expected graph size.

## 4. Nearest-Exit Baseline

The Nearest-Exit strategy selects the exit with minimum Euclidean distance from the occupant's current position:

e* = argmin d_euclidean(x_i, e)

After the target exit is selected, the occupant follows a network path to that exit.

This strategy does not consider:

- congestion
- queue delay
- hazard
- exit capacity

Purpose:
Provide a deliberately simple geometric baseline.

## 5. Static Shortest-Path Baseline

The Static Shortest-Path strategy selects the route with minimum network distance:

P* = argmin sum(L_e)

where L_e is the length of edge e.

This strategy considers building topology but ignores:

- congestion
- queue delay
- hazard cost
- production of alternative routes based on changing conditions

If the existing route becomes physically impossible because an exit or edge becomes unavailable, route recovery is permitted. This prevents the baseline from remaining on an impossible path.

## 6. Congestion-Aware Routing

Congestion-aware routing will minimize estimated remaining travel time rather than geometric distance.

For an edge:

T_e(t) = L_e / v(rho_e(t))

where:

L_e = edge length
rho_e = current edge density
v(rho_e) = density-adjusted walking speed

For a bottleneck:

T_queue = N_q / Q

where:

N_q = estimated queue size
Q = bottleneck service capacity

The approximate route cost becomes:

C_route = sum(T_e) + sum(T_queue)

This produces an interpretable quantity:

Estimated remaining evacuation time.

Arbitrary congestion weights should be avoided when a physically interpretable travel-time estimate can be used.

## 7. Hazard-Aware Routing

Hazard-aware routing will treat currently unsafe or unavailable route segments as restricted according to the hazard rules defined in Research Pass 3.

The initial concept is:

E_safe(t) = E - E_unavailable(t)

Then the strategy selects the shortest feasible route through the currently safe graph.

Exact hazard severity thresholds and route-availability rules are not yet frozen.

## 8. Adaptive Hybrid Routing

The Adaptive Hybrid strategy will combine:

- current route feasibility
- hazard information
- congestion-adjusted travel time
- bottleneck queue delay
- route-switching inertia

The strategy will not automatically switch whenever another route is slightly better.

Instead, it will compare the estimated remaining cost of the current route against alternatives and change routes only when the improvement is sufficiently meaningful or the current route becomes invalid.

## 9. Route Reevaluation

Normal route reevaluation will occur primarily at decision points such as:

- corridor junctions
- doors
- major route intersections
- transitions between building zones

This reduces unnecessary repeated calculations and makes route decisions easier to interpret.

Immediate reevaluation will occur when:

- the current exit becomes unavailable
- the current route becomes blocked
- a newly active hazard makes the current route unacceptable

Congestion alone will normally trigger evaluation at a decision opportunity rather than force an immediate route change.

## 10. Rerouting Inertia

Let:

C_current = estimated remaining cost of the current route

C_alt = estimated remaining cost of the best alternative route

Relative improvement is:

I = (C_current - C_alt) / C_current

A voluntary reroute occurs only when:

I >= theta

where theta is the rerouting-improvement threshold.

The purpose of theta is to prevent unstable route switching when alternatives differ only slightly.

## 11. Threshold Development

The rerouting threshold will not be selected arbitrarily.

Candidate development values:

theta = 0.00
theta = 0.10
theta = 0.20
theta = 0.30

These candidate values will be evaluated using development scenarios only.

The selected threshold will be frozen before holdout evaluation.

Selection should consider:

- evacuation performance
- hazard exposure
- number of reroutes
- exit target changes
- route reversals
- stability

## 12. Information Available to Strategies

All strategies will operate from the same current WorldState, but each strategy may use only the information defined for that policy.

Nearest Exit:
- current position
- exit positions

Static Shortest Path:
- network geometry
- route feasibility

Congestion-Aware:
- network geometry
- current density
- queue conditions
- current exit availability

Hazard-Aware:
- network geometry
- current hazard state
- current route availability

Adaptive Hybrid:
- network geometry
- density
- queue conditions
- hazard state
- exit availability
- current route
- decision history

## 13. No Future Knowledge

Routing policies may use only information available at the current simulation time.

Example:

If an exit will become blocked at t = 40 s, a strategy operating at t = 20 s cannot use that future information.

This prevents the routing engine from behaving as an oracle.

## 14. Guidance-System Interpretation

Dynamic routing strategies are interpreted as system-level evacuation-guidance policies with access to simulated situational information.

The model does not claim that unaided occupants possess perfect knowledge of:

- hidden congestion
- remote exit queues
- hazards outside their observable environment
- future disruptions

This distinction will remain explicit in the final report.

## 15. Decision Trace

Every significant route decision should produce a structured record containing fields such as:

- decision ID
- agent ID
- simulation time
- decision node
- strategy
- current target exit
- current estimated cost
- best alternative exit
- alternative estimated cost
- relative improvement
- rerouting threshold
- trigger
- action
- reason code

This information supports:

- debugging
- reproducibility
- research analysis
- live explanation during the 3D demonstration

## 16. Decision Reason Codes

Initial reason codes:

- INITIAL_ROUTE
- NEAREST_EXIT
- STATIC_SHORTEST
- CONGESTION_IMPROVEMENT
- HAZARD_AVOIDANCE
- EXIT_UNAVAILABLE
- ROUTE_BLOCKED
- DECISION_NODE_REVIEW
- REROUTE_THRESHOLD_MET
- REROUTE_THRESHOLD_NOT_MET
- NO_FEASIBLE_ALTERNATIVE

## 17. Route-Stability Metrics

In addition to evacuation outcomes, the adaptive strategy should record:

- reroutes per occupant
- percentage of occupants rerouted
- exit target changes
- route reversal events

A route reversal is a pattern such as:

Exit A -> Exit B -> Exit A

These metrics will help distinguish useful adaptation from unstable decision changing.

## 18. Validation Requirements

Routing validation should include:

- known shortest-path graphs
- nearest-exit versus shortest-path disagreement cases
- congestion-induced route changes
- rerouting-threshold tests
- forced blockage rerouting
- unavailable-exit tests
- unreachable-state tests
- deterministic repeated calculations
- decision-log verification

## Status

Research Pass 2 is substantively complete.

Items intentionally remaining provisional:

- exact hazard-aware routing rules, pending Research Pass 3
- final rerouting threshold, pending development-scenario tuning

# Research Pass 3: Hazard and Disruption Model

## 1. Research Focus

Research Pass 3 defines how changing hazardous conditions and route disruptions will be represented in the evacuation simulator.

The simulator will model changes in route risk and route availability. It will not attempt to reproduce physical fire growth, smoke transport, heat, toxicity, visibility loss, or injury probability.

The purpose is to create controlled dynamic conditions for evaluating evacuation-routing strategies.

## 2. Hazard State Representation

Each affected region or route segment may occupy one of three states:

CLEAR
RISK
BLOCKED

CLEAR:
Normal traversal is permitted.

RISK:
Traversal remains possible, but time spent in the region contributes to simulated hazard exposure. Hazard-aware strategies attempt to avoid these regions when safer alternatives exist.

BLOCKED:
Traversal is no longer permitted. The affected route segment is removed from feasible route calculations.

This discrete representation avoids creating unsupported physical hazard-severity values.

## 3. Hazard Geometry

Hazards will be represented spatially using defined regions associated with the building geometry and navigation graph.

A hazard may affect:

- a room
- corridor segment
- junction
- doorway
- multiple connected regions

The graphical hazard representation and navigation-state changes must be driven by the same underlying simulation state.

## 4. Hazard Activation and Expansion

Hazard evolution will occur through deterministic scheduled events.

Example:

t = 0 s
Hazard inactive

t = 20 s
Initial region becomes RISK

t = 35 s
Additional region becomes RISK

t = 50 s
Core route segment becomes BLOCKED

These times represent controlled experimental scenario settings. They are not claims about real fire-development rates.

## 5. Hazard Exposure

For occupant i:

H_i = integral I_risk,i(t) dt

where I_risk,i(t) equals 1 while the occupant is inside a RISK region and 0 otherwise.

Individual hazard exposure is therefore measured in:

seconds

Population hazard exposure is:

H_total = sum(H_i)

with units:

person-seconds

This is a simulation exposure measure only. It does not represent injury probability, toxicity, Fractional Effective Dose, or physiological harm.

## 6. Hazard-Aware Route Selection

Hazard-aware routing will use a safety-first decision rule.

For each feasible path:

H(P) = predicted exposure to currently known RISK regions

T(P) = estimated travel time

The routing decision will:

1. remove BLOCKED paths
2. minimize predicted hazard exposure
3. among alternatives with equivalent exposure, minimize estimated travel time

This avoids introducing an arbitrary numerical conversion between hazard exposure and travel time.

## 7. Adaptive Hybrid Hazard Response

The Adaptive Hybrid strategy will use the following decision priority:

1. Determine whether the current route remains feasible.
2. Determine whether an alternative reduces current predicted hazard exposure.
3. If safety is equivalent, compare congestion-adjusted evacuation time.
4. Apply normal rerouting inertia to time-only improvements.

A meaningful safety improvement does not need to satisfy the normal time-improvement threshold.

## 8. Disruption Event Types

Research Model v1.0 will support four primary disruption events:

HAZARD_ACTIVATE
HAZARD_EXPAND
CORRIDOR_BLOCK
EXIT_BLOCK

Each event will contain information such as:

- event ID
- event type
- activation time
- target region, edge, or exit
- scenario ID

## 9. Exit Blocking

When an EXIT_BLOCK event occurs:

- the exit becomes unavailable
- it is removed from feasible routing
- occupants currently targeting the exit receive an immediate forced route reevaluation

## 10. Corridor Blocking

When a CORRIDOR_BLOCK event occurs:

- the associated graph edge becomes non-traversable
- newly calculated routes cannot use the edge
- occupants whose current routes contain the blocked edge receive immediate reevaluation

## 11. Hazard Activation

When a hazard changes a region from CLEAR to RISK:

- the region remains traversable
- hazard exposure begins accumulating
- occupants whose current routes pass through the region reevaluate their routes

This permits direct comparison between shorter risky routes and longer clear alternatives.

## 12. Hazard Expansion

Hazard expansion will occur through scheduled transitions such as:

CLEAR -> RISK

or:

RISK -> BLOCKED

Expansion will be deterministic within a scenario so that competing routing strategies face identical environmental conditions.

## 13. No Predictive Hazard Knowledge

Routing strategies may use only the currently active hazard state.

If a corridor is scheduled to become BLOCKED at t = 40 s, a strategy operating at t = 30 s cannot use that future event unless the experimental design explicitly introduces predictive information in a later study.

Research Model v1.0 will therefore evaluate reactive guidance rather than perfect-forecast routing.

## 14. Initial Scenario Families

The formal experiment is expected to include scenario families such as:

H0: no hazard or disruption

H1: dynamic hazard only

H2: exit or corridor blockage

H3: combined hazard and blockage

Exact hazard locations, activation times, occupancy levels, and scenario combinations will be finalized during Research Pass 4.

## 15. Validation Requirements

Hazard and disruption validation should include:

- zero hazard produces zero exposure
- known five-second RISK exposure produces approximately five seconds of individual exposure
- exposure begins at hazard activation time
- BLOCKED edges cannot appear in newly calculated routes
- blocked exits cause immediate target reevaluation
- Hazard-Aware prefers a zero-exposure route over a risky alternative when available
- if all routes contain risk, Hazard-Aware minimizes predicted exposure
- if all routes become impossible, the occupant receives an UNREACHABLE state
- same scenario and seed reproduce the same disruption sequence

## Status

Research Pass 3 is substantively complete.

Remaining experimental decisions:

- exact hazard locations
- exact activation times
- exact expansion timing
- disruption combinations
- scenario factor levels

These will be established in Research Pass 4.

# Research Pass 4: Experimental Methodology

## 1. Purpose

Research Pass 4 defines the formal experimental design used to compare evacuation-routing strategies.

The experiment is designed around controlled simulation, reproducible scenario instances, paired strategy comparisons, convergence-based replication, development/holdout separation, and explicit statistical analysis.

## 2. Primary Experimental Factors

Three primary factors will be investigated:

Routing Strategy:
1. Nearest Exit
2. Static Shortest Path
3. Congestion-Aware
4. Hazard-Aware
5. Adaptive Hybrid

Occupancy Condition:
1. Low
2. Medium
3. High

Disruption Condition:
1. D0 - No disruption
2. D1 - Dynamic hazard
3. D2 - Exit blockage
4. D3 - Corridor blockage
5. D4 - Combined hazard and blockage

This produces:

5 x 3 x 5 = 75 experimental cells

before replication.

## 3. Occupancy Conditions

Low, medium, and high occupancy will represent different congestion regimes rather than arbitrary round population counts.

The exact occupant counts will be calibrated after Layout A and the core simulation engine exist.

Target interpretation:

Low:
Mostly free movement with little sustained queuing.

Medium:
Observable local congestion and intermittent bottleneck queues.

High:
Sustained bottleneck congestion without placing most of the facility near jam density.

Exact counts will be frozen before formal strategy comparison.

## 4. Development and Holdout Layouts

Layout A will be used for:

- development
- debugging
- occupancy calibration
- adaptive-threshold tuning
- visualization development
- sensitivity testing

Layout B will be reserved as a holdout simulation layout.

Layout B will differ meaningfully in:

- corridor topology
- exit relationships
- bottleneck locations
- alternative routes
- disruption locations

The adaptive algorithm will be frozen before holdout evaluation.

## 5. Scenario Instances and Randomness

A seed will generate an immutable ScenarioInstance before a routing strategy is applied.

A ScenarioInstance will contain items such as:

- occupant starting positions
- occupant desired walking speeds
- relevant stochastic occupant attributes
- disruption schedule
- hazard schedule
- layout configuration

The same ScenarioInstance will then be supplied to every competing routing strategy.

This produces paired comparisons and avoids divergence caused by different strategies consuming random-number streams differently.

## 6. Replication Strategy

Formal stochastic scenarios will begin with a minimum of:

n_min = 40

ScenarioInstances per experimental cell.

After the initial 40 runs, convergence will be evaluated.

If convergence criteria are not met, additional runs will be added in batches of:

10

until the required stability is reached or an explicit computational stopping rule is invoked.

The project will therefore use convergence-based replication rather than assuming that one fixed replication count is universally sufficient.

## 7. Convergence Assessment

Convergence should not be judged from total evacuation time alone.

The assessment will consider at least:

- total evacuation time
- 95th-percentile evacuation time
- maximum local density
- exit utilization
- queue exposure
- hazard exposure when applicable

For primary continuous time outcomes, the initial project criterion will target a 95% confidence-interval half-width no greater than approximately 5% of the estimated mean.

Near-zero outcomes such as hazard exposure may require an absolute or batch-stability criterion rather than a relative percentage criterion.

These thresholds are project acceptance criteria rather than universal evacuation-model standards.

## 8. Primary Outcomes

Co-primary outcomes:

Total Evacuation Time

TET = max(T_i)

Population Hazard Exposure

H_total = sum(H_i)

Hazard exposure is only a co-primary outcome for scenarios containing active hazard conditions.

## 9. Key Secondary Outcomes

- 95th-percentile occupant evacuation time
- maximum local pedestrian density
- queue exposure
- evacuation completion rate
- number of unreachable occupants

## 10. Diagnostic Outcomes

- mean travel distance
- exit utilization
- reroutes per occupant
- percentage of occupants rerouted
- exit target changes
- route reversal events
- strategy computation time

Diagnostic outcomes will be used to explain why strategies behave differently rather than being treated as equally important primary endpoints.

## 11. Normalized Disruption Timing

Exact disruption timing will be established relative to baseline evacuation dynamics rather than treated as a physical fire-development prediction.

Example scenario design may use normalized times such as:

25% of baseline evacuation timescale:
hazard activation

40%:
hazard expansion

55%:
selected route or exit disruption

Exact values will be frozen before formal experiments.

These percentages are experimental design parameters and do not represent real fire-growth constants.

## 12. Adaptive Threshold Tuning

Candidate rerouting thresholds:

theta = 0.00
theta = 0.10
theta = 0.20
theta = 0.30

Threshold tuning will use Layout A development scenarios only.

Selection will consider:

1. hazard exposure
2. evacuation performance
3. routing stability

The threshold will be frozen before Layout B holdout evaluation.

Holdout results will not be used to retune the algorithm.

## 13. Model Freeze

Before holdout evaluation, the project will record:

- adaptive threshold
- parameter-set version
- Git commit
- routing algorithm version
- experiment configuration

After the freeze, algorithm changes motivated by holdout performance will require a new version and separate experiment rather than retroactive tuning.

## 14. Statistical Comparison

Because strategies receive the same ScenarioInstances, strategy outcomes are paired by scenario.

Analysis will emphasize:

- paired differences
- percentage differences
- confidence intervals
- effect sizes

The main factorial structure is:

Strategy x Occupancy x Disruption

Important interactions include:

Strategy x Occupancy

and:

Strategy x Disruption

A mixed-effects or related blocked-analysis framework may be used so that ScenarioInstance/seed is treated as a matched block rather than as unrelated independent data.

Skewed or count outcomes may use bootstrap confidence intervals or suitable generalized statistical models.

## 15. Termination Conditions

A simulation normally terminates when every occupant is either:

EVACUATED

or:

UNREACHABLE

A large defensive runtime ceiling will also be implemented to identify simulation failures or pathological states.

A timeout will be recorded explicitly as:

TIMEOUT

Remaining occupants will not be silently counted as evacuated.

## 16. Formal Run Record

Each formal simulation run should record at least:

- experiment ID
- ScenarioInstance ID
- layout ID
- occupancy condition
- disruption condition
- routing strategy
- random seed
- software Git commit
- parameter-set version
- adaptive threshold
- total evacuation time
- P95 evacuation time
- hazard exposure
- maximum density
- queue exposure
- completion rate
- unreachable count
- reroutes
- route reversals
- exit utilization
- computation time
- run status

## 17. Minimum Formal Experiment Size

The initial design contains:

5 routing strategies
x 3 occupancy levels
x 5 disruption conditions
= 75 cells

At a minimum of 40 ScenarioInstances per cell:

75 x 40 = 3000 formal simulation runs

Additional runs may be required when convergence criteria are not satisfied.

## Status

Research Pass 4 is substantively complete.

The following values remain calibration- or validation-gated:

- exact low/medium/high occupant counts
- final simulation timestep
- final density-cell length
- final bottleneck-capacity setting
- final adaptive rerouting threshold
- exact disruption timings and locations

The procedures for resolving these parameters are now defined.