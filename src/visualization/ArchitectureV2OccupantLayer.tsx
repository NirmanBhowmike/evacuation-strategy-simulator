import {
  useMemo,
} from "react";

import type {
  ThreeEvent,
} from "@react-three/fiber";

import {
  layoutAArchitectureV2,
} from "../environment/layoutAArchitectureV2";

import type {
  SimulationReplayFrame,
} from "../types/simulationReplay";

import type {
  SimulationAgentSnapshot,
} from "../types/simulationSnapshot";

import {
  createRoomOccupantPreview,
} from "./createRoomOccupantPreview";

import {
  LowPolyHuman,
} from "./LowPolyHuman";

export type AgentSelectionMode =
  | "replace"
  | "toggle";

interface ArchitectureV2OccupantLayerProps {
  readonly currentFrame:
    SimulationReplayFrame | null;

  readonly nextFrame:
    SimulationReplayFrame | null;

  readonly interpolationAlpha:
    number;

  readonly selectedAgentIds?:
    ReadonlySet<string>;

  readonly primarySelectedAgentId?:
    string | null;

  readonly onAgentSelect?:
    (
      agentId:
        string,
      mode:
        AgentSelectionMode,
    ) => void;
}

interface DisplayOffset {
  readonly x:
    number;

  readonly y:
    number;
}

interface AgentAppearance {
  readonly bodyVariant:
    number;

  readonly heightScale:
    number;

  readonly animationPhase:
    number;

  readonly initialHeadingRadians:
    number;
}

const COLOCATION_BUCKET_METERS =
  0.04;

const ZERO_OFFSET:
  DisplayOffset = {
    x:
      0,

    y:
      0,
  };

const EMPTY_SELECTION =
  new Set<string>();

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

function interpolate(
  start:
    number,
  end:
    number,
  alpha:
    number,
): number {
  return (
    start +
    (
      end -
      start
    ) *
      alpha
  );
}

function positionBucketKey(
  agent:
    SimulationAgentSnapshot,
): string {
  const xBucket =
    Math.round(
      agent.position.x /
        COLOCATION_BUCKET_METERS,
    );

  const yBucket =
    Math.round(
      agent.position.y /
        COLOCATION_BUCKET_METERS,
    );

  return (
    `${xBucket}|${yBucket}`
  );
}

function hashString(
  value:
    string,
): number {
  let hash =
    2166136261;

  for (
    let index =
      0;
    index <
      value.length;
    index +=
      1
  ) {
    hash ^=
      value.charCodeAt(
        index,
      );

    hash =
      Math.imul(
        hash,
        16777619,
      );
  }

  return (
    hash >>>
    0
  );
}

function deterministicDisplayOffset(
  agentId:
    string,
  colocatedCount:
    number,
): DisplayOffset {
  if (
    colocatedCount <=
    1
  ) {
    return ZERO_OFFSET;
  }

  const hash =
    hashString(
      agentId,
    );

  const angle =
    (
      (
        hash %
        360
      ) *
      Math.PI
    ) /
    180;

  const radiusBand =
    (
      hash >>>
      8
    ) %
    3;

  const baseRadius =
    colocatedCount <=
    3
      ? 0.10
      : colocatedCount <=
          6
        ? 0.14
        : 0.17;

  const radius =
    baseRadius +
    radiusBand *
      0.025;

  return {
    x:
      Math.cos(
        angle,
      ) *
      radius,

    y:
      Math.sin(
        angle,
      ) *
      radius,
  };
}

function buildDisplayOffsets(
  frame:
    SimulationReplayFrame | null,
): ReadonlyMap<
  string,
  DisplayOffset
