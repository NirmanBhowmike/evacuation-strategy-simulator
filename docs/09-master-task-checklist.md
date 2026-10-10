# Master Project Checklist

## Current state

The research-software build is complete through formal v1.2 execution, analysis, deployment, and responsive browser support.

Remaining work is primarily academic communication: final figures, report writing, presentation preparation, and any later publication-oriented refinement.

## Research model

- [x] Define the research question and simulation scope.
- [x] Keep the quantitative engine separate from the renderer.
- [x] Build the fictional Architecture V2 environment.
- [x] Implement deterministic navigation and movement.
- [x] Implement density-sensitive walking speed.
- [x] Implement bottleneck service constraints.
- [x] Implement hazards, exit blocks, and corridor blocks.
- [x] Implement route tracing and decision logging.
- [x] Implement all five routing strategies.
- [x] Freeze Adaptive Hybrid threshold at `0.10`.
- [x] Freeze timestep at `0.05 s`.
- [x] Freeze density-cell baseline at `1.0 m`.
- [x] Freeze specific flow at `1.3 persons/m/s`.
- [x] Freeze LOW / MEDIUM / HIGH occupancy at 14 / 42 / 70.

## Formal v1.2 design

- [x] D0 Baseline.
- [x] D1 Main-spine hazard.
- [x] D2 South-central exit block.
- [x] D3 Main-central corridor block.
- [x] D4 Hazard + south-central exit block.
- [x] D5 West exit block.
- [x] D6 East-main to southeast corridor block.
- [x] Freeze event timing.
- [x] Preserve common random numbers across strategies.
- [x] Freeze 40 formal seeds, `100001-100040`.
- [x] Build the 5 x 3 x 7 x 40 factorial execution plan.
- [x] Confirm 105 cells and 840 paired scenarios.
- [x] Freeze formal execution source at `1a84923664c028f3b6b15c5ec93ddaf9b7905095`.

## Historical gridlock correction

- [x] Preserve the original pre-correction 3,000-run evidence.
- [x] Identify the absorbing HIGH-occupancy gridlock mechanism.
- [x] Confirm additional simulation time does not resolve the old failure.
- [x] Implement downstream receiving/jam-release correction.
- [x] Avoid adding an arbitrary minimum-speed floor.
- [x] Add regression coverage for seed `100025`.
- [x] Rerun the corrected v1.1 experiment.
- [x] Confirm corrected v1.1 result: 3,000 completed, 0 timeout, 0 unreachable.
- [x] Keep pre-correction data separate from final research evidence.

## Formal execution

| Batch | Seeds | Runs | Status |
|---|---|---:|---|
| 1 | 100001-100010 | 1,050 | complete |
| 2 | 100011-100020 | 1,050 | complete |
| 3 | 100021-100030 | 1,050 | complete |
| 4 | 100031-100040 | 1,050 | complete |

Final dataset:

- [x] 4,200 records.
- [x] 4,200 unique run IDs.
- [x] 840 pair keys.
- [x] 105 cells.
- [x] 40 seeds.
- [x] 5 strategies.
- [x] 7 conditions.
- [x] 3 occupancy levels.
- [x] Every pair contains all five strategies.
- [x] Every cell contains 40 replications.
- [x] 4,200 `COMPLETED`.
- [x] 0 timeout.
- [x] 0 unreachable present.
- [x] Validate formal provenance.
- [x] Publish canonical CSV and curated result package.

## Analysis

### Stage A

- [x] Validate dataset integrity before statistical analysis.
- [x] Calculate 105 cell-level descriptive summaries.
- [x] Calculate overall strategy summaries.
- [x] Preserve seed-level Adaptive-versus-comparator paired differences.
- [x] Verify evacuation-time and hazard-exposure values.

### Stage B

- [x] Compare Adaptive Hybrid with four comparator strategies.
- [x] Use seed-level paired analysis.
- [x] Analyze evacuation time.
- [x] Analyze simulated hazard exposure.
- [x] Calculate paired confidence intervals.
- [x] Calculate Cohen's `dz`.
- [x] Run paired two-sided t-tests.
- [x] Run exact sign-test sensitivity checks.
- [x] Apply Holm correction across 168 co-primary tests.
- [x] Record the analysis as post-execution rather than preregistered.
- [x] Identify 18 clear speed-exposure tradeoffs.
- [x] Avoid claiming that Adaptive Hybrid is universally fastest or universally best.

## Formal findings

