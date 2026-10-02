import {
  describe,
  expect,
  it,
} from "vitest";

import {
  findShortestPathDijkstra,
} from "../../src/core/dijkstra";
import {
  DynamicDisruptionController,
} from "../../src/core/DynamicDisruptionController";
import {
  HazardField,
} from "../../src/core/HazardField";
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
  RoutingStrategyId,
} from "../../src/types/routingStrategy";
import type {
  SpawnZone,
} from "../../src/types/spawn";

const BLOCKABLE_ZONE_ID =
  "corridor-main-east-blockable";

const BLOCKABLE_EDGE_ID =
  "edge-main-east-end";

const BLOCK_TIME_SECONDS =
  6.65;

const OCCUPANT_COUNT =
  36;

const STRATEGIES:
  readonly RoutingStrategyId[] =
[
  "NEAREST_EXIT",
  "STATIC_SHORTEST_PATH",
  "CONGESTION_AWARE",
  "HAZARD_AWARE",
  "ADAPTIVE_HYBRID",
];

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

function createBlockedScenario(
  activationTimeSeconds:
    number,
  withOccupants:
    boolean,
): ScenarioInstance {
  const occupants =
    withOccupants
      ? Array.from(
          {
            length:
              OCCUPANT_COUNT,
          },
          (
            _,
            index,
          ) => {
            const spawnZone =
              layoutASpawnZones
                .zones[
                  index %
                  layoutASpawnZones
                    .zones
                    .length
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
        )
      : [];

  return {
    id:
      `permanent-corridor-block-${activationTimeSeconds}`,

    seed:
      1042,

    layoutId:
      "layout-a",

    parameterSetVersion:
      "corridor-block-permanent-v1",

    occupants,

    disruptionSchedule: [
      {
        id:
          "block-main-east-segment",

        type:
          "CORRIDOR_BLOCK",

        activationTimeSeconds,

        targetId:
          BLOCKABLE_ZONE_ID,
      },
    ],
  };
}

describe(
  "Permanent Layout A corridor-block segment",
  () => {
    it("maps exactly the intended main-east edge to the blockable zone", () => {
      const zone =
        layoutA.zones.find(
          (
            candidate,
          ) =>
            candidate.id ===
            BLOCKABLE_ZONE_ID,
        );

      expect(
        zone,
      ).toBeDefined();

      expect(
        zone?.type,
      ).toBe(
        "CORRIDOR",
      );

      const edgesUsingZone =
        layoutANavigationGraph
          .edges
          .filter(
            (
              edge,
            ) =>
              edge.zoneId ===
              BLOCKABLE_ZONE_ID,
          );

      expect(
        edgesUsingZone,
      ).toHaveLength(
        1,
      );

      expect(
        edgesUsingZone[0]
          ?.id,
      ).toBe(
        BLOCKABLE_EDGE_ID,
      );

      expect(
        edgesUsingZone[0]
          ?.from,
      ).toBe(
        "main-east",
      );

      expect(
        edgesUsingZone[0]
          ?.to,
      ).toBe(
        "main-east-end",
      );
    });

    it("preserves access to at least one exit from every occupied spawn-access node when blocked", () => {
      const hazardField =
        new HazardField(
          layoutA,
        );

      const disruptions =
        new DynamicDisruptionController(
          createBlockedScenario(
            0,
            false,
          ),
          layoutA,
          layoutAExits,
          hazardField,
        );

      disruptions.processDueEvents(
        0,
      );

      expect(
        hazardField
          .getZoneState(
            BLOCKABLE_ZONE_ID,
          ),
      ).toBe(
        "BLOCKED",
      );

      const blockableEdge =
        layoutANavigationGraph
          .edges
          .find(
            (
              edge,
            ) =>
              edge.id ===
              BLOCKABLE_EDGE_ID,
          );

      expect(
        blockableEdge,
      ).toBeDefined();

      expect(
        hazardField
          .isEdgeTraversable(
            blockableEdge!,
          ),
      ).toBe(
        false,
      );

      const exitNodeIds =
        layoutAExits.exits.map(
          (
            exit,
          ) =>
            exit.id,
        );

      const accessNodeIds =
        [
          ...new Set(
            layoutASpawnZones
              .zones
              .map(
                (
                  zone,
                ) =>
                  zone.accessNodeId,
              ),
          ),
        ];

      for (
        const accessNodeId of
          accessNodeIds
      ) {
        const route =
          findShortestPathDijkstra(
            layoutANavigationGraph,
            accessNodeId,
            exitNodeIds,
            {
              isTraversalAllowed:
                ({
                  edge,
                }) =>
                  hazardField
                    .isEdgeTraversable(
                      edge,
                    ),
            },
          );

        expect(
          route,
          `Expected ${accessNodeId} to retain a feasible exit route`,
        ).not.toBeNull();
      }
    });

    it("reproduces the calibrated 6.65 second disruption outcome across all five strategies", () => {
      for (
        const strategyId of
          STRATEGIES
      ) {
        const result =
          runHeadlessSimulation({
            scenario:
              createBlockedScenario(
                BLOCK_TIME_SECONDS,
                true,
              ),

            environment:
              layoutA,

            graph:
              layoutANavigationGraph,

            exits:
              layoutAExits,

            spawnZones:
              layoutASpawnZones,

            configuration: {
              strategyId,

              timestepSeconds:
                0.05,

              maximumSimulationTimeSeconds:
                180,

              densityCellLengthMeters:
                1,

              specificFlowPersonsPerMeterSecond:
                1.3,

              adaptiveRerouteThreshold:
                0.20,
            },
          });

        expect(
          result.metrics
            .completionRate,
        ).toBe(1);

        expect(
          result.metrics
            .unreachableAgents,
        ).toBe(0);

        expect(
          result.metrics
            .timeoutAgents,
        ).toBe(0);

        expect(
          result.metrics
            .totalEvacuationTimeSeconds,
        ).toBeCloseTo(
          33.45,
          8,
        );
      }
    });
  },
);