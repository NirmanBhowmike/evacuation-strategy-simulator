# Documentation Index

This directory contains the research, methodological, validation, and development documentation for the **3D Emergency Evacuation Strategy Simulator**.

The quantitative simulation engine is treated as the authoritative research artifact. Documentation is maintained alongside the codebase so modeling decisions, assumptions, validation steps, and experimental conditions remain traceable.

## Core Documents

### `00-project-charter.md`
Original project purpose, scope, research question, and design principle. Early wording reflects the initial project stage; later versioned research files take precedence where the project evolved.

### `01-research-basis.md`
Research basis for quantitative model choices, parameter ranges, and methodological assumptions.

### `02-model-assumptions.md`
Modeling assumptions, boundaries, and interpretation limits.

### `03-decision-log.md`
Consequential research and engineering decisions and why they were made.

### `04-development-log.md`
Development-history record. This is being converted from an initial session-log template into a milestone-oriented project history.

### `05-validation-log.md`
Verification, validation, calibration, sensitivity tests, regression checks, and model-behavior investigations.

### `06-experiment-registry.md`
Formal and diagnostic experiment definitions and execution metadata.

### `07-time-log.md`
Time-tracking structure. Only directly supported time information should be recorded; time should not be reconstructed or invented retrospectively.

### `08-research-model-specification.md`
Historical Research Model Specification v1.0 and earlier Layout A configuration. Where historical values differ from current Architecture V2, the current versioned Architecture V2 parameter files and regression definitions are authoritative.

### `09-master-task-checklist.md`
Current master implementation and research checklist.

## Current Architecture V2 Research Configuration

Formal occupancy levels:

```text
LOW     = 14
MEDIUM  = 42
HIGH    = 70
```

Frozen disruption conditions:

```text
D0 = baseline
D1 = main-spine hazard at 12 s
D2 = south-central exit block at 18 s
D3 = main-central corridor block at 12 s
D4 = main-spine hazard at 12 s + south-central exit block at 18 s
```

Baseline numerical parameters:

```text
Timestep              = 0.05 s
Density cell baseline = 1.0 m
Specific flow         = 1.3 persons/m/s
Adaptive threshold    = 0.10
```

These conditions should not be silently modified. Any methodological change to a frozen formal condition should be documented and versioned.

## Research vs Demonstration Features

Formal research conditions are predefined, reproducible, controlled, and versioned.

Demonstration features are exploratory and presentation-oriented. Planned Interactive Demo Mode will allow manual disruption events but will remain explicitly separate from Research Mode.

## Reproducibility Principle

Formal comparisons use common random numbers:

```text
same scenario
+ same seed
+ same parameter set
→ comparable stochastic inputs
```

The routing strategy is then the experimental factor being compared.

## Documentation Authority

When project documents disagree because the system evolved over time, use this priority:

1. current versioned Architecture V2 research parameter implementation
2. current automated regression tests
3. current experiment configuration
4. current master task checklist
5. current validation documentation
6. historical Research Model v1.0 documents

Historical documents are retained intentionally to preserve development and calibration history.

## Software Verification

Stable checkpoints should pass:

```bash
npm test
npm run typecheck:all
npm run build
git diff --check
```

Formal execution should additionally preserve parameter-set version, seed, strategy, occupancy condition, disruption condition, experiment identifier, and software / Git provenance.

## Repository Navigation

```text
src/          simulation engine and application
 tests/       automated verification and validation
 experiments/ formal and diagnostic experiment runners
 research/    literature and parameter evidence
 results/     curated research outputs
```

## Documentation Policy

1. Historical research decisions are preserved rather than silently overwritten.
2. Current formal research conditions are versioned and reproducible.
3. Demonstration features are separated from formal research conditions.
4. Unsupported development-time or experimental claims are not reconstructed after the fact.
