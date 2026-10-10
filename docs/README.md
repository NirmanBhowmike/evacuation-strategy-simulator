# Project Documentation

The files in this directory record how the research model was built, changed, tested, and frozen. They are not all snapshots of the same version. Older documents are retained where they help explain the development path.

For current numerical results, start with [`../results/formal-v1.2/README.md`](../results/formal-v1.2/README.md).

## Document map

| File | Role | Status |
|---|---|---|
| `00-project-charter.md` | original scope and research direction | historical foundation |
| `01-research-basis.md` | literature and parameter basis | supporting research record |
| `02-model-assumptions.md` | assumptions and interpretation boundaries | supporting research record |
| `03-decision-log.md` | consequential engineering and research decisions | development record |
| `04-development-log.md` | implementation history | development record |
| `05-validation-log.md` | verification, regression, and production validation | current |
| `06-experiment-registry.md` | experiment definitions and provenance | research record |
| `07-time-log.md` | recorded development-time information | project record |
| `08-research-model-specification.md` | earlier Research Model v1.0 specification | historical |
| `09-master-task-checklist.md` | current completion state and remaining deliverables | current |

## Current formal configuration

```text
Software version:       1.2.0
Formal execution SHA:   1a84923664c028f3b6b15c5ec93ddaf9b7905095
Parameter set:          architecture-v2-research-v1.2-frozen
Design:                 architecture-v2-formal-factorial-v3
Seed bank:              architecture-v2-formal-seed-bank-v1

Strategies:             5
Occupancy levels:       3
Conditions:             D0-D6
Replications per cell:  40
Factorial cells:        105
Paired scenarios:       840
Formal runs:            4,200
```

All 4,200 runs completed. No formal v1.2 run ended with timeout or an unreachable occupant present.

Occupancy levels are 14, 42, and 70 occupants.

The seven formal disruption conditions are:

```text
D0  Baseline
D1  Main-spine hazard
D2  South-central exit block
D3  Main-central corridor block
D4  Hazard + south-central exit block
D5  West exit block
D6  East-main to southeast corridor block
```

Frozen event times remain 12 s for hazard/corridor events and 18 s for exit blocks.

## Which source is authoritative?

Where historical documents differ from the current model, use this order:

1. versioned source code at the formal execution commit
2. frozen v1.2 parameter and experiment definitions
3. automated regression tests
4. formal result manifests and provenance files
5. current validation and project-status documentation
6. older research-model documents

## Research and demonstration features

Research Mode is tied to the controlled D0-D6 configuration.

Demo Mode permits manual disruption sequences for software demonstrations. Those events do not become formal research conditions merely because the same simulation engine executes them.

## Verification checkpoint

```text
66 passing test files
455 passing tests
TypeScript validation passed
Production build passed
```

Production application:

https://evacuation-strategy-simulator.nirman-bhowmike.workers.dev

Desktop is the reference interface. Responsive phone support is included, with landscape preferred for detailed mobile inspection.

## Documentation rule

Record what was actually done. Do not reconstruct unsupported experiment dates, run times, parameter choices, or validation outcomes after the fact.

Historical material can remain in the repository, but current status pages should state clearly when a value or design has been superseded.