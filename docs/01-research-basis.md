# Research Basis

## Purpose

This document records the published evidence used to define the quantitative evacuation model. Numerical values should not be treated as literature-supported unless their basis is recorded here or in the parameter-evidence directory.

## Research Pass 1: Pedestrian Movement and Flow

### 1. Modeling Approach

The simulator will use a hybrid agent-based and graph-based architecture.

Each occupant will remain an individual simulated agent. Tactical decisions such as route and exit selection will occur on a navigation graph. Operational movement will use continuous agent positions with walking speed affected by local pedestrian density and bottleneck conditions.

A full Social Force Model will not be used as the primary movement model. The main research question concerns routing and adaptive rerouting. Introducing a highly parameterized force model would add additional calibration requirements and could make routing effects harder to isolate.

### 2. Free-Flow Walking Speed

A widely used benchmark for unrestricted pedestrian walking is a normally distributed desired speed with:

Mean = 1.34 m/s
Standard deviation = 0.26 m/s

The baseline model will therefore begin with:

v0 ~ N(1.34, 0.26^2) m/s

The distribution should be bounded to prevent unrealistic simulated values. The exact implementation bounds will be confirmed before Research Model Specification v1.0 is frozen.

This distribution represents a benchmark general pedestrian population. It is not assumed to represent every age group, culture, mobility condition, or emergency behavior.

### 3. Density-Speed Relationship

The baseline congestion model will use the Weidmann pedestrian fundamental diagram:

v(rho) = 1.34 * [1 - exp(-1.913 * (1/rho - 1/5.4))]

for pedestrian density between zero and the model jam density.

The model uses approximately:

Free-flow speed = 1.34 m/s
Jam density = 5.4 persons/m^2
Shape parameter = 1.913

For heterogeneous agents, the density reduction term will be applied relative to each agent's assigned free-flow walking speed rather than forcing every occupant to use the same unrestricted speed.

The Weidmann relationship will be treated as the baseline rather than as a universal law. Sensitivity testing will be used where model conclusions may depend on the selected fundamental diagram.

### 4. Local Density

Local corridor density will initially be calculated using spatial cells along the movement network:

rho_c(t) = N_c(t) / A_c

where:

rho_c = pedestrian density in cell c
N_c = number of occupants in the cell
A_c = usable area of the cell

A nominal longitudinal cell length of 1.0 m is proposed for the first implementation.

Cell lengths of 0.5 m and 2.0 m will be examined during numerical sensitivity testing before this parameter is frozen.

The cell length is a numerical modeling choice rather than a human-behavior constant.

### 5. Bottlenecks and Doorways

Doorways and narrow connectors will be treated as explicit flow constraints.

Published pedestrian-flow studies report variation in specific bottleneck capacity. Therefore, the simulator should not assume that one specific-flow value is universally correct.

The provisional design is:

Baseline specific flow = 1.3 persons/(m*s)

Sensitivity cases:
1.6 persons/(m*s)
1.9 persons/(m*s)

For an opening with usable width W:

Q = q_s * W

where:

Q = estimated service capacity in persons/s
q_s = selected specific-flow parameter
W = usable opening width

The baseline and sensitivity values must be revisited during model validation.

### 6. Occupant Physical Footprint

A nominal occupant shoulder width of approximately 0.456 m will be used as an initial body-footprint parameter for spacing, doorway admission, collision prevention, and visualization.

This value is consistent with the default cylindrical occupant diameter documented by Pathfinder.

The footprint will not be used to create a separate force-based behavioral model.

### 7. Pre-Evacuation Time

The primary routing experiments will use:

Pre-evacuation delay = 0 s

This is a deliberate experimental control.

Pre-evacuation behavior is an important component of real evacuation modeling, but including heterogeneous response delays in the primary experiment would make it harder to isolate the effect of routing strategy.

Distributed pre-evacuation time may be studied later as a secondary experiment.

### 8. Simulation Timestep

A fixed simulation timestep is required.

Provisional value:

dt = 0.05 s

Numerical comparison values:

dt = 0.025 s
dt = 0.10 s

The 0.05 s value is not yet frozen.

The timestep will be accepted only if convergence testing shows that reducing the step to 0.025 s does not materially alter the primary experimental outputs.

### 9. Collision and Local Movement

The primary model will not use a full Social Force Model.

Local movement will instead combine:

- route following
- occupant physical footprint
- minimum-spacing / overlap prevention
- density-dependent walking speed
- bottleneck admission limits

The exact local overlap-resolution algorithm remains an implementation item and must be verified independently.

### 10. Verification and Validation

Movement-model validation should include at minimum:

- single-agent travel-time tests
- free-flow speed tests
- density-speed consistency tests
- doorway and bottleneck throughput tests
- blocked-route tests
- same-seed reproducibility tests
- timestep convergence tests
- high-density boundary-condition tests

The model should be evaluated component by component rather than accepted because the animation appears realistic.

## Key Sources

1. Ulrich Weidmann. Transporttechnik der Fussgänger. ETH Zürich. DOI: 10.3929/ethz-a-000687810.

2. Ronchi, E., Kuligowski, E., Reneke, P., Peacock, R., and Nilsson, D. The Process of Verification and Validation of Building Fire Evacuation Models. NIST Technical Note 1822. DOI: 10.6028/NIST.TN.1822.

3. JuPedSim documentation. Simulation API and pedestrian-model documentation. Used as a contemporary reference for pedestrian-simulation architecture and numerical timestep practice.

4. Pathfinder documentation. Occupant characteristics. Used as a reference for the nominal 45.58 cm occupant shoulder-width parameter.

## Status

Research Pass 1 completed.

Some parameters remain provisional until numerical and sensitivity testing:

- simulation timestep
- density-cell length
- bottleneck specific flow
- exact local overlap-resolution implementation