import { DynamicDisruptionController } from "./DynamicDisruptionController";
import { HazardField } from "./HazardField";

import type { DensitySnapshot } from "../types/density";
import type { ExitSet } from "../types/exit";
import type {
  NavigationGraph,
  NavigationNodeId,
} from "../types/navigation";
import type {
  RoutingQueueDelayByEdge,
  RoutingStrategyContext,
} from "../types/routingStrategy";

function validateLayouts(
  graph: NavigationGraph,
  exits: ExitSet,
  hazardField: HazardField,
): void {
  if (
    graph.layoutId !==
      exits.layoutId ||
    graph.layoutId !==
      hazardField.layoutId
  ) {
    throw new Error(
      "Navigation graph, exit set, and hazard field must use the same layout.",
    );
  }
}

function validateStartNode(
  graph: NavigationGraph,
  startNodeId:
    NavigationNodeId,
): void {
  const exists =
    graph.nodes.some(
      (node) =>
        node.id ===
        startNodeId,
    );

  if (!exists) {
    throw new Error(
      `Navigation node not found: ${startNodeId}`,
    );
  }
}

function copyDensitySnapshot(
  snapshot: DensitySnapshot,
): DensitySnapshot {
  if (
    !Number.isFinite(
      snapshot.cellLengthMeters,
    ) ||
    snapshot.cellLengthMeters <= 0
  ) {
    throw new Error(
      "Density snapshot cell length must be positive and finite.",
    );
  }

  const cells =
    snapshot.cells.map(
      (cell) => {
        if (
          !Number.isFinite(
            cell.densityPersonsPerSquareMeter,
          ) ||
          cell.densityPersonsPerSquareMeter <
            0
        ) {
          throw new Error(
            `Density cell on edge ${cell.edgeId} must have non-negative finite density.`,
          );
        }

        return Object.freeze({
          edgeId:
            cell.edgeId,

          cellIndex:
            cell.cellIndex,

          startDistanceMeters:
            cell.startDistanceMeters,

          lengthMeters:
            cell.lengthMeters,

          widthMeters:
            cell.widthMeters,

          occupantCount:
            cell.occupantCount,

          densityPersonsPerSquareMeter:
            cell.densityPersonsPerSquareMeter,
        });
      },
    );

  return Object.freeze({
    cellLengthMeters:
      snapshot.cellLengthMeters,

    cells:
      Object.freeze(cells),
  });
}

function copyQueueDelays(
  graph: NavigationGraph,
  queueDelayByEdge:
    RoutingQueueDelayByEdge,
): RoutingQueueDelayByEdge {
  const edgeIds =
    new Set(
      graph.edges.map(
        (edge) => edge.id,
      ),
    );

  const copy:
    Record<string, number> = {};

  for (
    const [
      edgeId,
      delaySeconds,
    ] of Object.entries(
      queueDelayByEdge,
    )
  ) {
    if (
      !edgeIds.has(edgeId)
    ) {
      throw new Error(
        `Queue-delay input references unknown edge: ${edgeId}`,
      );
    }

    if (
      !Number.isFinite(
        delaySeconds,
      ) ||
      delaySeconds < 0
    ) {
      throw new Error(
        `Queue delay for edge ${edgeId} must be non-negative and finite.`,
      );
    }

    copy[edgeId] =
      delaySeconds;
  }

  return Object.freeze(
    copy,
  );
}

/**
 * Builds the standardized information package supplied to every
 * routing strategy.
 *
 * The function extracts only CURRENT dynamic state from the
 * simulation engine.
 *
 * The returned context contains no ScenarioInstance and no
 * DynamicDisruptionController reference, so strategy
 * implementations cannot inspect scheduled future disruptions
 * through the common routing API.
 */
export function createRoutingStrategyContext(
  startNodeId:
    NavigationNodeId,
  graph:
    NavigationGraph,
  exits:
    ExitSet,
  hazardField:
    HazardField,
  disruptions:
    DynamicDisruptionController,
  densitySnapshot:
    DensitySnapshot,
  queueDelayByEdge:
    RoutingQueueDelayByEdge = {},
): RoutingStrategyContext {
  validateLayouts(
    graph,
    exits,
    hazardField,
  );

  validateStartNode(
    graph,
    startNodeId,
  );

  const hazardSnapshot =
    hazardField.createSnapshot();

  const hazardZones =
    hazardSnapshot.zones.map(
      (zone) =>
        Object.freeze({
          zoneId:
            zone.zoneId,

          state:
            zone.state,
        }),
    );

  const blockedExitIds =
    [
      ...disruptions
        .getBlockedExitIds(),
    ].sort(
      (first, second) =>
        first.localeCompare(
          second,
        ),
    );

  const current =
    Object.freeze({
      hazardZones:
        Object.freeze(
          hazardZones,
        ),

      blockedExitIds:
        Object.freeze(
          blockedExitIds,
        ),

      densitySnapshot:
        copyDensitySnapshot(
          densitySnapshot,
        ),

      queueDelayByEdge:
        copyQueueDelays(
          graph,
          queueDelayByEdge,
        ),
    });

  return Object.freeze({
    layoutId:
      graph.layoutId,

    startNodeId,

    graph,

    exits,

    current,
  });
}