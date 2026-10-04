import {
  createArchitectureV2AuthoritativeBundle,
} from "../src/app/createArchitectureV2DemoReplay";

import {
  runHeadlessSimulation,
} from "../src/core/runHeadlessSimulation";

import {
  layoutAArchitectureV2Environment,
} from "../src/environment/layoutAArchitectureV2Environment";

import {
  layoutAArchitectureV2Exits,
} from "../src/environment/layoutAArchitectureV2Exits";

import {
  RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
  RESEARCH_DENSITY_CELL_LENGTH_METERS,
  RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,
  RESEARCH_TIMESTEP_SECONDS,
} from "../src/scenario/researchParameterSet";

import type {
  SimulationReplayFrame,
} from "../src/types/simulationReplay";

interface EdgeUsageRecord {
  readonly edgeId:
    string;

  readonly zoneId:
    string;

  readonly from:
    string;

  readonly to:
    string;

  readonly lengthMeters:
    number;

  readonly widthMeters:
    number;

  readonly uniqueAgentsOnEdge:
    number;

  readonly maximumConcurrentAgents:
    number;

  readonly routeUsersAtTime8:
    number;

  readonly routeUsersAtTime10:
    number;

  readonly routeUsersAtTime12:
    number;

  readonly routeUsersAtTime14:
    number;

  readonly routeUsersAtTime16:
    number;

  readonly routeUsersAtTime18:
    number;
}

const INSPECTION_TIMES =
  [
    8,
    10,
    12,
    14,
    16,
    18,
  ] as const;

const TIME_TOLERANCE =
  RESEARCH_TIMESTEP_SECONDS /
  2 +
  1e-9;

const bundle =
  createArchitectureV2AuthoritativeBundle();

const frames:
  SimulationReplayFrame[] =
[];

const scenario = {
  ...bundle.scenario,

  id:
    "layout-a-v2-medium-42-d0-edge-usage-profile",

  parameterSetVersion:
    "architecture-v2-edge-usage-profile-v1",

  disruptionSchedule:
    [],
};

