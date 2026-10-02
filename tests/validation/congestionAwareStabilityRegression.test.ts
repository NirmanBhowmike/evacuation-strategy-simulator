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

import type {
  Position2D,
  ScenarioInstance,
} from "../../src/types/scenario";
import type {
  SpawnZone,
} from "../../src/types/spawn";

function polygonCenter(
  zone: SpawnZone,
): Position2D {
  if (
    zone.polygon.vertices.length ===
    0
  ) {
    throw new Error(
      `Spawn zone ${zone.id} has no vertices.`,
    );
  }

  const total =
    zone.polygon.vertices.reduce(
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
      zone.polygon.vertices.length,

    y:
      total.y /
      zone.polygon.vertices.length,
  };
}

function createScenario():
  ScenarioInstance {
  const spawnZones =
    layoutASpawnZones.zones;

  if (
    spawnZones.length ===
    0
  ) {
    throw new Error(
      "Layout A requires spawn zones.",
    );
  }

  return {
    id:
      "congestion-aware-stability-regression",

    seed:
      1042,

    layoutId:
      "layout-a",

    parameterSetVersion:
      "congestion-aware-regression-v1",

    occupants:
      Array.from(
        {
          length: 36,
        },
        (
          _,
          index,
        ) => {
          const spawnZone =
            spawnZones[
              index %
              spawnZones.length
            ];

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

    disruptionSchedule: [],
  };
}

describe(
  "Congestion-Aware queue-commitment regression",
  () => {
    it("does not repeatedly reroute queued agents at the same node", () => {
      const result =
        runHeadlessSimulation({
          scenario:
            createScenario(),

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
              "CONGESTION_AWARE",

            timestepSeconds:
              0.05,

            maximumSimulationTimeSeconds:
              180,

            densityCellLengthMeters:
              1,

            specificFlowPersonsPerMeterSecond:
              1.3,
          },
        });

      /**
       * Before the node-visit review gate was introduced, five
       * agents remained at main-west for the entire run and the
       * strategy generated 17,946 accepted reroutes.
       */
      expect(
        result.metrics
          .completionRate,
      ).toBe(1);

      expect(
        result.metrics
          .timeoutAgents,
      ).toBe(0);

      expect(
        result.metrics
          .unreachableAgents,
      ).toBe(0);

      expect(
        result.routeStability
          .totalAcceptedReroutes,
      ).toBeLessThan(
        100,
      );

      for (
        const summary of
          result.routeStability
            .byAgent
      ) {
        expect(
          summary
            .acceptedReroutes,
        ).toBeLessThan(
          20,
        );
      }

      for (
        const agent of
          result.finalAgents
      ) {
        expect(
          agent.status,
        ).toBe(
          "EVACUATED",
        );
      }
    });
  },
);