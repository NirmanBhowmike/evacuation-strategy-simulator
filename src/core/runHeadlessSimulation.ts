import {
  BottleneckFlowController,
} from "./bottleneckFlow";
import {
  calculateDensitySnapshot,
} from "./calculateDensity";
import {
  calculateSimulationMetrics,
} from "./calculateSimulationMetrics";
import {
  calculateAgentEffectiveSpeedMps,
} from "./congestionEffects";
import {
  createInitialAgentStates,
} from "./createInitialAgentStates";
import {
  createRoutingStrategyContext,
} from "./createRoutingStrategyContext";
import {
  DecisionTraceLog,
} from "./DecisionTraceLog";
import {
  DynamicDisruptionController,
  type AppliedDisruption,
} from "./DynamicDisruptionController";
import {
  updateAgentEvacuationState,
} from "./evacuationState";
import {
  HazardField,
} from "./HazardField";
import {
  advanceAgentAlongCurrentEdge,
  beginEdgeTraversal,
} from "./pedestrianMovement";
import {
  decideAdaptiveRerouting,
} from "./reroutingDecision";
import {
  RouteStabilityTracker,
} from "./RouteStabilityTracker";
import {
  getRoutingStrategy,
} from "./routingStrategies";
import {
  SimulationClock,
} from "./SimulationClock";
import {
  updateSimulationTermination,
} from "./simulationTermination";

import type {
  AgentState,
} from "../types/agent";
import type {
  DensitySnapshot,
} from "../types/density";
import type {
  BuildingEnvironment,
  Polygon2D,
} from "../types/environment";
import type {
  ExitSet,
} from "../types/exit";
import type {
  HeadlessSimulationConfiguration,
  HeadlessSimulationResult,
} from "../types/headlessSimulation";
import type {
  NavigationEdge,
  NavigationGraph,
  NavigationNode,
  NavigationNodeId,
} from "../types/navigation";
import type {
  RoutingPath,
} from "../types/routing";
import type {
  RoutingQueueDelayByEdge,
  RoutingStrategyDecision,
  RoutingStrategyId,
} from "../types/routingStrategy";
import type {
  ScenarioInstance,
} from "../types/scenario";
import type {
  SpawnZoneSet,
} from "../types/spawn";

export interface HeadlessSimulationInput {
  readonly scenario:
    ScenarioInstance;

  readonly environment:
    BuildingEnvironment;

  readonly graph:
    NavigationGraph;

  readonly exits:
    ExitSet;

  readonly spawnZones:
    SpawnZoneSet;

  readonly configuration:
    HeadlessSimulationConfiguration;
}

const DEFAULT_TIMESTEP_SECONDS =
  0.05;

const DEFAULT_MAXIMUM_SIMULATION_TIME_SECONDS =
  300;

const DEFAULT_DENSITY_CELL_LENGTH_METERS =
  1;

const DEFAULT_ADAPTIVE_REROUTE_THRESHOLD =
  0.20;

const GEOMETRY_TOLERANCE =
  1e-9;

function validateConfiguration(
  input:
    HeadlessSimulationInput,
): {
  timestepSeconds: number;
  maximumSimulationTimeSeconds: number;
  densityCellLengthMeters: number;
  adaptiveRerouteThreshold: number;
} {
  const {
    scenario,
    environment,
    graph,
    exits,
    spawnZones,
    configuration,
  } = input;

  if (
    scenario.layoutId !==
      environment.layoutId ||
    scenario.layoutId !==
      graph.layoutId ||
    scenario.layoutId !==
      exits.layoutId ||
    scenario.layoutId !==
      spawnZones.layoutId
  ) {
    throw new Error(
      "Scenario, environment, navigation graph, exits, and spawn zones must use the same layout.",
    );
  }

  const timestepSeconds =
    configuration
      .timestepSeconds ??
    DEFAULT_TIMESTEP_SECONDS;

  const maximumSimulationTimeSeconds =
    configuration
      .maximumSimulationTimeSeconds ??
    DEFAULT_MAXIMUM_SIMULATION_TIME_SECONDS;

  const densityCellLengthMeters =
    configuration
      .densityCellLengthMeters ??
    DEFAULT_DENSITY_CELL_LENGTH_METERS;

  const adaptiveRerouteThreshold =
    configuration
      .adaptiveRerouteThreshold ??
    DEFAULT_ADAPTIVE_REROUTE_THRESHOLD;

  if (
    !Number.isFinite(
      timestepSeconds,
    ) ||
    timestepSeconds <= 0
  ) {
    throw new Error(
      "Headless simulation timestep must be positive and finite.",
    );
  }

  if (
    !Number.isFinite(
      maximumSimulationTimeSeconds,
    ) ||
    maximumSimulationTimeSeconds <= 0
  ) {
    throw new Error(
      "Headless maximum simulation time must be positive and finite.",
    );
  }

  if (
    !Number.isFinite(
      densityCellLengthMeters,
    ) ||
    densityCellLengthMeters <= 0
  ) {
    throw new Error(
      "Headless density cell length must be positive and finite.",
    );
  }

  if (
    !Number.isFinite(
      adaptiveRerouteThreshold,
    ) ||
    adaptiveRerouteThreshold < 0 ||
    adaptiveRerouteThreshold > 1
  ) {
    throw new Error(
      "Adaptive reroute threshold must be finite and between 0 and 1.",
    );
  }

  return {
    timestepSeconds,
    maximumSimulationTimeSeconds,
    densityCellLengthMeters,
    adaptiveRerouteThreshold,
  };
}

