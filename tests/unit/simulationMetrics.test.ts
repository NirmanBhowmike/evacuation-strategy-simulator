import {
  describe,
  expect,
  it,
} from "vitest";

import { calculateSimulationMetrics } from "../../src/core/calculateSimulationMetrics";

import type { AgentState } from "../../src/types/agent";
import type { DensitySnapshot } from "../../src/types/density";
import type { ExitSet } from "../../src/types/exit";

function createExits(): ExitSet {
  return {
    layoutId:
      "metrics-test",

    exits: [
      {
        id:
          "exit-west",

        position: {
          x: 0,
          y: 0,
        },

        widthMeters:
          1.8,

        connectedZoneId:
          "corridor-a",
      },

      {
        id:
          "exit-east",

        position: {
          x: 20,
          y: 0,
        },

        widthMeters:
          1.8,

        connectedZoneId:
          "corridor-b",
      },
    ],
  };
}

function createAgent(
  id: string,
  status:
    | "ACTIVE"
    | "EVACUATED"
    | "UNREACHABLE"
    | "TIMEOUT",
  options: {
    evacuationTimeSeconds?: number;
    targetExitId?: string;
    hazardExposureSeconds?: number;
    distanceTraveledMeters?: number;
    rerouteCount?: number;
  } = {},
): AgentState {
  return {
    id,

    desiredSpeedMps:
      1.3,

    position: {
      x: 0,
      y: 0,
    },

    status,

    currentNodeId:
      "node-a",

    currentEdgeId:
      null,

    routeNodeIds: [],

    routeCursorIndex:
      0,

    targetExitId:
      status ===
      "EVACUATED"
        ? options.targetExitId ??
          "exit-west"
        : null,

    rerouteCount:
      options.rerouteCount ??
      0,

    distanceTraveledMeters:
      options.distanceTraveledMeters ??
      0,

    hazardExposureSeconds:
      options.hazardExposureSeconds ??
      0,

    evacuationTimeSeconds:
      status ===
      "EVACUATED"
        ? options.evacuationTimeSeconds ??
          10
        : null,
  };
}

function createDensitySnapshots():
  readonly DensitySnapshot[] {
  return [
    {
      cellLengthMeters: 1,

      cells: [
        {
          edgeId:
            "edge-a",

          cellIndex: 0,

          startDistanceMeters:
            0,

          lengthMeters:
            1,

          widthMeters:
            2,

          occupantCount:
            2,

          densityPersonsPerSquareMeter:
            1,
        },

        {
          edgeId:
            "edge-a",

          cellIndex: 1,

          startDistanceMeters:
            1,

          lengthMeters:
            1,

          widthMeters:
            2,

          occupantCount:
            4,

          densityPersonsPerSquareMeter:
            2,
        },
      ],
    },

    {
      cellLengthMeters: 1,

      cells: [
        {
          edgeId:
            "edge-b",

          cellIndex: 0,

          startDistanceMeters:
            0,

          lengthMeters:
            1,

          widthMeters:
            1,

          occupantCount:
            4,

          densityPersonsPerSquareMeter:
            4,
        },
      ],
    },
  ];
}

