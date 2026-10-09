# Formal Results — Architecture V2 v1.2

## Experiment

This directory contains the curated formal results for the Architecture V2 evacuation-strategy experiment.

Formal design:

- 5 routing strategies
- 3 occupancy levels
- 7 disruption conditions
- 40 paired stochastic replications per factorial cell
- 105 factorial cells
- 840 common-random-number paired scenarios
- 4,200 simulation runs

All 4,200 formal runs completed successfully.

- COMPLETED: 4,200
- UNREACHABLE_PRESENT: 0
- TIMEOUT: 0

Software provenance:

- Software version: 1.2.0
- Git commit: `1a84923664c028f3b6b15c5ec93ddaf9b7905095`
- Design: `architecture-v2-formal-factorial-v3`
- Parameter set: `architecture-v2-research-v1.2-frozen`

## Conditions

- D0 — Baseline
- D1 — Hazard
- D2 — Exit Block
- D3 — Corridor Block
- D4 — Combined Hazard + Exit Block
- D5 — West Exit Block
- D6 — East-Main to Southeast Corridor Block

## Primary Outcomes

1. Total evacuation time in seconds
2. Population simulated hazard exposure in person-seconds

Hazard exposure represents simulated time spent in regions classified as `RISK`. It is not a physiological dose, injury probability, mortality measure, or tenability metric.

## Statistical Analysis

Adaptive Hybrid was compared against:

- Nearest Exit
- Static Shortest Path
- Congestion-Aware
- Hazard-Aware

Comparisons retained the common-random-number pairing across seeds.

The inferential analysis used:

- two-sided paired t-tests
- paired Cohen's dz effect sizes
- exact two-sided sign tests as a robustness check
- Holm family-wise correction across all 168 co-primary tests

The inferential plan was finalized after formal execution. It is therefore described as a post-execution multiplicity-controlled analysis rather than a preregistered confirmatory analysis.

## Main Findings

Evacuation time:

- Adaptive Hybrid significantly faster: 4 of 84 comparisons
- Adaptive Hybrid significantly slower: 18 of 84
- No corrected evidence: 33 of 84
- Exact ties: 29 of 84

Simulated hazard exposure:

- Adaptive Hybrid significantly lower exposure: 20 of 84 comparisons
- Adaptive Hybrid significantly higher exposure: 0
- No corrected evidence: 4 of 84
- Exact ties: 60 of 84

The clearest result is a speed-versus-exposure tradeoff.

There were 18 comparisons in which the comparator produced significantly shorter evacuation time while Adaptive Hybrid produced significantly lower simulated hazard exposure.

These tradeoffs occurred systematically in D1 Hazard and D4 Combined across LOW, MEDIUM, and HIGH occupancy against Nearest Exit, Static Shortest Path, and Congestion-Aware.

The magnitude of the exposure reduction generally increased with occupancy.

Adaptive Hybrid should therefore be interpreted as a safety-sensitive multi-objective routing strategy rather than a universally fastest evacuation strategy.

## Figures

- `figures/figure-1-significant-evacuation-time-effects.svg`
- `figures/figure-2-significant-hazard-exposure-effects.svg`
- `figures/figure-3-evacuation-hazard-tradeoff.svg`

## Data

The canonical 4,200-run CSV is:

`data/formal-combined-run-records.csv`

Descriptive summaries are also provided under `data/`.

## Analysis

Detailed paired and inferential outputs are under `analysis/`.

## Provenance

Formal manifests, analysis metadata, and integrity hashes are under `provenance/`.

The simulation environment is a fictional research building model and is not a certified life-safety system or validated digital twin of a real building.
