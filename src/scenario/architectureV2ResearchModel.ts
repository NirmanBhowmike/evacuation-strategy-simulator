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
 * D3 blockable corridor segment.
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

/**
 * D6 blockable corridor segment.
 *
 * Physical segment:
 *
 * main-east
 *   (60.0, 20.0)
 *
 * to
 *
 * main-southeast
 *   (69.0, 20.0)
 *
 * Width:
 *   4.0 m
 *
 * D6 is spatially separate from D3 and was selected through
 * the dedicated D5/D6 calibration and independent
 * confirmation process.
 */
export const ARCHITECTURE_V2_D6_BLOCKABLE_ZONE:
  BuildingZone = {
  id:
    ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS
      .D6_CORRIDOR_ZONE,

  type:
    "CORRIDOR",

  polygon: {
    vertices: [
      {
        x:
          60,

        y:
          18,
      },

      {
        x:
          69,

        y:
          18,
      },

      {
        x:
          69,

        y:
          22,
      },

      {
        x:
          60,

        y:
          22,
      },
    ],
  },
};

function assertResearchZoneNotInBaseEnvironment(
  zone:
    BuildingZone,
): void {
  const duplicate =
    layoutAArchitectureV2Environment
      .zones
      .some(
        (
          candidate,
        ) =>
          candidate.id ===
          zone.id,
      );

  if (
    duplicate
  ) {
    throw new Error(
      `Architecture V2 base environment already contains research zone ${zone.id}.`,
    );
  }
}

assertResearchZoneNotInBaseEnvironment(
  ARCHITECTURE_V2_D3_BLOCKABLE_ZONE,
);

assertResearchZoneNotInBaseEnvironment(
  ARCHITECTURE_V2_D6_BLOCKABLE_ZONE,
);

/**
 * D3-specific environment.
 *
 * The approved Architecture V2 base environment remains
 * unchanged. This derived environment adds only the D3
 * blockable segment.
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
 * D6-specific environment.
 *
 * This derived environment adds only the independently
 * calibrated D6 blockable segment.
 */
export const layoutAArchitectureV2D6ResearchEnvironment:
  BuildingEnvironment = {
  ...layoutAArchitectureV2Environment,

  zones: [
    ...layoutAArchitectureV2Environment
      .zones,

    ARCHITECTURE_V2_D6_BLOCKABLE_ZONE,
  ],
};

/**
 * D0, D1, D2, D4 and D5 use the approved base
 * Architecture V2 environment.
 *
 * D3 receives its dedicated corridor zone.
 *
 * D6 receives its separate dedicated corridor zone.
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

  if (
    conditionId ===
    "D6_CORRIDOR_BLOCK_EAST_SOUTHEAST"
  ) {
    return layoutAArchitectureV2D6ResearchEnvironment;
  }

  return layoutAArchitectureV2Environment;
}

interface CorridorRemapDefinition {
  readonly edgeId:
    string;

  readonly expectedBaseZoneId:
    string;

  readonly researchZoneId:
    string;

  readonly conditionLabel:
    string;
}

function remapResearchCorridorEdge(
  baseGraph:
    NavigationGraph,

  definition:
    CorridorRemapDefinition,
): NavigationGraph {
  const targetEdges =
    baseGraph
      .edges
      .filter(
        (
          edge,
        ) =>
          edge.id ===
          definition.edgeId,
      );

  if (
    targetEdges.length !==
    1
  ) {
    throw new Error(
      `Expected exactly one Architecture V2 ${definition.conditionLabel} target edge ${definition.edgeId}, found ${targetEdges.length}.`,
    );
  }

  const targetEdge =
    targetEdges[0];

  if (!targetEdge) {
    throw new Error(
      `Architecture V2 ${definition.conditionLabel} target edge not found: ${definition.edgeId}`,
    );
  }

  /**
   * Guard against unnoticed graph drift.
   *
   * Both currently calibrated blockable segments belong to
   * corridor-main-spine in the approved base graph.
   */
  if (
    targetEdge.zoneId !==
    definition.expectedBaseZoneId
  ) {
    throw new Error(
      `Architecture V2 ${definition.conditionLabel} target edge ${definition.edgeId} expected base zone ${definition.expectedBaseZoneId}, received ${targetEdge.zoneId}.`,
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
            definition.edgeId
          ) {
            return edge;
          }

          return {
            ...edge,

            zoneId:
              definition
                .researchZoneId,
          };
        },
      );

  return {
    ...baseGraph,

    nodes:
      baseGraph.nodes,

    edges,
  };
}

/**
 * Returns the condition-specific Architecture V2 graph.
 *
 * The supplied baseGraph remains authoritative and contains
 * the full room-origin population graph.
 *
 * D3 and D6 remap exactly one calibrated corridor edge each
 * to a dedicated blockable zone.
 *
 * All other conditions preserve the supplied graph unchanged.
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
    conditionId ===
    "D3_CORRIDOR_BLOCK"
  ) {
    return remapResearchCorridorEdge(
      baseGraph,
      {
        edgeId:
          ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS
            .CORRIDOR_EDGE,

        expectedBaseZoneId:
          "corridor-main-spine",

        researchZoneId:
          ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS
            .CORRIDOR_ZONE,

        conditionLabel:
          "D3",
      },
    );
  }

  if (
    conditionId ===
    "D6_CORRIDOR_BLOCK_EAST_SOUTHEAST"
  ) {
    return remapResearchCorridorEdge(
      baseGraph,
      {
        edgeId:
          ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS
            .D6_CORRIDOR_EDGE,

        expectedBaseZoneId:
          "corridor-main-spine",

        researchZoneId:
          ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS
            .D6_CORRIDOR_ZONE,

        conditionLabel:
          "D6",
      },
    );
  }

  return baseGraph;
}