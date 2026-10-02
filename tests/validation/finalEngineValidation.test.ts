import {
  describe,
  expect,
  it,
} from "vitest";

import {
  BottleneckFlowController,
} from "../../src/core/bottleneckFlow";
import {
  calculateDensitySnapshot,
} from "../../src/core/calculateDensity";
import {
  calculateWeidmannSpeedMps,
} from "../../src/core/congestionEffects";
import {
  findShortestPathDijkstra,
} from "../../src/core/dijkstra";
import {
  advanceAgentAlongCurrentEdge,
  beginEdgeTraversal,
} from "../../src/core/pedestrianMovement";
import {
  runHeadlessSimulation,
} from "../../src/core/runHeadlessSimulation";
import {
  SimulationClock,
} from "../../src/core/SimulationClock";

import type {
  AgentState,
} from "../../src/types/agent";
import type {
  BuildingEnvironment,
} from "../../src/types/environment";
import type {
  ExitSet,
} from "../../src/types/exit";
import type {
  NavigationEdge,
  NavigationGraph,
} from "../../src/types/navigation";
import type {
  ScenarioInstance,
} from "../../src/types/scenario";
import type {
  SpawnZoneSet,
} from "../../src/types/spawn";

function createTwoNodeGraph():
  NavigationGraph {
  return {
    layoutId:
      "boundary-layout",

    nodes: [
      {
        id:
          "node-a",

        type:
          "JUNCTION",

        position: {
          x: 0,
          y: 0,
        },

        zoneId:
          "corridor",
      },

      {
        id:
          "node-b",

        type:
          "JUNCTION",

        position: {
          x: 2,
          y: 0,
        },

        zoneId:
          "corridor",
      },
    ],

    edges: [
      {
        id:
          "edge-a-b",

        from:
          "node-a",

        to:
          "node-b",

        lengthMeters:
          2,

        widthMeters:
          1,

        zoneId:
          "corridor",

        bidirectional:
          true,
      },
    ],
  };
}

function createAgent(
  overrides:
    Partial<AgentState> = {},
): AgentState {
  return {
    id:
      "agent-001",

    desiredSpeedMps:
      1,

    position: {
      x: 0,
      y: 0,
    },

    status:
      "ACTIVE",

    currentNodeId:
      "node-a",

    currentEdgeId:
      null,

    routeNodeIds: [
      "node-a",
      "node-b",
    ],

    routeCursorIndex:
      0,

    targetExitId:
      null,

    rerouteCount:
      0,

    distanceTraveledMeters:
      0,

    hazardExposureSeconds:
      0,

    evacuationTimeSeconds:
      null,

    ...overrides,
  };
}

/**
 * Independent reference solver.
 *
 * This intentionally does NOT use Dijkstra.
 * It enumerates all simple paths in the small validation graph
 * and returns the minimum total edge length.
 */
function referenceShortestPathCostByEnumeration(
  graph:
    NavigationGraph,
  startNodeId:
    string,
  targetNodeId:
    string,
): number | null {
  const adjacency =
    new Map<
      string,
      {
        to: string;
        cost: number;
      }[]
    >();

  for (
    const node of graph.nodes
  ) {
    adjacency.set(
      node.id,
      [],
    );
  }

  for (
    const edge of graph.edges
  ) {
    adjacency
      .get(edge.from)!
      .push({
        to:
          edge.to,

        cost:
          edge.lengthMeters,
      });

    if (
      edge.bidirectional
    ) {
      adjacency
        .get(edge.to)!
        .push({
          to:
            edge.from,

          cost:
            edge.lengthMeters,
        });
    }
  }

  let best:
    number | null =
    null;

  function search(
    nodeId: string,
    accumulatedCost: number,
    visited:
      ReadonlySet<string>,
  ): void {
    if (
      nodeId ===
      targetNodeId
    ) {
      if (
        best === null ||
        accumulatedCost <
          best
      ) {
        best =
          accumulatedCost;
      }

      return;
    }

    const nextVisited =
      new Set(
        visited,
      );

    nextVisited.add(
      nodeId,
    );

    for (
      const next of
        adjacency.get(
          nodeId,
        ) ?? []
    ) {
      if (
        nextVisited.has(
          next.to,
        )
      ) {
        continue;
      }

      if (
        best !== null &&
        accumulatedCost +
          next.cost >=
          best
      ) {
        continue;
      }

      search(
        next.to,
        accumulatedCost +
          next.cost,
        nextVisited,
      );
    }
  }

  search(
    startNodeId,
    0,
    new Set(),
  );

  return best;
}

