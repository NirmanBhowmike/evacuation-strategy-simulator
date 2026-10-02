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