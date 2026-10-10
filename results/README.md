# Research Results

The current formal result package is under [`formal-v1.2/`](formal-v1.2/).

## Current experiment

```text
Strategies:            5
Occupancy levels:      3
Disruption conditions: 7
Replications per cell: 40
Factorial cells:       105
Paired scenarios:      840
Total runs:            4,200
Completed:             4,200
Timeout:               0
Unreachable present:   0
```

The formal comparison uses common random numbers so each routing strategy receives the same stochastic scenario realization for a given pair key.

Conditions are D0 Baseline, D1 Hazard, D2 Exit Block, D3 Corridor Block, D4 Hazard + Exit Block, D5 West Exit Block, and D6 East-Main to Southeast Corridor Block.

## Historical dataset

The corrected v1.1 experiment used D0-D4 only:

```text
75 cells
600 paired scenarios
3,000 runs
```

It remains historical evidence and must not be substituted for the current D0-D6 v1.2 dataset.

## Interpretation boundary

Hazard exposure is simulated time in `RISK` regions, reported in person-seconds. It is not injury probability, smoke dose, mortality probability, FED, physiological tenability, or a certification metric.

The building is fictional.

## Repository policy

The repository retains curated formal data, summaries, statistical outputs, figures, provenance, and integrity records. Raw batch directories and redundant generated artifacts remain outside the public repository.