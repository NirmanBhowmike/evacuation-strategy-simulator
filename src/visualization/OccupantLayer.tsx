import {
  useMemo,
} from "react";

import {
  layoutA,
} from "../environment/layoutA";

import type {
  SimulationReplayFrame,
} from "../types/simulationReplay";

import type {
  SimulationAgentSnapshot,
} from "../types/simulationSnapshot";

interface OccupantLayerProps {
  readonly currentFrame:
    SimulationReplayFrame | null;

  readonly nextFrame:
    SimulationReplayFrame | null;

  readonly interpolationAlpha:
    number;
}

interface DisplayOffset {
  readonly x:
    number;

  readonly y:
    number;
}

const COLOCATION_BUCKET_METERS =
  0.04;

const ZERO_OFFSET:
  DisplayOffset = {
    x: 0,
    y: 0,
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
    `${xBucket}|` +
    `${yBucket}`
  );
}

function hashString(
  value:
    string,
): number {
  let hash =
    2166136261;

  for (
    let index = 0;
    index <
    value.length;
    index += 1
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

/**
 * Display-only separation.
 *
 * Multiple agents can legitimately occupy the same tactical
 * navigation coordinate because the research engine begins
 * movement at room access nodes.
 *
 * This offset changes only renderer coordinates. It is never
 * returned to the simulation engine.
 */
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

  const angleDegrees =
    hash %
    360;

  const angle =
    (
      angleDegrees *
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
      ? 0.20
      : colocatedCount <=
          6
        ? 0.27
        : 0.32;

  const radius =
    baseRadius +
    radiusBand *
      0.045;

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
  if (!frame) {
    return new Map();
  }

  const activeAgents =
    frame.snapshot.agents
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

function LowPolyPerson({
  heading,
}: {
  readonly heading:
    number;
}) {
  return (
    <group
      rotation={[
        0,
        heading,
        0,
      ]}
    >
      {/* subtle location shadow */}
      <mesh
        rotation={[
          -Math.PI /
            2,
          0,
          0,
        ]}
        position={[
          0,
          0.015,
          0,
        ]}
      >
        <circleGeometry
          args={[
            0.14,
            16,
          ]}
        />

        <meshBasicMaterial
          color="#4aaab5"
          transparent
          opacity={0.22}
          depthWrite={
            false
          }
        />
      </mesh>

      {/* left leg */}
      <mesh
        castShadow
        position={[
          -0.07,
          0.22,
          0,
        ]}
      >
        <cylinderGeometry
          args={[
            0.052,
            0.06,
            0.36,
            8,
          ]}
        />

        <meshStandardMaterial
          color="#709da7"
          roughness={0.62}
          metalness={0.03}
        />
      </mesh>

      {/* right leg */}
      <mesh
        castShadow
        position={[
          0.07,
          0.22,
          0,
        ]}
      >
        <cylinderGeometry
          args={[
            0.052,
            0.06,
            0.36,
            8,
          ]}
        />

        <meshStandardMaterial
          color="#709da7"
          roughness={0.62}
          metalness={0.03}
        />
      </mesh>

      {/* torso */}
      <mesh
        castShadow
        position={[
          0,
          0.58,
          0,
        ]}
      >
        <cylinderGeometry
          args={[
            0.12,
            0.17,
            0.40,
            9,
          ]}
        />

        <meshStandardMaterial
          color="#94cbd2"
          emissive="#17444a"
          emissiveIntensity={
            0.30
          }
          roughness={0.52}
          metalness={0.04}
        />
      </mesh>

      {/* left arm */}
      <mesh
        castShadow
        position={[
          -0.17,
          0.57,
          0,
        ]}
        rotation={[
          0,
          0,
          -0.10,
        ]}
      >
        <cylinderGeometry
          args={[
            0.038,
            0.044,
            0.33,
            7,
          ]}
        />

        <meshStandardMaterial
          color="#86b8c0"
          roughness={0.55}
          metalness={0.03}
        />
      </mesh>

      {/* right arm */}
      <mesh
        castShadow
        position={[
          0.17,
          0.57,
          0,
        ]}
        rotation={[
          0,
          0,
          0.10,
        ]}
      >
        <cylinderGeometry
          args={[
            0.038,
            0.044,
            0.33,
            7,
          ]}
        />

        <meshStandardMaterial
          color="#86b8c0"
          roughness={0.55}
          metalness={0.03}
        />
      </mesh>

      {/* head */}
      <mesh
        castShadow
        position={[
          0,
          0.91,
          0,
        ]}
      >
        <sphereGeometry
          args={[
            0.115,
            12,
            10,
          ]}
        />

        <meshStandardMaterial
          color="#d9eef0"
          emissive="#1c5157"
          emissiveIntensity={
            0.24
          }
          roughness={0.46}
          metalness={0.02}
        />
      </mesh>
    </group>
  );
}

export function OccupantLayer({
  currentFrame,
  nextFrame,
  interpolationAlpha,
}: OccupantLayerProps) {
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

  if (!currentFrame) {
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

            const currentOffset =
              currentOffsets.get(
                agent.id,
              ) ??
              ZERO_OFFSET;

            const nextOffset =
              nextOffsets.get(
                agent.id,
              ) ??
              ZERO_OFFSET;

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

            const offsetX =
              interpolate(
                currentOffset.x,
                nextOffset.x,
                interpolationAlpha,
              );

            const offsetY =
              interpolate(
                currentOffset.y,
                nextOffset.y,
                interpolationAlpha,
              );

            const simulationX =
              interpolate(
                agent
                  .position
                  .x,
                nextX,
                interpolationAlpha,
              ) +
              offsetX;

            const simulationY =
              interpolate(
                agent
                  .position
                  .y,
                nextY,
                interpolationAlpha,
              ) +
              offsetY;

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
                agent
                  .position
                  .x +
                  currentOffset.x,
              );

            const currentWorldZ =
              simulationYToWorldZ(
                agent
                  .position
                  .y +
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

            const heading =
              Math.hypot(
                deltaX,
                deltaZ,
              ) <
              0.001
                ? 0
                : Math.atan2(
                    deltaX,
                    deltaZ,
                  );

            return (
              <group
                key={
                  agent.id
                }
                position={[
                  worldX,
                  0.79,
                  worldZ,
                ]}
              >
                <LowPolyPerson
                  heading={
                    heading
                  }
                />
              </group>
            );
          },
        )}
    </group>
  );
}