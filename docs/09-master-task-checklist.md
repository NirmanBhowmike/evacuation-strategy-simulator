# Master Project Checklist — Current Status

## Phase 0 — Project Infrastructure

- [x] Final project direction established
- [x] Research-oriented 3D evacuation simulator selected
- [x] Digital-twin requirement removed
- [x] Fictional first-floor academic/engineering building concept selected
- [x] Quality prioritized over original October 15 target
- [x] Git installed and configured
- [x] Node.js LTS installed
- [x] npm configured
- [x] VS Code updated
- [x] ESLint installed
- [x] Prettier installed
- [x] Local project folder created
- [x] Local Git repository initialized
- [x] Private GitHub repository created
- [x] Local repository connected to GitHub
- [x] Documentation structure created
- [x] Initial project documentation populated
- [x] `.gitignore` created
- [x] First Git commit completed
- [x] First GitHub push completed
- [x] Working tree verification workflow established
- [x] Current Architecture V2 research-freeze checkpoint committed and pushed
- [x] Current working tree verified clean

---

## Phase 1 — Research Model Specification

### Research Pass 1 — Pedestrian Movement and Flow Model

- [x] Free-flow walking speed defined
- [x] Inter-person variability / speed distribution defined
- [x] Speed-density relationship defined
- [x] Local pedestrian-density calculation defined
- [x] Corridor flow treatment defined
- [x] Door/bottleneck capacity defined
- [x] Personal spacing / collision approach defined
- [x] Numerical timestep baseline established
- [x] Baseline timestep = 0.05 s
- [x] Timestep convergence tested against 0.025 s and 0.10 s
- [x] Movement-model validation targets defined

### Research Pass 2 — Navigation and Route-Choice Model

- [x] Navigation-graph structure defined
- [x] Shortest-path baseline defined
- [x] Nearest-exit baseline defined
- [x] Congestion-aware routing defined
- [x] Hazard-aware routing defined
- [x] CLEAR / RISK / BLOCKED safety rules implemented
- [x] Adaptive Hybrid routing architecture defined
- [x] Route-cost formulation defined
- [x] Information available to agents defined
- [x] Route update mechanism defined
- [x] Decision-node rerouting implemented
- [x] Event-based rerouting implemented
- [x] Rerouting hysteresis / switching approach implemented
- [x] Adaptive rerouting threshold calibrated
- [x] Adaptive rerouting threshold frozen at theta = 0.10
- [x] Safety overrides rerouting inertia when a route becomes infeasible

### Research Pass 3 — Hazard and Disruption Model

- [x] Hazard representation defined
- [x] Hazard growth / expansion mechanism implemented
- [x] Hazard exposure metric implemented
- [x] Exit blocking implemented
- [x] Corridor blocking implemented
- [x] Deterministic scheduled disruptions implemented

### Research Pass 4 — Experimental Methodology

- [x] Independent variables defined
- [x] Factor-level framework defined
- [x] Dependent variables defined
- [x] Disruption-factor framework defined
- [x] Random-seed / ScenarioInstance strategy defined
- [x] Common-random-number approach planned
- [x] Replication and convergence method defined
- [x] Development-scenario methodology defined
- [x] Holdout methodology defined
- [x] Sensitivity-analysis plan defined
- [x] Statistical-analysis framework defined
- [x] Stopping / termination rules defined
- [x] Primary and secondary outcome measures defined
- [x] Total evacuation time selected as co-primary performance outcome
- [x] Hazard exposure selected as co-primary safety outcome
- [x] P95 evacuation time retained
- [x] Maximum density retained
- [x] Queue exposure retained
- [x] Completion / unreachable metrics retained
- [x] Rerouting / route-stability diagnostics retained

### Historical Research Model v1.0

- [x] Initial Layout A Research Model v1.0 frozen
- [x] Historical v1 occupancy levels preserved as LOW = 12, MEDIUM = 36, HIGH = 48
- [x] Historical v1 disruption timings preserved
- [x] Historical v1 parameter set preserved for regression and comparison
- [x] Historical v1 tests remain passing
- [x] v1 model intentionally not overwritten by Architecture V2

