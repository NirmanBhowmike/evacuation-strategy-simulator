import type { AgentState } from "../types/agent";
import type { ScenarioInstance } from "../types/scenario";

/**
 * Creates fresh mutable runtime state from an immutable
 * ScenarioInstance.
 *
 * Each routing strategy must call this independently so that
 * strategies never share mutable occupant state.
 */
export function createInitialAgentStates(
  scenario: ScenarioInstance,
): AgentState[] {
  return scenario.occupants.map((occupant) => ({
    id: occupant.id,

    desiredSpeedMps:
      occupant.desiredSpeedMps,

    position: {
      x: occupant.spawnPosition.x,
      y: occupant.spawnPosition.y,
    },

    status: "ACTIVE",

    currentNodeId: null,
    currentEdgeId: null,

    routeNodeIds: [],
    routeCursorIndex: 0,

    targetExitId: null,

    rerouteCount: 0,
    distanceTraveledMeters: 0,
    hazardExposureSeconds: 0,

    evacuationTimeSeconds: null,
  }));
}