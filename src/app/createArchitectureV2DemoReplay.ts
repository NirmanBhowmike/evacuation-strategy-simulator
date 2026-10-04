import {
  runHeadlessSimulation,
} from "../core/runHeadlessSimulation";

import {
  layoutAArchitectureV2,
} from "../environment/layoutAArchitectureV2";

import {
  layoutAArchitectureV2Environment,
  LAYOUT_A_ARCHITECTURE_V2_ID,
} from "../environment/layoutAArchitectureV2Environment";

import {
  layoutAArchitectureV2Exits,
} from "../environment/layoutAArchitectureV2Exits";

import {
  layoutAArchitectureV2NavigationGraph,
} from "../environment/layoutAArchitectureV2NavigationGraph";

import {
  getResearchDisruptionCondition,
  RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
  RESEARCH_DENSITY_CELL_LENGTH_METERS,
  RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,
  RESEARCH_TIMESTEP_SECONDS,
} from "../scenario/researchParameterSet";

import type {
  HeadlessSimulationResult,
} from "../types/headlessSimulation";

import type {
  NavigationEdge,
  NavigationGraph,
  NavigationNode,
} from "../types/navigation";

import type {
  Position2D,
  ScenarioInstance,
} from "../types/scenario";

import type {
  SimulationReplayFrame,
} from "../types/simulationReplay";

import type {
  SpawnZone,
  SpawnZoneSet,
} from "../types/spawn";

import {
  createRoomOccupantPreview,
  ROOM_OCCUPANT_PREVIEW_COUNT,
} from "../visualization/createRoomOccupantPreview";

export const ARCHITECTURE_V2_OCCUPANCY =
  Object.freeze({
    LOW:
      14,

    MEDIUM:
      42,

    HIGH:
      56,
  });

export const ARCHITECTURE_V2_PROVISIONAL_PARAMETER_SET_VERSION =
  "architecture-v2-provisional-42-v1";

const ROOM_ORIGIN_SPAWN_HALF_SIZE_METERS =
  0.08;

export interface ArchitectureV2AuthoritativeBundle {
  readonly scenario:
    ScenarioInstance;

  readonly graph:
    NavigationGraph;

  readonly spawnZones:
    SpawnZoneSet;
}

export interface ArchitectureV2DemoReplay {
  readonly frames:
    readonly SimulationReplayFrame[];

  readonly result:
    HeadlessSimulationResult;
}

interface PreparedOccupant {
  readonly id:
    string;

  readonly roomId:
    string;

  readonly spawnPosition:
    Position2D;

  readonly originNodeId:
    string;

  readonly originEdgeId:
    string;

  readonly doorId:
    string;

  readonly doorWidthMeters:
    number;
}

function requireSingleRoomDoor(
  roomId:
    string,
): {
  readonly id:
    string;

  readonly widthMeters:
    number;
} {
  const room =
    layoutAArchitectureV2
      .rooms
      .find(
        (
          candidate,
        ) =>
          candidate.id ===
          roomId,
      );

  if (!room) {
    throw new Error(
      `Architecture V2 room not found: ${roomId}`,
    );
  }

  if (
    room.doors.length !==
    1
  ) {
    throw new Error(
      `Architecture V2 authoritative population currently requires exactly one door per room. ${roomId} has ${room.doors.length}.`,
    );
  }

  const door =
    room.doors[0]!;

  return {
    id:
      door.id,

    widthMeters:
      door.widthMeters,
  };
}

function createSpawnPolygon(
  position:
    Position2D,
) {
  const half =
    ROOM_ORIGIN_SPAWN_HALF_SIZE_METERS;

  return {
    vertices: [
      {
        x:
          position.x -
          half,

        y:
          position.y -
          half,
      },

      {
        x:
          position.x +
          half,

        y:
          position.y -
          half,
      },

      {
        x:
          position.x +
          half,

        y:
          position.y +
          half,
      },

      {
        x:
          position.x -
          half,

        y:
          position.y +
          half,
      },
    ],
  };
}

function prepareOccupants():
  readonly PreparedOccupant[] {
  const previewPopulation =
    createRoomOccupantPreview();

  if (
    ROOM_OCCUPANT_PREVIEW_COUNT !==
    ARCHITECTURE_V2_OCCUPANCY
      .MEDIUM
  ) {
    throw new Error(
      "Architecture V2 preview population and provisional MEDIUM occupancy disagree.",
    );
  }

  if (
    previewPopulation.length !==
    ARCHITECTURE_V2_OCCUPANCY
      .MEDIUM
  ) {
    throw new Error(
      `Expected ${ARCHITECTURE_V2_OCCUPANCY.MEDIUM} Architecture V2 occupants, received ${previewPopulation.length}.`,
    );
  }

  return previewPopulation.map(
    (
      previewAgent,
      index,
    ) => {
      const id =
        `agent-${String(
          index +
            1,
        ).padStart(
          4,
          "0",
        )}`;

      const door =
        requireSingleRoomDoor(
          previewAgent.roomId,
        );

      return {
        id,

        roomId:
          previewAgent.roomId,

        spawnPosition: {
          x:
            previewAgent
              .position
              .x,

          y:
            previewAgent
              .position
              .y,
        },

        originNodeId:
          `room-origin-${id}`,

        originEdgeId:
          `room-origin-edge-${id}`,

        doorId:
          door.id,

        doorWidthMeters:
          door.widthMeters,
      };
    },
  );
}

function createOriginNode(
  occupant:
    PreparedOccupant,
): NavigationNode {
  return {
    id:
      occupant
        .originNodeId,

    type:
      "CONNECTOR",

    position: {
      x:
        occupant
          .spawnPosition
          .x,

      y:
        occupant
          .spawnPosition
          .y,
    },

    zoneId:
      occupant
        .roomId,
  };
}

