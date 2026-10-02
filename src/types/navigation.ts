import type { Position2D } from "./scenario";
import type { ZoneId } from "./environment";

export type NavigationNodeId = string;
export type NavigationEdgeId = string;

export type NavigationNodeType =
  | "JUNCTION"
  | "DECISION_POINT"
  | "DOOR"
  | "CONNECTOR"
  | "EXIT";

export interface NavigationNode {
  readonly id: NavigationNodeId;

  /**
   * Functional role of the node in the navigation network.
   */
  readonly type: NavigationNodeType;

  /**
   * Node position in the 2D simulation coordinate system.
   */
  readonly position: Position2D;

  /**
   * Building zone associated with this navigation node.
   */
  readonly zoneId: ZoneId;
}

export interface NavigationEdge {
  readonly id: NavigationEdgeId;

  /**
   * Starting navigation node.
   */
  readonly from: NavigationNodeId;

  /**
   * Ending navigation node.
   */
  readonly to: NavigationNodeId;

  /**
   * Geometric path length represented by this edge.
   */
  readonly lengthMeters: number;

  /**
   * Usable pedestrian width of the movement segment.
   */
  readonly widthMeters: number;

  /**
   * Primary building zone associated with this movement segment.
   */
  readonly zoneId: ZoneId;

  /**
   * Whether normal pedestrian movement is allowed in both directions.
   */
  readonly bidirectional: boolean;
}

export interface NavigationGraph {
  /**
   * Building layout associated with this graph.
   */
  readonly layoutId: string;

  /**
   * All navigation nodes in the graph.
   */
  readonly nodes: readonly NavigationNode[];

  /**
   * All navigation edges connecting the nodes.
   */
  readonly edges: readonly NavigationEdge[];
}