### Initial Research Documentation

- [x] `01-research-basis.md` created
- [x] `02-model-assumptions.md` created
- [x] `03-decision-log.md` created
- [x] `08-research-model-specification.md` created
- [x] Research Model Specification v1.0 documented

---

## Phase 2 — Core Research Engine

- [x] Initialize TypeScript project
- [x] Configure testing framework
- [x] Define scenario data schema
- [x] Implement deterministic ScenarioInstance generation
- [x] Implement seeded random-number generator
- [x] Implement deterministic simulation clock
- [x] Implement building/environment representation
- [x] Implement navigation graph
- [x] Implement exits and spawn zones
- [x] Implement agent-state model
- [x] Implement pedestrian movement
- [x] Implement density calculation
- [x] Implement congestion effects
- [x] Implement bottleneck behavior
- [x] Implement hazard field
- [x] Implement dynamic disruptions
- [x] Implement evacuation-state handling
- [x] Implement simulation termination conditions
- [x] Implement metrics engine
- [x] Separate rendering from authoritative simulation logic
- [x] Implement replay-compatible simulation snapshots
- [x] Preserve deterministic headless execution

---

## Phase 3 — Routing Strategy Engine

- [x] Define common strategy interface
- [x] Implement Nearest Exit
- [x] Implement Static Shortest Path
- [x] Implement Congestion-Aware
- [x] Implement Hazard-Aware
- [x] Implement Adaptive Hybrid
- [x] Implement rerouting-event logging
- [x] Implement Decision Trace / explanation data
- [x] Implement route-stability tracking
- [x] Verify every strategy independently
- [x] Prevent unfair strategy-specific access to future information
- [x] Prevent repeated rerouting of queued agents at the same node
- [x] Validate selected theta = 0.10 Adaptive Hybrid threshold

---

## Phase 4 — Experiment Engine

- [x] Headless simulation mode
- [x] Batch experiment runner
- [x] Scenario IDs
- [x] Parameter-set IDs
- [x] Random-seed logging
- [x] Software / commit-version logging
- [x] CSV export
- [x] JSON configuration export
- [x] Experiment registry integration
- [x] Automatic metric aggregation
- [x] Exact same-scenario replay across strategies
- [x] Experiment artifact generation
- [x] Deterministic scenario execution
- [x] Generic experiment infrastructure validated

### Architecture V2 Experiment Integration Still Required

- [ ] Generalize Architecture V2 authoritative population generation beyond Medium = 42
- [ ] Support formal LOW = 14 population generation
- [ ] Support formal MEDIUM = 42 population generation
- [ ] Support formal HIGH = 70 population generation
- [ ] Preserve nested / comparable population construction across occupancy levels where appropriate
- [ ] Connect frozen Architecture V2 parameter set directly to formal batch runner
- [ ] Generate Architecture V2 formal experiment registry automatically
- [ ] Verify same scenario and seed are presented fairly to all five strategies

---

## Phase 5 — Verification and Validation

- [x] Single-agent analytical tests
- [x] Known shortest-path graph tests
- [x] Blocked-edge tests
- [x] Unreachable-agent tests
- [x] Same-seed reproducibility
- [x] Density-speed sanity tests
- [x] Bottleneck-flow tests
- [x] Zero-hazard exposure tests
- [x] Routing-response tests
- [x] Adaptive rerouting tests
- [x] Congestion-aware queue-commitment regression test
- [x] Adaptive threshold regression test
- [x] Replay consistency tests
- [x] Visual vs headless-result consistency
- [x] Boundary-condition tests
- [x] Performance / stress tests
- [x] Timestep convergence tests
- [x] Architecture V2 navigation validation
- [x] Architecture V2 room-access validation
- [x] Architecture V2 northwest-room regression validation
- [x] Architecture V2 authoritative 42-person population validation
- [x] Architecture V2 frozen D0–D4 regression validation
- [x] Existing v1 regression suite preserved
- [x] Current full test suite passes
- [x] Current checkpoint: 53 test files passed
- [x] Current checkpoint: 381 tests passed
- [x] Current production build passes
- [x] `git diff --check` passes

