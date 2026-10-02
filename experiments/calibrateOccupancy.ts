import {
  runHeadlessSimulation,
} from "../src/core/runHeadlessSimulation";

import {
  layoutA,
} from "../src/environment/layoutA";
import {
  layoutAExits,
} from "../src/environment/layoutAExits";
import {
  layoutANavigationGraph,
} from "../src/environment/layoutANavigationGraph";
import {
  layoutASpawnZones,
} from "../src/environment/layoutASpawnZones";

import type {
  Position2D,
  ScenarioInstance,
} from "../src/types/scenario";
import type {
  SpawnZone,
} from "../src/types/spawn";

const CANDIDATE_OCCUPANCIES = [
  12,
  24,
  36,
  48,
  60,
  72,
  96,
  120,
] as const;

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

function createCalibrationScenario(
  occupantCount: number,
): ScenarioInstance {
  const spawnZones =
    layoutASpawnZones.zones;

  if (
    spawnZones.length === 0
  ) {
    throw new Error(
      "Layout A requires at least one spawn zone.",
    );
  }

  return {
    id:
      `occupancy-calibration-${occupantCount}`,

    seed:
      1042,

    layoutId:
      layoutA.layoutId,

    parameterSetVersion:
      "occupancy-calibration-v1",

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
            spawnZones[
              index %
              spawnZones.length
            ];

          if (!spawnZone) {
            throw new Error(
              "Unable to select a spawn zone.",
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

            /**
             * Fixed speed deliberately isolates occupancy
             * effects during this calibration pass.
             *
             * Formal ScenarioInstances will later restore
             * inter-person speed variability.
             */
            desiredSpeedMps:
              1.34,
          };
        },
      ),

    disruptionSchedule: [],
  };
}

interface CalibrationRow {
  readonly occupants:
    number;

  readonly completionRate:
    number;

  readonly totalEvacuationTimeSeconds:
    number | null;

  readonly p95EvacuationTimeSeconds:
    number | null;

  readonly maximumDensity:
    number | null;

  readonly populationQueueWaitPersonSeconds:
    number;

  readonly meanQueueWaitSeconds:
    number;

  readonly maximumQueueWaitSeconds:
    number;

  readonly unreachable:
    number;

  readonly timeout:
    number;
}

function runCandidate(
  occupantCount: number,
): CalibrationRow {
  const result =
    runHeadlessSimulation({
      scenario:
        createCalibrationScenario(
          occupantCount,
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
        /**
         * Use one fixed baseline policy during occupancy
         * calibration so routing strategy does not become a
         * second experimental factor.
         */
        strategyId:
          "STATIC_SHORTEST_PATH",

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

  return {
    occupants:
      occupantCount,

    completionRate:
      Number(
        result.metrics
          .completionRate
          .toFixed(
            3,
          ),
      ),

    totalEvacuationTimeSeconds:
      result.metrics
        .totalEvacuationTimeSeconds ===
      null
        ? null
        : Number(
            result.metrics
              .totalEvacuationTimeSeconds
              .toFixed(
                2,
              ),
          ),

    p95EvacuationTimeSeconds:
      result.metrics
        .p95EvacuationTimeSeconds ===
      null
        ? null
        : Number(
            result.metrics
              .p95EvacuationTimeSeconds
              .toFixed(
                2,
              ),
          ),

    maximumDensity:
      result.metrics
        .maximumLocalDensityPersonsPerSquareMeter ===
      null
        ? null
        : Number(
            result.metrics
              .maximumLocalDensityPersonsPerSquareMeter
              .toFixed(
                3,
              ),
          ),

    populationQueueWaitPersonSeconds:
      Number(
        result.queueMetrics
          .populationQueueWaitPersonSeconds
          .toFixed(
            2,
          ),
      ),

    meanQueueWaitSeconds:
      Number(
        result.queueMetrics
          .meanQueueWaitSeconds
          .toFixed(
            2,
          ),
      ),

    maximumQueueWaitSeconds:
      Number(
        result.queueMetrics
          .maximumQueueWaitSeconds
          .toFixed(
            2,
          ),
      ),

    unreachable:
      result.metrics
        .unreachableAgents,

    timeout:
      result.metrics
        .timeoutAgents,
  };
}

const rows =
  CANDIDATE_OCCUPANCIES.map(
    (occupancy) => {
      console.log(
        `Running occupancy calibration: ${occupancy} occupants`,
      );

      return runCandidate(
        occupancy,
      );
    },
  );

console.log(
  "\nLayout A occupancy calibration results\n",
);

console.table(
  rows,
);