import {
  useMemo,
} from "react";

import {
  Line,
} from "@react-three/drei";

import * as THREE from "three";

import {
  layoutAArchitectureV2,
} from "../environment/layoutAArchitectureV2";

import {
  layoutAArchitectureV2NavigationGraph,
} from "../environment/layoutAArchitectureV2NavigationGraph";

import type {
  NavigationEdge,
  NavigationNode,
  NavigationNodeType,
} from "../types/navigation";

const NETWORK_HEIGHT =
  0.96;

interface NodeStyle {
  readonly radius:
    number;

  readonly color:
    string;

  readonly emissive:
    string;

  readonly emissiveIntensity:
    number;
}

const NODE_STYLES:
  Record<
    NavigationNodeType,
    NodeStyle
  > = {
  DOOR: {
    radius:
      0.18,

    color:
      "#ffd27a",

    emissive:
      "#6f4612",

    emissiveIntensity:
      1.2,
  },

  EXIT: {
    radius:
      0.25,

    color:
      "#72efcf",

    emissive:
      "#126354",

    emissiveIntensity:
      1.5,
  },

  DECISION_POINT: {
    radius:
      0.22,

    color:
      "#f0a7ff",

    emissive:
      "#652b72",

    emissiveIntensity:
      1.25,
  },

  JUNCTION: {
    radius:
      0.18,

    color:
      "#83e2ef",

    emissive:
      "#185865",

    emissiveIntensity:
      1,
  },

  CONNECTOR: {
    radius:
      0.13,

    color:
      "#8eb9c8",

    emissive:
      "#294955",

    emissiveIntensity:
      0.7,
  },
};

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

function nodeToWorldPosition(
  node:
    NavigationNode,
): [
  number,
  number,
  number,
] {
  return [
    simulationXToWorldX(
      node.position.x,
    ),

    NETWORK_HEIGHT,

    simulationYToWorldZ(
      node.position.y,
    ),
  ];
}

function edgeColor(
  fromNode:
    NavigationNode,
  toNode:
    NavigationNode,
): string {
  if (
    fromNode.type ===
      "EXIT" ||
    toNode.type ===
      "EXIT"
  ) {
    return "#72efcf";
  }

  if (
    fromNode.type ===
      "DOOR" ||
    toNode.type ===
      "DOOR"
  ) {
    return "#f6c66f";
  }

  return "#65d6e4";
}

function edgeWidth(
  edge:
    NavigationEdge,
): number {
  if (
    edge.widthMeters <=
    1.8
  ) {
    return 1.8;
  }

  if (
    edge.widthMeters <=
    3.6
  ) {
    return 2.1;
  }

  return 2.4;
}

function NavigationEdgeVisual({
  edge,
  fromNode,
  toNode,
}: {
  readonly edge:
    NavigationEdge;

  readonly fromNode:
    NavigationNode;

  readonly toNode:
    NavigationNode;
}) {
  const points =
    useMemo(
      () => [
        nodeToWorldPosition(
          fromNode,
        ),

        nodeToWorldPosition(
          toNode,
        ),
      ],
      [
        fromNode,
        toNode,
      ],
    );

  return (
    <Line
      points={
        points
      }
      color={
        edgeColor(
          fromNode,
          toNode,
        )
      }
      lineWidth={
        edgeWidth(
          edge,
        )
      }
      transparent
      opacity={0.9}
    />
  );
}

function DecisionRing({
  node,
}: {
  readonly node:
    NavigationNode;
}) {
  const [
    worldX,
    ,
    worldZ,
  ] =
    nodeToWorldPosition(
      node,
    );

  return (
    <mesh
      position={[
        worldX,
        NETWORK_HEIGHT +
          0.025,
        worldZ,
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
          0.31,
          0.41,
          30,
        ]}
      />

      <meshBasicMaterial
        color="#f0a7ff"
        transparent
        opacity={0.8}
        side={
          THREE.DoubleSide
        }
        depthWrite={
          false
        }
      />
    </mesh>
  );
}

