import type { Position2D } from "./scenario";
import type {
  NavigationEdgeId,
  NavigationNodeId,
} from "./navigation";
import type { ExitId } from "./exit";

export type AgentStatus =
  | "ACTIVE"
  | "EVACUATED"
  | "UNREACHABLE"
  | "TIMEOUT";

export interface AgentState {
  /**
   * Unique occupant identifier inherited from the immutable
   * ScenarioInstance.
   */
  id: string;

  /**
   * Individual desired free-flow walking speed.
   */
  desiredSpeedMps: number;

  /**
   * Current physical position in meters.
   */
  position: Position2D;

  /**
   * Current evacuation state.
   */
  status: AgentStatus;

  /**
   * Navigation node currently associated with the agent.
   * Null before the agent enters the navigation network.
   */
  currentNodeId: NavigationNodeId | null;

  /**
   * Edge currently being traversed.
   * Null when the agent is not moving along an edge.
   */
  currentEdgeId: NavigationEdgeId | null;

  /**
   * Current planned node sequence.
   */
  routeNodeIds: NavigationNodeId[];

  /**
   * Position within the current route sequence.
   *
   * Zero is also used when no route has yet been assigned.
   */
  routeCursorIndex: number;

  /**
   * Exit currently selected by the routing strategy.
   */
  targetExitId: ExitId | null;

  /**
   * Number of route changes made after the initial route.
   */
  rerouteCount: number;

  /**
   * Total physical distance traveled by the agent.
   */
  distanceTraveledMeters: number;

  /**
   * Accumulated time spent in RISK hazard regions.
   */
  hazardExposureSeconds: number;

  /**
   * Simulation time when evacuation was completed.
   * Null until the agent evacuates.
   */
  evacuationTimeSeconds: number | null;
}