---

## Phase 6 — Architecture V2 Building and 3D Visualization

### Architecture V2 Building

- [x] Replace early layout with Architecture V2
- [x] Finalize Architecture V2 fictional institutional / academic building geometry
- [x] Create meaningful routing tradeoffs
- [x] Main east-west corridor established
- [x] Secondary corridors established
- [x] Multiple building wings established
- [x] Four exterior exits established
- [x] Alternative circulation paths established
- [x] Bottleneck-capable corridor and doorway structure established
- [x] Wider alternative routing paths established
- [x] Central / open circulation area established
- [x] Northwest shared hall established
- [x] 20 major room zones represented
- [x] Northwest polygonal-room concept replaced with three unequal rectangular rooms
- [x] Northwest geometry validated
- [x] Door locations aligned with navigation network
- [x] Architecture V2 circulation geometry validated
- [x] Natural room-to-corridor access validated
- [x] Four exits connected through navigation graph

### Authoritative Room-Origin Movement

- [x] Occupants originate inside rooms rather than at hallway nodes
- [x] Private room-origin navigation nodes implemented
- [x] Private room-origin to door edges implemented
- [x] Room-to-door distance included in authoritative evacuation travel
- [x] Room-origin edges remain one-way toward evacuation doors
- [x] 42-person Medium population validated from actual room origins

### Density and Movement Integration

- [x] Architecture V2 balanced density-cell partition implemented
- [x] Legacy v1 density behavior preserved
- [x] Architecture V2 density-cell sliver issue corrected
- [x] Architecture V2 maximum-density behavior validated
- [x] Bottleneck waiting behavior retained
- [x] Queue exposure metric retained

### 3D Visualization

- [x] Convert Architecture V2 building definition into 3D geometry
- [x] Three.js / React Three Fiber integration
- [x] Low-poly human agent rendering
- [x] Deterministic 42-person visual population
- [x] Cutaway / open-wall research visualization
- [x] Exit representation
- [x] Building / room visualization
- [x] Camera/navigation controls
- [x] Authoritative simulation replay rendered in 3D
- [x] Visual/headless consistency validated
- [ ] Add final hazard-state visualization
- [ ] Add final blocked-exit visualization
- [ ] Add final blocked-corridor visualization
- [ ] Add congestion visualization / heatmap if useful
- [ ] Add route visualization
- [ ] Add rerouting visual indication
- [ ] Complete final research-interface visual polish

---

## Phase 6A — Architecture V2 Research Calibration and Freeze

### Occupancy Calibration

- [x] Establish Architecture V2 D0 reference condition
- [x] Evaluate initial occupancy levels
- [x] Run extended high-occupancy sweep
- [x] Evaluate 42, 56, 60, 64, 70, and 84 occupants
- [x] Freeze LOW = 14
- [x] Freeze MEDIUM = 42
- [x] Freeze HIGH = 70
- [x] Retain 84 as separate overload / stress-test occupancy
- [x] Reject 56 as insufficiently distinct for formal HIGH condition

### D0 — Baseline

- [x] Freeze no-disruption baseline
- [x] Medium = 42 reference established
- [x] D0 completion = 42 / 42
- [x] D0 TET = 39.90 s
- [x] D0 P95 = 38.45 s
- [x] D0 queue exposure = 91.80 person-s
- [x] D0 reroutes = 0

### D1 — Hazard Calibration

- [x] Calibrate Architecture V2 hazard timing
- [x] Use `corridor-main-spine` as hazard target
- [x] Evaluate multiple candidate activation times
- [x] Reject overly early activation
- [x] Reject late activation as less representative
- [x] Freeze D1 hazard activation at 12.00 s
- [x] D1 Medium-42 completion = 100%
- [x] D1 reroutes = 6
- [x] D1 TET = 56.65 s
- [x] D1 hazard exposure = 74.95 person-s
- [x] D1 unreachable = 0
- [x] D1 timeout = 0