function pointOnSegment(
  x: number,
  y: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): boolean {
  const cross =
    (x - x1) *
      (y2 - y1) -
    (y - y1) *
      (x2 - x1);

  if (
    Math.abs(cross) >
    GEOMETRY_TOLERANCE
  ) {
    return false;
  }

  const dot =
    (x - x1) *
      (x - x2) +
    (y - y1) *
      (y - y2);

  return (
    dot <=
    GEOMETRY_TOLERANCE
  );
}

function pointInsidePolygon(
  x: number,
  y: number,
  polygon: Polygon2D,
): boolean {
  const vertices =
    polygon.vertices;

  if (
    vertices.length < 3
  ) {
    return false;
  }

  let inside =
    false;

  for (
    let index = 0,
      previousIndex =
        vertices.length - 1;
    index <
      vertices.length;
    previousIndex = index,
      index += 1
  ) {
    const current =
      vertices[index]!;

    const previous =
      vertices[
        previousIndex
      ]!;

    if (
      pointOnSegment(
        x,
        y,
        previous.x,
        previous.y,
        current.x,
        current.y,
      )
    ) {
      return true;
    }

    const intersects =
      (
        current.y > y
      ) !==
        (
          previous.y > y
        ) &&
      x <
        (
          (
            previous.x -
            current.x
          ) *
            (
              y -
              current.y
            )
        ) /
          (
            previous.y -
            current.y
          ) +
          current.x;

    if (intersects) {
      inside =
        !inside;
    }
  }

  return inside;
}

function getNode(
  graph: NavigationGraph,
  nodeId: NavigationNodeId,
): NavigationNode {
  const node =
    graph.nodes.find(
      (candidate) =>
        candidate.id ===
        nodeId,
    );

  if (!node) {
    throw new Error(
      `Navigation node not found: ${nodeId}`,
    );
  }

  return node;
}

function getEdge(
  graph: NavigationGraph,
  edgeId: string,
): NavigationEdge {
  const edge =
    graph.edges.find(
      (candidate) =>
        candidate.id ===
        edgeId,
    );

  if (!edge) {
    throw new Error(
      `Navigation edge not found: ${edgeId}`,
    );
  }

  return edge;
}

/**
 * Scenario occupants are sampled inside room spawn polygons.
 *
 * The current tactical navigation model begins at the
 * SpawnZone.accessNodeId. The headless runner therefore moves
 * each runtime agent to that access node before routing begins.
 *
 * Movement inside the room from the sampled spawn coordinate to
 * the access node is not currently part of the tactical graph.
 */
function placeAgentsAtSpawnAccessNodes(
  agents: AgentState[],
  scenario: ScenarioInstance,
  spawnZones: SpawnZoneSet,
  graph: NavigationGraph,
): void {
  if (
    agents.length !==
    scenario.occupants.length
  ) {
    throw new Error(
      "Runtime agent count must match the scenario occupant count.",
    );
  }

  const occupantById =
    new Map(
      scenario.occupants.map(
        (occupant) =>
          [
            occupant.id,
            occupant,
          ] as const,
      ),
    );

  for (
    const agent of agents
  ) {
    const occupant =
      occupantById.get(
        agent.id,
      );

    if (!occupant) {
      throw new Error(
        `Scenario occupant not found for agent: ${agent.id}`,
      );
    }

    const matchingZones =
      spawnZones.zones.filter(
        (zone) =>
          pointInsidePolygon(
            occupant
              .spawnPosition.x,
            occupant
              .spawnPosition.y,
            zone.polygon,
          ),
      );

    if (
      matchingZones.length === 0
    ) {
      throw new Error(
        `Occupant ${agent.id} spawn position is not inside any spawn zone.`,
      );
    }

    if (
      matchingZones.length > 1
    ) {
      throw new Error(
        `Occupant ${agent.id} spawn position matches multiple spawn zones.`,
      );
    }

    const spawnZone =
      matchingZones[0]!;

    const accessNode =
      getNode(
        graph,
        spawnZone.accessNodeId,
      );

    agent.currentNodeId =
      accessNode.id;

    agent.currentEdgeId =
      null;

    agent.position = {
      x:
        accessNode.position.x,

      y:
        accessNode.position.y,
    };
  }
}

