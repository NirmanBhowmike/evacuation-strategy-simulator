import {
  layoutAExits,
} from "./layoutAExits";

import type {
  ZoneId,
} from "../types/environment";
import type {
  ExitId,
} from "../types/exit";

import type {
  NavigationEdge,
  NavigationGraph,
  NavigationNode,
  NavigationNodeId,
} from "../types/navigation";

function getExit(
  exitId: ExitId,
) {
  const exit =
    layoutAExits.exits.find(
      (candidate) =>
        candidate.id ===
        exitId,
    );

  if (!exit) {
    throw new Error(
      `Missing Layout A exit definition: ${exitId}`,
    );
  }

  return exit;
}

function exitNode(
  exitId: ExitId,
): NavigationNode {
  const exit =
    getExit(
      exitId,
    );

  return {
    id:
      exit.id,

    type:
      "EXIT",

    position:
      exit.position,

    zoneId:
      exit.connectedZoneId,
  };
}

const nodes:
  readonly NavigationNode[] =
[
  // ============================================================
  // WESTERN AREA
  // ============================================================

  exitNode(
    "exit-west",
  ),

  {
    id:
      "west-junction",

    type:
      "JUNCTION",

    position: {
      x: 15,
      y: 24.75,
    },

    zoneId:
      "corridor-west-central",
  },

  {
    id:
      "northwest-decision",

    type:
      "DECISION_POINT",

    position: {
      x: 10,
      y: 30,
    },

    zoneId:
      "corridor-northwest-link",
  },

  {
    id:
      "west-atrium-decision",

    type:
      "DECISION_POINT",

    position: {
      x: 20,
      y: 24.75,
    },

    zoneId:
      "open-west-atrium",
  },

  {
    id:
      "main-west",

    type:
      "CONNECTOR",

    position: {
      x: 20,
      y: 18.75,
    },

    zoneId:
      "corridor-main-spine",
  },

  // ============================================================
  // CENTRAL MAIN SPINE
  // ============================================================

  {
    id:
      "main-central",

    type:
      "DECISION_POINT",

    position: {
      x: 36.75,
      y: 18.75,
    },

    zoneId:
      "corridor-main-spine",
  },

  exitNode(
    "exit-south-central",
  ),

  {
    id:
      "main-mid",

    type:
      "JUNCTION",

    position: {
      x: 48,
      y: 18.75,
    },

    zoneId:
      "corridor-main-spine",
  },

  {
    id:
      "main-east",

    type:
      "DECISION_POINT",

    position: {
      x: 59.75,
      y: 18.75,
    },

    zoneId:
      "corridor-main-spine",
  },

  {
    id:
      "main-east-end",

    type:
      "CONNECTOR",

    position: {
      x: 72,
      y: 18.75,
    },

    zoneId:
      "corridor-main-spine",
  },

  // ============================================================
  // CENTRAL VERTICAL ROUTE
  // ============================================================

  {
    id:
      "central-lower",

    type:
      "CONNECTOR",

    position: {
      x: 36.75,
      y: 20.5,
    },

    zoneId:
      "corridor-central-vertical",
  },

  {
    id:
      "central-bottleneck-junction",

    type:
      "DECISION_POINT",

    position: {
      x: 36.75,
      y: 30,
    },

    zoneId:
      "corridor-central-vertical",
  },

  {
    id:
      "central-upper",

    type:
      "JUNCTION",

    position: {
      x: 36.75,
      y: 32.75,
    },

    zoneId:
      "corridor-central-vertical",
  },

  {
    id:
      "open-central-decision",

    type:
      "DECISION_POINT",

    position: {
      x: 31,
      y: 30,
    },

    zoneId:
      "open-central",
  },

  // ============================================================
  // NARROW CENTRAL-EAST ROUTE
  // ============================================================

  {
    id:
      "bottleneck-west",

    type:
      "CONNECTOR",

    position: {
      x: 38.5,
      y: 30,
    },

    zoneId:
      "corridor-east-bottleneck",
  },

  {
    id:
      "bottleneck-east",

    type:
      "CONNECTOR",

    position: {
      x: 58,
      y: 30,
    },

    zoneId:
      "corridor-east-bottleneck",
  },

  {
    id:
      "east-bottleneck-junction",

    type:
      "DECISION_POINT",

    position: {
      x: 59.75,
      y: 30,
    },

    zoneId:
      "corridor-east-vertical",
  },

  // ============================================================
  // WIDER UPPER ALTERNATIVE
  // ============================================================

  {
    id:
      "upper-west",

    type:
      "CONNECTOR",

    position: {
      x: 40,
      y: 32.75,
    },

    zoneId:
      "corridor-east-upper",
  },

  {
    id:
      "upper-east",

    type:
      "CONNECTOR",

    position: {
      x: 59.75,
      y: 32.75,
    },

    zoneId:
      "corridor-east-upper",
  },

  // ============================================================
  // EASTERN VERTICAL ROUTE
  // ============================================================

  {
    id:
      "east-lower",

    type:
      "CONNECTOR",

    position: {
      x: 59.75,
      y: 20.5,
    },

    zoneId:
      "corridor-east-vertical",
  },

  // ============================================================
  // FAR EAST
  // ============================================================

  {
    id:
      "far-east-main",

    type:
      "DECISION_POINT",

    position: {
      x: 73.75,
      y: 18.75,
    },

    zoneId:
      "corridor-far-east",
  },

  exitNode(
    "exit-east",
  ),

  {
    id:
      "far-east-southeast-connector",

    type:
      "CONNECTOR",

    position: {
      x: 73.75,
      y: 16.5,
    },

    zoneId:
      "corridor-far-east",
  },

  // ============================================================
  // SOUTHEAST EXTENSION
  // ============================================================

  {
    id:
      "southeast-junction",

    type:
      "JUNCTION",

    position: {
      x: 73.75,
      y: 14.75,
    },

    zoneId:
      "corridor-southeast",
  },

  {
    id:
      "southeast-mid",

    type:
      "DECISION_POINT",

    position: {
      x: 68.5,
      y: 14.75,
    },

    zoneId:
      "corridor-southeast",
  },

  exitNode(
    "exit-southeast",
  ),
];