### D2 — Exit-Block Calibration

- [x] Calibrate Architecture V2 exit-block timing
- [x] Use `exit-south-central` as D2 target
- [x] Evaluate multiple candidate activation times
- [x] Verify target exit is already in use before closure
- [x] Verify meaningful active demand remains at closure
- [x] Freeze D2 exit block at 18.00 s
- [x] D2 Medium-42 completion = 100%
- [x] D2 reroutes = 10
- [x] D2 TET = 56.45 s
- [x] D2 unreachable = 0
- [x] D2 timeout = 0

### D3 — Corridor-Block Target Selection

- [x] Reject initial visually selected east-main segment because baseline traffic did not use it
- [x] Preserve rejected-target calibration as methodological evidence
- [x] Profile actual Architecture V2 baseline edge usage
- [x] Identify candidate corridor segments from observed traffic
- [x] Compare three candidate D3 targets under the same condition
- [x] Verify alternate path exists for selected segment
- [x] Select `edge-main-central-central-01`
- [x] Selected physical segment = `main-central` to `central-01-access`
- [x] Dedicated D3 zone = `corridor-main-central-east-blockable`

### D3 — Corridor-Block Timing Calibration

- [x] Sweep D3 activation at 8, 10, 12, 14, 16, and 18 s
- [x] Verify 12 s occurs after evacuation has begun
- [x] Verify zero occupants are physically inside the segment immediately before closure at 12 s
- [x] Verify four remaining active routes depend on the segment
- [x] Verify four `ROUTE_BLOCKED` reviews occur
- [x] Verify all four affected occupants reroute
- [x] Freeze D3 activation at 12.00 s
- [x] D3 Medium-42 completion = 100%
- [x] D3 reroutes = 4
- [x] D3 TET = 49.05 s
- [x] D3 P95 = 46.15 s
- [x] D3 queue exposure = 94.70 person-s
- [x] D3 unreachable = 0
- [x] D3 timeout = 0

### D4 — Combined Dynamic Condition

- [x] Define D4 using independently calibrated D1 and D2 events
- [x] D4 hazard activation remains 12.00 s
- [x] D4 exit block remains 18.00 s
- [x] Do not retune D4 to maximize severity
- [x] Verify hazard affects active routes before exit closure
- [x] Verify south-central exit remains actively targeted at 18 s
- [x] Verify both disruptions are applied exactly once
- [x] Verify combined condition remains solvable
- [x] D4 Medium-42 completion = 100%
- [x] D4 reroutes = 19
- [x] D4 TET = 86.25 s
- [x] D4 P95 = 83.55 s
- [x] D4 hazard exposure = 202.66 person-s
- [x] D4 queue exposure = 120.00 person-s
- [x] D4 unreachable = 0
- [x] D4 timeout = 0
- [x] Keep D3 separate from D4 rather than creating an arbitrary all-failures condition

### Frozen Architecture V2 Research Configuration

- [x] Create `architectureV2ResearchParameterSet.ts`
- [x] Create frozen parameter-set version
- [x] Version = `architecture-v2-research-v1.0-frozen`
- [x] Preserve v1 research parameter module separately
- [x] Create condition-specific Architecture V2 research model
- [x] Preserve original Architecture V2 graph for D0, D1, D2, and D4
- [x] Apply D3 blockable-zone mapping only to D3
- [x] Preserve authoritative room-origin nodes in D3 graph
- [x] Preserve authoritative room-origin edges in D3 graph
- [x] Add frozen Architecture V2 regression test
- [x] Reproduce D0 signature in regression
- [x] Reproduce D1 signature in regression
- [x] Reproduce D2 signature in regression
- [x] Reproduce D3 signature in regression
- [x] Reproduce D4 signature in regression
- [x] Full suite passes: 381 / 381 tests
- [x] Production build passes
- [x] Architecture V2 research-freeze checkpoint committed
- [x] Architecture V2 research-freeze checkpoint pushed to GitHub
- [x] Working tree clean after freeze

---

## Phase 7 — Interactive Application