> {
  if (
    !frame
  ) {
    return new Map();
  }

  const activeAgents =
    frame.snapshot
      .agents
      .filter(
        (
          agent,
        ) =>
          agent.status ===
          "ACTIVE",
      );

  const groupSizeByPosition =
    new Map<
      string,
      number
    >();

  for (
    const agent of
    activeAgents
  ) {
    const key =
      positionBucketKey(
        agent,
      );

    groupSizeByPosition.set(
      key,
      (
        groupSizeByPosition.get(
          key,
        ) ??
        0
      ) +
        1,
    );
  }

  const offsets =
    new Map<
      string,
      DisplayOffset
    >();

  for (
    const agent of
    activeAgents
  ) {
    const key =
      positionBucketKey(
        agent,
      );

    const count =
      groupSizeByPosition.get(
        key,
      ) ??
      1;

    offsets.set(
      agent.id,
      deterministicDisplayOffset(
        agent.id,
        count,
      ),
    );
  }

  return offsets;
}

function createAppearanceMap():
  ReadonlyMap<
    string,
    AgentAppearance
  > {
  const previewAgents =
    createRoomOccupantPreview();

  const map =
    new Map<
      string,
      AgentAppearance
    >();

  for (
    let index =
      0;
    index <
      previewAgents.length;
    index +=
      1
  ) {
    const preview =
      previewAgents[
        index
      ];

    if (
      !preview
    ) {
      continue;
    }

    const authoritativeId =
      `agent-${String(
        index +
          1,
      ).padStart(
        4,
        "0",
      )}`;

    map.set(
      authoritativeId,
      {
        bodyVariant:
          preview.bodyVariant,

        heightScale:
          preview.heightScale,

        animationPhase:
          preview.animationPhase,

        initialHeadingRadians:
          preview.headingRadians,
      },
    );
  }

  return map;
}

interface SelectionHighlightProps {
  readonly primary:
    boolean;
}

function SelectionHighlight({
  primary,
}: SelectionHighlightProps) {
  return (
    <>
      <mesh
        rotation={[
          -Math.PI /
            2,
          0,
          0,
        ]}
        position={[
          0,
          0.025,
          0,
        ]}
      >
        <ringGeometry
          args={[
            primary
              ? 0.30
              : 0.27,
            primary
              ? 0.43
              : 0.38,
            32,
          ]}
        />

        <meshBasicMaterial
          color={
            primary
              ? "#55e7f0"
              : "#a8f3f6"
          }
          transparent
          opacity={
            primary
              ? 0.96
              : 0.72
          }
          depthWrite={false}
        />
      </mesh>

      {primary ? (
        <mesh
          position={[
            0,
            0.86,
            0,
          ]}
        >
          <cylinderGeometry
            args={[
              0.30,
              0.30,
              1.65,
              18,
              1,
              true,
            ]}
          />

          <meshBasicMaterial
            color="#55e7f0"
            transparent
            opacity={0.09}
            depthWrite={false}
            side={2}
          />
        </mesh>
      ) : null}
    </>
  );
}

