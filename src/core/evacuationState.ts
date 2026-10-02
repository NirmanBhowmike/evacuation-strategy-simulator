import type { AgentState } from "../types/agent";
import type { ExitId, ExitSet } from "../types/exit";
import type { NavigationGraph } from "../types/navigation";

import { DynamicDisruptionController } from "./DynamicDisruptionController";
import { HazardField } from "./HazardField";

export type EvacuationStateTransition =
  | "NO_CHANGE"
  | "EVACUATED"
  | "UNREACHABLE";

function validateLayouts(
  graph: NavigationGraph,
  exits: ExitSet,
  hazardField: HazardField,
): void {
  if (
    graph.layoutId !== exits.layoutId ||
    graph.layoutId !== hazardField.layoutId
  ) {
    throw new Error(
      "Navigation graph, exit set, and hazard field must use the same layout.",
    );
  }
}

/**
 * Returns all exits that are currently available.
 *
 * EXIT_BLOCK disruptions are respected.
 */
export function getAvailableExitIds(
  exits: ExitSet,
  disruptions: DynamicDisruptionController,
): readonly ExitId[] {
  return exits.exits
    .filter((exit) =>
      disruptions.isExitAvailable(exit.id),
    )
    .map((exit) => exit.id);
}

/**
 * Returns the currently available exits reachable from a
 * navigation node.
 *
 * BLOCKED hazard zones remove their associated edges from the
 * usable navigation network.
 */
export function findReachableAvailableExitIds(
  startNodeId: string,
  graph: NavigationGraph,
  exits: ExitSet,
  hazardField: HazardField,
  disruptions: DynamicDisruptionController,
): readonly ExitId[] {
  validateLayouts(
    graph,
    exits,
    hazardField,
  );

  const startNode = graph.nodes.find(
    (node) =>
      node.id === startNodeId,
  );

  if (!startNode) {
    throw new Error(
      `Navigation node not found: ${startNodeId}`,
    );
  }

  const availableExitIds =
    new Set(
      getAvailableExitIds(
        exits,
        disruptions,
      ),
    );

  if (
    availableExitIds.size === 0
  ) {
    return [];
  }

  const adjacency =
    new Map<string, string[]>();

  for (const node of graph.nodes) {
    adjacency.set(
      node.id,
      [],
    );
  }

  for (const edge of graph.edges) {
    if (
      !hazardField.isEdgeTraversable(
        edge,
      )
    ) {
      continue;
    }

    adjacency
      .get(edge.from)
      ?.push(edge.to);

    if (edge.bidirectional) {
      adjacency
        .get(edge.to)
        ?.push(edge.from);
    }
  }

  const visited =
    new Set<string>();

  const queue: string[] = [
    startNodeId,
  ];

  visited.add(
    startNodeId,
  );

  while (
    queue.length > 0
  ) {
    const current =
      queue.shift()!;

    for (
      const next of
        adjacency.get(current) ?? []
    ) {
      if (
        visited.has(next)
      ) {
        continue;
      }

      visited.add(next);
      queue.push(next);
    }
  }

  return exits.exits
    .filter(
      (exit) =>
        availableExitIds.has(
          exit.id,
        ) &&
        visited.has(
          exit.id,
        ),
    )
    .map(
      (exit) => exit.id,
    );
}

/**
 * Marks an ACTIVE agent as EVACUATED when the agent has reached
 * an available EXIT node.
 *
 * The agent must no longer be traversing an edge.
 */