### Replay Controls Already Implemented

- [x] Play / Start
- [x] Pause
- [x] Reset / Replay
- [x] 0.5× simulation speed
- [x] 1× simulation speed
- [x] 2× simulation speed
- [x] 4× simulation speed
- [x] Authoritative simulation-time playback
- [x] Camera/navigation controls
- [x] Live evacuation metrics
- [x] Strategy identification in interface
- [x] Occupancy identification in interface
- [x] Disruption-condition identification in interface
- [x] Exact authoritative replay of current Medium-42 baseline

### Research / Experiment Mode

- [ ] Add formal strategy selector
- [ ] Add formal occupancy selector
- [ ] Add D0–D4 condition selector
- [ ] Connect interface directly to frozen Architecture V2 parameter set
- [ ] Allow exact formal-scenario replay
- [ ] Preserve deterministic experiment behavior
- [ ] Prevent manual controls from contaminating formal experiment mode

### Interactive Demonstration Mode

- [ ] Add mode separation between Research Mode and Interactive Demo Mode
- [ ] Add Select Exit control
- [ ] Add Block Selected Exit control
- [ ] Add Select Corridor control
- [ ] Add Block Selected Corridor control
- [ ] Add Select Hazard Zone control
- [ ] Add Activate Hazard control
- [ ] Allow all four exits to be selected in demo mode
- [ ] Provide clear indication that manual demo events are not formal experiment data
- [ ] Reset interactive condition cleanly

### Research Explanation UI

- [ ] Decision Trace panel
- [ ] Select individual agent
- [ ] Show original route
- [ ] Show revised route
- [ ] Show rerouting reason
- [ ] Show route-change timing
- [ ] Show hazard-avoidance reason
- [ ] Show exit-unavailable reason
- [ ] Show route-blocked reason

### Comparison / Results UI

- [ ] Strategy Comparison view
- [ ] Experiment Results view
- [ ] Results-table integration
- [ ] Research-chart integration
- [ ] Same-scenario side-by-side comparison if feasible

---

## Phase 8 — Formal Architecture V2 Research Experiments

### 8.1 Formal Experiment Infrastructure — NEXT CURRENT PHASE

- [ ] Generalize Architecture V2 authoritative population builder for LOW = 14
- [ ] Preserve MEDIUM = 42 authoritative population
- [ ] Generalize Architecture V2 authoritative population builder for HIGH = 70
- [ ] Verify all generated occupants originate inside valid rooms
- [ ] Verify every generated occupant receives a valid room-origin node
- [ ] Verify every generated occupant receives a valid room-origin to door edge
- [ ] Verify population construction is deterministic by seed
- [ ] Create formal Architecture V2 experiment configuration
- [ ] Connect frozen `architecture-v2-research-v1.0-frozen` parameters
- [ ] Connect all five routing strategies
- [ ] Connect all three formal occupancy levels
- [ ] Connect all five frozen disruption conditions
- [ ] Generate complete 5 × 3 × 5 factorial design
- [ ] Verify 75 formal experimental cells
- [ ] Implement common seed bank across strategy comparisons
- [ ] Verify same scenario instance is reused across competing strategies
- [ ] Record parameter-set version automatically
- [ ] Record software commit automatically
- [ ] Record scenario ID automatically
- [ ] Record seed automatically
- [ ] Record occupancy level automatically
- [ ] Record strategy automatically
- [ ] Record disruption condition automatically
- [ ] Record run status / termination automatically

### 8.2 Formal Output Schema

- [ ] Record total evacuation time
- [ ] Record P95 evacuation time
- [ ] Record population hazard exposure
- [ ] Record maximum density
- [ ] Record queue exposure
- [ ] Record mean queue wait
- [ ] Record maximum queue wait
- [ ] Record completion rate
- [ ] Record unreachable occupants
- [ ] Record timeout occupants
- [ ] Record reroute count
- [ ] Record fraction rerouted
- [ ] Record route-reversal metrics
- [ ] Record exit utilization
- [ ] Record decision-trace diagnostics where required
- [ ] Preserve raw per-run data
- [ ] Export machine-readable CSV
- [ ] Export machine-readable JSON metadata