function ExitRing({
  node,
}: {
  readonly node:
    NavigationNode;
}) {
  const [
    worldX,
    ,
    worldZ,
  ] =
    nodeToWorldPosition(
      node,
    );

  return (
    <mesh
      position={[
        worldX,
        NETWORK_HEIGHT +
          0.02,
        worldZ,
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
          0.36,
          0.50,
          32,
        ]}
      />

      <meshBasicMaterial
        color="#72efcf"
        transparent
        opacity={0.88}
        side={
          THREE.DoubleSide
        }
        depthWrite={
          false
        }
      />
    </mesh>
  );
}

function DoorMarker({
  node,
}: {
  readonly node:
    NavigationNode;
}) {
  const [
    worldX,
    worldY,
    worldZ,
  ] =
    nodeToWorldPosition(
      node,
    );

  return (
    <mesh
      position={[
        worldX,
        worldY +
          0.08,
        worldZ,
      ]}
    >
      <boxGeometry
        args={[
          0.32,
          0.16,
          0.32,
        ]}
      />

      <meshStandardMaterial
        color="#ffd27a"
        emissive="#6f4612"
        emissiveIntensity={1.2}
        roughness={0.45}
        metalness={0.06}
      />
    </mesh>
  );
}

function RoundNodeMarker({
  node,
}: {
  readonly node:
    NavigationNode;
}) {
  const style =
    NODE_STYLES[
      node.type
    ];

  const [
    worldX,
    worldY,
    worldZ,
  ] =
    nodeToWorldPosition(
      node,
    );

  return (
    <mesh
      position={[
        worldX,
        worldY +
          style.radius *
            0.62,
        worldZ,
      ]}
    >
      <sphereGeometry
        args={[
          style.radius,
          18,
          14,
        ]}
      />

      <meshStandardMaterial
        color={
          style.color
        }
        emissive={
          style.emissive
        }
        emissiveIntensity={
          style.emissiveIntensity
        }
        roughness={0.42}
        metalness={0.08}
      />
    </mesh>
  );
}

function NavigationNodeVisual({
  node,
}: {
  readonly node:
    NavigationNode;
}) {
  return (
    <group>
      {node.type ===
      "DOOR" ? (
        <DoorMarker
          node={
            node
          }
        />
      ) : (
        <RoundNodeMarker
          node={
            node
          }
        />
      )}

      {node.type ===
      "DECISION_POINT" ? (
        <DecisionRing
          node={
            node
          }
        />
      ) : null}

      {node.type ===
      "EXIT" ? (
        <ExitRing
          node={
            node
          }
        />
      ) : null}
    </group>
  );
}

/**
 * Architecture V2 navigation inspection overlay.
 *
 * Color key:
 *
 * amber  = room-door connection
 * cyan   = internal circulation
 * purple = decision point
 * green  = exterior evacuation endpoint
 *
 * Occupants remain intentionally disabled during this review.
 */
export function LayoutAArchitectureV2NavigationOverlay() {
  const nodeById =
    useMemo(
      () =>
        new Map(
          layoutAArchitectureV2NavigationGraph
            .nodes
            .map(
              (
                node,
              ) =>
                [
                  node.id,
                  node,
                ] as const,
            ),
        ),
      [],
    );

  return (
    <group>
      {layoutAArchitectureV2NavigationGraph
        .edges
        .map(
          (
            edge,
          ) => {
            const fromNode =
              nodeById.get(
                edge.from,
              );

            const toNode =
              nodeById.get(
                edge.to,
              );

            if (
              !fromNode ||
              !toNode
            ) {
              throw new Error(
                `Architecture V2 navigation edge ${edge.id} references a missing node.`,
              );
            }

            return (
              <NavigationEdgeVisual
                key={
                  edge.id
                }
                edge={
                  edge
                }
                fromNode={
                  fromNode
                }
                toNode={
                  toNode
                }
              />
            );
          },
        )}

      {layoutAArchitectureV2NavigationGraph
        .nodes
        .map(
          (
            node,
          ) => (
            <NavigationNodeVisual
              key={
                node.id
              }
              node={
                node
              }
            />
          ),
        )}
    </group>
  );
}