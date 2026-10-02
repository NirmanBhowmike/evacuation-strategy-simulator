import type {
  NavigationEdge,
  NavigationEdgeId,
  NavigationNodeId,
} from "./navigation";

export interface RoutingTraversal {
  readonly edge: NavigationEdge;

  readonly fromNodeId: NavigationNodeId;

  readonly toNodeId: NavigationNodeId;
}

export type RoutingEdgeCostFunction = (
  traversal: RoutingTraversal,
) => number;

export type RoutingTraversalAllowedFunction = (
  traversal: RoutingTraversal,
) => boolean;

export interface DijkstraOptions {
  /**
   * Cost assigned to one directed traversal.
   *
   * If omitted, edge.lengthMeters is used.
   */
  readonly edgeCost?: RoutingEdgeCostFunction;

  /**
   * Determines whether a directed traversal may be used.
   *
   * If omitted, every graph-valid traversal is available.
   */
  readonly isTraversalAllowed?: RoutingTraversalAllowedFunction;
}

export interface RoutingPath {
  /**
   * Ordered navigation nodes from start through destination.
   */
  readonly nodeIds: readonly NavigationNodeId[];

  /**
   * Ordered navigation edges corresponding to nodeIds.
   */
  readonly edgeIds: readonly NavigationEdgeId[];

  /**
   * Total accumulated routing cost.
   *
   * Units depend on the supplied cost function.
   */
  readonly totalCost: number;

  /**
   * Target reached by the solver.
   */
  readonly targetNodeId: NavigationNodeId;
}