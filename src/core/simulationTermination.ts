import type { AgentState } from "../types/agent";
import type { SimulationTerminationStatus } from "../types/termination";

function validateSimulationTimes(
  simulationTimeSeconds: number,
  maximumSimulationTimeSeconds: number,
): void {
  if (
    !Number.isFinite(
      simulationTimeSeconds,
    ) ||
    simulationTimeSeconds < 0
  ) {
    throw new Error(
      "Simulation time must be non-negative and finite.",
    );
  }

  if (
    !Number.isFinite(
      maximumSimulationTimeSeconds,
    ) ||
    maximumSimulationTimeSeconds <= 0
  ) {
    throw new Error(
      "Maximum simulation time must be positive and finite.",
    );
  }
}

function createStatusSummary(
  agents: readonly AgentState[],
): Omit<
  SimulationTerminationStatus,
  "isTerminated" | "reason"
> {
  let activeAgents = 0;
  let evacuatedAgents = 0;
  let unreachableAgents = 0;
  let timeoutAgents = 0;

  for (const agent of agents) {
    switch (agent.status) {
      case "ACTIVE":
        activeAgents += 1;
        break;

      case "EVACUATED":
        evacuatedAgents += 1;
        break;

      case "UNREACHABLE":
        unreachableAgents += 1;
        break;

      case "TIMEOUT":
        timeoutAgents += 1;
        break;

      default: {
        const unreachable: never =
          agent.status;

        throw new Error(
          `Unsupported agent status: ${String(
            unreachable,
          )}`,
        );
      }
    }
  }

  return {
    totalAgents:
      agents.length,

    activeAgents,

    evacuatedAgents,

    unreachableAgents,

    timeoutAgents,
  };
}

/**
 * Evaluates and applies simulation termination rules.
 *
 * Normal termination:
 *
 * Every agent is either EVACUATED or UNREACHABLE.
 *
 * Defensive termination:
 *
 * If the maximum simulation time is reached while ACTIVE agents
 * remain, those agents are explicitly marked TIMEOUT.
 *
 * TIMEOUT agents are never counted as evacuated.
 */
export function updateSimulationTermination(
  agents: AgentState[],
  simulationTimeSeconds: number,
  maximumSimulationTimeSeconds: number,
): SimulationTerminationStatus {
  validateSimulationTimes(
    simulationTimeSeconds,
    maximumSimulationTimeSeconds,
  );

  let summary =
    createStatusSummary(
      agents,
    );

  /**
   * A population with no ACTIVE agents is already resolved.
   *
   * If one or more agents were previously marked TIMEOUT, retain
   * TIMEOUT as the run-level termination reason.
   */
  if (
    summary.activeAgents === 0
  ) {
    return {
      ...summary,

      isTerminated: true,

      reason:
        summary.timeoutAgents > 0
          ? "TIMEOUT"
          : "ALL_RESOLVED",
    };
  }

  const tolerance = 1e-9;

  const timeoutReached =
    simulationTimeSeconds +
      tolerance >=
    maximumSimulationTimeSeconds;

  if (!timeoutReached) {
    return {
      ...summary,

      isTerminated: false,

      reason: null,
    };
  }

  /**
   * The defensive time ceiling has been reached.
   *
   * Every remaining ACTIVE agent receives an explicit TIMEOUT
   * status. We do not manufacture evacuation times or classify
   * these occupants as successfully evacuated.
   */
  for (const agent of agents) {
    if (
      agent.status !==
      "ACTIVE"
    ) {
      continue;
    }

    agent.status =
      "TIMEOUT";

    agent.currentEdgeId =
      null;

    agent.routeNodeIds = [];

    agent.routeCursorIndex = 0;

    agent.evacuationTimeSeconds =
      null;
  }

  summary =
    createStatusSummary(
      agents,
    );

  return {
    ...summary,

    isTerminated: true,

    reason: "TIMEOUT",
  };
}