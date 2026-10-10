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
Validation result:

Numerical convergence testing was completed using 0.025 s, 0.05 s, and 0.10 s timesteps. The 0.05 s timestep satisfied the convergence checks relative to the 0.025 s reference while requiring approximately half as many simulation ticks.

Decision:

Use 0.05 s as the baseline timestep for the primary experiment. Retain 0.025 s and 0.10 s as numerical sensitivity cases.
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
Calibration result:

Layout A occupancy calibration evaluated:

12, 24, 36, 48, 60, 72, 96, and 120 occupants.

The selected primary occupancy conditions are:

- LOW = 12 occupants
- MEDIUM = 36 occupants
- HIGH = 48 occupants

All three selected conditions achieved 100% completion under the baseline calibration case while showing progressively greater local density and queue exposure.

At 60 occupants, maximum local density exceeded the 5.4 persons/mÂ² jam-density reference and completion dropped below 100%.

Decision:

Use 12, 36, and 48 occupants as the primary Layout A occupancy levels.

Treat 60 occupants and above as overload/stress conditions rather than primary factor levels.
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

### D-046

Freeze the Adaptive Hybrid voluntary rerouting threshold at theta = 0.10.

Calibration:

Candidate values were:

- 0.00
- 0.10
- 0.20
- 0.30

Controlled Layout A congestion scenarios were constructed without hazards or blocked routes so the normal relative-improvement threshold controlled the decision.

Valid consequential cases produced predicted improvements of approximately 0.31%, 4.71%, and 8.73%.

With theta = 0, the Adaptive Hybrid strategy accepted these switches. The resulting probe evacuation time was worse than when the current route was retained.

Theta = 0.10, 0.20, and 0.30 all rejected the demonstrated harmful low-benefit switches.

Decision:

Select theta = 0.10 because it is the lowest candidate that eliminates the observed harmful switching while introducing the least additional rerouting inertia.

The value is a development-calibrated research parameter rather than a claim of universal optimality.

The threshold must remain frozen before Layout B holdout evaluation.

Date:
October 2, 2026

### D-047

Freeze the five-level disruption factor and Research Model v1.0 calibrated parameter set.

Formal disruption conditions:

D0 - Baseline
No disruption.

D1 - Hazard
HAZARD_ACTIVATE on corridor-main-spine at 6.65 s.

D2 - Exit Block
EXIT_BLOCK on exit-south-central at 13.25 s.

D3 - Corridor Block
CORRIDOR_BLOCK on corridor-main-east-blockable at 6.65 s.

D4 - Combined
HAZARD_ACTIVATE on corridor-main-spine at 6.65 s followed by EXIT_BLOCK on exit-south-central at 13.25 s.

Calibration rationale:

The selected conditions produced meaningful experimental effects while retaining complete evacuation and avoiding unreachable or timeout occupants in the medium-occupancy development calibration.

The hazard condition produces measurable differentiation in hazard exposure.

The exit-block condition creates a dynamic recovery problem after route commitment.

The corridor-block condition creates a controlled detour without structural disconnection.

The combined condition provides simultaneous performance and hazard-exposure tradeoffs without the excessive severity of the rejected three-event combined candidate.

The calibrated values are centralized in:

`src/scenario/researchParameterSet.ts`

The parameter set is protected by:

`tests/validation/researchParameterSetRegression.test.ts`

Validation status at freeze:

45 test files passed.
343 tests passed.
0 tests failed.

Date:
October 2, 2026

## Architecture V2 and v1.2 closure decisions

### D-048
Adopt Architecture V2 as the current fictional research environment and move the formal occupancy levels to LOW = 14, MEDIUM = 42, and HIGH = 70.

Reason: Architecture V2 replaced the earlier Layout A configuration and required its own calibrated occupancy regimes.

### D-049
Freeze the Architecture V2 disruption timing at 12 s for hazard/corridor events and 18 s for exit blocks.

Reason: These values are the calibrated experimental event times used by the current formal model.

### D-050
Extend the formal disruption factor from D0-D4 to D0-D6.

Added conditions:

- D5 = West exit block at 18 s
- D6 = East-main to southeast corridor block at 12 s

Reason: The additional conditions broaden route-availability challenges while retaining complete formal execution.

### D-051
Retain the downstream receiving/jam-release correction after the pre-correction HIGH-occupancy gridlock investigation.

Reason: The earlier timeout behavior was an absorbing numerical/movement state rather than legitimate slow evacuation. The correction resolves the identified gridlock without imposing an arbitrary minimum walking speed.

### D-052
Freeze the v1.2 formal execution at Git commit `1a84923664c028f3b6b15c5ec93ddaf9b7905095`.

Formal design:

```text
5 strategies
3 occupancy levels
7 conditions
40 paired seeds per cell
105 cells
840 paired scenarios
4,200 runs
```

All 4,200 runs completed with 0 timeout and 0 unreachable-present outcomes.

### D-053
Analyze Adaptive Hybrid against the four comparator strategies using paired common-seed comparisons.

Co-primary outcomes:

- total evacuation time
- population simulated hazard exposure

The analysis uses paired two-sided t-tests, Cohen's `dz`, exact sign tests as a sensitivity check, and Holm correction across 168 tests.

The analysis plan was finalized after execution and is therefore reported as post-execution multiplicity-controlled analysis.

### D-054
Keep Interactive Demo Mode separate from Research Mode.

Reason: Manual demonstration disruptions are useful for presentation and exploration but must not be confused with the frozen D0-D6 research design.

### D-055
Deploy the application publicly with graceful WebGL failure handling and responsive phone support while preserving the validated desktop experience.

The accepted phone limitation is visual only: extreme manual zoom-out in portrait can expose a large dark area around the finite scene ground.