describe(
  "Simulation metrics",
  () => {
    it("calculates complete-run evacuation metrics", () => {
      const agents = [
        createAgent(
          "agent-001",
          "EVACUATED",
          {
            evacuationTimeSeconds:
              10,

            targetExitId:
              "exit-west",
          },
        ),

        createAgent(
          "agent-002",
          "EVACUATED",
          {
            evacuationTimeSeconds:
              20,

            targetExitId:
              "exit-east",
          },
        ),

        createAgent(
          "agent-003",
          "EVACUATED",
          {
            evacuationTimeSeconds:
              30,

            targetExitId:
              "exit-east",
          },
        ),
      ];

      const metrics =
        calculateSimulationMetrics(
          agents,
          createExits(),
        );

      expect(
        metrics.totalAgents,
      ).toBe(3);

      expect(
        metrics.evacuatedAgents,
      ).toBe(3);

      expect(
        metrics.completionRate,
      ).toBe(1);

      expect(
        metrics.totalEvacuationTimeSeconds,
      ).toBe(30);

      expect(
        metrics.latestEvacuationTimeSeconds,
      ).toBe(30);

      expect(
        metrics.meanEvacuationTimeSeconds,
      ).toBe(20);

      expect(
        metrics.p95EvacuationTimeSeconds,
      ).toBe(30);
    });

    it("does not report conventional total evacuation time for incomplete evacuation", () => {
      const agents = [
        createAgent(
          "agent-001",
          "EVACUATED",
          {
            evacuationTimeSeconds:
              12,
          },
        ),

        createAgent(
          "agent-002",
          "UNREACHABLE",
        ),
      ];

      const metrics =
        calculateSimulationMetrics(
          agents,
          createExits(),
        );

      expect(
        metrics.completionRate,
      ).toBeCloseTo(0.5);

      expect(
        metrics.totalEvacuationTimeSeconds,
      ).toBeNull();

      expect(
        metrics.latestEvacuationTimeSeconds,
      ).toBe(12);

      expect(
        metrics.unreachableAgents,
      ).toBe(1);
    });

    it("reports TIMEOUT separately from evacuation success", () => {
      const agents = [
        createAgent(
          "agent-001",
          "EVACUATED",
        ),

        createAgent(
          "agent-002",
          "TIMEOUT",
        ),
      ];

      const metrics =
        calculateSimulationMetrics(
          agents,
          createExits(),
        );

      expect(
        metrics.evacuatedAgents,
      ).toBe(1);

      expect(
        metrics.timeoutAgents,
      ).toBe(1);

      expect(
        metrics.completionRate,
      ).toBeCloseTo(0.5);

      expect(
        metrics.totalEvacuationTimeSeconds,
      ).toBeNull();
    });

    it("calculates population and mean hazard exposure", () => {
      const agents = [
        createAgent(
          "agent-001",
          "EVACUATED",
          {
            hazardExposureSeconds:
              5,
          },
        ),

        createAgent(
          "agent-002",
          "EVACUATED",
          {
            hazardExposureSeconds:
              15,
          },
        ),

        createAgent(
          "agent-003",
          "UNREACHABLE",
          {
            hazardExposureSeconds:
              10,
          },
        ),
      ];

      const metrics =
        calculateSimulationMetrics(
          agents,
          createExits(),
        );

      expect(
        metrics.populationHazardExposurePersonSeconds,
      ).toBe(30);

      expect(
        metrics.meanHazardExposureSeconds,
      ).toBe(10);
    });

    it("calculates distance and rerouting diagnostics", () => {
      const agents = [
        createAgent(
          "agent-001",
          "EVACUATED",
          {
            distanceTraveledMeters:
              30,

            rerouteCount:
              0,
          },
        ),

        createAgent(
          "agent-002",
          "EVACUATED",
          {
            distanceTraveledMeters:
              40,

            rerouteCount:
              2,
          },
        ),

        createAgent(
          "agent-003",
          "EVACUATED",
          {
            distanceTraveledMeters:
              50,

            rerouteCount:
              1,
          },
        ),
      ];

      const metrics =
        calculateSimulationMetrics(
          agents,
          createExits(),
        );

      expect(
        metrics.meanTravelDistanceMeters,
      ).toBe(40);

      expect(
        metrics.totalReroutes,
      ).toBe(3);

      expect(
        metrics.meanReroutesPerAgent,
      ).toBe(1);

      expect(
        metrics.fractionRerouted,
      ).toBeCloseTo(
        2 / 3,
      );
    });

    it("calculates exit utilization including exits with zero use", () => {
      const agents = [
        createAgent(
          "agent-001",
          "EVACUATED",
          {
            targetExitId:
              "exit-east",
          },
        ),

        createAgent(
          "agent-002",
          "EVACUATED",
          {
            targetExitId:
              "exit-east",
          },
        ),
      ];

      const metrics =
        calculateSimulationMetrics(
          agents,
          createExits(),
        );

      expect(
        metrics.exitUtilization,
      ).toEqual([
        {
          exitId:
            "exit-west",

          evacuatedAgents:
            0,

          fractionOfEvacuatedAgents:
            0,
        },

        {
          exitId:
            "exit-east",

          evacuatedAgents:
            2,

          fractionOfEvacuatedAgents:
            1,
        },
      ]);
    });

    it("calculates maximum density across multiple snapshots", () => {
      const metrics =
        calculateSimulationMetrics(
          [],
          createExits(),
          createDensitySnapshots(),
        );

      expect(
        metrics.maximumLocalDensityPersonsPerSquareMeter,
      ).toBe(4);
    });

    it("returns null maximum density when no density snapshots are supplied", () => {
      const metrics =
        calculateSimulationMetrics(
          [],
          createExits(),
        );

      expect(
        metrics.maximumLocalDensityPersonsPerSquareMeter,
      ).toBeNull();
    });

    it("handles an empty population deterministically", () => {
      const metrics =
        calculateSimulationMetrics(
          [],
          createExits(),
        );

      expect(
        metrics.totalAgents,
      ).toBe(0);

      expect(
        metrics.completionRate,
      ).toBe(1);

      expect(
        metrics.totalEvacuationTimeSeconds,
      ).toBeNull();

      expect(
        metrics.meanEvacuationTimeSeconds,
      ).toBeNull();

      expect(
        metrics.p95EvacuationTimeSeconds,
      ).toBeNull();

      expect(
        metrics.meanHazardExposureSeconds,
      ).toBe(0);

      expect(
        metrics.meanTravelDistanceMeters,
      ).toBe(0);

      expect(
        metrics.fractionRerouted,
      ).toBe(0);
    });

    it("rejects inconsistent evacuated-agent and metric inputs", () => {
      const missingTime =
        createAgent(
          "agent-001",
          "EVACUATED",
        );

      missingTime.evacuationTimeSeconds =
        null;

      expect(() =>
        calculateSimulationMetrics(
          [
            missingTime,
          ],
          createExits(),
        ),
      ).toThrow(
        /must have an evacuation time/,
      );

      const unknownExit =
        createAgent(
          "agent-002",
          "EVACUATED",
          {
            targetExitId:
              "missing-exit",
          },
        );

      expect(() =>
        calculateSimulationMetrics(
          [
            unknownExit,
          ],
          createExits(),
        ),
      ).toThrow(
        /references unknown exit/,
      );

      const invalidDensity:
        DensitySnapshot = {
        cellLengthMeters:
          1,

        cells: [
          {
            edgeId:
              "edge-a",

            cellIndex:
              0,

            startDistanceMeters:
              0,

            lengthMeters:
              1,

            widthMeters:
              2,

            occupantCount:
              0,

            densityPersonsPerSquareMeter:
              -1,
          },
        ],
      };

      expect(() =>
        calculateSimulationMetrics(
          [],
          createExits(),
          [
            invalidDensity,
          ],
        ),
      ).toThrow(
        /non-negative finite densities/,
      );
    });
  },
);