function createReferenceGraph():
  NavigationGraph {
  return {
    layoutId:
      "reference-validation",

    nodes: [
      {
        id:
          "start",

        type:
          "JUNCTION",

        position: {
          x: 0,
          y: 0,
        },

        zoneId:
          "corridor",
      },

      {
        id:
          "a",

        type:
          "JUNCTION",

        position: {
          x: 1,
          y: 1,
        },

        zoneId:
          "corridor",
      },

      {
        id:
          "b",

        type:
          "JUNCTION",

        position: {
          x: 1,
          y: -1,
        },

        zoneId:
          "corridor",
      },

      {
        id:
          "c",

        type:
          "JUNCTION",

        position: {
          x: 2,
          y: -1,
        },

        zoneId:
          "corridor",
      },

      {
        id:
          "exit",

        type:
          "EXIT",

        position: {
          x: 3,
          y: 0,
        },

        zoneId:
          "corridor",
      },
    ],

    edges: [
      {
        id:
          "start-a",

        from:
          "start",

        to:
          "a",

        lengthMeters:
          2,

        widthMeters:
          2,

        zoneId:
          "corridor",

        bidirectional:
          true,
      },

      {
        id:
          "a-exit",

        from:
          "a",

        to:
          "exit",

        lengthMeters:
          4,

        widthMeters:
          2,

        zoneId:
          "corridor",

        bidirectional:
          true,
      },

      {
        id:
          "start-b",

        from:
          "start",

        to:
          "b",

        lengthMeters:
          1,

        widthMeters:
          2,

        zoneId:
          "corridor",

        bidirectional:
          true,
      },

      {
        id:
          "b-c",

        from:
          "b",

        to:
          "c",

        lengthMeters:
          1,

        widthMeters:
          2,

        zoneId:
          "corridor",

        bidirectional:
          true,
      },

      {
        id:
          "c-exit",

        from:
          "c",

        to:
          "exit",

        lengthMeters:
          2,

        widthMeters:
          2,

        zoneId:
          "corridor",

        bidirectional:
          true,
      },

      {
        id:
          "direct",

        from:
          "start",

        to:
          "exit",

        lengthMeters:
          10,

        widthMeters:
          2,

        zoneId:
          "corridor",

        bidirectional:
          true,
      },
    ],
  };
}

function createStressEnvironment():
  BuildingEnvironment {
  return {
    layoutId:
      "stress-layout",

    widthMeters:
      30,

    heightMeters:
      20,

    zones: [
      {
        id:
          "room-start",

        type:
          "ROOM",

        polygon: {
          vertices: [
            {
              x: 0,
              y: 0,
            },
            {
              x: 4,
              y: 0,
            },
            {
              x: 4,
              y: 4,
            },
            {
              x: 0,
              y: 4,
            },
          ],
        },
      },

      {
        id:
          "corridor-a",

        type:
          "CORRIDOR",

        polygon: {
          vertices: [
            {
              x: 4,
              y: 0,
            },
            {
              x: 15,
              y: 0,
            },
            {
              x: 15,
              y: 4,
            },
            {
              x: 4,
              y: 4,
            },
          ],
        },
      },

      {
        id:
          "corridor-b",

        type:
          "CORRIDOR",

        polygon: {
          vertices: [
            {
              x: 4,
              y: 5,
            },
            {
              x: 20,
              y: 5,
            },
            {
              x: 20,
              y: 9,
            },
            {
              x: 4,
              y: 9,
            },
          ],
        },
      },
    ],
  };
}

function createStressGraph():
  NavigationGraph {
  return {
    layoutId:
      "stress-layout",

    nodes: [
      {
        id:
          "start",

        type:
          "DECISION_POINT",

        position: {
          x: 4,
          y: 2,
        },

        zoneId:
          "corridor-a",
      },

      {
        id:
          "exit-a",

        type:
          "EXIT",

        position: {
          x: 9,
          y: 2,
        },

        zoneId:
          "corridor-a",
      },

      {
        id:
          "exit-b",

        type:
          "EXIT",

        position: {
          x: 12,
          y: 2,
        },

        zoneId:
          "corridor-b",
      },
    ],

    edges: [
      {
        id:
          "edge-a",

        from:
          "start",

        to:
          "exit-a",

        lengthMeters:
          5,

        widthMeters:
          2,

        zoneId:
          "corridor-a",

        bidirectional:
          true,
      },

      {
        id:
          "edge-b",

        from:
          "start",

        to:
          "exit-b",

        lengthMeters:
          8,

        widthMeters:
          2,

        zoneId:
          "corridor-b",

        bidirectional:
          true,
      },
    ],
  };
}