function isRoutingReviewNode(
  node: NavigationNode,
): boolean {
  return (
    node.type ===
      "JUNCTION" ||
    node.type ===
      "DECISION_POINT" ||
    node.type ===
      "DOOR" ||
    node.type ===
      "CONNECTOR"
  );
}

function cloneRoutingPath(
  path: RoutingPath,
): RoutingPath {
  return {
    nodeIds: [
      ...path.nodeIds,
    ],

    edgeIds: [
      ...path.edgeIds,
    ],

    totalCost:
      path.totalCost,

    targetNodeId:
      path.targetNodeId,
  };
}

function getRemainingPath(
  agent: AgentState,
  fullPath: RoutingPath,
): RoutingPath {
  if (
    agent.currentNodeId ===
    null
  ) {
    throw new Error(
      `Agent ${agent.id} has no current node.`,
    );
  }

  const index =
    agent.routeCursorIndex;

  if (
    index < 0 ||
    index >=
      fullPath.nodeIds.length
  ) {
    throw new Error(
      `Agent ${agent.id} has an invalid route cursor.`,
    );
  }

  if (
    fullPath.nodeIds[index] !==
    agent.currentNodeId
  ) {
    throw new Error(
      `Agent ${agent.id} route cursor does not match its current node.`,
    );
  }

  return {
    nodeIds:
      fullPath.nodeIds.slice(
        index,
      ),

    edgeIds:
      fullPath.edgeIds.slice(
        index,
      ),

    totalCost:
      fullPath.totalCost,

    targetNodeId:
      fullPath.targetNodeId,
  };
}

function pathsEqual(
  first: RoutingPath,
  second: RoutingPath,
): boolean {
  if (
    first.targetNodeId !==
    second.targetNodeId
  ) {
    return false;
  }

  if (
    first.nodeIds.length !==
      second.nodeIds.length ||
    first.edgeIds.length !==
      second.edgeIds.length
  ) {
    return false;
  }

  for (
    let index = 0;
    index <
      first.nodeIds.length;
    index += 1
  ) {
    if (
      first.nodeIds[index] !==
      second.nodeIds[index]
    ) {
      return false;
    }
  }

  for (
    let index = 0;
    index <
      first.edgeIds.length;
    index += 1
  ) {
    if (
      first.edgeIds[index] !==
      second.edgeIds[index]
    ) {
      return false;
    }
  }

  return true;
}

function applyRouteDecision(
  agent: AgentState,
  decision:
    RoutingStrategyDecision,
  routeByAgentId:
    Map<string, RoutingPath>,
  isReroute: boolean,
): void {
  if (
    agent.currentNodeId ===
    null
  ) {
    throw new Error(
      `Agent ${agent.id} requires a current node before route assignment.`,
    );
  }

  if (
    decision.path.nodeIds[0] !==
    agent.currentNodeId
  ) {
    throw new Error(
      `Route for agent ${agent.id} must begin at its current node.`,
    );
  }

  if (
    decision.path.targetNodeId !==
    decision.targetExitId
  ) {
    throw new Error(
      `Route target and selected exit disagree for agent ${agent.id}.`,
    );
  }

  const copiedPath =
    cloneRoutingPath(
      decision.path,
    );

  routeByAgentId.set(
    agent.id,
    copiedPath,
  );

  agent.routeNodeIds = [
    ...copiedPath.nodeIds,
  ];

  agent.routeCursorIndex =
    0;

  agent.targetExitId =
    decision.targetExitId;

  if (isReroute) {
    agent.rerouteCount +=
      1;
  }
}

