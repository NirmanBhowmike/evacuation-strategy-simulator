import {
  useMemo,
} from "react";

import * as THREE from "three";

import {
  Line,
} from "@react-three/drei";

import {
  layoutA,
} from "../environment/layoutA";

import {
  layoutANavigationGraph,
} from "../environment/layoutANavigationGraph";

import type {
  NavigationEdge,
  NavigationNode,
  NavigationNodeType,
} from "../types/navigation";

const NETWORK_HEIGHT =
  0.94;

interface NodeVisualStyle {
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
    NodeVisualStyle
  > = {
    DECISION_POINT: {
      radius:
        0.23,

      color:
        "#78e2ea",

      emissive:
        "#17535a",

      emissiveIntensity:
        1.25,
    },

    JUNCTION: {
      radius:
        0.17,

      color:
        "#79bcc8",

      emissive:
        "#123941",

      emissiveIntensity:
        0.72,
    },

    CONNECTOR: {
      radius:
        0.115,

      color:
        "#5f91a1",

      emissive:
        "#102d35",

      emissiveIntensity:
        0.45,
    },

    DOOR: {
      radius:
        0.105,

      color:
        "#8daeba",

      emissive:
        "#152f36",

      emissiveIntensity:
        0.35,
    },

    EXIT: {
      radius:
        0.2,

      color:
        "#62dce5",

      emissive:
        "#17545a",

      emissiveIntensity:
        1.15,
    },
  };

function simulationXToWorldX(
  x:
    number,
): number {
  return (
    x -
    layoutA.widthMeters /
      2
  );
}

function simulationYToWorldZ(
  y:
    number,
): number {
  return (
    layoutA.heightMeters /
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

function NetworkEdge({
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

  const isNarrow =
    edge.widthMeters <=
    2;

  return (
    <Line
      points={
        points
      }
      color={
        isNarrow
          ? "#6d9eab"
          : "#64b7c4"
      }
      lineWidth={
        isNarrow
          ? 0.9
          : 1.2
      }
      transparent
      opacity={
        isNarrow
          ? 0.55
          : 0.62
      }
    />
  );
}

function DecisionPointRing({
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
          0.012,
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
          0.3,
          0.39,
          28,
        ]}
      />

      <meshBasicMaterial
        color="#8aebf0"
        transparent
        opacity={0.72}
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

function NetworkNode({
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
    <group>
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
            16,
            12,
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
            style
              .emissiveIntensity
          }
          roughness={0.5}
          metalness={0.08}
        />
      </mesh>

      {node.type ===
      "DECISION_POINT" ? (
        <DecisionPointRing
          node={
            node
          }
        />
      ) : null}
    </group>
  );
}

export function NavigationNetworkOverlay() {
  const nodeById =
    useMemo(
      () =>
        new Map(
          layoutANavigationGraph
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
      {layoutANavigationGraph
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
                `Navigation edge ${edge.id} references a missing node.`,
              );
            }

            return (
              <NetworkEdge
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

      {layoutANavigationGraph
        .nodes
        .map(
          (
            node,
          ) => (
            <NetworkNode
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