function requireBaseDoorNode(
  doorId:
    string,
): NavigationNode {
  const node =
    layoutAArchitectureV2NavigationGraph
      .nodes
      .find(
        (
          candidate,
        ) =>
          candidate.id ===
          doorId,
      );

  if (!node) {
    throw new Error(
      `Architecture V2 navigation door node not found: ${doorId}`,
    );
  }

  if (
    node.type !==
    "DOOR"
  ) {
    throw new Error(
      `Architecture V2 node ${doorId} is not a DOOR node.`,
    );
  }

  return node;
}

function createOriginEdge(
  occupant:
    PreparedOccupant,
): NavigationEdge {
  const doorNode =
    requireBaseDoorNode(
      occupant.doorId,
    );

  const lengthMeters =
    Math.hypot(
      doorNode.position.x -
        occupant
          .spawnPosition
          .x,

      doorNode.position.y -
        occupant
          .spawnPosition
          .y,
    );

  if (
    lengthMeters <=
    0
  ) {
    throw new Error(
      `Architecture V2 occupant ${occupant.id} has zero room-to-door travel distance.`,
    );
  }

  return {
    id:
      occupant
        .originEdgeId,

    from:
      occupant
        .originNodeId,

    to:
      occupant
        .doorId,

    lengthMeters,

    widthMeters:
      occupant
        .doorWidthMeters,

    zoneId:
      occupant
        .roomId,

    /**
     * Deliberately one-way.
     *
     * The edge represents the occupant's initial room approach
     * toward the evacuation doorway. Other agents cannot route
     * backward into another occupant's private origin stub.
     */
    bidirectional:
      false,
  };
}

function createSpawnZone(
  occupant:
    PreparedOccupant,
): SpawnZone {
  return {
    id:
      `spawn-${occupant.id}`,

    roomZoneId:
      occupant
        .roomId,

    accessNodeId:
      occupant
        .originNodeId,

    polygon:
      createSpawnPolygon(
        occupant
          .spawnPosition,
      ),
  };
}

/**
 * Builds the provisional 42-person Architecture V2
 * authoritative simulation input.
 *
 * Important design feature:
 *
 * The spawn access node is placed at the actual room-origin
 * coordinate. The authoritative graph then contains a directed
 * room-origin -> room-door edge.
 *
 * Therefore runHeadlessSimulation does not teleport the agent
 * from the room to the door.
 */
export function createArchitectureV2AuthoritativeBundle():
  ArchitectureV2AuthoritativeBundle {
  const prepared =
    prepareOccupants();

  const originNodes =
    prepared.map(
      createOriginNode,
    );

  const originEdges =
    prepared.map(
      createOriginEdge,
    );

  const graph:
    NavigationGraph = {
    layoutId:
      LAYOUT_A_ARCHITECTURE_V2_ID,

    nodes: [
      ...layoutAArchitectureV2NavigationGraph
        .nodes,

      ...originNodes,
    ],

    edges: [
      ...layoutAArchitectureV2NavigationGraph
        .edges,

      ...originEdges,
    ],
  };

  const spawnZones:
    SpawnZoneSet = {
    layoutId:
      LAYOUT_A_ARCHITECTURE_V2_ID,

    zones:
      prepared.map(
        createSpawnZone,
      ),
  };

  const baselineCondition =
    getResearchDisruptionCondition(
      "D0_BASELINE",
    );

  const scenario:
    ScenarioInstance = {
    id:
      "layout-a-v2-medium-42-d0-adaptive-provisional",

    seed:
      1042,

    layoutId:
      LAYOUT_A_ARCHITECTURE_V2_ID,

    parameterSetVersion:
      ARCHITECTURE_V2_PROVISIONAL_PARAMETER_SET_VERSION,

    occupants:
      prepared.map(
        (
          occupant,
        ) => ({
          id:
            occupant.id,

          spawnPosition: {
            x:
              occupant
                .spawnPosition
                .x,

            y:
              occupant
                .spawnPosition
                .y,
          },

          desiredSpeedMps:
            1.34,
        }),
      ),

    disruptionSchedule:
      baselineCondition
        .events,
  };

  return {
    scenario,
    graph,
    spawnZones,
  };
}

export function createArchitectureV2DemoReplay():
  ArchitectureV2DemoReplay {
  const {
    scenario,
    graph,
    spawnZones,
  } =
    createArchitectureV2AuthoritativeBundle();

  const frames:
    SimulationReplayFrame[] =
  [];

  const result =
    runHeadlessSimulation({
      scenario,

      environment:
        layoutAArchitectureV2Environment,

      graph,

      exits:
        layoutAArchitectureV2Exits,

      spawnZones,

      configuration: {
        strategyId:
          "ADAPTIVE_HYBRID",

        timestepSeconds:
          RESEARCH_TIMESTEP_SECONDS,

        maximumSimulationTimeSeconds:
          180,

        densityCellLengthMeters:
          RESEARCH_DENSITY_CELL_LENGTH_METERS,

        specificFlowPersonsPerMeterSecond:
          RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,

        adaptiveRerouteThreshold:
          RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
      },

      replayIntervalSeconds:
        0.10,

      replayObserver:
        (
          frame,
        ) => {
          frames.push(
            frame,
          );
        },
    });

  if (
    frames.length ===
    0
  ) {
    throw new Error(
      "Architecture V2 replay produced no frames.",
    );
  }

  return Object.freeze({
    frames:
      Object.freeze([
        ...frames,
      ]),

    result,
  });
}