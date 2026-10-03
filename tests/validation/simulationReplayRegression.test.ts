import {
  describe,
  expect,
  it,
} from "vitest";

import {
  runHeadlessSimulation,
} from "../../src/core/runHeadlessSimulation";

import {
  layoutA,
} from "../../src/environment/layoutA";

import {
  layoutAExits,
} from "../../src/environment/layoutAExits";

import {
  layoutANavigationGraph,
} from "../../src/environment/layoutANavigationGraph";

import {
  layoutASpawnZones,
} from "../../src/environment/layoutASpawnZones";

import {
  getResearchDisruptionCondition,
  RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
  RESEARCH_DENSITY_CELL_LENGTH_METERS,
  RESEARCH_OCCUPANCY,
  RESEARCH_PARAMETER_SET_VERSION,
  RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,
  RESEARCH_TIMESTEP_SECONDS,
} from "../../src/scenario/researchParameterSet";

import type {
  Position2D,
  ScenarioInstance,
} from "../../src/types/scenario";

import type {
  SimulationReplayFrame,
} from "../../src/types/simulationReplay";

import type {
  SpawnZone,
} from "../../src/types/spawn";

function polygonCenter(
  zone:
    SpawnZone,
): Position2D {
  const vertices =
    zone.polygon.vertices;

  if (
    vertices.length ===
    0
  ) {
    throw new Error(
      `Spawn zone ${zone.id} has no vertices.`,
    );
  }

  const total =
    vertices.reduce(
      (
        accumulator,
        vertex,
      ) => ({
        x:
          accumulator.x +
          vertex.x,

        y:
          accumulator.y +
          vertex.y,
      }),
      {
        x: 0,
        y: 0,
      },
    );

  return {
    x:
      total.x /
      vertices.length,

    y:
      total.y /
      vertices.length,
  };
}

function createScenario(
  conditionId:
    "D0_BASELINE" |
    "D4_COMBINED",
): ScenarioInstance {
  const condition =
    getResearchDisruptionCondition(
      conditionId,
    );

  const occupantCount =
    RESEARCH_OCCUPANCY.LOW;

  return {
    id:
      `replay-regression-${conditionId}`,

    seed:
      1042,

    layoutId:
      layoutA.layoutId,

    parameterSetVersion:
      RESEARCH_PARAMETER_SET_VERSION,

    occupants:
      Array.from(
        {
          length:
            occupantCount,
        },
        (
          _,
          index,
        ) => {
          const spawnZone =
            layoutASpawnZones
              .zones[index];

          if (!spawnZone) {
            throw new Error(
              "Unable to select Layout A spawn zone.",
            );
          }

          return {
            id:
              `agent-${String(
                index + 1,
              ).padStart(
                4,
                "0",
              )}`,

            spawnPosition:
              polygonCenter(
                spawnZone,
              ),

            desiredSpeedMps:
              1.34,
          };
        },
      ),

    disruptionSchedule:
      condition.events,
  };
}

function createInput(
  scenario:
    ScenarioInstance,
) {
  return {
    scenario,

    environment:
      layoutA,

    graph:
      layoutANavigationGraph,

    exits:
      layoutAExits,

    spawnZones:
      layoutASpawnZones,

    configuration: {
      strategyId:
        "ADAPTIVE_HYBRID" as const,

      timestepSeconds:
        RESEARCH_TIMESTEP_SECONDS,

      maximumSimulationTimeSeconds:
        180,

      densityCellLengthMeters:
        RESEARCH_DENSITY_CELL_LENGTH_METERS,

      specificFlowPersonsPerMeterSecond:
        RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,

      adaptiveRerouteThreshold:
        RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
    },
  };
}

