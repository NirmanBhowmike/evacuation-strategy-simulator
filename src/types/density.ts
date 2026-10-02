import type { NavigationEdgeId } from "./navigation";

export interface DensityCell {
  readonly edgeId: NavigationEdgeId;

  /**
   * Zero-based cell position along the navigation edge.
   */
  readonly cellIndex: number;

  /**
   * Distance from the edge's "from" node where this cell begins.
   */
  readonly startDistanceMeters: number;

  /**
   * Actual cell length. The final cell of an edge may be shorter
   * than the configured nominal cell length.
   */
  readonly lengthMeters: number;

  /**
   * Usable pedestrian width inherited from the navigation edge.
   */
  readonly widthMeters: number;

  /**
   * Number of ACTIVE agents currently occupying this cell.
   */
  readonly occupantCount: number;

  /**
   * Local pedestrian density in persons per square meter.
   */
  readonly densityPersonsPerSquareMeter: number;
}

export interface DensitySnapshot {
  readonly cellLengthMeters: number;
  readonly cells: readonly DensityCell[];
}