### 8.3 Formal Replication Plan

- [ ] Establish frozen formal seed bank
- [ ] Run minimum 40 replications per experimental cell
- [ ] Minimum planned formal runs = 75 × 40 = 3,000
- [ ] Evaluate convergence after minimum replication requirement
- [ ] Add replications in controlled batches of 10 where required
- [ ] Define convergence stopping rule in implementation
- [ ] Prevent post-hoc selective replication
- [ ] Preserve failed / terminated runs rather than silently deleting them

### 8.4 Formal Experiment Execution

- [ ] Record frozen commit before first formal run
- [ ] Verify clean working tree before first formal run
- [ ] Run smoke test of complete factorial pipeline
- [ ] Validate output columns and metadata
- [ ] Run complete formal experiment matrix
- [ ] Run required replications
- [ ] Preserve raw results without manual editing
- [ ] Archive formal configuration used for every run
- [ ] Record execution time

### 8.5 Holdout and Generalization

- [ ] Finalize holdout-layout methodology
- [ ] Build / prepare holdout Layout B if retained
- [ ] Freeze Layout B before evaluating final claims
- [ ] Run holdout scenarios
- [ ] Investigate strategy × building-layout interaction
- [ ] Keep holdout results separate from development calibration

### 8.6 Sensitivity Analysis

- [ ] Run required sensitivity analyses
- [ ] Density-cell sensitivity where required
- [ ] Specific-flow sensitivity where required
- [ ] Timestep sensitivity already validated for baseline numerical model
- [ ] Test additional parameter sensitivities only when methodologically justified
- [ ] Avoid changing frozen formal parameters based on formal-result preference

### 8.7 Statistical Analysis

- [ ] Perform descriptive statistical analysis
- [ ] Calculate confidence intervals
- [ ] Calculate effect sizes where appropriate
- [ ] Compare strategy main effects
- [ ] Investigate strategy × occupancy interaction
- [ ] Investigate strategy × disruption interaction
- [ ] Investigate strategy × building-layout interaction if Layout B retained
- [ ] Analyze evacuation-time outcomes
- [ ] Analyze hazard-exposure outcomes
- [ ] Analyze congestion / queue outcomes
- [ ] Analyze rerouting stability
- [ ] Analyze exit utilization
- [ ] Interpret negative findings honestly
- [ ] Interpret conditional findings honestly
- [ ] Avoid claiming real-world human behavior beyond model scope

---

## Phase 9 — Deployment

### Current Build Readiness

- [x] Development production build currently passes
- [x] Vite production compilation currently succeeds
- [x] Current build warning limited to large JavaScript chunk size

### Final Deployment

- [ ] Optimize bundle / code splitting if useful
- [ ] Final production build
- [ ] Local presentation build
- [ ] Local performance test
- [ ] Public web deployment
- [ ] Verify free-host asset-size constraints
- [ ] Cross-browser testing
- [ ] Test on another computer
- [ ] Test without internet for local demo
- [ ] Create presentation backup
- [ ] Freeze stable presentation release

---

## Phase 10 — Documentation and Academic Output

### Documentation Maintenance

- [ ] Update `01-research-basis.md` for Architecture V2
- [ ] Update `02-model-assumptions.md` for Architecture V2
- [ ] Update `03-decision-log.md` with Architecture V2 decisions
- [ ] Update development log with Architecture V2 development
- [ ] Update validation log with current 381-test checkpoint
- [ ] Update experiment registry for Architecture V2
- [ ] Update time log
- [x] Update master task checklist after Architecture V2 research freeze

### Calibration Documentation

- [ ] Document occupancy calibration
- [ ] Document D1 hazard timing calibration
- [ ] Document D2 exit-block timing calibration
- [ ] Document rejected first D3 corridor target
- [ ] Document baseline edge-usage profiling
- [ ] Document D3 candidate comparison
- [ ] Document D3 timing calibration
- [ ] Document D4 combined-condition validation
- [ ] Document distinction between historical v1 model and current Architecture V2 model

