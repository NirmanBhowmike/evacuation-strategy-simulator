import {
  layoutAArchitectureV2,
} from "./layoutAArchitectureV2";

import type {
  ArchitectureDoor,
  ArchitecturePoint,
  ArchitectureRoom,
} from "./layoutAArchitectureV2";

import type {
  NavigationEdge,
  NavigationGraph,
  NavigationNode,
  NavigationNodeId,
  NavigationNodeType,
} from "../types/navigation";

function interpolatePoint(
  start: ArchitecturePoint,
  end: ArchitecturePoint,
  t: number,
): ArchitecturePoint {
  return {
    x:
      start.x +
      (end.x - start.x) *
        t,

    y:
      start.y +
      (end.y - start.y) *
        t,
  };
}

function requireRoom(
  roomId: string,
): ArchitectureRoom {
  const room =
    layoutAArchitectureV2.rooms.find(
      (candidate) =>
        candidate.id ===
        roomId,
    );

  if (!room) {
    throw new Error(
      `Architecture V2 room not found: ${roomId}`,
    );
  }

  return room;
}

function requireDoor(
  roomId: string,
  doorId: string,
): {
  readonly room: ArchitectureRoom;
  readonly door: ArchitectureDoor;
  readonly position: ArchitecturePoint;
} {
  const room =
    requireRoom(
      roomId,
    );

  const door =
    room.doors.find(
      (candidate) =>
        candidate.id ===
        doorId,
    );

  if (!door) {
    throw new Error(
      `Architecture V2 door not found: ${doorId}`,
    );
  }

  const start =
    room.polygon[
      door.edgeIndex
    ];

  const end =
    room.polygon[
      (door.edgeIndex + 1) %
        room.polygon.length
    ];

  if (
    !start ||
    !end
  ) {
    throw new Error(
      `Architecture V2 door ${doorId} references an invalid edge.`,
    );
  }

  return {
    room,
    door,

    position:
      interpolatePoint(
        start,
        end,
        door.centerT,
      ),
  };
}

function requireExit(
  exitId: string,
) {
  const exit =
    layoutAArchitectureV2.exits.find(
      (candidate) =>
        candidate.id ===
        exitId,
    );

  if (!exit) {
    throw new Error(
      `Architecture V2 exit not found: ${exitId}`,
    );
  }

  return exit;
}

function doorNode(
  roomId: string,
  doorId: string,
): NavigationNode {
  const {
    position,
  } =
    requireDoor(
      roomId,
      doorId,
    );

  return {
    id:
      doorId,

    type:
      "DOOR",

    position,

    zoneId:
      roomId,
  };
}

function exitNode(
  exitId: string,
  zoneId: string,
): NavigationNode {
  const exit =
    requireExit(
      exitId,
    );

  return {
    id:
      exit.id,

    type:
      "EXIT",

    position: {
      ...exit.position,
    },

    zoneId,
  };
}

function circulationNode(
  id: string,
  type: NavigationNodeType,
  x: number,
  y: number,
  zoneId: string,
): NavigationNode {
  return {
    id,
    type,

    position: {
      x,
      y,
    },

    zoneId,
  };
}

const nodes:
  readonly NavigationNode[] =