function getNextEdgeId(
  agent: AgentState,
  routeByAgentId:
    ReadonlyMap<
      string,
      RoutingPath
    >,
): string | null {
  if (
    agent.status !==
      "ACTIVE" ||
    agent.currentEdgeId !==
      null ||
    agent.currentNodeId ===
      null
  ) {
    return null;
  }

  const path =
    routeByAgentId.get(
      agent.id,
    );

  if (!path) {
    return null;
  }

  if (
    path.nodeIds[
      agent.routeCursorIndex
    ] !==
    agent.currentNodeId
  ) {
    throw new Error(
      `Agent ${agent.id} route cursor is inconsistent with its current node.`,
    );
  }

  return (
    path.edgeIds[
      agent.routeCursorIndex
    ] ?? null
  );
}

function isRemainingRouteFeasible(
  path: RoutingPath,
  graph: NavigationGraph,
  hazardField: HazardField,
  disruptions:
    DynamicDisruptionController,
): boolean {
  if (
    !disruptions.isExitAvailable(
      path.targetNodeId,
    )
  ) {
    return false;
  }

  for (
    const edgeId of
      path.edgeIds
  ) {
    const edge =
      getEdge(
        graph,
        edgeId,
      );

    if (
      !hazardField.isEdgeTraversable(
        edge,
      )
    ) {
      return false;
    }
  }

  return true;
}

function buildQueueDelayByEdge(
  graph: NavigationGraph,
  edgeQueues:
    ReadonlyMap<
      string,
      readonly string[]
    >,
  bottleneck:
    BottleneckFlowController,
): RoutingQueueDelayByEdge {
  const delays:
    Record<
      string,
      number
    > = {};

  for (
    const edge of graph.edges
  ) {
    const queueLength =
      edgeQueues.get(
        edge.id,
      )?.length ??
      0;

    if (
      queueLength === 0
    ) {
      continue;
    }

    const capacity =
      bottleneck
        .calculateCapacityPersonsPerSecond(
          edge,
        );

    delays[edge.id] =
      queueLength /
      capacity;
  }

  return delays;
}

function maximumDensityInSnapshot(
  snapshot: DensitySnapshot,
): number | null {
  if (
    snapshot.cells.length === 0
  ) {
    return null;
  }

  let maximum = 0;

  for (
    const cell of
      snapshot.cells
  ) {
    maximum =
      Math.max(
        maximum,
        cell
          .densityPersonsPerSquareMeter,
      );
  }

  return maximum;
}

function cloneAgents(
  agents:
    readonly AgentState[],
): readonly AgentState[] {
  return agents.map(
    (agent) => ({
      ...agent,

      position: {
        x:
          agent.position.x,

        y:
          agent.position.y,
      },

      routeNodeIds: [
        ...agent.routeNodeIds,
      ],
    }),
  );
}

function updateMaximumDensity(
  current:
    number | null,
  snapshot:
    DensitySnapshot,
): number | null {
  const observed =
    maximumDensityInSnapshot(
      snapshot,
    );

  if (
    observed === null
  ) {
    return current;
  }

  if (
    current === null
  ) {
    return observed;
  }

  return Math.max(
    current,
    observed,
  );
}

function calculateQueueMetrics(
  queueWaitByAgent:
    ReadonlyMap<
      string,
      number
    >,
  agents:
    readonly AgentState[],
) {
  let total = 0;
  let maximum = 0;

  for (
    const agent of agents
  ) {
    const value =
      queueWaitByAgent.get(
        agent.id,
      ) ?? 0;

    total += value;

    maximum =
      Math.max(
        maximum,
        value,
      );
  }

  return {
    populationQueueWaitPersonSeconds:
      total,

    meanQueueWaitSeconds:
      agents.length === 0
        ? 0
        : total /
          agents.length,

    maximumQueueWaitSeconds:
      maximum,
  };
}

function handleNoRoute(
  agent: AgentState,
  graph: NavigationGraph,
  exits: ExitSet,
  hazardField: HazardField,
  disruptions:
    DynamicDisruptionController,
  simulationTimeSeconds: number,
): void {
  updateAgentEvacuationState(
    agent,
    graph,
    exits,
    hazardField,
    disruptions,
    simulationTimeSeconds,
  );

  if (
    agent.status ===
    "ACTIVE"
  ) {
    throw new Error(
      `Routing strategy returned no route for active agent ${agent.id} even though a reachable exit remains.`,
    );
  }
}

function recordAcceptedRouteChange(
  agent: AgentState,
  simulationTimeSeconds: number,
  previousPath: RoutingPath,
  decision:
    RoutingStrategyDecision,
  arrivalFromNodeId:
    NavigationNodeId | null,
  routeByAgentId:
    Map<string, RoutingPath>,
  stability:
    RouteStabilityTracker,
): void {
  if (
    agent.currentNodeId ===
    null
  ) {
    throw new Error(
      `Agent ${agent.id} requires a current node for rerouting.`,
    );
  }

  stability.recordAcceptedReroute(
    agent.id,
    simulationTimeSeconds,
    agent.currentNodeId,
    arrivalFromNodeId,
    previousPath,
    decision.path,
  );

  applyRouteDecision(
    agent,
    decision,
    routeByAgentId,
    true,
  );
}