### Project Record

- [ ] Record AI-assisted work accurately
- [ ] Record planning hours
- [ ] Record coding hours
- [ ] Record testing hours
- [ ] Record research / calibration hours
- [ ] Record failed / revised approaches
- [ ] Record approximate final LOC
- [ ] Document software architecture
- [ ] Document research-engine architecture
- [ ] Document visualization architecture
- [ ] Document experiment architecture
- [ ] Document limitations
- [ ] Document model-scope limitations
- [ ] Document future research pathway
- [ ] Compile final project report

---

## Phase 11 — Presentation

### Research Story

- [ ] Select one clear research story
- [ ] Select strongest formal experiment result
- [ ] Select strongest same-scenario comparison
- [ ] Select one useful negative / conditional finding if relevant

### Slides

- [ ] Prepare no more than three primary slides unless instructor guidance changes
- [ ] Prefer approximately two strong content slides if sufficient
- [ ] Keep technical details focused on research question and evidence
- [ ] Prepare results visualization
- [ ] Prepare methodology / reproducibility summary

### Demonstration

- [ ] Prepare fixed-vs-adaptive same-scenario demo
- [ ] Prepare live disruption demonstration
- [ ] Clearly distinguish Research Mode from Interactive Demo Mode
- [ ] Demonstrate deterministic replay
- [ ] Demonstrate meaningful rerouting response
- [ ] Demonstrate live metrics
- [ ] Prepare local demo fallback
- [ ] Prepare live-site fallback
- [ ] Prepare screenshots / video emergency backup

### Presentation Preparation

- [ ] Build approximately 12–15 minute oral presentation flow unless instructor specifies otherwise
- [ ] Rehearse timing
- [ ] Rehearse live demo transitions
- [ ] Prepare likely technical questions
- [ ] Prepare explanation of validation
- [ ] Prepare explanation of model limitations
- [ ] Prepare explanation of why results are reproducible
- [ ] Final rehearsal

---

## Phase 12 — Final Project Archive

- [ ] Final clean Git status
- [ ] Final GitHub push
- [ ] Tag stable release
- [ ] Archive frozen Architecture V2 parameter set
- [ ] Archive formal experiment configuration
- [ ] Archive seed bank
- [ ] Archive raw data
- [ ] Archive analyzed results
- [ ] Archive statistical-analysis outputs
- [ ] Archive presentation
- [ ] Archive final report
- [ ] Archive screenshots / demo backup
- [ ] Preserve reproducibility instructions
- [ ] Preserve exact software commit used for reported results
- [ ] Preserve historical v1 research model for traceability

---

# Current Project Position

The project is currently at the transition between the completed Architecture V2 research-model calibration/freeze and Phase 8 formal research experiments.

The authoritative Architecture V2 research model is frozen at:

- LOW occupancy = 14
- MEDIUM occupancy = 42
- HIGH occupancy = 70
- Stress-test occupancy = 84
- Timestep = 0.05 s
- Density cell length = 1.0 m
- Specific flow = 1.3 persons/(m·s)
- Adaptive rerouting threshold theta = 0.10

Frozen disruption conditions:

- D0 — No disruption
- D1 — Main-spine hazard at 12.00 s
- D2 — South-central exit block at 18.00 s
- D3 — Main-central corridor block at 12.00 s
- D4 — Main-spine hazard at 12.00 s plus south-central exit block at 18.00 s

Current validated software checkpoint:

- 53 test files passed
- 381 tests passed
- Production build passed
- Frozen Architecture V2 D0–D4 regression tests passed
- Historical Research Model v1.0 regression tests remain passing
- Architecture V2 research-freeze checkpoint committed and pushed
- Working tree clean

## Immediate Next Task

Build the formal Architecture V2 experiment infrastructure beginning with deterministic LOW = 14, MEDIUM = 42, and HIGH = 70 authoritative population generation. Then connect the frozen strategies, occupancy levels, disruption conditions, seed bank, batch runner, and output schema to create the 75-cell formal experimental design.