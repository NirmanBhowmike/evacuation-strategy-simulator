import type { AgentState } from "../types/agent";
import type { SimulationSnapshot } from "../types/simulationSnapshot";

import { DynamicDisruptionController } from "./DynamicDisruptionController";
import { HazardField } from "./HazardField";

/**
 * Creates a renderer-safe representation of simulation state.
 *
 * The returned snapshot contains copied plain data only.
 *
 * A future 2D or 3D visualization layer should consume this
 * snapshot rather than receiving mutable engine objects.
 */
export function createSimulationSnapshot(
  layoutId: string,
  simulationTimeSeconds: number,
  agents: readonly AgentState[],
  hazardField: HazardField,
  disruptions: DynamicDisruptionController,
): SimulationSnapshot {
  if (!layoutId.trim()) {
    throw new Error(
      "Simulation snapshot layout id is required.",
    );
  }

  if (
    hazardField.layoutId !==
    layoutId
  ) {
    throw new Error(
      "Hazard field layout must match the simulation snapshot layout.",
    );
  }

  if (
    !Number.isFinite(
      simulationTimeSeconds,
    ) ||
    simulationTimeSeconds < 0
  ) {
    throw new Error(
      "Simulation snapshot time must be non-negative and finite.",
    );
  }

  const hazardSnapshot =
    hazardField.createSnapshot();

  return {
    layoutId,

    simulationTimeSeconds,

    agents:
      agents.map(
        (agent) => ({
          id:
            agent.id,

          position: {
            x:
              agent.position.x,

            y:
              agent.position.y,
          },

          status:
            agent.status,

          desiredSpeedMps:
            agent.desiredSpeedMps,

          currentNodeId:
            agent.currentNodeId,

          currentEdgeId:
            agent.currentEdgeId,

          targetExitId:
            agent.targetExitId,

          rerouteCount:
            agent.rerouteCount,

          distanceTraveledMeters:
            agent.distanceTraveledMeters,

          hazardExposureSeconds:
            agent.hazardExposureSeconds,

          evacuationTimeSeconds:
            agent.evacuationTimeSeconds,
        }),
      ),

    hazardZones:
      hazardSnapshot.zones.map(
        (zone) => ({
          zoneId:
            zone.zoneId,

          state:
            zone.state,
        }),
      ),

    blockedExitIds:
      [
        ...disruptions
          .getBlockedExitIds(),
      ],
  };
}