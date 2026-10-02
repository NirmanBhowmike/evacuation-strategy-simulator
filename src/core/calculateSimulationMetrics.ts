import type { AgentState } from "../types/agent";
import type { DensitySnapshot } from "../types/density";
import type { ExitSet } from "../types/exit";
import type {
  ExitUtilizationMetric,
  SimulationMetrics,
} from "../types/metrics";

function mean(
  values: readonly number[],
): number | null {
  if (values.length === 0) {
    return null;
  }

  const total =
    values.reduce(
      (sum, value) =>
        sum + value,
      0,
    );

  return total / values.length;
}

/**
 * Nearest-rank percentile.
 *
 * rank = ceil(p * n)
 *
 * This method is intentionally simple and deterministic for the
 * experiment pipeline.
 */
function nearestRankPercentile(
  values: readonly number[],
  percentile: number,
): number | null {
  if (values.length === 0) {
    return null;
  }

  if (
    !Number.isFinite(percentile) ||
    percentile <= 0 ||
    percentile > 1
  ) {
    throw new Error(
      "Percentile must be greater than zero and no greater than one.",
    );
  }

  const sorted =
    [...values].sort(
      (a, b) => a - b,
    );

  const rank =
    Math.ceil(
      percentile *
        sorted.length,
    );

  return (
    sorted[
      Math.max(
        0,
        rank - 1,
      )
    ] ?? null
  );
}

function calculateMaximumDensity(
  snapshots: readonly DensitySnapshot[],
): number | null {
  if (snapshots.length === 0) {
    return null;
  }

  let maximumDensity = 0;

  for (
    const snapshot of snapshots
  ) {
    for (
      const cell of snapshot.cells
    ) {
      if (
        !Number.isFinite(
          cell.densityPersonsPerSquareMeter,
        ) ||
        cell.densityPersonsPerSquareMeter < 0
      ) {
        throw new Error(
          "Density snapshots must contain non-negative finite densities.",
        );
      }

      maximumDensity =
        Math.max(
          maximumDensity,
          cell.densityPersonsPerSquareMeter,
        );
    }
  }

  return maximumDensity;
}

function validateAgents(
  agents: readonly AgentState[],
): void {
  const ids =
    new Set<string>();

  for (const agent of agents) {
    if (
      ids.has(agent.id)
    ) {
      throw new Error(
        `Duplicate agent id in metrics input: ${agent.id}`,
      );
    }

    ids.add(agent.id);

    if (
      !Number.isFinite(
        agent.hazardExposureSeconds,
      ) ||
      agent.hazardExposureSeconds < 0
    ) {
      throw new Error(
        `Agent ${agent.id} has invalid hazard exposure.`,
      );
    }

    if (
      !Number.isFinite(
        agent.distanceTraveledMeters,
      ) ||
      agent.distanceTraveledMeters < 0
    ) {
      throw new Error(
        `Agent ${agent.id} has invalid traveled distance.`,
      );
    }

    if (
      !Number.isInteger(
        agent.rerouteCount,
      ) ||
      agent.rerouteCount < 0
    ) {
      throw new Error(
        `Agent ${agent.id} has invalid reroute count.`,
      );
    }

    if (
      agent.status ===
      "EVACUATED"
    ) {
      if (
        agent.evacuationTimeSeconds ===
        null
      ) {
        throw new Error(
          `Evacuated agent ${agent.id} must have an evacuation time.`,
        );
      }

      if (
        !Number.isFinite(
          agent.evacuationTimeSeconds,
        ) ||
        agent.evacuationTimeSeconds < 0
      ) {
        throw new Error(
          `Agent ${agent.id} has invalid evacuation time.`,
        );
      }

      if (
        agent.targetExitId ===
        null
      ) {
        throw new Error(
          `Evacuated agent ${agent.id} must have a target exit.`,
        );
      }
    }
  }
}