function reviewRouteAtNode(
  agent: AgentState,
  strategyId:
    RoutingStrategyId,
  graph: NavigationGraph,
  exits: ExitSet,
  hazardField: HazardField,
  disruptions:
    DynamicDisruptionController,
  densitySnapshot:
    DensitySnapshot,
  queueDelayByEdge:
    RoutingQueueDelayByEdge,
  adaptiveRerouteThreshold:
    number,
  disruptionAppliedThisTick:
    boolean,
  simulationTimeSeconds:
    number,
  routeByAgentId:
    Map<string, RoutingPath>,
  arrivalFromNodeByAgent:
    ReadonlyMap<
      string,
      NavigationNodeId | null
    >,
  decisionTrace:
    DecisionTraceLog,
  stability:
    RouteStabilityTracker,
): void {
  if (
    agent.status !==
      "ACTIVE" ||
    agent.currentEdgeId !==
      null ||
    agent.currentNodeId ===
      null
  ) {
    return;
  }

  const fullPath =
    routeByAgentId.get(
      agent.id,
    );

  if (!fullPath) {
    return;
  }

  const currentNode =
    getNode(
      graph,
      agent.currentNodeId,
    );

  const remainingPath =
    getRemainingPath(
      agent,
      fullPath,
    );

  const forcedReview =
    !isRemainingRouteFeasible(
      remainingPath,
      graph,
      hazardField,
      disruptions,
    );

  const normalReview =
    isRoutingReviewNode(
      currentNode,
    ) &&
    strategyId !==
      "STATIC_SHORTEST_PATH";

  if (
    !forcedReview &&
    !normalReview
  ) {
    return;
  }

  const context =
    createRoutingStrategyContext(
      agent.currentNodeId,
      graph,
      exits,
      hazardField,
      disruptions,
      densitySnapshot,
      queueDelayByEdge,
    );

  const strategy =
    getRoutingStrategy(
      strategyId,
    );

  const candidate =
    strategy.route(
      context,
    );

  if (
    strategyId ===
    "ADAPTIVE_HYBRID"
  ) {
    const trigger =
      forcedReview ||
      disruptionAppliedThisTick
        ? "HAZARD_CHANGE"
        : "DECISION_NODE_REVIEW";

    const input = {
      trigger,

      threshold:
        adaptiveRerouteThreshold,

      candidate,
    } as const;

    const result =
      decideAdaptiveRerouting(
        context,
        remainingPath,
        input,
      );

    decisionTrace
      .recordReroutingDecision(
        agent.id,
        simulationTimeSeconds,
        remainingPath,
        input,
        result,
      );

    if (
      result.action ===
      "REROUTE"
    ) {
      if (!candidate) {
        throw new Error(
          "Adaptive rerouting requested a route change without a candidate route.",
        );
      }

      recordAcceptedRouteChange(
        agent,
        simulationTimeSeconds,
        remainingPath,
        candidate,
        arrivalFromNodeByAgent.get(
          agent.id,
        ) ?? null,
        routeByAgentId,
        stability,
      );

      return;
    }

    if (
      result.action ===
      "NO_FEASIBLE_ALTERNATIVE"
    ) {
      handleNoRoute(
        agent,
        graph,
        exits,
        hazardField,
        disruptions,
        simulationTimeSeconds,
      );
    }

    return;
  }

  if (!candidate) {
    if (forcedReview) {
      handleNoRoute(
        agent,
        graph,
        exits,
        hazardField,
        disruptions,
        simulationTimeSeconds,
      );
    }

    return;
  }

  if (
    pathsEqual(
      remainingPath,
      candidate.path,
    )
  ) {
    return;
  }

  recordAcceptedRouteChange(
    agent,
    simulationTimeSeconds,
    remainingPath,
    candidate,
    arrivalFromNodeByAgent.get(
      agent.id,
    ) ?? null,
    routeByAgentId,
    stability,
  );
}

