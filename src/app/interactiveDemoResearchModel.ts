import {
  layoutAArchitectureV2Environment,
} from "../environment/layoutAArchitectureV2Environment";

import {
  ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS,
} from "../scenario/architectureV2ResearchParameterSet";

import type {
  BuildingEnvironment,
  BuildingZone,
} from "../types/environment";

import type {
  NavigationEdge,
  NavigationGraph,
} from "../types/navigation";

import type {
  InteractiveDemoManualEvent,
} from "./interactiveDemoMode";

const BASE_CORRIDOR_ZONE_ID =
  "corridor-main-spine";

export const INTERACTIVE_DEMO_D3_BLOCKABLE_ZONE:
  BuildingZone = {
  id:
    ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS
      .CORRIDOR_ZONE,

  type:
    "CORRIDOR",

  polygon: {
    vertices: [
      {
        x: 36,
        y: 18,
      },
      {
        x: 40.5,
        y: 18,
      },
      {
        x: 40.5,
        y: 22,
      },
      {
        x: 36,
        y: 22,
      },
    ],
  },
};

export const INTERACTIVE_DEMO_D6_BLOCKABLE_ZONE:
  BuildingZone = {
  id:
    ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS
      .D6_CORRIDOR_ZONE,

  type:
    "CORRIDOR",

  polygon: {
    vertices: [
      {
        x: 60,
        y: 18,
      },
      {
        x: 69,
        y: 18,
      },
      {
        x: 69,
        y: 22,
      },
      {
        x: 60,
        y: 22,
      },
    ],
  },
};

interface InteractiveDemoCorridorDefinition {
  readonly zone:
    BuildingZone;

  readonly edgeId:
    string;
}

function requireCorridorDefinition(
  targetId:
    string,
): InteractiveDemoCorridorDefinition {
  switch (
    targetId
  ) {
    case "corridor-main-central-east-blockable":
      return {
        zone:
          INTERACTIVE_DEMO_D3_BLOCKABLE_ZONE,

        edgeId:
          ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS
            .CORRIDOR_EDGE,
      };

    case "corridor-main-east-southeast-blockable":
      return {
        zone:
          INTERACTIVE_DEMO_D6_BLOCKABLE_ZONE,

        edgeId:
          ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS
            .D6_CORRIDOR_EDGE,
      };

    default:
      throw new Error(
        `Interactive Demo corridor target is not supported: ${targetId}.`,
      );
  }
}

function corridorEvents(
  events:
    readonly InteractiveDemoManualEvent[],
): readonly InteractiveDemoManualEvent[] {
  return events.filter(
    (
      event,
    ) =>
      event.type ===
      "CORRIDOR_BLOCK",
  );
}

function validateResearchZoneIsDemoSafe(
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
      `Interactive Demo zone duplicates a base Architecture V2 zone: ${zone.id}.`,
    );
  }
}

validateResearchZoneIsDemoSafe(
  INTERACTIVE_DEMO_D3_BLOCKABLE_ZONE,
);

validateResearchZoneIsDemoSafe(
  INTERACTIVE_DEMO_D6_BLOCKABLE_ZONE,
);

export function createInteractiveDemoArchitectureV2Environment(
  events:
    readonly InteractiveDemoManualEvent[],
): BuildingEnvironment {
  const corridorBlockEvents =
    corridorEvents(
      events,
    );

  if (
    corridorBlockEvents.length ===
    0
  ) {
    return layoutAArchitectureV2Environment;
  }

  if (
    corridorBlockEvents.length >
    1
  ) {
    throw new Error(
      "Interactive Demo allows at most one corridor-block event per run.",
    );
  }

  const event =
    corridorBlockEvents[0]!;

  const definition =
    requireCorridorDefinition(
      event.targetId,
    );

  return {
    ...layoutAArchitectureV2Environment,

    zones: [
      ...layoutAArchitectureV2Environment
        .zones,

      definition.zone,
    ],
  };
}

function remapInteractiveDemoEdge(
  edges:
    readonly NavigationEdge[],

  edgeId:
    string,

  targetZoneId:
    string,
): readonly NavigationEdge[] {
  const matchingEdges =
    edges.filter(
      (
        edge,
      ) =>
        edge.id ===
        edgeId,
    );

  if (
    matchingEdges.length !==
    1
  ) {
    throw new Error(
      `Interactive Demo expected exactly one navigation edge ${edgeId}, found ${matchingEdges.length}.`,
    );
  }

  const matchingEdge =
    matchingEdges[0]!;

  if (
    matchingEdge.zoneId !==
    BASE_CORRIDOR_ZONE_ID
  ) {
    throw new Error(
      `Interactive Demo edge ${edgeId} expected base zone ${BASE_CORRIDOR_ZONE_ID}, found ${matchingEdge.zoneId}.`,
    );
  }

  return edges.map(
    (
      edge,
    ) =>
      edge.id ===
        edgeId
        ? {
            ...edge,

            zoneId:
              targetZoneId,
          }
        : edge,
  );
}

export function createInteractiveDemoArchitectureV2NavigationGraph(
  baseGraph:
    NavigationGraph,

  events:
    readonly InteractiveDemoManualEvent[],
): NavigationGraph {
  if (
    baseGraph.layoutId !==
    layoutAArchitectureV2Environment.layoutId
  ) {
    throw new Error(
      "Interactive Demo navigation graph must use the Architecture V2 layout.",
    );
  }

  const corridorBlockEvents =
    corridorEvents(
      events,
    );

  if (
    corridorBlockEvents.length ===
    0
  ) {
    return baseGraph;
  }

  if (
    corridorBlockEvents.length >
    1
  ) {
    throw new Error(
      "Interactive Demo allows at most one corridor-block event per run.",
    );
  }

  const event =
    corridorBlockEvents[0]!;

  const definition =
    requireCorridorDefinition(
      event.targetId,
    );

  return {
    ...baseGraph,

    edges:
      remapInteractiveDemoEdge(
        baseGraph.edges,
        definition.edgeId,
        definition.zone.id,
      ),
  };
}