export function calculateSimulationMetrics(
  agents: readonly AgentState[],
  exitSet: ExitSet,
  densitySnapshots: readonly DensitySnapshot[] = [],
): SimulationMetrics {
  validateAgents(
    agents,
  );

  const exitIds =
    new Set(
      exitSet.exits.map(
        (exit) => exit.id,
      ),
    );

  let evacuatedAgents = 0;
  let unreachableAgents = 0;
  let timeoutAgents = 0;
  let activeAgents = 0;

  let populationHazardExposure =
    0;

  let totalTravelDistance =
    0;

  let totalReroutes = 0;
  let reroutedAgents = 0;

  const evacuationTimes:
    number[] = [];

  const exitCounts =
    new Map<string, number>();

  for (
    const exit of
    exitSet.exits
  ) {
    exitCounts.set(
      exit.id,
      0,
    );
  }

  for (const agent of agents) {
    populationHazardExposure +=
      agent.hazardExposureSeconds;

    totalTravelDistance +=
      agent.distanceTraveledMeters;

    totalReroutes +=
      agent.rerouteCount;

    if (
      agent.rerouteCount > 0
    ) {
      reroutedAgents += 1;
    }

    switch (agent.status) {
      case "ACTIVE":
        activeAgents += 1;
        break;

      case "EVACUATED": {
        evacuatedAgents += 1;

        evacuationTimes.push(
          agent.evacuationTimeSeconds!,
        );

        const exitId =
          agent.targetExitId!;

        if (
          !exitIds.has(exitId)
        ) {
          throw new Error(
            `Evacuated agent ${agent.id} references unknown exit ${exitId}.`,
          );
        }

        exitCounts.set(
          exitId,
          (exitCounts.get(
            exitId,
          ) ?? 0) + 1,
        );

        break;
      }

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

  const totalAgents =
    agents.length;

  const completionRate =
    totalAgents === 0
      ? 1
      : evacuatedAgents /
        totalAgents;

  const latestEvacuationTimeSeconds =
    evacuationTimes.length === 0
      ? null
      : Math.max(
          ...evacuationTimes,
        );

  const allAgentsEvacuated =
    totalAgents > 0 &&
    evacuatedAgents ===
      totalAgents;

  const totalEvacuationTimeSeconds =
    allAgentsEvacuated
      ? latestEvacuationTimeSeconds
      : null;

  const meanEvacuationTimeSeconds =
    mean(
      evacuationTimes,
    );

  const p95EvacuationTimeSeconds =
    nearestRankPercentile(
      evacuationTimes,
      0.95,
    );

  const meanHazardExposureSeconds =
    totalAgents === 0
      ? 0
      : populationHazardExposure /
        totalAgents;

  const meanTravelDistanceMeters =
    totalAgents === 0
      ? 0
      : totalTravelDistance /
        totalAgents;

  const meanReroutesPerAgent =
    totalAgents === 0
      ? 0
      : totalReroutes /
        totalAgents;

  const fractionRerouted =
    totalAgents === 0
      ? 0
      : reroutedAgents /
        totalAgents;

  const maximumLocalDensityPersonsPerSquareMeter =
    calculateMaximumDensity(
      densitySnapshots,
    );

  const exitUtilization:
    ExitUtilizationMetric[] =
      exitSet.exits.map(
        (exit) => {
          const count =
            exitCounts.get(
              exit.id,
            ) ?? 0;

          return {
            exitId:
              exit.id,

            evacuatedAgents:
              count,

            fractionOfEvacuatedAgents:
              evacuatedAgents ===
              0
                ? 0
                : count /
                  evacuatedAgents,
          };
        },
      );

  return {
    totalAgents,

    evacuatedAgents,
    unreachableAgents,
    timeoutAgents,
    activeAgents,

    completionRate,

    totalEvacuationTimeSeconds,

    latestEvacuationTimeSeconds,

    meanEvacuationTimeSeconds,

    p95EvacuationTimeSeconds,

    populationHazardExposurePersonSeconds:
      populationHazardExposure,

    meanHazardExposureSeconds,

    meanTravelDistanceMeters,

    totalReroutes,

    meanReroutesPerAgent,

    fractionRerouted,

    maximumLocalDensityPersonsPerSquareMeter,

    exitUtilization,
  };
}