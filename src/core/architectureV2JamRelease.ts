import {
  ARCHITECTURE_V2_LAYOUT_ID,
} from "./calculateDensity";

import {
  calculateAgentEffectiveSpeedMps,
  calculateCongestionSpeedFactor,
  WEIDMANN_JAM_DENSITY_PPM2,
} from "./congestionEffects";

import type {
  AgentState,
} from "../types/agent";

import type {
  DensityCell,
  DensitySnapshot,
} from "../types/density";

import type {
  NavigationEdge,
  NavigationGraph,
  NavigationNode,
} from "../types/navigation";

export const ARCHITECTURE_V2_JAM_RELEASE_MODEL_VERSION =
  "downstream-receiving-jam-release-v1";

export interface ArchitectureV2JamReleaseContext {
  readonly releaseAgentIds:
    ReadonlySet<string>;

  readonly receivingDensityByAgentId:
    ReadonlyMap<string, number>;
}

interface JammedAgentCandidate {
  readonly agent:
    AgentState;

  readonly cell:
    DensityCell;

  readonly projectedDistanceMeters:
    number;

  readonly direction:
    1 | -1;
}

function getNode(
  graph:
    NavigationGraph,
  nodeId:
    string,
): NavigationNode {
  const node =
    graph.nodes.find(
      (candidate) =>
        candidate.id === nodeId,
    );

  if (!node) {
    throw new Error(
      `Navigation node not found: ${nodeId}`,
    );
  }

  return node;
}

function getEdge(
  graph:
    NavigationGraph,
  edgeId:
    string,
): NavigationEdge {
  const edge =
    graph.edges.find(
      (candidate) =>
        candidate.id === edgeId,
    );

  if (!edge) {
    throw new Error(
      `Navigation edge not found: ${edgeId}`,
    );
  }

  return edge;
}

function projectedDistanceFromEdgeStart(
  agent:
    AgentState,
  edge:
    NavigationEdge,
  graph:
    NavigationGraph,
): number {
  const fromNode =
    getNode(
      graph,
      edge.from,
    );

  const toNode =
    getNode(
      graph,
      edge.to,
    );

  const dx =
    toNode.position.x -
    fromNode.position.x;

  const dy =
    toNode.position.y -
    fromNode.position.y;

  const geometricLength =
    Math.hypot(
      dx,
      dy,
    );

  if (
    geometricLength <=
    0
  ) {
    throw new Error(
      `Navigation edge ${edge.id} has zero geometric length.`,
    );
  }

  const unitX =
    dx /
    geometricLength;

  const unitY =
    dy /
    geometricLength;

  const relativeX =
    agent.position.x -
    fromNode.position.x;

  const relativeY =
    agent.position.y -
    fromNode.position.y;

  const projected =
    relativeX *
      unitX +
    relativeY *
      unitY;

  return Math.min(
    edge.lengthMeters,
    Math.max(
      0,
      projected,
    ),
  );
}

function getAgentTraversalDirection(
  agent:
    AgentState,
  edge:
    NavigationEdge,
): 1 | -1 {
  if (
    agent.currentNodeId ===
    edge.from
  ) {
    return 1;
  }

  if (
    agent.currentNodeId ===
    edge.to
  ) {
    if (
      !edge.bidirectional
    ) {
      throw new Error(
        `Agent ${agent.id} cannot traverse edge ${edge.id} in reverse.`,
      );
    }

    return -1;
  }

  throw new Error(
    `Agent ${agent.id} does not have a valid origin node for edge ${edge.id}.`,
  );
}

function getAgentDensityCell(
  agent:
    AgentState,
  graph:
    NavigationGraph,
  snapshot:
    DensitySnapshot,
): DensityCell | null {
  if (
    agent.status !==
      "ACTIVE" ||
    agent.currentEdgeId ===
      null
  ) {
    return null;
  }

  const edge =
    getEdge(
      graph,
      agent.currentEdgeId,
    );

  const projectedDistance =
    projectedDistanceFromEdgeStart(
      agent,
      edge,
      graph,
    );

  const edgeCells =
    snapshot.cells
      .filter(
        (cell) =>
          cell.edgeId ===
          edge.id,
      )
      .sort(
        (first, second) =>
          first.cellIndex -
          second.cellIndex,
      );

  const tolerance =
    1e-9;

  for (
    let index =
      0;
    index <
      edgeCells.length;
    index +=
      1
  ) {
    const cell =
      edgeCells[index]!;

    const endDistance =
      cell.startDistanceMeters +
      cell.lengthMeters;

    const isLast =
      index ===
      edgeCells.length -
        1;

    const afterStart =
      projectedDistance +
        tolerance >=
      cell.startDistanceMeters;

    const beforeEnd =
      isLast
        ? projectedDistance <=
          endDistance +
            tolerance
        : projectedDistance <
          endDistance;

    if (
      afterStart &&
      beforeEnd
    ) {
      return cell;
    }
  }

  throw new Error(
    `Density cell not found for agent ${agent.id} on edge ${edge.id}.`,
  );
}

function createEmptyContext():
  ArchitectureV2JamReleaseContext {
  return {
    releaseAgentIds:
      new Set<string>(),

    receivingDensityByAgentId:
      new Map<string, number>(),
  };
}

