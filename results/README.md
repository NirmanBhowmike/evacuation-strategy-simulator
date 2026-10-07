# Research Results Directory

This directory is reserved for reproducible research outputs produced by the evacuation simulation and experiment infrastructure. It should not be used as a general temporary-output folder.

## Intended Contents

Research artifacts may include:

- experiment summaries
- CSV result tables
- configuration snapshots
- parameter-set metadata
- seed records
- aggregated metrics
- formal comparison outputs
- sensitivity-analysis outputs
- diagnostic experiment outputs

Each retained result should be traceable to the configuration that generated it.

## Minimum Provenance

Formal outputs should preserve, where applicable:

```text
experiment identifier
software / Git version
parameter-set version
routing strategy
occupancy level
disruption condition
random seed
replication identifier
execution configuration
```

## Result Classes

### Formal
Outputs generated from frozen research conditions and the designated formal seed set. These may be used for the primary experimental analysis.

### Diagnostic
Outputs generated for debugging, calibration, profiling, model inspection, or software verification. They should not be presented as formal study findings unless incorporated into a documented protocol.

### Development
Temporary outputs produced during implementation or debugging. These generally should not be retained unless they provide meaningful methodological evidence.

## Current Formal Design

```text
5 routing strategies
× 3 occupancy levels
× 5 disruption conditions
× 40 paired stochastic replications
```

Routing strategies:

```text
Nearest Exit
Static Shortest Path
Congestion-Aware
Hazard-Aware
Adaptive Hybrid
```

Occupancy levels:

```text
LOW     = 14
MEDIUM  = 42
HIGH    = 70
```

Frozen disruption factor:

```text
D0 = baseline
D1 = hazard
D2 = exit block
D3 = corridor block
D4 = combined hazard + exit block
```

Formal comparisons use common random numbers so the same stochastic scenario realization is presented to each strategy.

## Interpretation

Outputs are simulation results and should be interpreted within the model assumptions, parameterization, and validation scope documented in the repository.

Hazard exposure represents simulated time spent in regions classified as `RISK`; it is not a physiological injury or mortality metric.

## Repository Policy

Large temporary run directories, redundant generated files, and untraceable outputs should not be committed. Curated research artifacts should be retained only when they contribute to reproducibility, validation, analysis, methodological transparency, or presentation of formal results.
