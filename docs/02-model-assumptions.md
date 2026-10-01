# Model Assumptions

## Purpose

This document records assumptions introduced into the evacuation model. Each assumption should remain visible so that implementation convenience is not mistaken for empirical evidence.

## A-001: Experimental Building

The simulated building will be fictional and designed specifically for controlled routing experiments.

It will resemble a realistic institutional or academic building but will not represent an exact real facility.

Status: Locked

Reason:
The research concerns evacuation-routing strategies rather than architectural reconstruction.

## A-002: Primary Population

Research Model v1.0 will initially represent a general ambulatory adult pedestrian population.

Special populations such as children, mobility-impaired occupants, wheelchair users, and explicitly elderly populations will not be included in the primary experiment.

Status: Locked for primary experiment

Reason:
Each additional population would require separate empirical movement and behavioral assumptions.

## A-003: Free-Flow Speed

Baseline desired walking speeds will initially follow a normal distribution with:

Mean = 1.34 m/s
SD = 0.26 m/s

Status: Baseline selected; implementation bounds pending

Limitation:
This is a benchmark distribution and does not represent every population or context.

## A-004: Pre-Evacuation Delay

Primary routing experiments will use a pre-evacuation delay of 0 s.

Status: Locked for primary experiment

Reason:
The purpose is to isolate routing and movement effects.

Limitation:
Real occupants may have substantial and heterogeneous response delays.

## A-005: Congestion

Walking speed will decrease as local pedestrian density increases.

The Weidmann fundamental diagram will be the baseline density-speed relationship.

Status: Baseline locked

Limitation:
Pedestrian fundamental diagrams vary among populations, geometries, and measurement methods.

## A-006: Density Discretization

Corridor density will initially be calculated using 1.0 m longitudinal spatial cells.

Status: Provisional

Sensitivity:
0.5 m and 2.0 m cells will also be tested.

## A-007: Bottleneck Capacity

Baseline specific bottleneck flow will initially be 1.3 persons/(m*s).

Sensitivity cases will include:

1.6 persons/(m*s)
1.9 persons/(m*s)

Status: Provisional baseline with required sensitivity analysis

## A-008: Occupant Width

Nominal occupant shoulder width will initially be approximately 0.456 m.

Status: Baseline selected

Purpose:
Spacing, doorway admission, overlap prevention, and visual scale.

## A-009: Local Movement

A full Social Force Model will not be used in the primary research engine.

Local motion will combine route following, physical footprint, overlap prevention, density-sensitive speed, and bottleneck constraints.

Status: Architectural decision locked

Implementation details:
Pending.

## A-010: Hazard Physics

Hazards will be represented as abstract dynamic risk and route-availability conditions.

The model will not predict:

- fire spread
- smoke movement
- temperature
- toxic gas concentration
- visibility
- injury probability

Status: Locked

## A-011: Timestep

Nominal timestep:

dt = 0.05 s

Status: Provisional

Required validation:
Compare against 0.025 s and 0.10 s before freezing.

## A-012: Determinism and Randomness

All stochastic behavior used in formal experiments will be driven by recorded pseudorandom seeds.

The same scenario seed will be used when comparing routing strategies.

Status: Locked

## A-013: Model Purpose

The software is an experimental evacuation-routing simulator.

It is not intended for:

- regulatory evacuation certification
- life-safety approval
- operational emergency planning
- prediction of injury or mortality
- exact representation of a particular real building

Status: Locked