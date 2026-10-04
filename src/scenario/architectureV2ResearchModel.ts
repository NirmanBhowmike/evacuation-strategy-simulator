import {
  layoutAArchitectureV2Environment,
} from "../environment/layoutAArchitectureV2Environment";

import {
  ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS,
} from "./architectureV2ResearchParameterSet";

import type {
  ArchitectureV2ResearchDisruptionConditionId,
} from "./architectureV2ResearchParameterSet";

import type {
  BuildingEnvironment,
  BuildingZone,
} from "../types/environment";

import type {
  NavigationEdge,
  NavigationGraph,
} from "../types/navigation";

/**
 * Frozen Architecture V2 D3 blockable corridor segment.
 *
 * Physical segment:
 *
 * main-central
 *   (36.0, 20.0)
 *
 * to
 *
 * central-01-access
 *   (40.5, 20.0)
 *
 * Width:
 *   4.0 m
 *
 * Rectangle:
 *
 * x = 36.0 .. 40.5
 * y = 18.0 .. 22.0
 */
export const ARCHITECTURE_V2_D3_BLOCKABLE_ZONE:
  BuildingZone = {
  id:
    ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS
      .CORRIDOR_ZONE,

  type:
    "CORRIDOR",

  polygon: {
    vertices: [
      {
        x:
          36,

        y:
          18,
      },

      {
        x:
          40.5,

        y:
          18,
      },

      {
        x:
          40.5,

        y:
          22,
      },

      {
        x:
          36,

        y:
          22,
      },
    ],
  },
};

const duplicateResearchZone =
  layoutAArchitectureV2Environment
    .zones
    .some(
      (
        zone,
      ) =>
        zone.id ===
        ARCHITECTURE_V2_D3_BLOCKABLE_ZONE
          .id,
    );

if (
  duplicateResearchZone
) {
  throw new Error(
    `Architecture V2 base environment already contains research zone ${ARCHITECTURE_V2_D3_BLOCKABLE_ZONE.id}.`,
  );
}

/**
 * D3-specific research environment.
 *
 * The approved Architecture V2 environment remains unchanged.
 *
 * This environment adds only the selected blockable corridor
 * segment required by the D3 CORRIDOR_BLOCK experiment.
 */
export const layoutAArchitectureV2D3ResearchEnvironment:
  BuildingEnvironment = {
  ...layoutAArchitectureV2Environment,

  zones: [
    ...layoutAArchitectureV2Environment
      .zones,

    ARCHITECTURE_V2_D3_BLOCKABLE_ZONE,
  ],
};

/**
 * Returns the correct environment for one frozen
 * Architecture V2 disruption condition.
 *
 * D0, D1, D2 and D4 use the original approved
 * Architecture V2 environment.
 *
 * D3 alone receives the additional blockable zone.
 */
export function getArchitectureV2ResearchEnvironment(
  conditionId:
    ArchitectureV2ResearchDisruptionConditionId,
): BuildingEnvironment {
  if (
    conditionId ===
    "D3_CORRIDOR_BLOCK"
  ) {
    return layoutAArchitectureV2D3ResearchEnvironment;
  }

  return layoutAArchitectureV2Environment;
}

/**
 * Returns the correct navigation graph for one frozen
 * Architecture V2 disruption condition.
 *
 * IMPORTANT:
 *
 * The supplied baseGraph must be the authoritative graph
 * returned by createArchitectureV2AuthoritativeBundle().
 *
 * That graph contains the 42 private room-origin nodes
 * and room-origin -> door edges required by the calibrated
 * Medium population.
 *
 * D0, D1, D2 and D4 therefore return that authoritative
 * graph unchanged.
 *
 * D3 preserves ALL supplied nodes and edges but changes
 * the zoneId of exactly one calibrated corridor edge.
 */
export function getArchitectureV2ResearchNavigationGraph(
  conditionId:
    ArchitectureV2ResearchDisruptionConditionId,

  baseGraph:
    NavigationGraph,
): NavigationGraph {
  if (
    baseGraph.layoutId !==
    layoutAArchitectureV2Environment
      .layoutId
  ) {
    throw new Error(
      `Architecture V2 research graph expected layout ${layoutAArchitectureV2Environment.layoutId}, received ${baseGraph.layoutId}.`,
    );
  }

  if (
    conditionId !==
    "D3_CORRIDOR_BLOCK"
  ) {
    return baseGraph;
  }

  const targetEdgeId =
    ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS
      .CORRIDOR_EDGE;

  const targetEdges =
    baseGraph
      .edges
      .filter(
        (
          edge,
        ) =>
          edge.id ===
          targetEdgeId,
      );

  if (
    targetEdges.length !==
    1
  ) {
    throw new Error(
      `Expected exactly one Architecture V2 D3 target edge ${targetEdgeId}, found ${targetEdges.length}.`,
    );
  }

  const targetEdge =
    targetEdges[0];

  if (!targetEdge) {
    throw new Error(
      `Architecture V2 D3 target edge not found: ${targetEdgeId}`,
    );
  }

  /**
   * Guard against unnoticed model drift.
   *
   * During calibration the selected physical edge belonged
   * to corridor-main-spine before the D3-specific remapping.
   */
  if (
    targetEdge.zoneId !==
    "corridor-main-spine"
  ) {
    throw new Error(
      `Architecture V2 D3 target edge ${targetEdgeId} expected base zone corridor-main-spine, received ${targetEdge.zoneId}.`,
    );
  }

  const edges:
    readonly NavigationEdge[] =
    baseGraph
      .edges
      .map(
        (
          edge,
        ) => {
          if (
            edge.id !==
            targetEdgeId
          ) {
            return edge;
          }

          return {
            ...edge,

            zoneId:
              ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS
                .CORRIDOR_ZONE,
          };
        },
      );

  return {
    ...baseGraph,

    /**
     * Preserve every room-origin and architectural node.
     */
    nodes:
      baseGraph.nodes,

    /**
     * Preserve every room-origin edge.
     *
     * Only the selected D3 corridor edge receives
     * different zone metadata.
     */
    edges,
  };
}