# Research Results

This directory contains curated research outputs from the 3D Emergency Evacuation Strategy Simulator.

## Current Formal Experiment

The current formal results are stored in:

`results/formal-v1.2/`

The Architecture V2 v1.2 formal design contains:

- 5 routing strategies
- 3 occupancy levels
- 7 disruption conditions
- 40 paired stochastic replications
- 105 factorial cells
- 840 paired stochastic scenarios
- 4,200 total simulation runs

All 4,200 formal simulations completed successfully with no timeout or unreachable-present outcomes.

Current disruption conditions:

- D0 — Baseline
- D1 — Hazard
- D2 — Exit Block
- D3 — Corridor Block
- D4 — Combined Hazard + Exit Block
- D5 — West Exit Block
- D6 — East-Main to Southeast Corridor Block

Formal comparisons use common random numbers so the same stochastic scenario realization is presented to each routing strategy.

## Historical Formal Experiment

The earlier Architecture V2 v1.1 experiment evaluated D0–D4 only:

- 5 strategies
- 3 occupancy levels
- 5 conditions
- 40 replications
- 75 cells
- 600 paired scenarios
- 3,000 corrected formal runs

Those results are historical and must not be substituted for the current D0–D6 v1.2 experiment.

## Interpretation Boundary

Hazard exposure represents simulated time spent in regions classified as `RISK`, reported in person-seconds.

It is not:

- injury probability
- smoke dose
- mortality probability
- physiological tenability
- a real-world safety certification metric

The building environment is a fictional research layout rather than a digital twin of a specific real building.

## Repository Policy

Curated formal results, summary tables, statistical outputs, figures, provenance metadata, and reproducibility records may be retained in this directory.

Temporary run directories and redundant generated artifacts should remain outside the repository.
