import type { NavigationNodeId } from "./navigation";

export interface RouteChangeStabilityEvent {
  readonly sequence: number;

  readonly eventId: string;

  readonly agentId: string;

  readonly simulationTimeSeconds: number;

  readonly currentNodeId:
    NavigationNodeId;

  readonly arrivalFromNodeId:
    NavigationNodeId | null;

  readonly previousTargetExitId:
    NavigationNodeId;

  readonly selectedTargetExitId:
    NavigationNodeId;

  /**
   * True when the accepted reroute changes the target exit.
   */
  readonly exitTargetChanged: boolean;

  /**
   * True when the first movement of the accepted new route sends
   * the agent back toward the node from which it just arrived.
   */
  readonly routeReversal: boolean;
}

export interface AgentRouteStabilitySummary {
  readonly agentId: string;

  readonly acceptedReroutes: number;

  readonly exitTargetChanges: number;

  readonly routeReversalEvents: number;
}

export interface RouteStabilitySummary {
  readonly totalAcceptedReroutes: number;

  readonly totalExitTargetChanges: number;

  readonly totalRouteReversalEvents: number;

  readonly agentsWithAcceptedReroutes: number;

  readonly byAgent:
    readonly AgentRouteStabilitySummary[];
}