- [x] Adaptive significantly faster in 4 of 84 evacuation-time comparisons.
- [x] Adaptive significantly slower in 18 of 84 evacuation-time comparisons.
- [x] Adaptive significantly lower in simulated hazard exposure in 20 of 84 comparisons.
- [x] No comparison shows significantly higher Adaptive hazard exposure.
- [x] Identify D1 and D4 as the clearest speed-exposure tradeoff conditions.
- [x] Treat very small statistically significant time differences as potentially limited in practical importance.
- [x] Keep hazard exposure interpretation limited to person-seconds in simulated `RISK` regions.

## Verification

- [x] Core-engine tests.
- [x] Routing-policy tests.
- [x] Dynamic-disruption tests.
- [x] Population and scenario tests.
- [x] Timestep and numerical checks.
- [x] Formal runner and executor tests.
- [x] Provenance and artifact tests.
- [x] Visual/headless consistency tests.
- [x] D5/D6 regression tests.
- [x] Interactive Demo reproducibility tests.
- [x] Final automated checkpoint: 66 test files.
- [x] Final automated checkpoint: 455 tests.
- [x] TypeScript validation passed.
- [x] Production build passed.

## Research interface

- [x] Build the 3D Architecture V2 interface.
- [x] Render occupants from authoritative replay state.
- [x] Add hazard and closure visualization.
- [x] Add route tracing.
- [x] Add selected-agent inspection.
- [x] Add Play / Pause / Resume / Replay / Reset.
- [x] Add playback-rate controls.
- [x] Add camera presets.
- [x] Add light and dark modes.
- [x] Add Research Mode.
- [x] Add separate Interactive Demo Mode.
- [x] Add manual Demo disruptions.
- [x] Add deterministic Demo replay.
- [x] Add WebGL failure fallback.
- [x] Add responsive phone support.
- [x] Preserve the validated desktop interface while adding mobile CSS.
- [x] Use route-only agent selection in phone portrait.
- [x] Keep detailed Agent Inspector in landscape.
- [x] Hide mobile Present mode.
- [x] Hide Reset Views in phone portrait.
- [x] Record portrait extreme-zoom visualization limitation.

## Deployment

- [x] Add Cloudflare Workers static deployment configuration.
- [x] Deploy from GitHub `main`.
- [x] Verify production URL.
- [x] Smoke-test production load and refresh.
- [x] Test WebGL fallback in a restricted browser.
- [x] Verify real 3D rendering in WebGL-capable Chrome.
- [x] Verify Research / Demo switching.
- [x] Verify playback on production.
- [x] Verify responsive phone portrait.
- [x] Verify responsive phone landscape.

Production:

https://evacuation-strategy-simulator.nirman-bhowmike.workers.dev

## Public repository

- [x] Publish v1.2 formal result package.
- [x] Keep raw execution batches outside the public repository.
- [x] Publish analysis summaries and figures.
- [x] Publish formal manifests and integrity hashes.
- [x] Mark the npm package `UNLICENSED`.
- [x] State research and life-safety interpretation limits.
- [x] Synchronize README with the completed 4,200-run study.
- [x] Synchronize validation counts and current design.
- [x] Record mobile/browser behavior and known limitation.
- [x] Refine public documentation into concise research-software style.

## Remaining academic deliverables

These tasks do not block the software release.

- [ ] Select the strongest final figures for presentation.
- [ ] Decide whether the current SVG figures need publication-level visual refinement.
- [ ] Build a compact primary-results table for the final report.
- [ ] Prepare the experiment-design figure.
- [ ] Prepare a software/system architecture figure if useful for the presentation.
- [ ] Draft the final Results section.
- [ ] Draft Discussion.
- [ ] Draft Limitations.
- [ ] Explain the gridlock correction concisely in the final written record.
- [ ] Prepare the in-class demonstration sequence.
- [ ] Prepare presentation slides.
- [ ] Prepare speaker notes.
- [ ] Decide which development details belong in the appendix rather than the main presentation.

## Research boundaries to preserve

- [x] Do not call the fictional building a real-building digital twin.
- [x] Do not describe hazard exposure as injury, mortality, FED, smoke dose, or certified tenability.
- [x] Do not present Demo events as formal experimental conditions.
- [x] Do not merge historical v1.1 statistics into the current D0-D6 result set.
- [x] Do not claim Adaptive Hybrid is universally superior.
- [x] Keep the formal execution Git provenance fixed even when the application receives later UI or documentation commits.