export function completeEvacuationAtCurrentNode(
  agent: AgentState,
  graph: NavigationGraph,
  exits: ExitSet,
  disruptions: DynamicDisruptionController,
  simulationTimeSeconds: number,
): boolean {
  if (
    !Number.isFinite(
      simulationTimeSeconds,
    ) ||
    simulationTimeSeconds < 0
  ) {
    throw new Error(
      "Evacuation time must be non-negative and finite.",
    );
  }

  if (
    graph.layoutId !==
    exits.layoutId
  ) {
    throw new Error(
      "Navigation graph and exit set must use the same layout.",
    );
  }

  if (
    agent.status !==
    "ACTIVE"
  ) {
    return false;
  }

  if (
    agent.currentEdgeId !==
    null
  ) {
    return false;
  }

  if (
    agent.currentNodeId ===
    null
  ) {
    return false;
  }

  const node =
    graph.nodes.find(
      (candidate) =>
        candidate.id ===
        agent.currentNodeId,
    );

  if (!node) {
    throw new Error(
      `Navigation node not found: ${agent.currentNodeId}`,
    );
  }

  if (
    node.type !== "EXIT"
  ) {
    return false;
  }

  const exit =
    exits.exits.find(
      (candidate) =>
        candidate.id ===
        node.id,
    );

  if (!exit) {
    throw new Error(
      `EXIT navigation node ${node.id} has no matching exit definition.`,
    );
  }

  if (
    !disruptions.isExitAvailable(
      exit.id,
    )
  ) {
    return false;
  }

  agent.status =
    "EVACUATED";

  agent.targetExitId =
    exit.id;

  agent.evacuationTimeSeconds =
    simulationTimeSeconds;

  agent.currentEdgeId =
    null;

  return true;
}

/**
 * Marks an ACTIVE agent UNREACHABLE when the agent is positioned
 * at a navigation node and no currently available exit can be
 * reached through traversable edges.
 *
 * Agents currently traversing an edge are not classified here.
 * Their route response to a newly blocked edge belongs to the
 * rerouting/movement layer.
 */
export function markAgentUnreachableIfNoExit(
  agent: AgentState,
  graph: NavigationGraph,
  exits: ExitSet,
  hazardField: HazardField,
  disruptions: DynamicDisruptionController,
): boolean {
  validateLayouts(
    graph,
    exits,
    hazardField,
  );

  if (
    agent.status !==
    "ACTIVE"
  ) {
    return false;
  }

  if (
    agent.currentEdgeId !==
    null
  ) {
    return false;
  }

  if (
    agent.currentNodeId ===
    null
  ) {
    throw new Error(
      `Active agent ${agent.id} must have a current navigation node before reachability can be evaluated.`,
    );
  }

  const reachableExits =
    findReachableAvailableExitIds(
      agent.currentNodeId,
      graph,
      exits,
      hazardField,
      disruptions,
    );

  if (
    reachableExits.length > 0
  ) {
    return false;
  }

  agent.status =
    "UNREACHABLE";

  agent.targetExitId =
    null;

  agent.currentEdgeId =
    null;

  agent.evacuationTimeSeconds =
    null;

  return true;
}

/**
 * Evaluates the terminal evacuation state of one agent positioned
 * at a navigation node.
 *
 * Evaluation order:
 *
 * 1. If the agent has reached an available exit -> EVACUATED
 * 2. Otherwise, if no available exit is reachable -> UNREACHABLE
 * 3. Otherwise remain ACTIVE
 */
export function updateAgentEvacuationState(
  agent: AgentState,
  graph: NavigationGraph,
  exits: ExitSet,
  hazardField: HazardField,
  disruptions: DynamicDisruptionController,
  simulationTimeSeconds: number,
): EvacuationStateTransition {
  if (
    agent.status !==
    "ACTIVE"
  ) {
    return "NO_CHANGE";
  }

  const evacuated =
    completeEvacuationAtCurrentNode(
      agent,
      graph,
      exits,
      disruptions,
      simulationTimeSeconds,
    );

  if (evacuated) {
    return "EVACUATED";
  }

  const unreachable =
    markAgentUnreachableIfNoExit(
      agent,
      graph,
      exits,
      hazardField,
      disruptions,
    );

  if (unreachable) {
    return "UNREACHABLE";
  }

  return "NO_CHANGE";
}