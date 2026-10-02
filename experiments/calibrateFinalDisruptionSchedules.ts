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
  RoutingStrategyId,
} from "../src/types/routingStrategy";
import type {
  SpawnZone,
} from "../src/types/spawn";

const OCCUPANT_COUNT =
  36;

const EARLY =
  6.65;

const MID =
  13.25;

const LATE =
  19.90;

const ADAPTIVE_THRESHOLD =
  0.10;

const HAZARD_TARGET =
  "corridor-main-spine";

const EXIT_BLOCK_TARGET =
  "exit-south-central";

const CORRIDOR_BLOCK_TARGET =
  "corridor-main-east-blockable";

const STRATEGIES:
  readonly RoutingStrategyId[] =
[
  "NEAREST_EXIT",
  "STATIC_SHORTEST_PATH",
  "CONGESTION_AWARE",
  "HAZARD_AWARE",
  "ADAPTIVE_HYBRID",
];

interface CalibrationCase {
  readonly id: string;

  readonly family:
    | "BASELINE"
    | "HAZARD"
    | "EXIT_BLOCK"
    | "CORRIDOR_BLOCK"
    | "COMBINED";

  readonly description:
    string;

  readonly events:
    readonly DisruptionEvent[];
}

const CASES:
  readonly CalibrationCase[] =
[
  // ============================================================
  // BASELINE
  // ============================================================

  {
    id:
      "BASELINE",

    family:
      "BASELINE",

    description:
      "No disruption",

    events:
      [],
  },

  // ============================================================
  // HAZARD TIMING CANDIDATES
  // ============================================================

  {
    id:
      "HAZARD_EARLY",

    family:
      "HAZARD",

    description:
      "Main-spine RISK activation at 6.65 s",

    events: [
      {
        id:
          "hazard-main-spine-early",

        type:
          "HAZARD_ACTIVATE",

        activationTimeSeconds:
          EARLY,

        targetId:
          HAZARD_TARGET,
      },
    ],
  },

  {
    id:
      "HAZARD_MID",

    family:
      "HAZARD",

    description:
      "Main-spine RISK activation at 13.25 s",

    events: [
      {
        id:
          "hazard-main-spine-mid",

        type:
          "HAZARD_ACTIVATE",

        activationTimeSeconds:
          MID,

        targetId:
          HAZARD_TARGET,
      },
    ],
  },

  {
    id:
      "HAZARD_LATE",

    family:
      "HAZARD",

    description:
      "Main-spine RISK activation at 19.90 s",

    events: [
      {
        id:
          "hazard-main-spine-late",

        type:
          "HAZARD_ACTIVATE",

        activationTimeSeconds:
          LATE,

        targetId:
          HAZARD_TARGET,
      },
    ],
  },

  // ============================================================
  // EXIT-BLOCK TIMING CANDIDATES
  // ============================================================

  {
    id:
      "EXIT_EARLY",

    family:
      "EXIT_BLOCK",

    description:
      "South-central exit blocked at 6.65 s",

    events: [
      {
        id:
          "exit-south-central-early",

        type:
          "EXIT_BLOCK",

        activationTimeSeconds:
          EARLY,

        targetId:
          EXIT_BLOCK_TARGET,
      },
    ],
  },

  {
    id:
      "EXIT_MID",

    family:
      "EXIT_BLOCK",

    description:
      "South-central exit blocked at 13.25 s",

    events: [
      {
        id:
          "exit-south-central-mid",

        type:
          "EXIT_BLOCK",

        activationTimeSeconds:
          MID,

        targetId:
          EXIT_BLOCK_TARGET,
      },
    ],
  },

  {
    id:
      "EXIT_LATE",

    family:
      "EXIT_BLOCK",

    description:
      "South-central exit blocked at 19.90 s",

    events: [
      {
        id:
          "exit-south-central-late",

        type:
          "EXIT_BLOCK",

        activationTimeSeconds:
          LATE,

        targetId:
          EXIT_BLOCK_TARGET,
      },
    ],
  },

  // ============================================================
  // LOCKED CORRIDOR-BLOCK REFERENCE
  // ============================================================

  {
    id:
      "CORRIDOR_LOCKED",

    family:
      "CORRIDOR_BLOCK",

    description:
      "Selected main-east corridor segment blocked at 6.65 s",

    events: [
      {
        id:
          "corridor-main-east-locked",

        type:
          "CORRIDOR_BLOCK",

        activationTimeSeconds:
          EARLY,

        targetId:
          CORRIDOR_BLOCK_TARGET,
      },
    ],
  },

  // ============================================================
  // COMBINED-DISRUPTION CANDIDATES
  // ============================================================

  /**
   * Candidate A
   *
   * Early hazard first, then loss of a major exit.
   *
   * This tests a changing situation without also removing the
   * calibrated corridor segment.
   */
  {
    id:
      "COMBINED_A",

    family:
      "COMBINED",

    description:
      "Hazard at 6.65 s + south-central exit block at 13.25 s",

    events: [
      {
        id:
          "combined-a-hazard",

        type:
          "HAZARD_ACTIVATE",

        activationTimeSeconds:
          EARLY,

        targetId:
          HAZARD_TARGET,
      },

      {
        id:
          "combined-a-exit",

        type:
          "EXIT_BLOCK",

        activationTimeSeconds:
          MID,

        targetId:
          EXIT_BLOCK_TARGET,
      },
    ],
  },

  /**
   * Candidate B
   *
   * First remove the calibrated corridor segment. Then introduce
   * a RISK condition on the main spine.
   */
  {
    id:
      "COMBINED_B",

    family:
      "COMBINED",

    description:
      "Corridor block at 6.65 s + hazard at 13.25 s",

    events: [
      {
        id:
          "combined-b-corridor",

        type:
          "CORRIDOR_BLOCK",

        activationTimeSeconds:
          EARLY,

        targetId:
          CORRIDOR_BLOCK_TARGET,
      },

      {
        id:
          "combined-b-hazard",

        type:
          "HAZARD_ACTIVATE",

        activationTimeSeconds:
          MID,

        targetId:
          HAZARD_TARGET,
      },
    ],
  },

  /**
   * Candidate C
   *
   * Strongest development candidate.
   *
   * The early state simultaneously introduces a hazardous
   * main-spine region and removes the selected main-east segment.
   * The south-central exit is then removed at MID.
   *
   * This is intentionally evaluated rather than assumed suitable.
   * It will be rejected if it produces structural failure,
   * excessive timeouts, or an uninformative collapse of all
   * strategies.
   */
  {
    id:
      "COMBINED_C",

    family:
      "COMBINED",

    description:
      "Hazard + corridor block at 6.65 s, exit block at 13.25 s",

    events: [
      {
        id:
          "combined-c-hazard",

        type:
          "HAZARD_ACTIVATE",

        activationTimeSeconds:
          EARLY,

        targetId:
          HAZARD_TARGET,
      },

      {
        id:
          "combined-c-corridor",

        type:
          "CORRIDOR_BLOCK",

        activationTimeSeconds:
          EARLY,

        targetId:
          CORRIDOR_BLOCK_TARGET,
      },

      {
        id:
          "combined-c-exit",

        type:
          "EXIT_BLOCK",

        activationTimeSeconds:
          MID,

        targetId:
          EXIT_BLOCK_TARGET,
      },
    ],
  },
];

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

