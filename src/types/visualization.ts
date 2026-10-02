import type {
  AgentStatus,
} from "./agent";
import type {
  AppliedDisruptionRecord,
  HeadlessQueueMetrics,
} from "./headlessSimulation";
import type {
  BuildingZone,
} from "./environment";
import type {
  ExitDefinition,
  ExitId,
} from "./exit";
import type {
  SimulationMetrics,
} from "./metrics";
import type {
  NavigationEdge,
  NavigationEdgeId,
  NavigationNode,
  NavigationNodeId,
} from "./navigation";
import type {
  RoutingStrategyId,
} from "./routingStrategy";
import type {
  Position2D,
} from "./scenario";
import type {
  SimulationTerminationStatus,
} from "./termination";

/**
 * Renderer-facing occupant state.
 *
 * This is a read-only projection of the authoritative
 * headless AgentState. The visualization layer must never
 * modify simulation state through this object.
 */
export interface VisualizationAgentState {
  readonly id:
    string;

  readonly desiredSpeedMps:
    number;

  readonly position:
    Readonly<Position2D>;

  readonly status:
    AgentStatus;

  readonly currentNodeId:
    NavigationNodeId | null;

  readonly currentEdgeId:
    NavigationEdgeId | null;

  readonly routeNodeIds:
    readonly NavigationNodeId[];

  readonly routeCursorIndex:
    number;

  readonly targetExitId:
    ExitId | null;

  readonly rerouteCount:
    number;

  readonly distanceTraveledMeters:
    number;

  readonly hazardExposureSeconds:
    number;

  readonly evacuationTimeSeconds:
    number | null;
}

/**
 * Static geometry supplied to the visualization.
 *
 * These objects originate from the same environment,
 * navigation graph, and exit definitions used by the
 * headless research engine.
 */
export interface VisualizationLayout {
  readonly layoutId:
    string;

  readonly widthMeters:
    number;

  readonly heightMeters:
    number;

  readonly zones:
    readonly BuildingZone[];

  readonly navigationNodes:
    readonly NavigationNode[];

  readonly navigationEdges:
    readonly NavigationEdge[];

  readonly exits:
    readonly ExitDefinition[];
}

/**
 * Complete renderer-facing result for one simulation run.
 *
 * This type deliberately contains no simulation logic.
 * It is a presentation projection only.
 */
export interface VisualizationResult {
  readonly scenarioId:
    string;

  readonly parameterSetId:
    string;

  readonly seed:
    number;

  readonly layoutId:
    string;

  readonly strategyId:
    RoutingStrategyId;

  readonly timestepSeconds:
    number;

  readonly simulatedTimeSeconds:
    number;

  readonly ticks:
    number;

  readonly termination:
    SimulationTerminationStatus;

  readonly metrics:
    SimulationMetrics;

  readonly queueMetrics:
    HeadlessQueueMetrics;

  readonly appliedDisruptions:
    readonly AppliedDisruptionRecord[];

  readonly agents:
    readonly VisualizationAgentState[];

  readonly layout:
    VisualizationLayout;
}