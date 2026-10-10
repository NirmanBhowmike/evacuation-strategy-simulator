# Project Charter

## Project

**3D Emergency Evacuation Strategy Simulator: Experimental Evaluation of Adaptive Routing Strategies Under Dynamic Building Conditions**

The project evaluates evacuation-routing policies in a controlled fictional building model. The quantitative simulation engine is the research artifact; the 3D application is used to inspect and demonstrate authoritative simulation state.

## Research question

How do fixed and adaptive routing strategies differ when congestion, hazards, blocked exits, blocked corridors, and occupancy change during an evacuation?

## Formal design

```text
Strategies:            5
Occupancy levels:      3
Disruption conditions: 7
Replications per cell: 40
Factorial cells:       105
Paired scenarios:      840
Formal runs:           4,200
```

Occupancy levels:

```text
LOW     14
MEDIUM  42
HIGH    70
```

Formal conditions:

```text
D0  Baseline
D1  Main-spine hazard at 12 s
D2  South-central exit block at 18 s
D3  Main-central corridor block at 12 s
D4  Hazard at 12 s + south-central exit block at 18 s
D5  West exit block at 18 s
D6  East-main to southeast corridor block at 12 s
```

The five routing strategies are Nearest Exit, Static Shortest Path, Congestion-Aware, Hazard-Aware, and Adaptive Hybrid.

## Current formal status

All 4,200 v1.2 formal runs completed with no timeout and no unreachable-present outcome.

```text
Software version:  1.2.0
Formal Git commit: 1a84923664c028f3b6b15c5ec93ddaf9b7905095
Design:            architecture-v2-formal-factorial-v3
Parameter set:     architecture-v2-research-v1.2-frozen
Seed bank:         architecture-v2-formal-seed-bank-v1
```

The formal execution commit remains the provenance point for the dataset even though later commits added analysis artifacts, deployment support, browser safeguards, responsive presentation, and documentation.

## Research boundary

The building is fictional and is not a digital twin of a real facility.

Hazard exposure is simulated time spent in regions classified as `RISK`, reported in person-seconds. It is not a measure of injury, mortality, FED, smoke dose, or certified tenability.

The software is research software. It is not a certified life-safety or emergency-control system.