/**
 * Architecture V2 jam-release rule.
 *
 * The ordinary Weidmann speed-density relationship remains
 * authoritative below jam density.
 *
 * At or above jam density, applying zero speed to every agent
 * in the same discretized cell can create an absorbing numerical
 * state: nobody moves, density cannot fall, and the jam can never
 * discharge.
 *
 * For each jammed cell and direction of travel, this rule identifies
 * the downstream-most agent. If the immediately downstream cell,
 * or the node beyond the end of the edge, has receiving capacity
 * below the Weidmann jam density, that lead agent may discharge
 * using the speed implied by the receiving density.
 *
 * Other occupants of the jammed cell remain at zero speed until
 * downstream space becomes available.
 *
 * This is deliberately limited to Architecture V2 and does not
 * change the frozen legacy density implementation.
 */
export function createArchitectureV2JamReleaseContext(
  agents:
    readonly AgentState[],
  graph:
    NavigationGraph,
  snapshot:
    DensitySnapshot,
): ArchitectureV2JamReleaseContext {
  if (
    graph.layoutId !==
      ARCHITECTURE_V2_LAYOUT_ID ||
    snapshot.partitionMode !==
      "BALANCED"
  ) {
    return createEmptyContext();
  }

  const groupedCandidates =
    new Map<
      string,
      JammedAgentCandidate[]
    >();

  for (
    const agent of
      agents
  ) {
    if (
      agent.status !==
        "ACTIVE" ||
      agent.currentEdgeId ===
        null
    ) {
      continue;
    }

    const cell =
      getAgentDensityCell(
        agent,
        graph,
        snapshot,
      );

    if (
      !cell ||
      cell
        .densityPersonsPerSquareMeter <
        WEIDMANN_JAM_DENSITY_PPM2
    ) {
      continue;
    }

    const edge =
      getEdge(
        graph,
        agent.currentEdgeId,
      );

    const direction =
      getAgentTraversalDirection(
        agent,
        edge,
      );

    const projectedDistanceMeters =
      projectedDistanceFromEdgeStart(
        agent,
        edge,
        graph,
      );

    const key =
      [
        edge.id,
        cell.cellIndex,
        direction,
      ].join(
        "|",
      );

    const existing =
      groupedCandidates.get(
        key,
      ) ?? [];

    existing.push({
      agent,
      cell,
      projectedDistanceMeters,
      direction,
    });

    groupedCandidates.set(
      key,
      existing,
    );
  }

  const releaseAgentIds =
    new Set<string>();

  const receivingDensityByAgentId =
    new Map<
      string,
      number
    >();

  for (
    const candidates of
      groupedCandidates.values()
  ) {
    if (
      candidates.length ===
      0
    ) {
      continue;
    }

    const direction =
      candidates[0]!
        .direction;

    const ordered =
      [
        ...candidates,
      ].sort(
        (
          first,
          second,
        ) => {
          const positionalDifference =
            direction ===
              1
              ? second
                  .projectedDistanceMeters -
                first
                  .projectedDistanceMeters
              : first
                  .projectedDistanceMeters -
                second
                  .projectedDistanceMeters;

          if (
            Math.abs(
              positionalDifference,
            ) >
            1e-9
          ) {
            return positionalDifference;
          }

          return first
            .agent.id
            .localeCompare(
              second.agent.id,
            );
        },
      );

    const leader =
      ordered[0]!;

    const edgeId =
      leader.cell.edgeId;

    const receivingCellIndex =
      leader.cell.cellIndex +
      direction;

    const receivingCell =
      snapshot.cells.find(
        (cell) =>
          cell.edgeId ===
            edgeId &&
          cell.cellIndex ===
            receivingCellIndex,
      );

    /**
     * Crossing beyond the last density cell means the agent is
     * approaching the navigation node at the end of the edge.
     * Nodes are not represented as edge-density cells, so the
     * receiving density is treated as zero. Admission to the next
     * edge remains controlled independently by the bottleneck
     * flow controller.
     */
    const receivingDensity =
      receivingCell
        ?.densityPersonsPerSquareMeter ??
      0;

    if (
      receivingDensity >=
      WEIDMANN_JAM_DENSITY_PPM2
    ) {
      continue;
    }

    releaseAgentIds.add(
      leader.agent.id,
    );

    receivingDensityByAgentId.set(
      leader.agent.id,
      receivingDensity,
    );
  }

  return {
    releaseAgentIds,
    receivingDensityByAgentId,
  };
}

export function calculateArchitectureV2JamReleaseSpeedMps(
  agent:
    AgentState,
  graph:
    NavigationGraph,
  snapshot:
    DensitySnapshot,
  context:
    ArchitectureV2JamReleaseContext,
): number {
  const ordinarySpeed =
    calculateAgentEffectiveSpeedMps(
      agent,
      graph,
      snapshot,
    );

  if (
    ordinarySpeed >
      0 ||
    graph.layoutId !==
      ARCHITECTURE_V2_LAYOUT_ID ||
    snapshot.partitionMode !==
      "BALANCED"
  ) {
    return ordinarySpeed;
  }

  if (
    !context
      .releaseAgentIds
      .has(
        agent.id,
      )
  ) {
    return 0;
  }

  const receivingDensity =
    context
      .receivingDensityByAgentId
      .get(
        agent.id,
      );

  if (
    receivingDensity ===
    undefined
  ) {
    throw new Error(
      `Jam-release receiving density missing for agent ${agent.id}.`,
    );
  }

  const receivingSpeedFactor =
    calculateCongestionSpeedFactor(
      receivingDensity,
    );

  return (
    agent.desiredSpeedMps *
    receivingSpeedFactor
  );
}