function createStressExits():
  ExitSet {
  return {
    layoutId:
      "stress-layout",

    exits: [
      {
        id:
          "exit-a",

        position: {
          x: 9,
          y: 2,
        },

        widthMeters:
          1.8,

        connectedZoneId:
          "corridor-a",
      },

      {
        id:
          "exit-b",

        position: {
          x: 12,
          y: 2,
        },

        widthMeters:
          1.8,

        connectedZoneId:
          "corridor-b",
      },
    ],
  };
}

function createStressSpawnZones():
  SpawnZoneSet {
  return {
    layoutId:
      "stress-layout",

    zones: [
      {
        id:
          "spawn-start",

        roomZoneId:
          "room-start",

        accessNodeId:
          "start",

        polygon: {
          vertices: [
            {
              x: 1,
              y: 1,
            },
            {
              x: 3,
              y: 1,
            },
            {
              x: 3,
              y: 3,
            },
            {
              x: 1,
              y: 3,
            },
          ],
        },
      },
    ],
  };
}

function createStressScenario(
  occupantCount:
    number,
): ScenarioInstance {
  return {
    id:
      "stress-scenario",

    seed:
      1042,

    layoutId:
      "stress-layout",

    parameterSetVersion:
      "stress-v1",

    occupants:
      Array.from(
        {
          length:
            occupantCount,
        },
        (
          _,
          index,
        ) => ({
          id:
            `agent-${String(
              index + 1,
            ).padStart(
              4,
              "0",
            )}`,

          spawnPosition: {
            x: 2,
            y: 2,
          },

          desiredSpeedMps:
            1.34,
        }),
      ),

    disruptionSchedule:
      [],
  };
}