function synchronizeEdgeQueues(
  agents:
    readonly AgentState[],
  routeByAgentId:
    ReadonlyMap<
      string,
      RoutingPath
    >,
  edgeQueues:
    Map<
      string,
      string[]
    >,
  graph:
    NavigationGraph,
): void {
  const desiredEdgeByAgent =
    new Map<
      string,
      string
    >();

  for (
    const agent of agents
  ) {
    const edgeId =
      getNextEdgeId(
        agent,
        routeByAgentId,
      );

    if (edgeId !== null) {
      desiredEdgeByAgent.set(
        agent.id,
        edgeId,
      );
    }
  }

  for (
    const edge of graph.edges
  ) {
    const existing =
      edgeQueues.get(
        edge.id,
      ) ?? [];

    const filtered =
      existing.filter(
        (agentId) =>
          desiredEdgeByAgent.get(
            agentId,
          ) ===
          edge.id,
      );

    edgeQueues.set(
      edge.id,
      filtered,
    );
  }

  const queuedAgents =
    new Set<string>();

  for (
    const queue of
      edgeQueues.values()
  ) {
    for (
      const agentId of queue
    ) {
      queuedAgents.add(
        agentId,
      );
    }
  }

  const newWaiters =
    Array.from(
      desiredEdgeByAgent
        .entries(),
    )
      .filter(
        ([agentId]) =>
          !queuedAgents.has(
            agentId,
          ),
      )
      .sort(
        (
          [firstAgentId],
          [secondAgentId],
        ) =>
          firstAgentId.localeCompare(
            secondAgentId,
          ),
      );

  for (
    const [
      agentId,
      edgeId,
    ] of newWaiters
  ) {
    const queue =
      edgeQueues.get(
        edgeId,
      ) ?? [];

    queue.push(
      agentId,
    );

    edgeQueues.set(
      edgeId,
      queue,
    );
  }
}

function processBottleneckAdmissions(
  agents:
    readonly AgentState[],
  graph:
    NavigationGraph,
  edgeQueues:
    Map<
      string,
      string[]
    >,
  bottleneck:
    BottleneckFlowController,
  queueWaitByAgent:
    Map<string, number>,
  deltaSeconds:
    number,
): void {
  const agentById =
    new Map(
      agents.map(
        (agent) =>
          [
            agent.id,
            agent,
          ] as const,
      ),
    );

  const orderedEdges =
    [
      ...graph.edges,
    ].sort(
      (first, second) =>
        first.id.localeCompare(
          second.id,
        ),
    );

  for (
    const edge of orderedEdges
  ) {
    const queue =
      edgeQueues.get(
        edge.id,
      ) ?? [];

    const result =
      bottleneck.admitAgents(
        edge,
        queue,
        deltaSeconds,
      );

    for (
      const agentId of
        result.admittedAgentIds
    ) {
      const agent =
        agentById.get(
          agentId,
        );

      if (!agent) {
        throw new Error(
          `Queued agent not found: ${agentId}`,
        );
      }

      beginEdgeTraversal(
        agent,
        graph,
        edge.id,
      );
    }

    for (
      const agentId of
        result.queuedAgentIds
    ) {
      queueWaitByAgent.set(
        agentId,
        (
          queueWaitByAgent.get(
            agentId,
          ) ?? 0
        ) +
          deltaSeconds,
      );
    }

    edgeQueues.set(
      edge.id,
      [
        ...result
          .queuedAgentIds,
      ],
    );
  }
}

function moveAgents(
  agents:
    readonly AgentState[],
  graph:
    NavigationGraph,
  densitySnapshot:
    DensitySnapshot,
  hazardField:
    HazardField,
  deltaSeconds:
    number,
  routeByAgentId:
    ReadonlyMap<
      string,
      RoutingPath
    >,
  arrivalFromNodeByAgent:
    Map<
      string,
      NavigationNodeId | null
    >,
): void {
  for (
    const agent of agents
  ) {
    if (
      agent.status !==
        "ACTIVE" ||
      agent.currentEdgeId ===
        null
    ) {
      continue;
    }

    if (
      agent.currentNodeId ===
      null
    ) {
      throw new Error(
        `Agent ${agent.id} is traversing an edge without an origin node.`,
      );
    }

    const path =
      routeByAgentId.get(
        agent.id,
      );

    if (!path) {
      throw new Error(
        `Moving agent ${agent.id} has no active route.`,
      );
    }

    const expectedEdgeId =
      path.edgeIds[
        agent.routeCursorIndex
      ];

    if (
      expectedEdgeId !==
      agent.currentEdgeId
    ) {
      throw new Error(
        `Agent ${agent.id} current edge does not match its route.`,
      );
    }

    const originNodeId =
      agent.currentNodeId;

    const traversedEdge =
      getEdge(
        graph,
        agent.currentEdgeId,
      );

    const risky =
      hazardField.isEdgeRisky(
        traversedEdge,
      );

    const effectiveSpeed =
      calculateAgentEffectiveSpeedMps(
        agent,
        graph,
        densitySnapshot,
      );

    const movement =
      advanceAgentAlongCurrentEdge(
        agent,
        graph,
        deltaSeconds,
        effectiveSpeed,
      );

    let timeOnEdge =
      deltaSeconds;

    if (
      movement.arrivedAtNodeId !==
        null &&
      effectiveSpeed > 0
    ) {
      timeOnEdge =
        Math.max(
          0,
          Math.min(
            deltaSeconds,
            deltaSeconds -
              movement
                .unusedDistanceMeters /
                effectiveSpeed,
          ),
        );
    }

    if (risky) {
      agent.hazardExposureSeconds +=
        timeOnEdge;
    }

    if (
      movement.arrivedAtNodeId !==
      null
    ) {
      arrivalFromNodeByAgent.set(
        agent.id,
        originNodeId,
      );

      agent.routeCursorIndex +=
        1;

      if (
        path.nodeIds[
          agent.routeCursorIndex
        ] !==
        movement.arrivedAtNodeId
      ) {
        throw new Error(
          `Agent ${agent.id} arrived at a node inconsistent with its route.`,
        );
      }
    }
  }
}

