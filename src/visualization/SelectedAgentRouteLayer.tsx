import {
  useMemo,
} from "react";

import {
  Line,
} from "@react-three/drei";

import {
  layoutAArchitectureV2,
} from "../environment/layoutAArchitectureV2";

import {
  layoutAArchitectureV2NavigationGraph,
} from "../environment/layoutAArchitectureV2NavigationGraph";

import type {
  SimulationReplayFrame,
  SimulationReplayRoute,
} from "../types/simulationReplay";

interface SelectedAgentRouteLayerProps {
  readonly currentFrame:
    SimulationReplayFrame | null;

  readonly primarySelectedAgentId:
    string | null;
}

interface WorldPoint {
  readonly x:
    number;

  readonly y:
    number;

  readonly z:
    number;
}

interface RouteSegment {
  readonly id:
    string;

  readonly from:
    WorldPoint;

  readonly to:
    WorldPoint;

  readonly hazardous:
    boolean;
}

const ROUTE_Y =
  0.84;

function simulationXToWorldX(
  x:
    number,
): number {
  return (
    x -
    layoutAArchitectureV2
      .widthMeters /
      2
  );
}

function simulationYToWorldZ(
  y:
    number,
): number {
  return (
    layoutAArchitectureV2
      .heightMeters /
      2 -
    y
  );
}

function pointFromSimulation(
  x:
    number,
  y:
    number,
): WorldPoint {
  return {
    x:
      simulationXToWorldX(
        x,
      ),

    y:
      ROUTE_Y,

    z:
      simulationYToWorldZ(
        y,
      ),
  };
}

function findRoute(
  frame:
    SimulationReplayFrame,
  agentId:
    string,
): SimulationReplayRoute | null {
  return (
    frame.routes.find(
      (
        candidate,
      ) =>
        candidate.agentId ===
        agentId,
    ) ??
    null
  );
}

function activeHazardZoneIds(
  frame:
    SimulationReplayFrame,
): ReadonlySet<string> {
  return new Set(
    frame.appliedDisruptions
      .filter(
        (
          disruption,
        ) =>
          disruption.type ===
            "HAZARD_ACTIVATE" ||
          disruption.type ===
            "HAZARD_EXPAND",
      )
      .map(
        (
          disruption,
        ) =>
          disruption.targetId,
      ),
  );
}

function buildRouteSegments(
  frame:
    SimulationReplayFrame,
  agentId:
    string,
): readonly RouteSegment[] {
  const agent =
    frame.snapshot
      .agents
      .find(
        (
          candidate,
        ) =>
          candidate.id ===
          agentId,
      );

  if (
    !agent ||
    agent.status !==
      "ACTIVE"
  ) {
    return [];
  }

  const route =
    findRoute(
      frame,
      agentId,
    );

  if (
    !route ||
    route.nodeIds.length ===
      0
  ) {
    return [];
  }

  const nodeById =
    new Map(
      layoutAArchitectureV2NavigationGraph
        .nodes
        .map(
          (
            node,
          ) => [
            node.id,
            node,
          ] as const,
        ),
    );

  const edgeById =
    new Map(
      layoutAArchitectureV2NavigationGraph
        .edges
        .map(
          (
            edge,
          ) => [
            edge.id,
            edge,
          ] as const,
        ),
    );

  const hazardZoneIds =
    activeHazardZoneIds(
      frame,
    );

  const routeCursor =
    Math.max(
      0,
      route.routeCursorIndex,
    );

  const segments:
    RouteSegment[] =
    [];

  let previousPoint =
    pointFromSimulation(
      agent.position.x,
      agent.position.y,
    );

  /*
   * The first target is the next route node.
   *
   * Private room-origin nodes added by the formal population
   * are intentionally not required here. The trace begins at
   * the agent's authoritative physical position.
   */
  for (
    let nodeIndex =
      routeCursor +
      1;
    nodeIndex <
      route.nodeIds.length;
    nodeIndex +=
      1
  ) {
    const nodeId =
      route.nodeIds[
        nodeIndex
      ];

    if (
      !nodeId
    ) {
      continue;
    }

    const node =
      nodeById.get(
        nodeId,
      );

    if (
      !node
    ) {
      continue;
    }

    const currentPoint =
      pointFromSimulation(
        node.position.x,
        node.position.y,
      );

    const edgeIndex =
      nodeIndex -
      1;

    const edgeId =
      route.edgeIds[
        edgeIndex
      ];

    const edge =
      edgeId
        ? edgeById.get(
            edgeId,
          )
        : undefined;

    const hazardous =
      edge
        ? hazardZoneIds.has(
            edge.zoneId,
          )
        : false;

    segments.push({
      id:
        `${agentId}-${edgeId ?? nodeId}-${nodeIndex}`,

      from:
        previousPoint,

      to:
        currentPoint,

      hazardous,
    });

    previousPoint =
      currentPoint;
  }

  return segments;
}

export function SelectedAgentRouteLayer({
  currentFrame,
  primarySelectedAgentId,
}: SelectedAgentRouteLayerProps) {
  const segments =
    useMemo(
      () => {
        if (
          !currentFrame ||
          !primarySelectedAgentId
        ) {
          return [];
        }

        return buildRouteSegments(
          currentFrame,
          primarySelectedAgentId,
        );
      },
      [
        currentFrame,
        primarySelectedAgentId,
      ],
    );

  if (
    segments.length ===
    0
  ) {
    return null;
  }

  return (
    <group>
      {segments.map(
        (
          segment,
        ) => (
          <Line
            key={
              segment.id
            }
            points={[
              [
                segment.from.x,
                segment.from.y,
                segment.from.z,
              ],
              [
                segment.to.x,
                segment.to.y,
                segment.to.z,
              ],
            ]}
            color={
              segment.hazardous
                ? "#ff9b42"
                : "#46e0ea"
            }
            lineWidth={
              segment.hazardous
                ? 4.2
                : 3.2
            }
            transparent
            opacity={
              segment.hazardous
                ? 0.96
                : 0.88
            }
          />
        ),
      )}

      {segments.map(
        (
          segment,
          index,
        ) => {
          if (
            index !==
            segments.length -
              1
          ) {
            return null;
          }

          return (
            <mesh
              key="selected-route-destination"
              position={[
                segment.to.x,
                ROUTE_Y +
                  0.02,
                segment.to.z,
              ]}
              rotation={[
                -Math.PI /
                  2,
                0,
                0,
              ]}
            >
              <ringGeometry
                args={[
                  0.28,
                  0.43,
                  24,
                ]}
              />

              <meshBasicMaterial
                color="#46e0ea"
                transparent
                opacity={0.92}
                depthWrite={false}
              />
            </mesh>
          );
        },
      )}
    </group>
  );
}