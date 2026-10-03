import type {
  AgentState,
} from "../types/agent";

import type {
  AppliedDisruptionRecord,
} from "../types/headlessSimulation";

import type {
  RoutingPath,
} from "../types/routing";

import type {
  SimulationReplayFrame,
  SimulationReplayMetrics,
  SimulationReplayRoute,
} from "../types/simulationReplay";

import type {
  SimulationSnapshot,
} from "../types/simulationSnapshot";

export interface CreateSimulationReplayFrameInput {
  readonly snapshot:
    SimulationSnapshot;

  readonly tick:
    number;

  readonly agents:
    readonly AgentState[];

  readonly routeByAgentId:
    ReadonlyMap<
      string,
      RoutingPath
    >;

  readonly queueWaitByAgent:
    ReadonlyMap<
      string,
      number
    >;

  readonly appliedDisruptions:
    readonly AppliedDisruptionRecord[];

  readonly triggeredDisruptions:
    readonly AppliedDisruptionRecord[];

  readonly isTerminal:
    boolean;
}

function createRoutes(
  agents:
    readonly AgentState[],
  routeByAgentId:
    ReadonlyMap<
      string,
      RoutingPath
    >,
): readonly SimulationReplayRoute[] {
  return Object.freeze(
    [...agents]
      .sort(
        (
          first,
          second,
        ) =>
          first.id.localeCompare(
            second.id,
          ),
      )
      .map(
        (
          agent,
        ) => {
          const path =
            routeByAgentId.get(
              agent.id,
            );

          return Object.freeze({
            agentId:
              agent.id,

            targetExitId:
              agent.targetExitId,

            routeCursorIndex:
              agent.routeCursorIndex,

            nodeIds:
              Object.freeze(
                path
                  ? [
                      ...path.nodeIds,
                    ]
                  : [],
              ),

            edgeIds:
              Object.freeze(
                path
                  ? [
                      ...path.edgeIds,
                    ]
                  : [],
              ),
          });
        },
      ),
  );
}

function calculateMetrics(
  agents:
    readonly AgentState[],
  queueWaitByAgent:
    ReadonlyMap<
      string,
      number
    >,
): SimulationReplayMetrics {
  let activeAgents =
    0;

  let evacuatedAgents =
    0;

  let unreachableAgents =
    0;

  let timeoutAgents =
    0;

  let populationHazardExposurePersonSeconds =
    0;

  let populationQueueWaitPersonSeconds =
    0;

  let totalReroutes =
    0;

  for (
    const agent of
      agents
  ) {
    switch (
      agent.status
    ) {
      case "ACTIVE":
        activeAgents +=
          1;
        break;

      case "EVACUATED":
        evacuatedAgents +=
          1;
        break;

      case "UNREACHABLE":
        unreachableAgents +=
          1;
        break;

      case "TIMEOUT":
        timeoutAgents +=
          1;
        break;

      default: {
        const unreachable:
          never =
            agent.status;

        throw new Error(
          `Unsupported agent status: ${String(
            unreachable,
          )}`,
        );
      }
    }

    populationHazardExposurePersonSeconds +=
      agent
        .hazardExposureSeconds;

    populationQueueWaitPersonSeconds +=
      queueWaitByAgent.get(
        agent.id,
      ) ?? 0;

    totalReroutes +=
      agent.rerouteCount;
  }

  return Object.freeze({
    totalAgents:
      agents.length,

    activeAgents,

    evacuatedAgents,

    unreachableAgents,

    timeoutAgents,

    populationHazardExposurePersonSeconds,

    populationQueueWaitPersonSeconds,

    totalReroutes,
  });
}

function copyDisruptions(
  events:
    readonly AppliedDisruptionRecord[],
): readonly AppliedDisruptionRecord[] {
  return Object.freeze(
    events.map(
      (
        event,
      ) =>
        Object.freeze({
          ...event,
        }),
    ),
  );
}

export function createSimulationReplayFrame(
  input:
    CreateSimulationReplayFrameInput,
): SimulationReplayFrame {
  if (
    !Number.isInteger(
      input.tick,
    ) ||
    input.tick < 0
  ) {
    throw new Error(
      "Replay frame tick must be a non-negative integer.",
    );
  }

  return Object.freeze({
    snapshot:
      input.snapshot,

    tick:
      input.tick,

    routes:
      createRoutes(
        input.agents,
        input.routeByAgentId,
      ),

    appliedDisruptions:
      copyDisruptions(
        input.appliedDisruptions,
      ),

    triggeredDisruptions:
      copyDisruptions(
        input.triggeredDisruptions,
      ),

    metrics:
      calculateMetrics(
        input.agents,
        input
          .queueWaitByAgent,
      ),

    isTerminal:
      input.isTerminal,
  });
}