const nodeById =
  new Map<
    NavigationNodeId,
    NavigationNode
  >(
    nodes.map(
      (node) =>
        [
          node.id,
          node,
        ] as const,
    ),
  );

function edge(
  id: string,
  from:
    NavigationNodeId,
  to:
    NavigationNodeId,
  widthMeters:
    number,
  zoneId:
    ZoneId,
): NavigationEdge {
  const fromNode =
    nodeById.get(
      from,
    );

  const toNode =
    nodeById.get(
      to,
    );

  if (!fromNode) {
    throw new Error(
      `Missing navigation node: ${from}`,
    );
  }

  if (!toNode) {
    throw new Error(
      `Missing navigation node: ${to}`,
    );
  }

  const dx =
    toNode.position.x -
    fromNode.position.x;

  const dy =
    toNode.position.y -
    fromNode.position.y;

  return {
    id,

    from,

    to,

    lengthMeters:
      Math.hypot(
        dx,
        dy,
      ),

    widthMeters,

    zoneId,

    bidirectional:
      true,
  };
}

const edges:
  readonly NavigationEdge[] =
[
  // ============================================================
  // WESTERN ROUTES
  // ============================================================

  edge(
    "edge-west-exit",
    "exit-west",
    "west-junction",
    1.8,
    "corridor-west-central",
  ),

  edge(
    "edge-west-northwest",
    "west-junction",
    "northwest-decision",
    3,
    "corridor-northwest-link",
  ),

  edge(
    "edge-west-atrium",
    "west-junction",
    "west-atrium-decision",
    3.5,
    "corridor-west-central",
  ),

  edge(
    "edge-atrium-main",
    "west-atrium-decision",
    "main-west",
    3.5,
    "open-west-atrium",
  ),

  edge(
    "edge-main-west-central",
    "main-west",
    "main-central",
    3.5,
    "corridor-main-spine",
  ),

  // ============================================================
  // SOUTH-CENTRAL EXIT
  // ============================================================

  edge(
    "edge-south-central-exit",
    "main-central",
    "exit-south-central",
    1.8,
    "corridor-main-spine",
  ),

  // ============================================================
  // MAIN EAST-WEST ROUTE
  // ============================================================

  edge(
    "edge-main-central-main-mid",
    "main-central",
    "main-mid",
    3.5,
    "corridor-main-spine",
  ),

  edge(
    "edge-main-mid-main-east",
    "main-mid",
    "main-east",
    3.5,
    "corridor-main-spine",
  ),

  /**
   * Primary dynamic corridor-block target.
   *
   * Calibration selected this segment because blocking it at
   * 6.65 s created a meaningful detour effect while preserving
   * 100% evacuation completion and zero unreachable occupants.
   */
  edge(
    "edge-main-east-end",
    "main-east",
    "main-east-end",
    3.5,
    "corridor-main-east-blockable",
  ),

  // ============================================================
  // CENTRAL VERTICAL ROUTE
  // ============================================================

  edge(
    "edge-central-lower",
    "main-central",
    "central-lower",
    3.5,
    "corridor-central-vertical",
  ),

  edge(
    "edge-central-vertical",
    "central-lower",
    "central-bottleneck-junction",
    3.5,
    "corridor-central-vertical",
  ),

  edge(
    "edge-open-central",
    "central-bottleneck-junction",
    "open-central-decision",
    4,
    "open-central",
  ),

  // ============================================================
  // NARROW CENTRAL-EAST ALTERNATIVE
  // ============================================================

  edge(
    "edge-bottleneck-entry",
    "central-bottleneck-junction",
    "bottleneck-west",
    2,
    "corridor-east-bottleneck",
  ),

  edge(
    "edge-bottleneck-core",
    "bottleneck-west",
    "bottleneck-east",
    2,
    "corridor-east-bottleneck",
  ),

  edge(
    "edge-bottleneck-exit",
    "bottleneck-east",
    "east-bottleneck-junction",
    2,
    "corridor-east-bottleneck",
  ),

  // ============================================================
  // WIDER UPPER ALTERNATIVE
  // ============================================================

  edge(
    "edge-central-upper",
    "central-bottleneck-junction",
    "central-upper",
    3.5,
    "corridor-central-vertical",
  ),

  edge(
    "edge-upper-entry",
    "central-upper",
    "upper-west",
    3.5,
    "corridor-east-upper",
  ),

  edge(
    "edge-upper-west-upper-east",
    "upper-west",
    "upper-east",
    3.5,
    "corridor-east-upper",
  ),

  edge(
    "edge-upper-east",
    "upper-east",
    "east-bottleneck-junction",
    3.5,
    "corridor-east-vertical",
  ),

  // ============================================================
  // EASTERN VERTICAL CONNECTION
  // ============================================================

  edge(
    "edge-east-vertical",
    "east-bottleneck-junction",
    "east-lower",
    3.5,
    "corridor-east-vertical",
  ),

  edge(
    "edge-east-lower-main",
    "east-lower",
    "main-east",
    3.5,
    "corridor-east-vertical",
  ),

  // ============================================================
  // FAR EAST AND EAST EXIT
  // ============================================================

  edge(
    "edge-main-to-far-east",
    "main-east-end",
    "far-east-main",
    3.5,
    "corridor-far-east",
  ),

  edge(
    "edge-east-exit",
    "far-east-main",
    "exit-east",
    1.8,
    "corridor-far-east",
  ),

  // ============================================================
  // SOUTHEAST ROUTE
  // ============================================================

  edge(
    "edge-far-east-southeast",
    "far-east-main",
    "far-east-southeast-connector",
    3.5,
    "corridor-far-east",
  ),

  edge(
    "edge-southeast-entry",
    "far-east-southeast-connector",
    "southeast-junction",
    3.5,
    "corridor-southeast",
  ),

  edge(
    "edge-southeast-main",
    "southeast-junction",
    "southeast-mid",
    3.5,
    "corridor-southeast",
  ),

  edge(
    "edge-southeast-exit",
    "southeast-mid",
    "exit-southeast",
    1.8,
    "corridor-southeast",
  ),
];

export const layoutANavigationGraph:
  NavigationGraph = {
  layoutId:
    "layout-a",

  nodes,

  edges,
};