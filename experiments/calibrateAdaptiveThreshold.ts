import {
  runHeadlessSimulation,
} from "../src/core/runHeadlessSimulation";

import {
  ADAPTIVE_REROUTE_THRESHOLD_CANDIDATES,
} from "../src/core/reroutingDecision";

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

const PROBE_AGENT_ID =
  "probe-001";

const PROBE_SPAWN_ZONE_ID =
  "spawn-east-01";

const LOAD_SPAWN_ZONE_ID =
  "spawn-east-02";

const LOAD_COUNTS =
[
  8,
  10,
  12,
  14,
  16,
  18,
  20,
  22,
  24,
] as const;

const JAM_DENSITY_REFERENCE =
  5.4;

interface CalibrationRow {
  readonly loadCount:
    number;

  readonly threshold:
    number;

  readonly calibrationValid:
    boolean;

  readonly completionRate:
    number;

  readonly totalEvacuationTime:
    number | null;

  readonly maximumDensity:
    number | null;

  readonly queueExposure:
    number;

  readonly probeEvacuationTime:
    number | null;

  readonly probeFinalExit:
    string | null;

  readonly probeReroutes:
    number;

  readonly firstReviewTime:
    number | null;

  readonly firstReviewAction:
    string;

  readonly firstReviewReason:
    string;

  readonly firstCandidateExit:
    string | null;

  readonly firstSelectedExit:
    string | null;

  readonly firstImprovement:
    number | null;

  readonly acceptedRerouteTime:
    number | null;

  readonly acceptedImprovement:
    number | null;

  readonly totalReroutes:
    number;

  readonly totalExitChanges:
    number;

  readonly totalReversals:
    number;

  readonly unreachable:
    number;