export function ArchitectureV2OccupantLayer({
  currentFrame,
  nextFrame,
  interpolationAlpha,
  selectedAgentIds =
    EMPTY_SELECTION,
  primarySelectedAgentId =
    null,
  onAgentSelect,
}: ArchitectureV2OccupantLayerProps) {
  const appearanceByAgentId =
    useMemo(
      () =>
        createAppearanceMap(),
      [],
    );

  const nextAgentById =
    useMemo(
      () =>
        new Map(
          nextFrame
            ?.snapshot
            .agents
            .map(
              (
                agent,
              ) =>
                [
                  agent.id,
                  agent,
                ] as const,
            ) ??
            [],
        ),
      [
        nextFrame,
      ],
    );

  const currentOffsets =
    useMemo(
      () =>
        buildDisplayOffsets(
          currentFrame,
        ),
      [
        currentFrame,
      ],
    );

  const nextOffsets =
    useMemo(
      () =>
        buildDisplayOffsets(
          nextFrame,
        ),
      [
        nextFrame,
      ],
    );

  if (
    !currentFrame
  ) {
    return null;
  }

  return (
    <group>
      {currentFrame
        .snapshot
        .agents
        .filter(
          (
            agent,
          ) =>
            agent.status ===
            "ACTIVE",
        )
        .map(
          (
            agent,
          ) => {
            const nextAgent =
              nextAgentById.get(
                agent.id,
              );

            const appearance =
              appearanceByAgentId.get(
                agent.id,
              );

            const currentOffset =
              currentOffsets.get(
                agent.id,
              ) ??
              ZERO_OFFSET;

            const nextOffset =
              nextOffsets.get(
                agent.id,
              ) ??
              currentOffset;

            const nextX =
              nextAgent
                ? nextAgent
                    .position
                    .x
                : agent
                    .position
                    .x;

            const nextY =
              nextAgent
                ? nextAgent
                    .position
                    .y
                : agent
                    .position
                    .y;

            const simulationX =
              interpolate(
                agent.position.x +
                  currentOffset.x,
                nextX +
                  nextOffset.x,
                interpolationAlpha,
              );

            const simulationY =
              interpolate(
                agent.position.y +
                  currentOffset.y,
                nextY +
                  nextOffset.y,
                interpolationAlpha,
              );

            const worldX =
              simulationXToWorldX(
                simulationX,
              );

            const worldZ =
              simulationYToWorldZ(
                simulationY,
              );

            const currentWorldX =
              simulationXToWorldX(
                agent.position.x +
                  currentOffset.x,
              );

            const currentWorldZ =
              simulationYToWorldZ(
                agent.position.y +
                  currentOffset.y,
              );

            const nextWorldX =
              simulationXToWorldX(
                nextX +
                  nextOffset.x,
              );

            const nextWorldZ =
              simulationYToWorldZ(
                nextY +
                  nextOffset.y,
              );

            const deltaX =
              nextWorldX -
              currentWorldX;

            const deltaZ =
              nextWorldZ -
              currentWorldZ;

            const movementMagnitude =
              Math.hypot(
                deltaX,
                deltaZ,
              );

            const headingRadians =
              movementMagnitude >
              0.002
                ? Math.atan2(
                    deltaX,
                    deltaZ,
                  )
                : appearance
                    ?.initialHeadingRadians ??
                  0;

            const motionMode =
              movementMagnitude >
              0.002
                ? "WALK"
                : "IDLE";

            const selected =
              selectedAgentIds.has(
                agent.id,
              );

            const primary =
              primarySelectedAgentId ===
              agent.id;

            const handleAgentClick =
              (
                event:
                  ThreeEvent<
                    MouseEvent
                  >,
              ) => {
                event.stopPropagation();

                if (
                  !onAgentSelect
                ) {
                  return;
                }

                const nativeEvent =
                  event.nativeEvent;

                const toggleMode =
                  nativeEvent.shiftKey ||
                  nativeEvent.ctrlKey ||
                  nativeEvent.metaKey;

                onAgentSelect(
                  agent.id,
                  toggleMode
                    ? "toggle"
                    : "replace",
                );
              };

            return (
              <group
                key={
                  agent.id
                }
                position={[
                  worldX,
                  0.78,
                  worldZ,
                ]}
                onClick={
                  handleAgentClick
                }
              >
                {selected ? (
                  <SelectionHighlight
                    primary={
                      primary
                    }
                  />
                ) : null}

                <mesh
                  position={[
                    0,
                    0.82,
                    0,
                  ]}
                  visible={false}
                >
                  <cylinderGeometry
                    args={[
                      0.34,
                      0.34,
                      1.7,
                      12,
                    ]}
                  />

                  <meshBasicMaterial
                    transparent
                    opacity={0}
                    depthWrite={false}
                  />
                </mesh>

                <LowPolyHuman
                  headingRadians={
                    headingRadians
                  }
                  animationPhase={
                    appearance
                      ?.animationPhase ??
                    0
                  }
                  bodyVariant={
                    appearance
                      ?.bodyVariant ??
                    0
                  }
                  heightScale={
                    appearance
                      ?.heightScale ??
                    1
                  }
                  motionMode={
                    motionMode
                  }
                />
              </group>
            );
          },
        )}
    </group>
  );
}