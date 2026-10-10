# Architecture V2 v1.2 Formal Results

This directory contains the curated result package for the completed D0-D6 formal experiment.

## Dataset

```text
5 routing strategies
3 occupancy levels
7 disruption conditions
40 paired replications per cell

105 factorial cells
840 common-random-number scenario pairs
4,200 simulation runs
```

Execution status:

```text
COMPLETED:             4,200
UNREACHABLE_PRESENT:   0
TIMEOUT:               0
```

Formal provenance:

```text
Software version:  1.2.0
Git commit:        1a84923664c028f3b6b15c5ec93ddaf9b7905095
Design:            architecture-v2-formal-factorial-v3
Parameter set:     architecture-v2-research-v1.2-frozen
Seed bank:         architecture-v2-formal-seed-bank-v1
```

The formal execution commit is the provenance point for the dataset. Later repository commits do not change that provenance.

## Conditions

| ID | Condition |
|---|---|
| D0 | Baseline |
| D1 | Hazard |
| D2 | Exit Block |
| D3 | Corridor Block |
| D4 | Hazard + Exit Block |
| D5 | West Exit Block |
| D6 | East-Main to Southeast Corridor Block |

## Primary outcomes

Two outcomes were treated as co-primary:

1. total evacuation time, seconds
2. population simulated hazard exposure, person-seconds

`hazard exposure` is simulated time spent in regions classified as `RISK`. It is not a physiological dose, injury probability, mortality measure, smoke dose, FED, or certified tenability metric.

## Analysis

Adaptive Hybrid was compared with Nearest Exit, Static Shortest Path, Congestion-Aware, and Hazard-Aware. Seed pairing was retained throughout.

Inferential procedure:

```text
paired two-sided t-test
paired Cohen's dz
exact two-sided sign test as a sensitivity check
Holm family-wise correction across 168 co-primary tests
```

The inferential plan was finalized after formal execution. The analysis is therefore described as post-execution multiplicity-controlled analysis rather than preregistered confirmatory testing.

## Result summary

### Evacuation time

Across 84 Adaptive-versus-comparator comparisons:

```text
Adaptive significantly faster:   4
Adaptive significantly slower:  18
No corrected evidence:          33
Exact ties:                     29
```

### Simulated hazard exposure

```text
Adaptive significantly lower:   20
Adaptive significantly higher:   0
No corrected evidence:           4
Exact ties:                      60
```

The clearest pattern is a speed-exposure tradeoff.

Eighteen comparisons show a significantly faster comparator together with significantly lower simulated hazard exposure for Adaptive Hybrid. All 18 occur in D1 or D4 across LOW, MEDIUM, and HIGH occupancy against Nearest Exit, Static Shortest Path, and Congestion-Aware.

Exposure reductions generally become larger as occupancy increases.

Adaptive Hybrid is best interpreted as a safety-sensitive multi-objective strategy. The results do not support describing it as the universally fastest routing policy.

Some statistically significant evacuation-time differences are very small in absolute magnitude. Statistical evidence and practical magnitude should be reported separately.

## Files

Canonical run-level data:

```text
data/formal-combined-run-records.csv
```

Descriptive summaries:

```text
data/primary-cell-descriptives.csv
data/primary-overall-strategy-descriptives.csv
```

Paired and inferential outputs:

```text
analysis/adaptive-paired-difference-summary.csv
analysis/adaptive-significantly-faster.csv
analysis/adaptive-significantly-lower-hazard.csv
analysis/adaptive-significantly-slower.csv
analysis/explicit-speed-hazard-tradeoffs.csv
analysis/joint-pattern-counts.csv
analysis/paired-inferential-joint-summary.csv
analysis/paired-inferential-results.csv
```

Figures:

```text
figures/figure-1-significant-evacuation-time-effects.svg
figures/figure-2-significant-hazard-exposure-effects.svg
figures/figure-3-evacuation-hazard-tradeoff.svg
```

Provenance and integrity records:

```text
provenance/analysis-readiness.json
provenance/analysis-stage-b-summary.json
provenance/formal-combined-manifest.json
provenance/formal-combined-sha256.txt
package-sha256.txt
```

Raw batch execution folders are preserved separately from the public repository.

## Scope

The results belong to the implemented fictional building model and the frozen v1.2 assumptions. They are research simulation results, not certification evidence for a real building or operational life-safety system.