function initializeRoutes(
  agents:
    AgentState[],
  strategyId:
    RoutingStrategyId,
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
    RoutingQueueDelayByEdge,
  simulationTimeSeconds:
    number,
  routeByAgentId:
    Map<string, RoutingPath>,
  decisionTrace:
    DecisionTraceLog,
): void {
  const strategy =
    getRoutingStrategy(
      strategyId,
    );

  for (
    const agent of agents
  ) {
    if (
      agent.status !==
      "ACTIVE"
    ) {
      continue;
    }

    if (
      agent.currentNodeId ===
      null
    ) {
      throw new Error(
        `Agent ${agent.id} has no navigation access node.`,
      );
    }

    updateAgentEvacuationState(
      agent,
      graph,
      exits,
      hazardField,
      disruptions,
      simulationTimeSeconds,
    );

    if (
      agent.status !==
      "ACTIVE"
    ) {
      continue;
    }

    const context =
      createRoutingStrategyContext(
        agent.currentNodeId,
        graph,
        exits,
        hazardField,
        disruptions,
        densitySnapshot,
        queueDelayByEdge,
      );

    const decision =
      strategy.route(
        context,
      );

    decisionTrace
      .recordInitialRoute(
        agent.id,
        simulationTimeSeconds,
        decision,
      );

    if (!decision) {
      handleNoRoute(
        agent,
        graph,
        exits,
        hazardField,
        disruptions,
        simulationTimeSeconds,
      );

      continue;
    }

    applyRouteDecision(
      agent,
      decision,
      routeByAgentId,
      false,
    );
  }
}

