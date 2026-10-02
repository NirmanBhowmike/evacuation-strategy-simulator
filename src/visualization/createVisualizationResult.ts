import type {
  BuildingEnvironment,
  BuildingZone,
} from "../types/environment";
import type {
  ExitDefinition,
  ExitSet,
} from "../types/exit";
import type {
  HeadlessSimulationResult,
} from "../types/headlessSimulation";
import type {
  SimulationMetrics,
} from "../types/metrics";
import type {
  NavigationEdge,
  NavigationGraph,
  NavigationNode,
} from "../types/navigation";
import type {
  Position2D,
} from "../types/scenario";
import type {
  VisualizationAgentState,
  VisualizationResult,
} from "../types/visualization";

export interface CreateVisualizationResultInput {
  readonly result:
    HeadlessSimulationResult;

  readonly environment:
    BuildingEnvironment;

  readonly graph:
    NavigationGraph;

  readonly exits:
    ExitSet;
}

function clonePosition(
  position:
    Position2D,
): Readonly<Position2D> {
  return Object.freeze({
    x:
      position.x,

    y:
      position.y,
  });
}

function cloneZone(
  zone:
    BuildingZone,
): BuildingZone {
  return Object.freeze({
    id:
      zone.id,

    type:
      zone.type,

    polygon:
      Object.freeze({
        vertices:
          Object.freeze(
            zone.polygon.vertices
              .map(
                (
                  vertex,
                ) =>
                  clonePosition(
                    vertex,
                  ),
              ),
          ),
      }),
  });
}

function cloneNavigationNode(
  node:
    NavigationNode,
): NavigationNode {
  return Object.freeze({
    id:
      node.id,

    type:
      node.type,

    position:
      clonePosition(
        node.position,
      ),

    zoneId:
      node.zoneId,
  });
}

function cloneNavigationEdge(
  edge:
    NavigationEdge,
): NavigationEdge {
  return Object.freeze({
    id:
      edge.id,

    from:
      edge.from,

    to:
      edge.to,

    lengthMeters:
      edge.lengthMeters,

    widthMeters:
      edge.widthMeters,

    zoneId:
      edge.zoneId,

    bidirectional:
      edge.bidirectional,
  });
}

function cloneExit(
  exit:
    ExitDefinition,
): ExitDefinition {
  return Object.freeze({
    id:
      exit.id,

    position:
      clonePosition(
        exit.position,
      ),

    widthMeters:
      exit.widthMeters,

    connectedZoneId:
      exit.connectedZoneId,
  });
}

function cloneAgent(
  agent:
    HeadlessSimulationResult[
      "finalAgents"
    ][number],
): VisualizationAgentState {
  return Object.freeze({
    id:
      agent.id,

    desiredSpeedMps:
      agent.desiredSpeedMps,

    position:
      clonePosition(
        agent.position,
      ),

    status:
      agent.status,

    currentNodeId:
      agent.currentNodeId,

    currentEdgeId:
      agent.currentEdgeId,

    routeNodeIds:
      Object.freeze([
        ...agent.routeNodeIds,
      ]),

    routeCursorIndex:
      agent.routeCursorIndex,

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
  });
}

function cloneMetrics(
  metrics:
    SimulationMetrics,
): SimulationMetrics {
  return Object.freeze({
    ...metrics,

    exitUtilization:
      Object.freeze(
        metrics.exitUtilization
          .map(
            (
              exitMetric,
            ) =>
              Object.freeze({
                ...exitMetric,
              }),
          ),
      ),
  });
}

/**
 * Creates the authoritative presentation model consumed by
 * the future renderer.
 *
 * IMPORTANT:
 *
 * This function performs no routing, movement, hazard,
 * congestion, queue, or evacuation calculation.
 *
 * Dynamic simulation values are copied directly from the
 * completed HeadlessSimulationResult.
 *
 * Static geometry is copied directly from the same Layout,
 * NavigationGraph, and ExitSet supplied to the research engine.
 */
export function createVisualizationResult(
  input:
    CreateVisualizationResultInput,
): VisualizationResult {
  const {
    result,
    environment,
    graph,
    exits,
  } = input;

  if (
    result.layoutId !==
      environment.layoutId ||
    result.layoutId !==
      graph.layoutId ||
    result.layoutId !==
      exits.layoutId
  ) {
    throw new Error(
      "Visualization inputs must use the same layout as the headless result.",
    );
  }

  const termination =
    Object.freeze({
      ...result.termination,
    });

  const queueMetrics =
    Object.freeze({
      ...result.queueMetrics,
    });

  const appliedDisruptions =
    Object.freeze(
      result.appliedDisruptions
        .map(
          (
            disruption,
          ) =>
            Object.freeze({
              ...disruption,
            }),
        ),
    );

  const agents =
    Object.freeze(
      result.finalAgents
        .map(
          (
            agent,
          ) =>
            cloneAgent(
              agent,
            ),
        ),
    );

  const zones =
    Object.freeze(
      environment.zones
        .map(
          (
            zone,
          ) =>
            cloneZone(
              zone,
            ),
        ),
    );

  const navigationNodes =
    Object.freeze(
      graph.nodes
        .map(
          (
            node,
          ) =>
            cloneNavigationNode(
              node,
            ),
        ),
    );

  const navigationEdges =
    Object.freeze(
      graph.edges
        .map(
          (
            edge,
          ) =>
            cloneNavigationEdge(
              edge,
            ),
        ),
    );

  const visualizationExits =
    Object.freeze(
      exits.exits
        .map(
          (
            exit,
          ) =>
            cloneExit(
              exit,
            ),
        ),
    );

  const layout =
    Object.freeze({
      layoutId:
        environment.layoutId,

      widthMeters:
        environment.widthMeters,

      heightMeters:
        environment.heightMeters,

      zones,

      navigationNodes,

      navigationEdges,

      exits:
        visualizationExits,
    });

  return Object.freeze({
    scenarioId:
      result.scenarioId,

    parameterSetId:
      result.parameterSetId,

    seed:
      result.seed,

    layoutId:
      result.layoutId,

    strategyId:
      result.strategyId,

    timestepSeconds:
      result.timestepSeconds,

    simulatedTimeSeconds:
      result.simulatedTimeSeconds,

    ticks:
      result.ticks,

    termination,

    metrics:
      cloneMetrics(
        result.metrics,
      ),

    queueMetrics,

    appliedDisruptions,

    agents,

    layout,
  });
}