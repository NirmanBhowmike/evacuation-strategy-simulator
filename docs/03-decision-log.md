### D-004
Use a hybrid individual-agent and graph-routing model rather than a full Social Force Model.

Reason:
The principal research variable is routing strategy. A highly parameterized microscopic force model would introduce additional calibration uncertainty and could obscure routing effects.

Date:
Research Pass 1

### D-005
Use the Weidmann fundamental diagram as the baseline pedestrian density-speed relationship.

Reason:
It is a widely established pedestrian-flow benchmark and provides a transparent relationship among density, speed, and jam conditions.

Caution:
It will be treated as a baseline model, not as a universally valid pedestrian law.

Date:
Research Pass 1

### D-006
Control pre-evacuation delay at zero seconds in the primary experiment.

Reason:
This isolates routing and movement behavior from response-time variability.

Date:
Research Pass 1

### D-007
Model hazards as dynamic routing-risk and route-availability conditions rather than simulate physical fire or smoke.

Reason:
Fire and smoke modeling would substantially expand the project scope and would require additional physical validation unrelated to the primary routing research question.

Date:
Research Pass 1

### D-008
Use sensitivity analysis for uncertain pedestrian-flow parameters instead of presenting one value as universally correct.

Initial sensitivity targets include:

- bottleneck specific flow
- density-cell length
- simulation timestep

Date:
Research Pass 1

### D-009
Require timestep convergence testing before freezing the simulation timestep.

Nominal candidate:
0.05 s

Comparison values:
0.025 s and 0.10 s

Date:
Research Pass 1

### D-010
Formal stochastic experiments will use recorded seeds and identical seed sets when strategies are compared.

Reason:
This allows controlled paired comparison and reproducibility.

Date:
Research Pass 1
### D-011
Use a weighted navigation graph and Dijkstra's algorithm as the common pathfinding foundation for routing strategies.

Reason:
The graph is moderate in size and requires transparent, deterministic weighted routing that can be independently validated.

Date:
Research Pass 2

### D-012
Separate Nearest Exit from Static Shortest Path.

Nearest Exit uses geometric exit proximity.

Static Shortest Path uses actual network distance.

Reason:
This creates two meaningfully different baseline decision policies.

Date:
Research Pass 2

### D-013
Use estimated travel time rather than an arbitrary congestion penalty as the primary congestion-aware route cost.

Edge cost includes density-adjusted movement time and bottleneck queue delay.

Reason:
The resulting cost has a physical interpretation in seconds.

Date:
Research Pass 2

### D-014
Allow static strategies to recover from physically impossible routes.

Reason:
A static baseline should ignore performance adaptation but should not remain committed to a blocked or unavailable path.

Date:
Research Pass 2

### D-015
Use decision-node and event-triggered route reevaluation instead of continuous route switching.

Reason:
This improves interpretability, lowers computational noise, and reduces unstable route oscillation.

Date:
Research Pass 2

### D-016
Introduce explicit rerouting inertia through a relative-improvement threshold.

Reason:
Small temporary route-cost differences should not automatically cause a route switch.

Date:
Research Pass 2

### D-017
Do not assign the rerouting threshold arbitrarily.

Candidate thresholds will be evaluated on development scenarios and frozen before holdout testing.

Initial candidates:

0%
10%
20%
30%

Date:
Research Pass 2

### D-018
Prohibit routing strategies from using future event information.

Reason:
The simulation should evaluate real-time decision policies rather than algorithms with knowledge of future disruptions.

Date:
Research Pass 2

### D-019
Interpret dynamic routing strategies as system-level evacuation-guidance policies rather than complete predictive models of unaided human behavior.

Reason:
Real human route choice depends on familiarity, visibility, social influence, and incomplete information that are not the primary focus of this experiment.

Date:
Research Pass 2

### D-020
Record structured route-decision traces.

Reason:
Decision traces support reproducibility, validation, debugging, research analysis, and live explanation of adaptive behavior.

Date:
Research Pass 2

### D-021
Add route-stability outcomes to the research metrics.

Initial stability measures:

- reroutes per agent
- fraction of agents rerouted
- exit target changes
- route reversal events

Reason:
Adaptive routing should be evaluated not only for evacuation performance but also for decision stability.

Date:
Research Pass 2

### D-022
Represent hazards using CLEAR, RISK, and BLOCKED states.

Reason:
A discrete state model supports controlled routing experiments without implying unsupported fire or smoke physics.

Date:
Research Pass 3

### D-023
Do not implement physical fire, smoke, toxicity, or tenability calculations in Research Model v1.0.

