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
  DisruptionEvent,
  Position2D,
  ScenarioInstance,
} from "../src/types/scenario";
import type {
  SpawnZone,
} from "../src/types/spawn";

const MEDIUM_OCCUPANCY =
  36;

const BASELINE_TET_SECONDS =
  26.5;

const TIMESTEP_SECONDS =
  0.05;

const EARLY_TIME =
  6.65;

const MID_TIME =
  13.25;

const LATE_TIME =
  19.90;

function polygonCenter(
  zone: SpawnZone,
): Position2D {
  const vertices =
    zone.polygon.vertices;

  if (
    vertices.length === 0
  ) {
    throw new Error(
      `Spawn zone ${zone.id} has no vertices.`,
    );
  }

  const sum =
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
      sum.x /
      vertices.length,

    y:
      sum.y /
      vertices.length,
  };
}

function createScenario(
  id: string,
  disruptionSchedule:
    readonly DisruptionEvent[],
): ScenarioInstance {
  const spawnZones =
    layoutASpawnZones.zones;

  if (
    spawnZones.length === 0
  ) {
    throw new Error(
      "Layout A requires spawn zones.",
    );
  }

  return {
    id,

    seed:
      1042,

    layoutId:
      "layout-a",

    parameterSetVersion:
      "disruption-calibration-v1",

    occupants:
      Array.from(
        {
          length:
            MEDIUM_OCCUPANCY,
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
              "Unable to select spawn zone.",
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

    disruptionSchedule,
  };
}

interface CalibrationCase {
  readonly id:
    string;

  readonly timing:
    "BASELINE" |
    "EARLY" |
    "MID" |
    "LATE";

  readonly eventType:
    string;

  readonly timeSeconds:
    number | null;

  readonly events:
    readonly DisruptionEvent[];
}

const cases:
  readonly CalibrationCase[] =
[
  {
    id:
      "baseline",

    timing:
      "BASELINE",

    eventType:
      "NONE",

    timeSeconds:
      null,

    events: [],
  },

  // ============================================================
  // HAZARD ACTIVATION
  // ============================================================

  {
    id:
      "hazard-early",

    timing:
      "EARLY",

    eventType:
      "HAZARD_ACTIVATE",

    timeSeconds:
      EARLY_TIME,

    events: [
      {
        id:
          "hazard-early",

        type:
          "HAZARD_ACTIVATE",

        activationTimeSeconds:
          EARLY_TIME,

        targetId:
          "corridor-main-spine",
      },
    ],
  },

  {
    id:
      "hazard-mid",

    timing:
      "MID",

    eventType:
      "HAZARD_ACTIVATE",

    timeSeconds:
      MID_TIME,

    events: [
      {
        id:
          "hazard-mid",

        type:
          "HAZARD_ACTIVATE",

        activationTimeSeconds:
          MID_TIME,

        targetId:
          "corridor-main-spine",
      },
    ],
  },

  {
    id:
      "hazard-late",

    timing:
      "LATE",

    eventType:
      "HAZARD_ACTIVATE",

    timeSeconds:
      LATE_TIME,

    events: [
      {
        id:
          "hazard-late",

        type:
          "HAZARD_ACTIVATE",

        activationTimeSeconds:
          LATE_TIME,

        targetId:
          "corridor-main-spine",
      },
    ],
  },

  // ============================================================
  // EXIT BLOCKAGE
  // ============================================================

  {
    id:
      "exit-block-early",

    timing:
      "EARLY",

    eventType:
      "EXIT_BLOCK",

    timeSeconds:
      EARLY_TIME,

    events: [
      {
        id:
          "exit-block-early",

        type:
          "EXIT_BLOCK",

        activationTimeSeconds:
          EARLY_TIME,

        targetId:
          "exit-south-central",
      },
    ],
  },

  {
    id:
      "exit-block-mid",

    timing:
      "MID",

    eventType:
      "EXIT_BLOCK",

    timeSeconds:
      MID_TIME,

    events: [
      {
        id:
          "exit-block-mid",

        type:
          "EXIT_BLOCK",

        activationTimeSeconds:
          MID_TIME,

        targetId:
          "exit-south-central",
      },
    ],
  },

  {
    id:
      "exit-block-late",

    timing:
      "LATE",

    eventType:
      "EXIT_BLOCK",

    timeSeconds:
      LATE_TIME,

    events: [
      {
        id:
          "exit-block-late",

        type:
          "EXIT_BLOCK",

        activationTimeSeconds:
          LATE_TIME,

        targetId:
          "exit-south-central",
      },
    ],
  },

  // ============================================================
  // CORRIDOR BLOCKAGE
  // ============================================================

  {
    id:
      "corridor-block-early",

    timing:
      "EARLY",

    eventType:
      "CORRIDOR_BLOCK",

    timeSeconds:
      EARLY_TIME,

    events: [
      {
        id:
          "corridor-block-early",

        type:
          "CORRIDOR_BLOCK",

        activationTimeSeconds:
          EARLY_TIME,

        targetId:
          "corridor-east-bottleneck",
      },
    ],
  },

  {
    id:
      "corridor-block-mid",

    timing:
      "MID",

    eventType:
      "CORRIDOR_BLOCK",

    timeSeconds:
      MID_TIME,

    events: [
      {
        id:
          "corridor-block-mid",

        type:
          "CORRIDOR_BLOCK",

        activationTimeSeconds:
          MID_TIME,

        targetId:
          "corridor-east-bottleneck",
      },
    ],
  },

  {
    id:
      "corridor-block-late",

    timing:
      "LATE",

    eventType:
      "CORRIDOR_BLOCK",

    timeSeconds:
      LATE_TIME,

    events: [
      {
        id:
          "corridor-block-late",

        type:
          "CORRIDOR_BLOCK",

        activationTimeSeconds:
          LATE_TIME,

        targetId:
          "corridor-east-bottleneck",
      },
    ],
  },
];

function runCase(
  calibrationCase:
    CalibrationCase,
) {
  const result =
    runHeadlessSimulation({
      scenario:
        createScenario(
          calibrationCase.id,
          calibrationCase.events,
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
         * Static Shortest Path is used for timing calibration so
         * the event schedule is not tuned to benefit the adaptive
         * strategy.
         */
        strategyId:
          "STATIC_SHORTEST_PATH",

        timestepSeconds:
          TIMESTEP_SECONDS,

        maximumSimulationTimeSeconds:
          180,

        densityCellLengthMeters:
          1,

        specificFlowPersonsPerMeterSecond:
          1.3,
      },
    });

  return {
    case:
      calibrationCase.id,

    timing:
      calibrationCase.timing,

    event:
      calibrationCase.eventType,

    scheduledTime:
      calibrationCase
        .timeSeconds,

    appliedEvents:
      result
        .appliedDisruptions
        .length,

    completionRate:
      Number(
        result.metrics
          .completionRate
          .toFixed(
            3,
          ),
      ),

    totalEvacuationTime:
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

    p95EvacuationTime:
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

    hazardExposure:
      Number(
        result.metrics
          .populationHazardExposurePersonSeconds
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

    queueExposure:
      Number(
        result.queueMetrics
          .populationQueueWaitPersonSeconds
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

console.log(
  "\nDisruption timing calibration\n",
);

console.log(
  `Reference baseline TET: ${BASELINE_TET_SECONDS} s`,
);

console.log(
  `Early = ${EARLY_TIME} s`,
);

console.log(
  `Mid   = ${MID_TIME} s`,
);

console.log(
  `Late  = ${LATE_TIME} s\n`,
);

const results =
  cases.map(
    (
      calibrationCase,
    ) => {
      console.log(
        `Running ${calibrationCase.id}`,
      );

      return runCase(
        calibrationCase,
      );
    },
  );

console.log(
  "\nResults\n",
);

console.table(
  results,
);