  readonly timeout:
    number;
}

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
      PROBE_SPAWN_ZONE_ID,
    );

  const loadZone =
    getSpawnZone(
      LOAD_SPAWN_ZONE_ID,
    );

  return {
    id:
      `adaptive-threshold-consequential-load-${loadCount}-theta-${threshold.toFixed(
        2,
      )}`,

    seed:
      1042,

    layoutId:
      "layout-a",

    parameterSetVersion:
      "adaptive-threshold-consequential-v1",

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

function round(
  value: number,
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

const rows:
  CalibrationRow[] = [];

for (
  const loadCount of
    LOAD_COUNTS
) {
  for (
    const threshold of
      ADAPTIVE_REROUTE_THRESHOLD_CANDIDATES
  ) {
    console.log(
      `Running load=${loadCount}, theta=${threshold.toFixed(
        2,
      )}`,
    );

    const result =
      runHeadlessSimulation({
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

    const probe =
      result.finalAgents.find(
        (
          agent,
        ) =>
          agent.id ===
          PROBE_AGENT_ID,
      );

    if (!probe) {
      throw new Error(
        "Probe agent missing from final simulation state.",
      );
    }

    const probeReviews =
      result.decisionTrace
        .filter(
          (
            entry,
          ) =>
            entry.agentId ===
              PROBE_AGENT_ID &&
            entry.eventType ===
              "REROUTE_REVIEW",
        );

    const firstReview =
      probeReviews[0] ??
      null;

    const firstAcceptedReview =
      probeReviews.find(
        (
          entry,
        ) =>
          entry.action ===
          "REROUTE",
      ) ??
      null;

    const maximumDensity =
      result.metrics
        .maximumLocalDensityPersonsPerSquareMeter;

    const calibrationValid =
      result.metrics
        .completionRate ===
        1 &&
      result.metrics
        .unreachableAgents ===
        0 &&
      result.metrics
        .timeoutAgents ===
        0 &&
      maximumDensity !==
        null &&
      maximumDensity <
        JAM_DENSITY_REFERENCE;

    rows.push({
      loadCount,

      threshold,

      calibrationValid,

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

      maximumDensity:
        nullableRound(
          maximumDensity,
        ),

      queueExposure:
        round(
          result.queueMetrics
            .populationQueueWaitPersonSeconds,
          2,
        ),

      probeEvacuationTime:
        nullableRound(
          probe
            .evacuationTimeSeconds,
          2,
        ),

      probeFinalExit:
        probe.targetExitId,

      probeReroutes:
        probe.rerouteCount,

      firstReviewTime:
        nullableRound(
          firstReview
            ?.simulationTimeSeconds ??
          null,
          2,
        ),

      firstReviewAction:
        firstReview
          ?.action ??
        "NO_REVIEW",

      firstReviewReason:
        firstReview
          ?.reasonCodes
          .join(
            "|",
          ) ??
        "NO_REVIEW",

      firstCandidateExit:
        firstReview
          ?.candidateTargetExitId ??
        null,

      firstSelectedExit:
        firstReview
          ?.selectedTargetExitId ??
        null,

      firstImprovement:
        nullableRound(
          firstReview
            ?.relativeImprovement ??
          null,
          4,
        ),

      acceptedRerouteTime:
        nullableRound(
          firstAcceptedReview
            ?.simulationTimeSeconds ??
          null,
          2,
        ),

      acceptedImprovement:
        nullableRound(
          firstAcceptedReview
            ?.relativeImprovement ??
          null,
          4,
        ),

      totalReroutes:
        result.routeStability
          .totalAcceptedReroutes,

      totalExitChanges:
        result.routeStability
          .totalExitTargetChanges,

      totalReversals:
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

console.log(
  "\nAdaptive Hybrid consequential threshold calibration\n",
);

console.log(
  `Probe spawn: ${PROBE_SPAWN_ZONE_ID}`,
);

console.log(
  `Queue-load spawn: ${LOAD_SPAWN_ZONE_ID}`,
);

console.log(
  `Jam-density reference: ${JAM_DENSITY_REFERENCE} persons/m²`,
);

console.log(
  "No hazards or dynamic disruptions are present.\n",
);

console.log(
  "1. Complete calibration table\n",
);

console.table(
  rows,
);

const validRows =
  rows.filter(
    (
      row,
    ) =>
      row.calibrationValid,
  );

console.log(
  "\n2. Valid development cases only\n",
);

console.table(
  validRows,
);

const decisionEnvelope =
  LOAD_COUNTS.map(
    (
      loadCount,
    ) => {
      const matching =
        rows.filter(
          (
            row,
          ) =>
            row.loadCount ===
            loadCount,
        );

      const rowFor =
        (
          threshold:
            number,
        ) =>
          matching.find(
            (
              row,
            ) =>
              row.threshold ===
              threshold,
          );

      const theta0 =
        rowFor(
          0,
        );

      const theta10 =
        rowFor(
          0.10,
        );

      const theta20 =
        rowFor(
          0.20,
        );

      const theta30 =
        rowFor(
          0.30,
        );

      return {
        loadCount,

        validAtAllThresholds:
          matching.length ===
            4 &&
          matching.every(
            (
              row,
            ) =>
              row
                .calibrationValid,
          ),

        improvement:
          theta0
            ?.firstImprovement ??
          null,

        theta0Action:
          theta0
            ?.firstReviewAction ??
          "MISSING",

        theta10Action:
          theta10
            ?.firstReviewAction ??
          "MISSING",

        theta20Action:
          theta20
            ?.firstReviewAction ??
          "MISSING",

        theta30Action:
          theta30
            ?.firstReviewAction ??
          "MISSING",

        theta0ProbeTime:
          theta0
            ?.probeEvacuationTime ??
          null,

        theta10ProbeTime:
          theta10
            ?.probeEvacuationTime ??
          null,

        theta20ProbeTime:
          theta20
            ?.probeEvacuationTime ??
          null,

        theta30ProbeTime:
          theta30
            ?.probeEvacuationTime ??
          null,

        theta0Exit:
          theta0
            ?.probeFinalExit ??
          null,

        theta10Exit:
          theta10
            ?.probeFinalExit ??
          null,

        theta20Exit:
          theta20
            ?.probeFinalExit ??
          null,

        theta30Exit:
          theta30
            ?.probeFinalExit ??
          null,
      };
    },
  );

console.log(
  "\n3. Consequential decision envelope\n",
);

console.table(
  decisionEnvelope,
);