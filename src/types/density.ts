import type {
  NavigationEdgeId,
} from "./navigation";

export type DensityPartitionMode =
  | "LEGACY"
  | "BALANCED";

export interface DensityCell {
  readonly edgeId:
    NavigationEdgeId;

  /**
   * Zero-based cell position along the navigation edge.
   */
  readonly cellIndex:
    number;

  /**
   * Distance from the edge's "from" node where this cell begins.
   */
  readonly startDistanceMeters:
    number;

  /**
   * Actual physical length represented by this cell.
   */
  readonly lengthMeters:
    number;

  /**
   * Usable pedestrian width inherited from the navigation edge.
   */
  readonly widthMeters:
    number;

  /**
   * Number of ACTIVE agents currently occupying this cell.
   */
  readonly occupantCount:
    number;

  /**
   * Local pedestrian density in persons per square meter.
   */
  readonly densityPersonsPerSquareMeter:
    number;
}

export interface DensitySnapshot {
  /**
   * Requested nominal density resolution.
   *
   * In LEGACY mode this is also the ordinary cell length,
   * except for the final trailing cell.
   *
   * In BALANCED mode the edge is divided into
   * ceil(edgeLength / cellLengthMeters) equal cells.
   */
  readonly cellLengthMeters:
    number;

  /**
   * Optional for backward compatibility with frozen snapshots
   * and existing test fixtures.
   *
   * Absence means LEGACY.
   */
  readonly partitionMode?:
    DensityPartitionMode;

  readonly cells:
    readonly DensityCell[];
}