describe(
  "Simulation replay observer regression",
  () => {
    it(
      "does not change the authoritative headless result",
      () => {
        const scenario =
          createScenario(
            "D0_BASELINE",
          );

        const baseline =
          runHeadlessSimulation(
            createInput(
              scenario,
            ),
          );

        const frames:
          SimulationReplayFrame[] =
          [];

        const observed =
          runHeadlessSimulation({
            ...createInput(
              scenario,
            ),

            replayIntervalSeconds:
              0.10,

            replayObserver:
              (
                frame,
              ) => {
                frames.push(
                  frame,
                );
              },
          });

        expect(
          observed,
        ).toEqual(
          baseline,
        );

        expect(
          frames.length,
        ).toBeGreaterThan(
          1,
        );

        expect(
          frames[0]
            ?.snapshot
            .simulationTimeSeconds,
        ).toBe(
          0,
        );

        const finalFrame =
          frames[
            frames.length -
              1
          ];

        expect(
          finalFrame
            ?.snapshot
            .simulationTimeSeconds,
        ).toBe(
          observed
            .simulatedTimeSeconds,
        );

        expect(
          finalFrame
            ?.isTerminal,
        ).toBe(true);
      },
    );

    it(
      "captures the frozen D4 disruption instants exactly",
      () => {
        const frames:
          SimulationReplayFrame[] =
          [];

        runHeadlessSimulation({
          ...createInput(
            createScenario(
              "D4_COMBINED",
            ),
          ),

          replayIntervalSeconds:
            0.10,

          replayObserver:
            (
              frame,
            ) => {
              frames.push(
                frame,
              );
            },
        });

        const hazardFrame =
          frames.find(
            (
              frame,
            ) =>
              Math.abs(
                frame
                  .snapshot
                  .simulationTimeSeconds -
                  6.65,
              ) <
              1e-9,
          );

        const exitBlockFrame =
          frames.find(
            (
              frame,
            ) =>
              Math.abs(
                frame
                  .snapshot
                  .simulationTimeSeconds -
                  13.25,
              ) <
              1e-9,
          );

        expect(
          hazardFrame,
        ).toBeDefined();

        expect(
          exitBlockFrame,
        ).toBeDefined();

        expect(
          hazardFrame
            ?.triggeredDisruptions
            .some(
              (
                event,
              ) =>
                event.type ===
                  "HAZARD_ACTIVATE" &&
                event.targetId ===
                  "corridor-main-spine",
            ),
        ).toBe(true);

        expect(
          hazardFrame
            ?.snapshot
            .hazardZones
            .find(
              (
                zone,
              ) =>
                zone.zoneId ===
                "corridor-main-spine",
            )
            ?.state,
        ).toBe(
          "RISK",
        );

        expect(
          exitBlockFrame
            ?.triggeredDisruptions
            .some(
              (
                event,
              ) =>
                event.type ===
                  "EXIT_BLOCK" &&
                event.targetId ===
                  "exit-south-central",
            ),
        ).toBe(true);

        expect(
          exitBlockFrame
            ?.snapshot
            .blockedExitIds,
        ).toContain(
          "exit-south-central",
        );
      },
    );

    it(
      "produces monotonic detached replay frames with routes and live metrics",
      () => {
        const frames:
          SimulationReplayFrame[] =
          [];

        const result =
          runHeadlessSimulation({
            ...createInput(
              createScenario(
                "D4_COMBINED",
              ),
            ),

            replayIntervalSeconds:
              0.10,

            replayObserver:
              (
                frame,
              ) => {
                frames.push(
                  frame,
                );
              },
          });

        expect(
          frames.length,
        ).toBeGreaterThan(
          10,
        );

        for (
          let index = 1;
          index <
          frames.length;
          index += 1
        ) {
          expect(
            frames[index]!
              .snapshot
              .simulationTimeSeconds,
          ).toBeGreaterThan(
            frames[
              index -
                1
            ]!
              .snapshot
              .simulationTimeSeconds,
          );
        }

        const first =
          frames[0]!;

        expect(
          first.metrics
            .totalAgents,
        ).toBe(
          RESEARCH_OCCUPANCY
            .LOW,
        );

        expect(
          first.routes.length,
        ).toBe(
          RESEARCH_OCCUPANCY
            .LOW,
        );

        expect(
          first.routes.some(
            (
              route,
            ) =>
              route
                .edgeIds
                .length >
              0,
          ),
        ).toBe(true);

        expect(
          Object.isFrozen(
            first,
          ),
        ).toBe(true);

        expect(
          Object.isFrozen(
            first.routes,
          ),
        ).toBe(true);

        expect(
          Object.isFrozen(
            first.metrics,
          ),
        ).toBe(true);

        const final =
          frames[
            frames.length -
              1
          ]!;

        expect(
          final.isTerminal,
        ).toBe(true);

        expect(
          final
            .snapshot
            .simulationTimeSeconds,
        ).toBe(
          result
            .simulatedTimeSeconds,
        );
      },
    );
  },
);