[
  // ============================================================
  // ROOM DOORS
  // ============================================================

  doorNode(
    "room-nw-01",
    "door-nw-01",
  ),

  doorNode(
    "room-nw-02",
    "door-nw-02",
  ),

  doorNode(
    "room-nw-03",
    "door-nw-03",
  ),

  doorNode(
    "room-west-upper",
    "door-west-upper",
  ),

  doorNode(
    "room-west-lower",
    "door-west-lower",
  ),

  doorNode(
    "room-west-central-01",
    "door-west-central-01",
  ),

  doorNode(
    "room-west-central-02",
    "door-west-central-02",
  ),

  doorNode(
    "room-west-central-03",
    "door-west-central-03",
  ),

  doorNode(
    "room-west-central-04",
    "door-west-central-04",
  ),

  doorNode(
    "room-central-01",
    "door-central-01",
  ),

  doorNode(
    "room-central-02",
    "door-central-02",
  ),

  doorNode(
    "room-central-03",
    "door-central-03",
  ),

  doorNode(
    "room-central-upper-01",
    "door-central-upper-01",
  ),

  doorNode(
    "room-central-upper-02",
    "door-central-upper-02",
  ),

  doorNode(
    "room-east-large",
    "door-east-large",
  ),

  doorNode(
    "room-east-01",
    "door-east-01",
  ),

  doorNode(
    "room-east-02",
    "door-east-02",
  ),

  doorNode(
    "room-far-east",
    "door-far-east",
  ),

  doorNode(
    "room-southeast-01",
    "door-southeast-01",
  ),

  doorNode(
    "room-southeast-02",
    "door-southeast-02",
  ),

  // ============================================================
  // TRUE EXTERIOR EXITS
  // ============================================================

  exitNode(
    "exit-west",
    "corridor-west",
  ),

  exitNode(
    "exit-south-central",
    "corridor-south-central-egress",
  ),

  exitNode(
    "exit-east",
    "corridor-east-egress",
  ),

  exitNode(
    "exit-southeast",
    "corridor-southeast-egress",
  ),

  // ============================================================
  // NORTHWEST HALL
  // ============================================================

  circulationNode(
    "nw-hall-west",
    "CONNECTOR",
    5.5,
    34,
    "hall-northwest",
  ),

  circulationNode(
    "nw-hall-center",
    "JUNCTION",
    12.5,
    34,
    "hall-northwest",
  ),

  circulationNode(
    "nw-hall-east",
    "CONNECTOR",
    19.5,
    34,
    "hall-northwest",
  ),

  circulationNode(
    "nw-connector-north",
    "JUNCTION",
    16,
    32,
    "corridor-northwest-connector",
  ),

  circulationNode(
    "nw-connector-middle",
    "CONNECTOR",
    16,
    29,
    "corridor-northwest-connector",
  ),

  circulationNode(
    "nw-connector-south",
    "JUNCTION",
    16,
    26,
    "corridor-northwest-connector",
  ),

  // ============================================================
  // WEST CORRIDOR
  // ============================================================

  circulationNode(
    "west-central-03-access",
    "CONNECTOR",
    6,
    24,
    "corridor-west",
  ),

  circulationNode(
    "west-corridor-west",
    "JUNCTION",
    8,
    24,
    "corridor-west",
  ),

  circulationNode(
    "west-junction",
    "DECISION_POINT",
    16,
    24,
    "corridor-west",
  ),

  // ============================================================
  // WEST ATRIUM
  // ============================================================

  circulationNode(
    "west-atrium-entry",
    "CONNECTOR",
    18,
    24,
    "open-west-atrium",
  ),

  circulationNode(
    "west-atrium-corner",
    "CONNECTOR",
    18,
    22,
    "open-west-atrium",
  ),

  circulationNode(
    "west-atrium-south",
    "CONNECTOR",
    20,
    22,
    "open-west-atrium",
  ),

  // ============================================================
  // MAIN SPINE
  // ============================================================

  circulationNode(
    "west-central-01-access",
    "CONNECTOR",
    16,
    20,
    "corridor-main-spine",
  ),

  circulationNode(
    "main-west",
    "CONNECTOR",
    20,
    20,
    "corridor-main-spine",
  ),

  circulationNode(
    "west-central-02-access",
    "CONNECTOR",
    24,
    20,
    "corridor-main-spine",
  ),

  circulationNode(
    "main-open",
    "CONNECTOR",
    28,
    20,
    "corridor-main-spine",
  ),

  circulationNode(
    "main-central",
    "DECISION_POINT",
    36,
    20,
    "corridor-main-spine",
  ),

  circulationNode(
    "central-01-access",
    "CONNECTOR",
    40.5,
    20,
    "corridor-main-spine",
  ),

  circulationNode(
    "central-02-access",
    "CONNECTOR",
    45.5,
    20,
    "corridor-main-spine",
  ),

  circulationNode(
    "main-mid",
    "JUNCTION",
    48,
    20,
    "corridor-main-spine",
  ),

  circulationNode(
    "central-03-access",
    "CONNECTOR",
    50.5,
    20,
    "corridor-main-spine",
  ),

  circulationNode(
    "main-east",
    "DECISION_POINT",
    60,
    20,
    "corridor-main-spine",
  ),

  circulationNode(
    "main-southeast",
    "DECISION_POINT",
    69,
    20,
    "corridor-main-spine",
  ),

  circulationNode(
    "east-02-access",
    "CONNECTOR",
    69.5,
    20,
    "corridor-main-spine",
  ),

  circulationNode(
    "main-east-end",
    "CONNECTOR",
    76,
    20,
    "corridor-main-spine",
  ),

  // ============================================================
  // SOUTH-CENTRAL EXIT
  // ============================================================

  circulationNode(
    "south-central-inner",
    "CONNECTOR",
    36,
    18,
    "corridor-south-central-egress",
  ),

  // ============================================================
  // CENTRAL / UPPER ROUTE
  // ============================================================

  circulationNode(
    "central-vertical-lower",
    "CONNECTOR",
    36,
    22,
    "corridor-central-vertical",
  ),

  circulationNode(
    "central-vertical-upper",
    "DECISION_POINT",
    36,
    33,
    "corridor-central-vertical",
  ),

  circulationNode(
    "upper-west",
    "CONNECTOR",
    41,
    33,
    "corridor-upper-east",
  ),

  circulationNode(
    "upper-mid",
    "CONNECTOR",
    47,
    33,
    "corridor-upper-east",
  ),

  circulationNode(
    "east-large-access",
    "CONNECTOR",
    57,
    33,
    "corridor-upper-east",
  ),

  circulationNode(
    "upper-east",
    "CONNECTOR",
    60,
    33,
    "corridor-upper-east",
  ),

  circulationNode(
    "east-vertical-mid",
    "DECISION_POINT",
    60,
    27,
    "corridor-east-vertical",
  ),

  circulationNode(
    "east-vertical-lower",
    "CONNECTOR",
    60,
    22,
    "corridor-east-vertical",
  ),

  // ============================================================
  // EAST EGRESS
  // ============================================================

  circulationNode(
    "east-egress-center",
    "JUNCTION",
    79,
    20,
    "corridor-east-egress",
  ),

  // ============================================================
  // SOUTHEAST EGRESS
  // ============================================================

  circulationNode(
    "southeast-upper",
    "CONNECTOR",
    69,
    18,
    "corridor-southeast-branch",
  ),

  circulationNode(
    "southeast-mid",
    "DECISION_POINT",
    69,
    14,
    "corridor-southeast-egress",
  ),

  circulationNode(
    "southeast-room-junction",
    "JUNCTION",
    69,
    10.4,
    "corridor-southeast-egress",
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

function requireNavigationNode(
  nodeId: NavigationNodeId,
): NavigationNode {
  const node =
    nodeById.get(
      nodeId,
    );

  if (!node) {
    throw new Error(
      `Architecture V2 navigation node not found: ${nodeId}`,
    );
  }

  return node;
}

function edge(
  id: string,
  from: NavigationNodeId,
  to: NavigationNodeId,
  widthMeters: number,
  zoneId: string,
): NavigationEdge {
  const fromNode =
    requireNavigationNode(
      from,
    );

  const toNode =
    requireNavigationNode(
      to,
    );

  return {
    id,
    from,
    to,

    lengthMeters:
      Math.hypot(
        toNode.position.x -
          fromNode.position.x,

        toNode.position.y -
          fromNode.position.y,
      ),

    widthMeters,
    zoneId,

    bidirectional:
      true,
  };
}

function doorConnection(
  edgeId: string,
  doorId: string,
  targetNodeId: string,
  zoneId: string,
): NavigationEdge {
  const architecturalDoor =
    layoutAArchitectureV2.rooms
      .flatMap(
        (room) =>
          room.doors,
      )
      .find(
        (candidate) =>
          candidate.id ===
          doorId,
      );

  if (!architecturalDoor) {
    throw new Error(
      `Architecture V2 door not found while creating edge: ${doorId}`,
    );
  }

  return edge(
    edgeId,
    doorId,
    targetNodeId,
    architecturalDoor.widthMeters,
    zoneId,
  );
}

const edges:
  readonly NavigationEdge[] =
[
  // ============================================================
  // NORTHWEST ROOM ACCESS
  // ============================================================

  doorConnection(
    "edge-door-nw-01",
    "door-nw-01",
    "nw-hall-west",
    "hall-northwest",
  ),

  doorConnection(
    "edge-door-nw-02",
    "door-nw-02",
    "nw-hall-center",
    "hall-northwest",
  ),

  doorConnection(
    "edge-door-nw-03",
    "door-nw-03",
    "nw-hall-east",
    "hall-northwest",
  ),

  /**
   * Left room follows the hall toward the center before
   * approaching the connector.
   *
   * This avoids an unnecessary long diagonal that saved
   * negligible travel distance.
   */
  edge(
    "edge-nw-hall-west-center",
    "nw-hall-west",
    "nw-hall-center",
    4,
    "hall-northwest",
  ),

  edge(
    "edge-nw-hall-center-east",
    "nw-hall-center",
    "nw-hall-east",
    4,
    "hall-northwest",
  ),

  /**
   * Center and east positions have physically natural direct
   * approaches to the connector through the open hall.
   */
  edge(
    "edge-nw-center-direct",
    "nw-hall-center",
    "nw-connector-north",
    4,
    "hall-northwest",
  ),

  edge(
    "edge-nw-east-direct",
    "nw-hall-east",
    "nw-connector-north",
    4,
    "hall-northwest",
  ),

  edge(
    "edge-nw-connector-upper",
    "nw-connector-north",
    "nw-connector-middle",
    3.6,
    "corridor-northwest-connector",
  ),

  edge(
    "edge-nw-connector-lower",
    "nw-connector-middle",
    "nw-connector-south",
    3.6,
    "corridor-northwest-connector",
  ),

  doorConnection(
    "edge-door-west-upper",
    "door-west-upper",
    "nw-connector-middle",
    "corridor-northwest-connector",
  ),

  // ============================================================
  // WEST CORRIDOR
  // ============================================================

  edge(
    "edge-nw-connector-to-west",
    "nw-connector-south",
    "west-junction",
    3.6,
    "corridor-west",
  ),

  edge(
    "edge-west-exit-access",
    "exit-west",
    "west-central-03-access",
    1.8,
    "corridor-west",
  ),

  edge(
    "edge-west-access-west-node",
    "west-central-03-access",
    "west-corridor-west",
    4,
    "corridor-west",
  ),

  edge(
    "edge-west-corridor-main",
    "west-corridor-west",
    "west-junction",
    4,
    "corridor-west",
  ),

  doorConnection(
    "edge-door-west-central-03",
    "door-west-central-03",
    "west-central-03-access",
    "corridor-west",
  ),

  doorConnection(
    "edge-door-west-lower",
    "door-west-lower",
    "west-corridor-west",
    "corridor-west",
  ),

  // ============================================================
  // WEST ATRIUM
  // ============================================================

  edge(
    "edge-west-to-atrium",
    "west-junction",
    "west-atrium-entry",
    4,
    "corridor-west",
  ),

  edge(
    "edge-atrium-entry-corner",
    "west-atrium-entry",
    "west-atrium-corner",
    4,
    "open-west-atrium",
  ),

  edge(
    "edge-atrium-corner-south",
    "west-atrium-corner",
    "west-atrium-south",
    4,
    "open-west-atrium",
  ),

  edge(
    "edge-atrium-to-main",
    "west-atrium-south",
    "main-west",
    4,
    "corridor-main-spine",
  ),

  // ============================================================
  // WEST-CENTRAL ACCESS
  // ============================================================

  doorConnection(
    "edge-door-west-central-01",
    "door-west-central-01",
    "west-central-01-access",
    "corridor-main-spine",
  ),

  edge(
    "edge-west-central-01-west-junction",
    "west-central-01-access",
    "west-junction",
    4,
    "corridor-main-spine",
  ),

  edge(
    "edge-west-central-01-main-west",
    "west-central-01-access",
    "main-west",
    4,
    "corridor-main-spine",
  ),

  doorConnection(
    "edge-door-west-central-02",
    "door-west-central-02",
    "west-central-02-access",
    "corridor-main-spine",
  ),

  doorConnection(
    "edge-door-west-central-04",
    "door-west-central-04",
    "main-open",
    "corridor-main-spine",
  ),

  // ============================================================
  // MAIN SPINE
  // ============================================================

  edge(
    "edge-main-west-west-central-02",
    "main-west",
    "west-central-02-access",
    4,
    "corridor-main-spine",
  ),

  edge(
    "edge-west-central-02-main-open",
    "west-central-02-access",
    "main-open",
    4,
    "corridor-main-spine",
  ),

  edge(
    "edge-main-open-central",
    "main-open",
    "main-central",
    4,
    "corridor-main-spine",
  ),

  edge(
    "edge-main-central-central-01",
    "main-central",
    "central-01-access",
    4,
    "corridor-main-spine",
  ),

  edge(
    "edge-central-01-central-02",
    "central-01-access",
    "central-02-access",
    4,
    "corridor-main-spine",
  ),

  edge(
    "edge-central-02-main-mid",
    "central-02-access",
    "main-mid",
    4,
    "corridor-main-spine",
  ),

  edge(
    "edge-main-mid-central-03",
    "main-mid",
    "central-03-access",
    4,
    "corridor-main-spine",
  ),

  edge(
    "edge-central-03-main-east",
    "central-03-access",
    "main-east",
    4,
    "corridor-main-spine",
  ),

  edge(
    "edge-main-east-main-southeast",
    "main-east",
    "main-southeast",
    4,
    "corridor-main-spine",
  ),

  edge(
    "edge-main-southeast-east-02",
    "main-southeast",
    "east-02-access",
    4,
    "corridor-main-spine",
  ),

  edge(
    "edge-east-02-main-east-end",
    "east-02-access",
    "main-east-end",
    4,
    "corridor-main-spine",
  ),

  // ============================================================
  // MAIN-SPINE ROOM DOORS
  // ============================================================

  doorConnection(
    "edge-door-central-01",
    "door-central-01",
    "central-01-access",
    "corridor-main-spine",
  ),

  doorConnection(
    "edge-door-central-02",
    "door-central-02",
    "central-02-access",
    "corridor-main-spine",
  ),

  doorConnection(
    "edge-door-central-03",
    "door-central-03",
    "central-03-access",
    "corridor-main-spine",
  ),

  doorConnection(
    "edge-door-east-02",
    "door-east-02",
    "east-02-access",
    "corridor-main-spine",
  ),

  // ============================================================
  // SOUTH-CENTRAL EXIT
  // ============================================================

  edge(
    "edge-south-central-inner",
    "main-central",
    "south-central-inner",
    3.6,
    "corridor-main-spine",
  ),

  edge(
    "edge-south-central-exit",
    "south-central-inner",
    "exit-south-central",
    1.8,
    "corridor-south-central-egress",
  ),

  // ============================================================
  // CENTRAL / UPPER ROUTE
  // ============================================================

  edge(
    "edge-central-vertical-entry",
    "main-central",
    "central-vertical-lower",
    3.6,
    "corridor-main-spine",
  ),

  edge(
    "edge-central-vertical",
    "central-vertical-lower",
    "central-vertical-upper",
    3.6,
    "corridor-central-vertical",
  ),

  edge(
    "edge-upper-entry",
    "central-vertical-upper",
    "upper-west",
    3.6,
    "corridor-upper-east",
  ),

  edge(
    "edge-upper-west-mid",
    "upper-west",
    "upper-mid",
    4,
    "corridor-upper-east",
  ),

  edge(
    "edge-upper-mid-east-large",
    "upper-mid",
    "east-large-access",
    4,
    "corridor-upper-east",
  ),

  edge(
    "edge-east-large-upper-east",
    "east-large-access",
    "upper-east",
    4,
    "corridor-upper-east",
  ),

  edge(
    "edge-upper-east-vertical",
    "upper-east",
    "east-vertical-mid",
    3.6,
    "corridor-east-vertical",
  ),

  edge(
    "edge-east-vertical-lower",
    "east-vertical-mid",
    "east-vertical-lower",
    3.6,
    "corridor-east-vertical",
  ),

  edge(
    "edge-east-vertical-main",
    "east-vertical-lower",
    "main-east",
    3.6,
    "corridor-main-spine",
  ),

  // ============================================================
  // UPPER / EAST ROOM ACCESS
  // ============================================================

  doorConnection(
    "edge-door-central-upper-01",
    "door-central-upper-01",
    "upper-west",
    "corridor-upper-east",
  ),

  doorConnection(
    "edge-door-central-upper-02",
    "door-central-upper-02",
    "upper-mid",
    "corridor-upper-east",
  ),

  doorConnection(
    "edge-door-east-large",
    "door-east-large",
    "east-large-access",
    "corridor-upper-east",
  ),

  doorConnection(
    "edge-door-east-01",
    "door-east-01",
    "east-vertical-mid",
    "corridor-east-vertical",
  ),

  // ============================================================
  // EAST EXIT
  // ============================================================

  edge(
    "edge-main-to-east-egress",
    "main-east-end",
    "east-egress-center",
    4,
    "corridor-east-egress",
  ),

  edge(
    "edge-east-egress-exit",
    "east-egress-center",
    "exit-east",
    1.8,
    "corridor-east-egress",
  ),

  doorConnection(
    "edge-door-far-east",
    "door-far-east",
    "east-egress-center",
    "corridor-east-egress",
  ),

  // ============================================================
  // SOUTHEAST ROUTE
  // ============================================================

  edge(
    "edge-southeast-entry",
    "main-southeast",
    "southeast-upper",
    4,
    "corridor-main-spine",
  ),

  edge(
    "edge-southeast-upper-mid",
    "southeast-upper",
    "southeast-mid",
    3.6,
    "corridor-southeast-egress",
  ),

  edge(
    "edge-southeast-mid-room-junction",
    "southeast-mid",
    "southeast-room-junction",
    3.6,
    "corridor-southeast-egress",
  ),

  edge(
    "edge-southeast-final",
    "southeast-room-junction",
    "exit-southeast",
    1.8,
    "corridor-southeast-egress",
  ),

  doorConnection(
    "edge-door-southeast-01",
    "door-southeast-01",
    "southeast-room-junction",
    "corridor-southeast-egress",
  ),

  doorConnection(
    "edge-door-southeast-02",
    "door-southeast-02",
    "southeast-room-junction",
    "corridor-southeast-egress",
  ),
];

export const layoutAArchitectureV2NavigationGraph:
  NavigationGraph = {
  layoutId:
    "layout-a-architecture-v2",

  nodes,

  edges,
};