Reason:
These require separate physical modeling and validation and are outside the routing research scope.

Date:
Research Pass 3

### D-024
Measure hazard exposure as time spent in RISK regions.

Individual unit:
seconds

Population unit:
person-seconds

Reason:
This creates an interpretable simulation metric without implying physiological harm.

Date:
Research Pass 3

### D-025
Use safety-first hazard-aware route selection.

Decision order:

1. exclude blocked routes
2. minimize predicted hazard exposure
3. minimize travel time among similarly safe alternatives

Reason:
This avoids selecting an arbitrary numerical weight between hazard and time.

Date:
Research Pass 3

### D-026
Allow Adaptive Hybrid routing to override normal time-based rerouting inertia when an alternative meaningfully reduces hazard exposure.

Reason:
Safety response and congestion optimization should not be governed by the same switching threshold.

Date:
Research Pass 3

### D-027
Use deterministic scheduled disruption events.

Initial event types:

HAZARD_ACTIVATE
HAZARD_EXPAND
CORRIDOR_BLOCK
EXIT_BLOCK

Reason:
Competing strategies must experience identical environmental changes.

Date:
Research Pass 3

### D-028
Blocked exits and blocked route segments trigger immediate forced route reevaluation.

Reason:
The current route is no longer feasible.

Date:
Research Pass 3

### D-029
Hazard activation triggers reevaluation for occupants whose planned routes intersect the newly risky region.

Reason:
This enables dynamic safety response without automatically treating all hazardous regions as physically impassable.

Date:
Research Pass 3

### D-030
Do not provide routing strategies with knowledge of future hazard or disruption events.

Reason:
Research Model v1.0 evaluates reactive routing using current situational information.

Date:
Research Pass 3

### D-031
Treat exact hazard timing and placement as experimental factors rather than physical constants.

Reason:
The project does not contain a validated fire-development model.

Date:
Research Pass 3

### D-032
Use low, medium, and high occupancy regimes defined by observed congestion behavior rather than arbitrary population counts.

Reason:
The same occupant count can represent different congestion severity in different building geometries.

Date:
Research Pass 4

### D-033
Use a separate development layout and holdout layout.

Reason:
The adaptive strategy should be evaluated on geometry that was not used during parameter tuning.

Date:
Research Pass 4

### D-034
Generate immutable ScenarioInstances before applying routing strategies.

Reason:
This ensures competing strategies experience identical stochastic inputs and supports paired comparisons.

Date:
Research Pass 4

### D-035
Use a minimum initial replication count of 40 per experimental cell, followed by convergence testing.

Reason:
Different evacuation metrics may converge at different rates. A fixed small replication count is not assumed sufficient.

Date:
Research Pass 4

### D-036
Add additional replications in batches of 10 when convergence criteria are not met.

Date:
Research Pass 4

### D-037
Do not use total evacuation time as the only convergence indicator.

Additional indicators include density, exit utilization, queue exposure, and hazard exposure where applicable.

Date:
Research Pass 4

### D-038
Use total evacuation time and population hazard exposure as co-primary outcomes where hazard is present.

Reason:
The project evaluates both evacuation performance and safety-oriented exposure.

Date:
Research Pass 4

### D-039
Treat P95 evacuation time as a key secondary outcome.

Reason:
P95 represents the slower tail of occupants without relying exclusively on the final evacuating individual.

Date:
Research Pass 4

### D-040
Tune the adaptive rerouting threshold only on Layout A development scenarios.

Reason:
Holdout evaluation must remain independent from algorithm tuning.

Date:
Research Pass 4

### D-041
Freeze the adaptive strategy, parameter set, and software commit before holdout testing.

Reason:
Poor holdout performance should be reported as a result rather than corrected through hidden retuning.

Date:
Research Pass 4

### D-042
Use matched scenario comparisons across strategies.

Reason:
Every strategy should face identical occupant configurations and environmental events.

Date:
Research Pass 4

### D-043
Use factorial analysis to investigate strategy interactions with occupancy and disruption conditions.

Reason:
Overall averages can hide important condition-dependent strategy behavior.

Date:
Research Pass 4

### D-044
Separate primary, secondary, and diagnostic metrics.

Reason:
The analysis should focus on research outcomes rather than treat every logged variable as equally important.

Date:
Research Pass 4

### D-045
Use explicit EVACUATED, UNREACHABLE, and TIMEOUT run states.

Reason:
Failed or impossible evacuations must not be silently incorporated as successful outcomes.

Date:
Research Pass 4