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