export function runHeadlessSimulation(
  input:
    HeadlessSimulationInput,
): HeadlessSimulationResult {
  const validated =
    validateConfiguration(
      input,
    );

  const {
    scenario,
    environment,
    graph,
    exits,
    spawnZones,
    configuration,
  } = input;

  const clock =
    new SimulationClock(
      validated
        .timestepSeconds,
    );

  const hazardField =
    new HazardField(
      environment,
    );

  const disruptions =
    new DynamicDisruptionController(
      scenario,
      environment,
      exits,
      hazardField,
    );

  const bottleneck =
    configuration
      .specificFlowPersonsPerMeterSecond ===
    undefined
      ? new BottleneckFlowController()
      : new BottleneckFlowController(
          configuration
            .specificFlowPersonsPerMeterSecond,
        );

  const decisionTrace =
    new DecisionTraceLog();

  const stability =
    new RouteStabilityTracker();

  const agents =
    createInitialAgentStates(
      scenario,
    );

  placeAgentsAtSpawnAccessNodes(
    agents,
    scenario,
    spawnZones,
    graph,
  );

  const routeByAgentId =
    new Map<
      string,
      RoutingPath
    >();

  const arrivalFromNodeByAgent =
    new Map<
      string,
      NavigationNodeId | null
    >();

  const edgeQueues =
    new Map<
      string,
      string[]
    >();

  const queueWaitByAgent =
    new Map<
      string,
      number
    >();

  const appliedDisruptions:
    AppliedDisruption[] = [];

  const initialEvents =
    disruptions.processDueEvents(
      0,
    );

  appliedDisruptions.push(
    ...initialEvents,
  );

  let initialDensity =
    calculateDensitySnapshot(
      agents,
      graph,
      validated
        .densityCellLengthMeters,
    );

  let maximumDensityObserved =
    updateMaximumDensity(
      null,
      initialDensity,
    );

  initializeRoutes(
    agents,
    configuration.strategyId,
    graph,
    exits,
    hazardField,
    disruptions,
    initialDensity,
    {},
    0,
    routeByAgentId,
    decisionTrace,
  );

  let termination =
    updateSimulationTermination(
      agents,
      0,
      validated
        .maximumSimulationTimeSeconds,
    );

  while (
    !termination.isTerminated
  ) {
    const currentTime =
      clock.timeSeconds;

    const newDisruptions =
      disruptions.processDueEvents(
        currentTime,
      );

    appliedDisruptions.push(
      ...newDisruptions,
    );

    const preAdmissionDensity =
      calculateDensitySnapshot(
        agents,
        graph,
        validated
          .densityCellLengthMeters,
      );

    maximumDensityObserved =
      updateMaximumDensity(
        maximumDensityObserved,
        preAdmissionDensity,
      );

    const queueDelayByEdge =
      buildQueueDelayByEdge(
        graph,
        edgeQueues,
        bottleneck,
      );

    for (
      const agent of agents
    ) {
      if (
        agent.status ===
          "ACTIVE" &&
        agent.currentEdgeId ===
          null &&
        agent.currentNodeId !==
          null
      ) {
        updateAgentEvacuationState(
          agent,
          graph,
          exits,
          hazardField,
          disruptions,
          currentTime,
        );
      }
    }

    for (
      const agent of agents
    ) {
      reviewRouteAtNode(
        agent,
        configuration
          .strategyId,
        graph,
        exits,
        hazardField,
        disruptions,
        preAdmissionDensity,
        queueDelayByEdge,
        validated
          .adaptiveRerouteThreshold,
        newDisruptions.length >
          0,
        currentTime,
        routeByAgentId,
        arrivalFromNodeByAgent,
        decisionTrace,
        stability,
      );
    }

    synchronizeEdgeQueues(
      agents,
      routeByAgentId,
      edgeQueues,
      graph,
    );

    processBottleneckAdmissions(
      agents,
      graph,
      edgeQueues,
      bottleneck,
      queueWaitByAgent,
      validated
        .timestepSeconds,
    );

    const movementDensity =
      calculateDensitySnapshot(
        agents,
        graph,
        validated
          .densityCellLengthMeters,
      );

    maximumDensityObserved =
      updateMaximumDensity(
        maximumDensityObserved,
        movementDensity,
      );

    moveAgents(
      agents,
      graph,
      movementDensity,
      hazardField,
      validated
        .timestepSeconds,
      routeByAgentId,
      arrivalFromNodeByAgent,
    );

    clock.advance();

    const endTime =
      clock.timeSeconds;

    for (
      const agent of agents
    ) {
      if (
        agent.status ===
          "ACTIVE" &&
        agent.currentEdgeId ===
          null &&
        agent.currentNodeId !==
          null
      ) {
        updateAgentEvacuationState(
          agent,
          graph,
          exits,
          hazardField,
          disruptions,
          endTime,
        );
      }
    }

    termination =
      updateSimulationTermination(
        agents,
        endTime,
        validated
          .maximumSimulationTimeSeconds,
      );
  }

  const baseMetrics =
    calculateSimulationMetrics(
      agents,
      exits,
      [],
    );

  const metrics = {
    ...baseMetrics,

    maximumLocalDensityPersonsPerSquareMeter:
      maximumDensityObserved,
  };

  return Object.freeze({
    scenarioId:
      scenario.id,

    parameterSetId:
      scenario
        .parameterSetVersion,

    seed:
      scenario.seed,

    layoutId:
      scenario.layoutId,

    strategyId:
      configuration
        .strategyId,

    timestepSeconds:
      validated
        .timestepSeconds,

    simulatedTimeSeconds:
      clock.timeSeconds,

    ticks:
      clock.tick,

    termination:
      Object.freeze({
        ...termination,
      }),

    metrics:
      Object.freeze(
        metrics,
      ),

    queueMetrics:
      Object.freeze(
        calculateQueueMetrics(
          queueWaitByAgent,
          agents,
        ),
      ),

    appliedDisruptions:
      Object.freeze(
        appliedDisruptions.map(
          (event) =>
            Object.freeze({
              ...event,
            }),
        ),
      ),

    decisionTrace:
      decisionTrace
        .getEntries(),

    routeStability:
      stability
        .getSummary(),

    finalAgents:
      Object.freeze(
        cloneAgents(
          agents,
        ),
      ),
  });
}