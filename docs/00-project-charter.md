# Project Charter

## Project Title

**3D Emergency Evacuation Strategy Simulator: Experimental Evaluation of Adaptive Routing Strategies Under Dynamic Building Conditions**

## Purpose

Develop a research-oriented simulation platform for comparing fixed and adaptive evacuation-routing strategies under controlled, reproducible, and dynamically changing building conditions.

## Central Research Question

How do fixed and adaptive evacuation-routing strategies differ in performance when congestion, hazards, exit availability, occupancy, and route conditions change during an evacuation?

## Core Design Principle

The quantitative simulation and experimental engine is the authoritative research artifact.

The 3D interface visualizes authoritative simulation state and results. It does not independently determine research outcomes.

## Current Routing Strategies

The simulator implements five routing strategies:

1. Nearest Exit
2. Static Shortest Path
3. Congestion-Aware
4. Hazard-Aware
5. Adaptive Hybrid

## Current Research Environment

The current research model uses **Architecture V2**, a fictional first-floor institutional / academic building designed to provide:

- multiple building wings
- four exterior exits
- alternative circulation paths
- bottlenecks
- tactical decision points
- room-origin occupant movement
- configurable hazards
- corridor blocks
- exit failures

The building is intentionally fictional and is not presented as a digital twin of a real facility.

## Formal Occupancy Levels

```text
LOW     = 14
MEDIUM  = 42
HIGH    = 70