function createOccupants() {
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

  return Array.from(
    {
      length:
        OCCUPANT_COUNT,
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
  );
}

function createScenario(
  calibrationCase:
    CalibrationCase,
  strategyId:
    RoutingStrategyId,
): ScenarioInstance {
  return {
    id:
      `final-disruption-${calibrationCase.id}-${strategyId}`,

    seed:
      1042,

    layoutId:
      "layout-a",

    parameterSetVersion:
      "final-disruption-calibration-v1",

    occupants:
      createOccupants(),

    disruptionSchedule:
      calibrationCase.events,
  };
}

function round(
  value:
    number,
  digits = 3,
): number {
  return Number(
    value.toFixed(
      digits,
    ),
  );
}

function nullableRound(
  value:
    number | null,
  digits = 3,
): number | null {
  return value ===
    null
    ? null
    : round(
        value,
        digits,
      );
}

interface CalibrationRow {
  readonly caseId:
    string;

  readonly family:
    string;

  readonly strategy:
    RoutingStrategyId;

  readonly scheduledEvents:
    number;

  readonly appliedEvents:
    number;

  readonly completionRate:
    number;

  readonly totalEvacuationTime:
    number | null;

  readonly tetDelta:
    number | null;

  readonly p95:
    number | null;

  readonly hazardExposure:
    number;

  readonly hazardExposureDelta:
    number;

  readonly maximumDensity:
    number | null;

  readonly queueExposure:
    number;

  readonly reroutes:
    number;

  readonly agentsRerouted:
    number;

  readonly exitChanges:
    number;

  readonly reversals:
    number;

  readonly unreachable:
    number;

  readonly timeout:
    number;
}

const baselineByStrategy =
  new Map<
    RoutingStrategyId,
    ReturnType<
      typeof runHeadlessSimulation
    >
  >();

const rows:
  CalibrationRow[] = [];

const baselineCase =
  CASES.find(
    (
      calibrationCase,
    ) =>
      calibrationCase.id ===
      "BASELINE",
  );

if (!baselineCase) {
  throw new Error(
    "Baseline calibration case is missing.",
  );
}

// ============================================================
// BASELINES
// ============================================================

console.log(
  "\nRunning baseline cases\n",
);

for (
  const strategyId of
    STRATEGIES
) {
  console.log(
    `BASELINE - ${strategyId}`,
  );

  const result =
    runHeadlessSimulation({
      scenario:
        createScenario(
          baselineCase,
          strategyId,
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
          ADAPTIVE_THRESHOLD,
      },
    });

  baselineByStrategy.set(
    strategyId,
    result,
  );

  rows.push({
    caseId:
      "BASELINE",

    family:
      "BASELINE",

    strategy:
      strategyId,

    scheduledEvents:
      0,

    appliedEvents:
      0,

    completionRate:
      round(
        result.metrics
          .completionRate,
      ),

    totalEvacuationTime:
      nullableRound(
        result.metrics
          .totalEvacuationTimeSeconds,
        2,
      ),

    tetDelta:
      0,

    p95:
      nullableRound(
        result.metrics
          .p95EvacuationTimeSeconds,
        2,
      ),

    hazardExposure:
      round(
        result.metrics
          .populationHazardExposurePersonSeconds,
        2,
      ),

    hazardExposureDelta:
      0,

    maximumDensity:
      nullableRound(
        result.metrics
          .maximumLocalDensityPersonsPerSquareMeter,
      ),

    queueExposure:
      round(
        result.queueMetrics
          .populationQueueWaitPersonSeconds,
        2,
      ),

    reroutes:
      result.routeStability
        .totalAcceptedReroutes,

    agentsRerouted:
      result.routeStability
        .agentsWithAcceptedReroutes,

    exitChanges:
      result.routeStability
        .totalExitTargetChanges,

    reversals:
      result.routeStability
        .totalRouteReversalEvents,

    unreachable:
      result.metrics
        .unreachableAgents,

    timeout:
      result.metrics
        .timeoutAgents,
  });
}

// ============================================================
// DISRUPTION CASES
// ============================================================

console.log(
  "\nRunning disruption cases\n",
);

for (
  const calibrationCase of
    CASES
) {
  if (
    calibrationCase.id ===
    "BASELINE"
  ) {
    continue;
  }

  for (
    const strategyId of
      STRATEGIES
  ) {
    console.log(
      `${calibrationCase.id} - ${strategyId}`,
    );

    const baseline =
      baselineByStrategy.get(
        strategyId,
      );

    if (!baseline) {
      throw new Error(
        `Missing baseline for ${strategyId}`,
      );
    }

    const result =
      runHeadlessSimulation({
        scenario:
          createScenario(
            calibrationCase,
            strategyId,
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
            ADAPTIVE_THRESHOLD,
        },
      });

    const baselineTet =
      baseline.metrics
        .totalEvacuationTimeSeconds;

    const currentTet =
      result.metrics
        .totalEvacuationTimeSeconds;

    const tetDelta =
      baselineTet !==
        null &&
      currentTet !==
        null
        ? currentTet -
          baselineTet
        : null;

    const baselineExposure =
      baseline.metrics
        .populationHazardExposurePersonSeconds;

    const currentExposure =
      result.metrics
        .populationHazardExposurePersonSeconds;

    rows.push({
      caseId:
        calibrationCase.id,

      family:
        calibrationCase.family,

      strategy:
        strategyId,

      scheduledEvents:
        calibrationCase
          .events.length,

      appliedEvents:
        result
          .appliedDisruptions
          .length,

      completionRate:
        round(
          result.metrics
            .completionRate,
        ),

      totalEvacuationTime:
        nullableRound(
          currentTet,
          2,
        ),

      tetDelta:
        nullableRound(
          tetDelta,
          2,
        ),

      p95:
        nullableRound(
          result.metrics
            .p95EvacuationTimeSeconds,
          2,
        ),

      hazardExposure:
        round(
          currentExposure,
          2,
        ),

      hazardExposureDelta:
        round(
          currentExposure -
            baselineExposure,
          2,
        ),

      maximumDensity:
        nullableRound(
          result.metrics
            .maximumLocalDensityPersonsPerSquareMeter,
        ),

      queueExposure:
        round(
          result.queueMetrics
            .populationQueueWaitPersonSeconds,
          2,
        ),

      reroutes:
        result.routeStability
          .totalAcceptedReroutes,

      agentsRerouted:
        result.routeStability
          .agentsWithAcceptedReroutes,

      exitChanges:
        result.routeStability
          .totalExitTargetChanges,

      reversals:
        result.routeStability
          .totalRouteReversalEvents,

      unreachable:
        result.metrics
          .unreachableAgents,

      timeout:
        result.metrics
          .timeoutAgents,
    });
  }
}

// ============================================================
// COMPLETE TABLE
// ============================================================

console.log(
  "\nFinal disruption-schedule calibration\n",
);

console.log(
  `Occupancy: ${OCCUPANT_COUNT}`,
);

console.log(
  `Adaptive theta: ${ADAPTIVE_THRESHOLD}`,
);

console.log(
  `EARLY = ${EARLY} s`,
);

console.log(
  `MID   = ${MID} s`,
);

console.log(
  `LATE  = ${LATE} s\n`,
);

console.log(
  "1. Complete strategy-level results\n",
);

console.table(
  rows,
);

// ============================================================
// CASE-LEVEL SUMMARY
// ============================================================

const summaryRows =
  CASES.map(
    (
      calibrationCase,
    ) => {
      const matching =
        rows.filter(
          (
            row,
          ) =>
            row.caseId ===
            calibrationCase.id,
        );

      const tetDeltas =
        matching
          .map(
            (
              row,
            ) =>
              row.tetDelta,
          )
          .filter(
            (
              value,
          ):
              value is number =>
                value !==
                null,
          );

      const exposures =
        matching.map(
          (
            row,
          ) =>
            row.hazardExposure,
        );

      return {
        caseId:
          calibrationCase.id,

        family:
          calibrationCase.family,

        events:
          calibrationCase.events
            .length,

        allEventsApplied:
          matching.every(
            (
              row,
            ) =>
              row.appliedEvents ===
              calibrationCase
                .events.length,
          ),

        minimumCompletion:
          Math.min(
            ...matching.map(
              (
                row,
              ) =>
                row
                  .completionRate,
            ),
          ),

        meanTetDelta:
          tetDeltas.length ===
          0
            ? null
            : round(
                tetDeltas.reduce(
                  (
                    sum,
                    value,
                  ) =>
                    sum +
                    value,
                  0,
                ) /
                  tetDeltas.length,
                2,
              ),

        minimumTetDelta:
          tetDeltas.length ===
          0
            ? null
            : round(
                Math.min(
                  ...tetDeltas,
                ),
                2,
              ),

        maximumTetDelta:
          tetDeltas.length ===
          0
            ? null
            : round(
                Math.max(
                  ...tetDeltas,
                ),
                2,
              ),

        minimumExposure:
          round(
            Math.min(
              ...exposures,
            ),
            2,
          ),

        maximumExposure:
          round(
            Math.max(
              ...exposures,
            ),
            2,
          ),

        exposureSpread:
          round(
            Math.max(
              ...exposures,
            ) -
              Math.min(
                ...exposures,
              ),
            2,
          ),

        totalReroutes:
          matching.reduce(
            (
              sum,
              row,
            ) =>
              sum +
              row.reroutes,
            0,
          ),

        totalReversals:
          matching.reduce(
            (
              sum,
              row,
            ) =>
              sum +
              row.reversals,
            0,
          ),

        totalUnreachable:
          matching.reduce(
            (
              sum,
              row,
            ) =>
              sum +
              row.unreachable,
            0,
          ),

        totalTimeout:
          matching.reduce(
            (
              sum,
              row,
            ) =>
              sum +
              row.timeout,
            0,
          ),
      };
    },
  );

console.log(
  "\n2. Case-level summary\n",
);

console.table(
  summaryRows,
);

// ============================================================
// HAZARD FAMILY
// ============================================================

console.log(
  "\n3. Hazard timing comparison\n",
);

console.table(
  rows.filter(
    (
      row,
    ) =>
      row.family ===
      "HAZARD",
  ),
);

// ============================================================
// EXIT FAMILY
// ============================================================

console.log(
  "\n4. Exit-block timing comparison\n",
);

console.table(
  rows.filter(
    (
      row,
    ) =>
      row.family ===
      "EXIT_BLOCK",
  ),
);

// ============================================================
// COMBINED FAMILY
// ============================================================

console.log(
  "\n5. Combined-schedule comparison\n",
);

console.table(
  rows.filter(
    (
      row,
    ) =>
      row.family ===
      "COMBINED",
  ),
);