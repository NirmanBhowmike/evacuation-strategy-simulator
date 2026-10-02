import type { AgentState } from "../types/agent";

export function validateAgentStates(
  states: readonly AgentState[],
): void {
  const ids = new Set<string>();

  for (const state of states) {
    if (!state.id.trim()) {
      throw new Error(
        "Every agent state requires an id.",
      );
    }

    if (ids.has(state.id)) {
      throw new Error(
        `Duplicate agent-state id: ${state.id}`,
      );
    }

    ids.add(state.id);

    if (
      !Number.isFinite(state.position.x) ||
      !Number.isFinite(state.position.y)
    ) {
      throw new Error(
        `Agent ${state.id} has a non-finite position.`,
      );
    }

    if (
      !Number.isFinite(
        state.desiredSpeedMps,
      ) ||
      state.desiredSpeedMps <= 0
    ) {
      throw new Error(
        `Agent ${state.id} must have a positive finite desired speed.`,
      );
    }

    if (
      !Number.isInteger(
        state.routeCursorIndex,
      ) ||
      state.routeCursorIndex < 0 ||
      state.routeCursorIndex >
        state.routeNodeIds.length
    ) {
      throw new Error(
        `Agent ${state.id} has an invalid route cursor index.`,
      );
    }

    if (
      state.currentNodeId !== null &&
      !state.currentNodeId.trim()
    ) {
      throw new Error(
        `Agent ${state.id} has an invalid current node id.`,
      );
    }

    if (
      state.currentEdgeId !== null &&
      !state.currentEdgeId.trim()
    ) {
      throw new Error(
        `Agent ${state.id} has an invalid current edge id.`,
      );
    }

    if (
      state.targetExitId !== null &&
      !state.targetExitId.trim()
    ) {
      throw new Error(
        `Agent ${state.id} has an invalid target exit id.`,
      );
    }

    if (
      !Number.isInteger(
        state.rerouteCount,
      ) ||
      state.rerouteCount < 0
    ) {
      throw new Error(
        `Agent ${state.id} must have a non-negative integer reroute count.`,
      );
    }

    if (
      !Number.isFinite(
        state.distanceTraveledMeters,
      ) ||
      state.distanceTraveledMeters < 0
    ) {
      throw new Error(
        `Agent ${state.id} must have a non-negative finite traveled distance.`,
      );
    }

    if (
      !Number.isFinite(
        state.hazardExposureSeconds,
      ) ||
      state.hazardExposureSeconds < 0
    ) {
      throw new Error(
        `Agent ${state.id} must have non-negative finite hazard exposure.`,
      );
    }

    if (
      state.evacuationTimeSeconds !== null &&
      (
        !Number.isFinite(
          state.evacuationTimeSeconds,
        ) ||
        state.evacuationTimeSeconds < 0
      )
    ) {
      throw new Error(
        `Agent ${state.id} has an invalid evacuation time.`,
      );
    }
  }
}