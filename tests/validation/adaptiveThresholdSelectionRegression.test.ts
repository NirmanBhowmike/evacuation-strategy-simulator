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

const PROBE_AGENT_ID =
  "probe-001";

const SELECTED_THRESHOLD =
  0.10;

const ZERO_INERTIA_THRESHOLD =
  0;

const VALID_LOAD_COUNTS =
[
  18,
  20,
  22,
] as const;

const JAM_DENSITY_REFERENCE =
  5.4;

function getSpawnZone(
  id: string,
): SpawnZone {
  const zone =
    layoutASpawnZones
      .zones
      .find(
        (
          candidate,
        ) =>
          candidate.id ===
          id,
      );

  if (!zone) {
    throw new Error(
      `Unknown Layout A spawn zone: ${id}`,
    );
  }

  return zone;
}

function polygonCenter(
  zone: SpawnZone,
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
  loadCount: number,
  threshold: number,
): ScenarioInstance {
  const probeZone =
    getSpawnZone(
      "spawn-east-01",
    );

  const loadZone =
    getSpawnZone(
      "spawn-east-02",
    );

  return {
    id:
      `adaptive-threshold-regression-${loadCount}-${threshold}`,

    seed:
      1042,

    layoutId:
      "layout-a",

    parameterSetVersion:
      "adaptive-threshold-selection-v1",

    occupants: [
      {
        id:
          PROBE_AGENT_ID,

        spawnPosition:
          polygonCenter(
            probeZone,
          ),

        desiredSpeedMps:
          1.34,
      },

      ...Array.from(
        {
          length:
            loadCount,
        },
        (
          _,
          index,
        ) => ({
          id:
            `load-${String(
              index + 1,
            ).padStart(
              3,
              "0",
            )}`,

          spawnPosition:
            polygonCenter(
              loadZone,
            ),

          desiredSpeedMps:
            1.34,
        }),
      ),
    ],

    disruptionSchedule:
      [],
  };
}

function runCase(
  loadCount: number,
  threshold: number,
) {
  return runHeadlessSimulation({
    scenario:
      createScenario(
        loadCount,
        threshold,
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
      strategyId:
        "ADAPTIVE_HYBRID",

      timestepSeconds:
        0.05,

      maximumSimulationTimeSeconds:
        180,

      densityCellLengthMeters:
        1,

      specificFlowPersonsPerMeterSecond:
        1.3,

      adaptiveRerouteThreshold:
        threshold,
    },
  });
}

describe(
  "Adaptive Hybrid selected rerouting threshold",
  () => {
    it("rejects demonstrated harmful low-benefit switches at theta = 0.10", () => {
      for (
        const loadCount of
          VALID_LOAD_COUNTS
      ) {
        const zeroInertia =
          runCase(
            loadCount,
            ZERO_INERTIA_THRESHOLD,
          );

        const selected =
          runCase(
            loadCount,
            SELECTED_THRESHOLD,
          );

        expect(
          zeroInertia.metrics
            .completionRate,
        ).toBe(1);

        expect(
          selected.metrics
            .completionRate,
        ).toBe(1);

        expect(
          zeroInertia.metrics
            .unreachableAgents,
        ).toBe(0);

        expect(
          selected.metrics
            .unreachableAgents,
        ).toBe(0);

        expect(
          zeroInertia.metrics
            .timeoutAgents,
        ).toBe(0);

        expect(
          selected.metrics
            .timeoutAgents,
        ).toBe(0);

        expect(
          zeroInertia.metrics
            .maximumLocalDensityPersonsPerSquareMeter!,
        ).toBeLessThan(
          JAM_DENSITY_REFERENCE,
        );

        expect(
          selected.metrics
            .maximumLocalDensityPersonsPerSquareMeter!,
        ).toBeLessThan(
          JAM_DENSITY_REFERENCE,
        );

        const zeroProbe =
          zeroInertia.finalAgents.find(
            (
              agent,
            ) =>
              agent.id ===
              PROBE_AGENT_ID,
          );

        const selectedProbe =
          selected.finalAgents.find(
            (
              agent,
            ) =>
              agent.id ===
              PROBE_AGENT_ID,
          );

        expect(
          zeroProbe,
        ).toBeDefined();

        expect(
          selectedProbe,
        ).toBeDefined();

        expect(
          zeroProbe!
            .rerouteCount,
        ).toBe(1);

        expect(
          selectedProbe!
            .rerouteCount,
        ).toBe(0);

        expect(
          zeroProbe!
            .targetExitId,
        ).toBe(
          "exit-south-central",
        );

        expect(
          selectedProbe!
            .targetExitId,
        ).toBe(
          "exit-east",
        );

        expect(
          selectedProbe!
            .evacuationTimeSeconds!,
        ).toBeLessThan(
          zeroProbe!
            .evacuationTimeSeconds!,
        );
      }
    });
  },
);