describe(
  "Phase 5 final engine validation",
  () => {
    it("keeps fixed-step clock time exact at a long-step boundary", () => {
      const clock =
        new SimulationClock(
          0.025,
        );

      clock.advance(
        1000,
      );

      expect(
        clock.tick,
      ).toBe(
        1000,
      );

      expect(
        clock.timeSeconds,
      ).toBeCloseTo(
        25,
        12,
      );
    });

    it("handles exact edge-arrival movement without overshoot", () => {
      const graph =
        createTwoNodeGraph();

      const agent =
        createAgent();

      beginEdgeTraversal(
        agent,
        graph,
        "edge-a-b",
      );

      const result =
        advanceAgentAlongCurrentEdge(
          agent,
          graph,
          2,
          1,
        );

      expect(
        result.distanceMovedMeters,
      ).toBeCloseTo(
        2,
        12,
      );

      expect(
        result.arrivedAtNodeId,
      ).toBe(
        "node-b",
      );

      expect(
        result.unusedDistanceMeters,
      ).toBeCloseTo(
        0,
        12,
      );

      expect(
        agent.position,
      ).toEqual({
        x: 2,
        y: 0,
      });

      expect(
        agent.currentNodeId,
      ).toBe(
        "node-b",
      );

      expect(
        agent.currentEdgeId,
      ).toBeNull();
    });

    it("assigns an agent exactly on a density-cell boundary to the following cell", () => {
      const graph =
        createTwoNodeGraph();

      const agent =
        createAgent({
          position: {
            x: 1,
            y: 0,
          },

          currentNodeId:
            "node-a",

          currentEdgeId:
            "edge-a-b",
        });

      const snapshot =
        calculateDensitySnapshot(
          [
            agent,
          ],
          graph,
          1,
        );

      expect(
        snapshot.cells,
      ).toHaveLength(2);

      expect(
        snapshot.cells[0]
          ?.occupantCount,
      ).toBe(0);

      expect(
        snapshot.cells[1]
          ?.occupantCount,
      ).toBe(1);

      expect(
        snapshot.cells[1]
          ?.densityPersonsPerSquareMeter,
      ).toBeCloseTo(
        1,
        12,
      );
    });

    it("handles an exact whole-person bottleneck budget at the admission boundary", () => {
      const edge:
        NavigationEdge = {
        id:
          "boundary-edge",

        from:
          "a",

        to:
          "b",

        lengthMeters:
          5,

        widthMeters:
          2,

        zoneId:
          "corridor",

        bidirectional:
          true,
      };

      /**
       * q_s = 1 person/(m*s)
       * width = 2 m
       *
       * Q = 2 persons/s
       *
       * Over 0.5 s:
       * exact capacity = 1 person.
       */
      const controller =
        new BottleneckFlowController(
          1,
        );

      const result =
        controller.admitAgents(
          edge,
          [
            "agent-1",
            "agent-2",
          ],
          0.5,
        );

      expect(
        result.capacityPersonsPerSecond,
      ).toBe(2);

      expect(
        result.admittedAgentIds,
      ).toEqual([
        "agent-1",
      ]);

      expect(
        result.queuedAgentIds,
      ).toEqual([
        "agent-2",
      ]);

      expect(
        result.carryPersons,
      ).toBe(0);
    });

    it("matches the selected Weidmann equation against an independently calculated reference value", () => {
      const density =
        2;

      /**
       * Independent reference calculation from the model
       * equation:
       *
       * v(rho) =
       * 1.34 *
       * [1 - exp(-1.913 * (1/rho - 1/5.4))]
       */
      const reference =
        1.34 *
        (
          1 -
          Math.exp(
            -1.913 *
              (
                1 /
                  density -
                1 /
                  5.4
              ),
          )
        );

      const implementation =
        calculateWeidmannSpeedMps(
          density,
        );

      expect(
        implementation,
      ).toBeCloseTo(
        reference,
        12,
      );
    });

    it("matches Dijkstra output against an independent exhaustive path-enumeration reference", () => {
      const graph =
        createReferenceGraph();

      const referenceCost =
        referenceShortestPathCostByEnumeration(
          graph,
          "start",
          "exit",
        );

      const implementation =
        findShortestPathDijkstra(
          graph,
          "start",
          [
            "exit",
          ],
        );

      expect(
        referenceCost,
      ).toBe(4);

      expect(
        implementation,
      ).not.toBeNull();

      expect(
        implementation
          ?.totalCost,
      ).toBe(
        referenceCost,
      );

      expect(
        implementation
          ?.edgeIds,
      ).toEqual([
        "start-b",
        "b-c",
        "c-exit",
      ]);
    });

    it("completes a bounded 250-agent stress run without crashing or losing agents", () => {
      const occupantCount =
        250;

      const startedAt =
        performance.now();

      const result =
        runHeadlessSimulation({
          scenario:
            createStressScenario(
              occupantCount,
            ),

          environment:
            createStressEnvironment(),

          graph:
            createStressGraph(),

          exits:
            createStressExits(),

          spawnZones:
            createStressSpawnZones(),

          configuration: {
            strategyId:
              "STATIC_SHORTEST_PATH",

            timestepSeconds:
              0.1,

            /**
             * Deliberately bounded stress window.
             *
             * With this concentrated population, congestion may
             * prevent full evacuation. The validation objective
             * is engine stability and population accounting, not
             * successful evacuation.
             */
            maximumSimulationTimeSeconds:
              1,

            densityCellLengthMeters:
              1,

            specificFlowPersonsPerMeterSecond:
              1000,
          },
        });

      const elapsedMilliseconds =
        performance.now() -
        startedAt;

      expect(
        result.metrics
          .totalAgents,
      ).toBe(
        occupantCount,
      );

      expect(
        result.finalAgents,
      ).toHaveLength(
        occupantCount,
      );

      expect(
        result.termination
          .isTerminated,
      ).toBe(true);

      expect(
        result.metrics
          .evacuatedAgents +
          result.metrics
            .unreachableAgents +
          result.metrics
            .timeoutAgents +
          result.metrics
            .activeAgents,
      ).toBe(
        occupantCount,
      );

      /**
       * This is intentionally a generous regression guard rather
       * than a formal performance benchmark.
       *
       * Formal timing experiments should record hardware and
       * software environment separately.
       */
      expect(
        elapsedMilliseconds,
      ).toBeLessThan(
        10000,
      );
    });
  },
);