const result =
  runHeadlessSimulation({
    scenario,

    environment:
      layoutAArchitectureV2Environment,

    graph:
      bundle.graph,

    exits:
      layoutAArchitectureV2Exits,

    spawnZones:
      bundle.spawnZones,

    configuration: {
      strategyId:
        "ADAPTIVE_HYBRID",

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

    replayIntervalSeconds:
      RESEARCH_TIMESTEP_SECONDS,

    replayObserver:
      (
        frame,
      ) => {
        frames.push(
          frame,
        );
      },
  });

const uniqueAgentsByEdge =
  new Map<
    string,
    Set<string>
  >();

const maximumConcurrentByEdge =
  new Map<
    string,
    number
  >();

for (
  const frame of
    frames
) {
  const concurrent =
    new Map<
      string,
      number
    >();

  for (
    const agent of
      frame.snapshot.agents
  ) {
    if (
      agent.status !==
        "ACTIVE" ||
      agent.currentEdgeId ===
        null
    ) {
      continue;
    }

    const set =
      uniqueAgentsByEdge.get(
        agent.currentEdgeId,
      ) ??
      new Set<string>();

    set.add(
      agent.id,
    );

    uniqueAgentsByEdge.set(
      agent.currentEdgeId,
      set,
    );

    concurrent.set(
      agent.currentEdgeId,
      (
        concurrent.get(
          agent.currentEdgeId,
        ) ??
        0
      ) +
        1,
    );
  }

  for (
    const [
      edgeId,
      count,
    ] of concurrent
  ) {
    maximumConcurrentByEdge.set(
      edgeId,
      Math.max(
        maximumConcurrentByEdge.get(
          edgeId,
        ) ??
          0,

        count,
      ),
    );
  }
}

function nearestFrame(
  targetTime:
    number,
): SimulationReplayFrame {
  let selected =
    frames[0];

  if (!selected) {
    throw new Error(
      "No replay frames were generated.",
    );
  }

  let bestDifference =
    Math.abs(
      selected.snapshot
        .simulationTimeSeconds -
        targetTime,
    );

  for (
    const frame of
      frames
  ) {
    const difference =
      Math.abs(
        frame.snapshot
          .simulationTimeSeconds -
          targetTime,
      );

    if (
      difference <
      bestDifference
    ) {
      selected =
        frame;

      bestDifference =
        difference;
    }
  }

  if (
    bestDifference >
    TIME_TOLERANCE
  ) {
    throw new Error(
      `No replay frame sufficiently close to t=${targetTime}.`,
    );
  }

  return selected;
}

function countActiveRemainingRoutesUsingEdge(
  frame:
    SimulationReplayFrame,
  edgeId:
    string,
): number {
  const activeAgentIds =
    new Set(
      frame
        .snapshot
        .agents
        .filter(
          (
            agent,
          ) =>
            agent.status ===
            "ACTIVE",
        )
        .map(
          (
            agent,
          ) =>
            agent.id,
        ),
    );

  return frame
    .routes
    .filter(
      (
        route,
      ) => {
        if (
          !activeAgentIds.has(
            route.agentId,
          )
        ) {
          return false;
        }

        const remainingEdges =
          route.edgeIds.slice(
            route.routeCursorIndex,
          );

        return remainingEdges.includes(
          edgeId,
        );
      },
    )
    .length;
}

const frameByInspectionTime =
  new Map(
    INSPECTION_TIMES.map(
      (
        time,
      ) =>
        [
          time,
          nearestFrame(
            time,
          ),
        ] as const,
    ),
  );

const records:
  EdgeUsageRecord[] =
  bundle.graph
    .edges
    /**
     * Exclude private room-origin stubs.
     *
     * D3 should represent a shared circulation blockage,
     * not one occupant's private room-origin edge.
     */
    .filter(
      (
        edge,
      ) =>
        !edge.id.startsWith(
          "room-origin-edge-",
        ),
    )
    .map(
      (
        edge,
      ) => {
        const routeCount =
          (
            time:
              typeof INSPECTION_TIMES[number],
          ) => {
            const frame =
              frameByInspectionTime.get(
                time,
              );

            if (!frame) {
              throw new Error(
                `Missing inspection frame t=${time}.`,
              );
            }

            return countActiveRemainingRoutesUsingEdge(
              frame,
              edge.id,
            );
          };

        return {
          edgeId:
            edge.id,

          zoneId:
            edge.zoneId,

          from:
            edge.from,

          to:
            edge.to,

          lengthMeters:
            Number(
              edge.lengthMeters.toFixed(
                2,
              ),
            ),

          widthMeters:
            edge.widthMeters,

          uniqueAgentsOnEdge:
            uniqueAgentsByEdge
              .get(
                edge.id,
              )
              ?.size ??
            0,

          maximumConcurrentAgents:
            maximumConcurrentByEdge.get(
              edge.id,
            ) ??
            0,

          routeUsersAtTime8:
            routeCount(
              8,
            ),

          routeUsersAtTime10:
            routeCount(
              10,
            ),

          routeUsersAtTime12:
            routeCount(
              12,
            ),

          routeUsersAtTime14:
            routeCount(
              14,
            ),

          routeUsersAtTime16:
            routeCount(
              16,
            ),

          routeUsersAtTime18:
            routeCount(
              18,
            ),
        };
      },
    )
    .filter(
      (
        record,
      ) =>
        record.uniqueAgentsOnEdge >
          0 ||
        record.routeUsersAtTime8 >
          0 ||
        record.routeUsersAtTime10 >
          0 ||
        record.routeUsersAtTime12 >
          0 ||
        record.routeUsersAtTime14 >
          0 ||
        record.routeUsersAtTime16 >
          0 ||
        record.routeUsersAtTime18 >
          0,
    )
    .sort(
      (
        first,
        second,
      ) => {
        const maximumRouteUseFirst =
          Math.max(
            first.routeUsersAtTime8,
            first.routeUsersAtTime10,
            first.routeUsersAtTime12,
            first.routeUsersAtTime14,
            first.routeUsersAtTime16,
            first.routeUsersAtTime18,
          );

        const maximumRouteUseSecond =
          Math.max(
            second.routeUsersAtTime8,
            second.routeUsersAtTime10,
            second.routeUsersAtTime12,
            second.routeUsersAtTime14,
            second.routeUsersAtTime16,
            second.routeUsersAtTime18,
          );

        if (
          maximumRouteUseSecond !==
          maximumRouteUseFirst
        ) {
          return (
            maximumRouteUseSecond -
            maximumRouteUseFirst
          );
        }

        if (
          second.uniqueAgentsOnEdge !==
          first.uniqueAgentsOnEdge
        ) {
          return (
            second.uniqueAgentsOnEdge -
            first.uniqueAgentsOnEdge
          );
        }

        return first.edgeId.localeCompare(
          second.edgeId,
        );
      },
    );

console.log(
  "\n=== ARCHITECTURE V2 BASELINE EDGE-USAGE PROFILE ===\n",
);

console.log(
  `Occupancy: ${result.metrics.totalAgents}`,
);

console.log(
  "Strategy: ADAPTIVE_HYBRID",
);

console.log(
  `TET: ${result.metrics.totalEvacuationTimeSeconds?.toFixed(2)} s`,
);

console.log(
  "\nEdges are ranked by remaining-route demand and observed traversal.\n",
);

console.table(
  records,
);

console.log(
  "\n=== END EDGE-USAGE PROFILE ===\n",
);