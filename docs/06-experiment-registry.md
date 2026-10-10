# Experiment Registry

## Purpose

This document records formal and developmental simulation experiments so that results can be reproduced from the code version, parameter set, scenario definition, and random seed.

# Experiment Types

DEV:
Development or debugging experiment.

CAL:
Calibration experiment.

SENS:
Sensitivity experiment.

FORMAL:
Frozen formal experiment.

HOLDOUT:
Holdout-layout evaluation.

# Experiment Record

Experiment ID:

Experiment Type:

Research Question:

Date:

Software Git Commit:

Parameter Set Version:

Layout ID:

Scenario Family:

Occupancy Condition:

Disruption Condition:

Routing Strategy:

Adaptive Threshold:

ScenarioInstance ID:

Random Seed:

Replications:

Convergence Status:

Dependent Variables:

Output Directory:

Run Status:

Notes:

# Formal Run Fields

Each formal run should preserve:

- experimentId
- experimentType
- scenarioInstanceId
- seed
- layoutId
- occupancyCondition
- disruptionCondition
- strategy
- softwareCommit
- parameterSetVersion
- adaptiveThreshold
- totalEvacuationTime
- p95EvacuationTime
- hazardExposure
- maximumDensity
- queueExposure
- completionRate
- unreachableCount
- rerouteCount
- routeReversalCount
- exitUtilization
- computationTime
- runStatus

# Run Status Values

PLANNED

RUNNING

COMPLETED

UNREACHABLE_PRESENT

TIMEOUT

FAILED

# Reproducibility Requirement

A formal experiment must contain enough information to reproduce:

- building configuration
- population realization
- disruption schedule
- strategy
- model parameters
- software version
- random seed

## Registered formal experiment: Architecture V2 v1.2

```text
Experiment Type:       FORMAL
Design ID:             architecture-v2-formal-factorial-v3
Software Git Commit:   1a84923664c028f3b6b15c5ec93ddaf9b7905095
Software Version:      1.2.0
Parameter Set:         architecture-v2-research-v1.2-frozen
Seed Bank:             architecture-v2-formal-seed-bank-v1
Seeds:                 100001-100040
Strategies:            5
Occupancy Conditions:  3
Disruption Conditions: 7
Replications/Cell:     40
Factorial Cells:       105
Paired Scenarios:      840
Runs:                  4,200
Run Status:            4,200 COMPLETED
Timeout:               0
Unreachable Present:   0
Public Results:        results/formal-v1.2/
```

The dataset was executed in four batches of 1,050 runs and merged only after batch-level validation.

Formal comparisons preserve common random numbers across strategies.
