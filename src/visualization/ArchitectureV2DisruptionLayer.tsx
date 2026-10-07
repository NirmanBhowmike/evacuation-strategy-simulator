import {
  useRef,
} from "react";

import {
  Html,
  Line,
} from "@react-three/drei";

import {
  useFrame,
} from "@react-three/fiber";

import * as THREE from "three";

import {
  layoutAArchitectureV2,
} from "../environment/layoutAArchitectureV2";

import type {
  ArchitectureExit,
} from "../environment/layoutAArchitectureV2";

import {
  ARCHITECTURE_V2_D3_BLOCKABLE_ZONE,
} from "../scenario/architectureV2ResearchModel";

import type {
  AppliedDisruptionRecord,
} from "../types/headlessSimulation";

import type {
  SimulationReplayFrame,
} from "../types/simulationReplay";

interface ArchitectureV2DisruptionLayerProps {
  readonly currentFrame:
    SimulationReplayFrame | null;
}

interface PointLike {
  readonly x:
    number;

  readonly y:
    number;
}

interface ZoneBounds {
  readonly centerX:
    number;

  readonly centerZ:
    number;

  readonly width:
    number;

  readonly depth:
    number;
}

interface CompactWorldLabelProps {
  readonly symbol:
    string;

  readonly title:
    string;

  readonly targetLabel:
    string;

  readonly variant:
    "hazard" |
    "corridor" |
    "exit";

  readonly detailed:
    boolean;
}

const FLOOR_Y =
  0.69;

const FULL_WORLD_LABEL_SECONDS =
  6;

function simulationXToWorldX(
  simulationX:
    number,
): number {
  return (
    simulationX -
    layoutAArchitectureV2
      .widthMeters /
      2
  );
}

function simulationYToWorldZ(
  simulationY:
    number,
): number {
  return (
    layoutAArchitectureV2
      .heightMeters /
      2 -
    simulationY
  );
}

function boundsFromPolygon(
  vertices:
    readonly PointLike[],
): ZoneBounds | null {
  if (
    vertices.length ===
    0
  ) {
    return null;
  }

  let minimumX =
    Number.POSITIVE_INFINITY;

  let maximumX =
    Number.NEGATIVE_INFINITY;

  let minimumY =
    Number.POSITIVE_INFINITY;

  let maximumY =
    Number.NEGATIVE_INFINITY;

  for (
    const vertex of
    vertices
  ) {
    minimumX =
      Math.min(
        minimumX,
        vertex.x,
      );

    maximumX =
      Math.max(
        maximumX,
        vertex.x,
      );

    minimumY =
      Math.min(
        minimumY,
        vertex.y,
      );

    maximumY =
      Math.max(
        maximumY,
        vertex.y,
      );
  }

  const simulationCenterX =
    (
      minimumX +
      maximumX
    ) /
    2;

  const simulationCenterY =
    (
      minimumY +
      maximumY
    ) /
    2;

  return {
    centerX:
      simulationXToWorldX(
        simulationCenterX,
      ),

    centerZ:
      simulationYToWorldZ(
        simulationCenterY,
      ),

    width:
      Math.max(
        0.2,
        maximumX -
          minimumX,
      ),

    depth:
      Math.max(
        0.2,
        maximumY -
          minimumY,
      ),
  };
}

function resolveZoneBounds(
  targetId:
    string,
): ZoneBounds | null {
  const circulationArea =
    layoutAArchitectureV2
      .circulation
      .find(
        (
          area,
        ) =>
          area.id ===
          targetId,
      );

  if (
    circulationArea
  ) {
    return boundsFromPolygon(
      circulationArea.polygon,
    );
  }

  if (
    targetId ===
    ARCHITECTURE_V2_D3_BLOCKABLE_ZONE
      .id
  ) {
    return boundsFromPolygon(
      ARCHITECTURE_V2_D3_BLOCKABLE_ZONE
        .polygon
        .vertices,
    );
  }

  return null;
}

function resolveExit(
  targetId:
    string,
): ArchitectureExit | null {
  return (
    layoutAArchitectureV2
      .exits
      .find(
        (
          exit,
        ) =>
          exit.id ===
          targetId,
      ) ??
    null
  );
}

function targetDisplayName(
  targetId:
    string,
): string {
  const exit =
    resolveExit(
      targetId,
    );

  if (
    exit
  ) {
    return exit.label;
  }

  switch (
    targetId
  ) {
    case "corridor-main-spine":
      return "Main Spine";

    case "corridor-main-central-east-blockable":
      return "Main-Central Corridor";

    case "corridor-west":
      return "West Corridor";

    case "corridor-upper-east":
      return "Upper-East Corridor";

    default:
      return targetId;
  }
}

function shouldShowDetailedLabel(
  currentTimeSeconds:
    number,
  event:
    AppliedDisruptionRecord,
): boolean {
  const eventAgeSeconds =
    currentTimeSeconds -
    event.activationTimeSeconds;

  return (
    eventAgeSeconds >=
      -0.05 &&
    eventAgeSeconds <=
      FULL_WORLD_LABEL_SECONDS
  );
}

function CompactWorldLabel({
  symbol,
  title,
  targetLabel,
  variant,
  detailed,
}: CompactWorldLabelProps) {
  return (
    <div
      className={
        `world-event-label world-event-label-${variant}${
          detailed
            ? " detailed"
            : " compact"
        }`
      }
    >
      <span className="world-event-symbol">
        {symbol}
      </span>

      <span className="world-event-title">
        {title}
      </span>

      {detailed ? (
        <small>
          {targetLabel}
        </small>
      ) : null}
    </div>
  );
}

function createZoneBoundaryPoints(
  bounds:
    ZoneBounds,
): readonly [
  number,
  number,
  number
][] {
  const minX =
    bounds.centerX -
    bounds.width /
      2;

  const maxX =
    bounds.centerX +
    bounds.width /
      2;

  const minZ =
    bounds.centerZ -
    bounds.depth /
      2;

  const maxZ =
    bounds.centerZ +
    bounds.depth /
      2;

  return [
    [
      minX,
      FLOOR_Y +
        0.075,
      minZ,
    ],

    [
      maxX,
      FLOOR_Y +
        0.075,
      minZ,
    ],

    [
      maxX,
      FLOOR_Y +
        0.075,
      maxZ,
    ],

    [
      minX,
      FLOOR_Y +
        0.075,
      maxZ,
    ],

    [
      minX,
      FLOOR_Y +
        0.075,
      minZ,
    ],
  ];
}

interface HazardVisualProps {
  readonly event:
    AppliedDisruptionRecord;

  readonly currentTimeSeconds:
    number;
}

function HazardVisual({
  event,
  currentTimeSeconds,
}: HazardVisualProps) {
  const bounds =
    resolveZoneBounds(
      event.targetId,
    );

  const floorMaterialRef =
    useRef<
      THREE.MeshStandardMaterial | null
    >(
      null,
    );

  const glowLightRef =
    useRef<
      THREE.PointLight | null
    >(
      null,
    );

  useFrame(
    (
      state,
    ) => {
      const pulse =
        (
          Math.sin(
            state
              .clock
              .elapsedTime *
              1.8,
          ) +
          1
        ) /
        2;

      if (
        floorMaterialRef
          .current
      ) {
        floorMaterialRef
          .current
          .opacity =
          0.11 +
          pulse *
            0.045;

        floorMaterialRef
          .current
          .emissiveIntensity =
          0.38 +
          pulse *
            0.24;
      }

      if (
        glowLightRef
          .current
      ) {
        glowLightRef
          .current
          .intensity =
          1.8 +
          pulse *
            1.2;
      }
    },
  );

  if (
    !bounds
  ) {
    return null;
  }

  const detailed =
    shouldShowDetailedLabel(
      currentTimeSeconds,
      event,
    );

  const boundaryPoints =
    createZoneBoundaryPoints(
      bounds,
    );

  const stripeCount =
    Math.max(
      5,
      Math.min(
        11,
        Math.round(
          bounds.width /
            4,
        ),
      ),
    );

  /*
   * Keep the label near the edge of the hazardous region,
   * not across the pedestrian flow.
   */
  const labelX =
    bounds.centerX;

  const labelZ =
    bounds.centerZ -
    bounds.depth /
      2 -
    1.55;

  return (
    <group>
      <mesh
        position={[
          bounds.centerX,
          FLOOR_Y +
            0.01,
          bounds.centerZ,
        ]}
      >
        <boxGeometry
          args={[
            bounds.width,
            0.045,
            bounds.depth,
          ]}
        />

        <meshStandardMaterial
          ref={
            floorMaterialRef
          }
          color="#f58b35"
          emissive="#e85b22"
          emissiveIntensity={0.46}
          transparent
          opacity={0.13}
          depthWrite={false}
          roughness={0.72}
        />
      </mesh>

      {Array.from({
        length:
          stripeCount,
      }).map(
        (
          _,
          index,
        ) => {
          const normalizedPosition =
            (
              index +
              0.5
            ) /
              stripeCount -
            0.5;

          return (
            <mesh
              key={
                `hazard-warning-stripe-${index}`
              }
              position={[
                bounds.centerX +
                  normalizedPosition *
                    bounds.width,
                FLOOR_Y +
                  0.045,
                bounds.centerZ,
              ]}
            >
              <boxGeometry
                args={[
                  0.08,
                  0.022,
                  bounds.depth *
                    0.89,
                ]}
              />

              <meshBasicMaterial
                color="#ffd36b"
                transparent
                opacity={0.20}
                depthWrite={false}
              />
            </mesh>
          );
        },
      )}

      <Line
        points={
          boundaryPoints
        }
        color="#ff9a48"
        lineWidth={1.4}
        dashed
        dashSize={0.55}
        gapSize={0.34}
        transparent
        opacity={0.78}
      />

      <pointLight
        ref={
          glowLightRef
        }
        position={[
          bounds.centerX,
          1.65,
          bounds.centerZ,
        ]}
        color="#ff913f"
        intensity={2}
        distance={
          Math.max(
            7,
            Math.min(
              14,
              Math.max(
                bounds.width,
                bounds.depth,
              ),
            ),
          )
        }
        decay={2}
      />

      <Html
        center
        position={[
          labelX,
          detailed
            ? 2.55
            : 2.05,
          labelZ,
        ]}
        distanceFactor={
          detailed
            ? 16
            : 12
        }
        style={{
          pointerEvents:
            "none",
        }}
      >
        <CompactWorldLabel
          symbol="!"
          title={
            detailed
              ? "HAZARD · TRAVERSABLE"
              : "HAZARD"
          }
          targetLabel={
            detailed
              ? `${targetDisplayName(
                  event.targetId,
                )} · movement allowed`
              : targetDisplayName(
                  event.targetId,
                )
          }
          variant="hazard"
          detailed={
            detailed
          }
        />
      </Html>
    </group>
  );
}

interface CorridorBlockVisualProps {
  readonly event:
    AppliedDisruptionRecord;

  readonly currentTimeSeconds:
    number;
}

function CorridorBlockVisual({
  event,
  currentTimeSeconds,
}: CorridorBlockVisualProps) {
  const bounds =
    resolveZoneBounds(
      event.targetId,
    );

  const glowMaterialRef =
    useRef<
      THREE.MeshStandardMaterial | null
    >(
      null,
    );

  const warningLightRef =
    useRef<
      THREE.PointLight | null
    >(
      null,
    );

  useFrame(
    (
      state,
    ) => {
      const pulse =
        (
          Math.sin(
            state
              .clock
              .elapsedTime *
              1.8,
          ) +
          1
        ) /
        2;

      if (
        glowMaterialRef
          .current
      ) {
        glowMaterialRef
          .current
          .opacity =
          0.14 +
          pulse *
            0.05;

        glowMaterialRef
          .current
          .emissiveIntensity =
          0.32 +
          pulse *
            0.26;
      }

      if (
        warningLightRef
          .current
      ) {
        warningLightRef
          .current
          .intensity =
          2.2 +
          pulse *
            1.5;
      }
    },
  );

  if (
    !bounds
  ) {
    return null;
  }

  const detailed =
    shouldShowDetailedLabel(
      currentTimeSeconds,
      event,
    );

  const diagonalLength =
    Math.hypot(
      bounds.width,
      bounds.depth,
    ) *
    1.08;

  const stripeCount =
    6;

  const labelZ =
    bounds.centerZ -
    bounds.depth /
      2 -
    1.35;

  return (
    <group>
      <mesh
        position={[
          bounds.centerX,
          FLOOR_Y +
            0.015,
          bounds.centerZ,
        ]}
      >
        <boxGeometry
          args={[
            bounds.width,
            0.05,
            bounds.depth,
          ]}
        />

        <meshStandardMaterial
          ref={
            glowMaterialRef
          }
          color="#d94a2f"
          emissive="#b8291f"
          emissiveIntensity={0.4}
          transparent
          opacity={0.17}
          depthWrite={false}
          roughness={0.7}
        />
      </mesh>

      {Array.from({
        length:
          stripeCount,
      }).map(
        (
          _,
          index,
        ) => {
          const normalizedPosition =
            (
              index +
              0.5
            ) /
              stripeCount -
            0.5;

          return (
            <mesh
              key={
                `corridor-warning-stripe-${index}`
              }
              position={[
                bounds.centerX +
                  normalizedPosition *
                    bounds.width *
                    1.05,
                FLOOR_Y +
                  0.055,
                bounds.centerZ,
              ]}
              rotation={[
                0,
                Math.PI /
                  4,
                0,
              ]}
            >
              <boxGeometry
                args={[
                  0.13,
                  0.03,
                  diagonalLength,
                ]}
              />

              <meshBasicMaterial
                color="#ffd158"
                transparent
                opacity={0.72}
                depthWrite={false}
              />
            </mesh>
          );
        },
      )}

      <mesh
        castShadow
        position={[
          bounds.centerX,
          0.88,
          bounds.centerZ,
        ]}
      >
        <boxGeometry
          args={[
            0.20,
            0.54,
            Math.max(
              1.25,
              bounds.depth *
                0.88,
            ),
          ]}
        />

        <meshStandardMaterial
          color="#d83447"
          emissive="#6a101b"
          emissiveIntensity={0.32}
          roughness={0.5}
        />
      </mesh>

      <pointLight
        ref={
          warningLightRef
        }
        position={[
          bounds.centerX,
          1.5,
          bounds.centerZ,
        ]}
        color="#e94838"
        intensity={2.5}
        distance={7}
        decay={2}
      />

      <Html
        center
        position={[
          bounds.centerX,
          detailed
            ? 2.55
            : 2.05,
          labelZ,
        ]}
        distanceFactor={
          detailed
            ? 15
            : 12
        }
        style={{
          pointerEvents:
            "none",
        }}
      >
        <CompactWorldLabel
          symbol="×"
          title={
            detailed
              ? "CORRIDOR BLOCKED"
              : "BLOCKED"
          }
          targetLabel={
            detailed
              ? `${targetDisplayName(
                  event.targetId,
                )} · movement prohibited`
              : targetDisplayName(
                  event.targetId,
                )
          }
          variant="corridor"
          detailed={
            detailed
          }
        />
      </Html>
    </group>
  );
}

interface ExitBlockVisualProps {
  readonly event:
    AppliedDisruptionRecord;

  readonly currentTimeSeconds:
    number;
}

function ExitBlockVisual({
  event,
  currentTimeSeconds,
}: ExitBlockVisualProps) {
  const exit =
    resolveExit(
      event.targetId,
    );

  const barrierMaterialRef =
    useRef<
      THREE.MeshStandardMaterial | null
    >(
      null,
    );

  const warningLightRef =
    useRef<
      THREE.PointLight | null
    >(
      null,
    );

  useFrame(
    (
      state,
    ) => {
      const pulse =
        (
          Math.sin(
            state
              .clock
              .elapsedTime *
              2.4,
          ) +
          1
        ) /
        2;

      if (
        barrierMaterialRef
          .current
      ) {
        barrierMaterialRef
          .current
          .emissiveIntensity =
          0.62 +
          pulse *
            0.52;
      }

      if (
        warningLightRef
          .current
      ) {
        warningLightRef
          .current
          .intensity =
          2.4 +
          pulse *
            2.0;
      }
    },
  );

  if (
    !exit
  ) {
    return null;
  }

  const x =
    simulationXToWorldX(
      exit.position.x,
    );

  const z =
    simulationYToWorldZ(
      exit.position.y,
    );

  const horizontal =
    exit.orientation ===
    "HORIZONTAL";

  const barrierWidth =
    horizontal
      ? exit.widthMeters +
        0.45
      : 0.22;

  const barrierDepth =
    horizontal
      ? 0.22
      : exit.widthMeters +
        0.45;

  const detailed =
    shouldShowDetailedLabel(
      currentTimeSeconds,
      event,
    );

  /*
   * Place the label outside the building.
   *
   * South-facing exits move farther toward +Z.
   * North-facing horizontal exits move toward -Z.
   * West/east exits move outward on X.
   */
  const worldCenterX =
    0;

  const worldCenterZ =
    0;

  let labelX =
    x;

  let labelZ =
    z;

  if (
    horizontal
  ) {
    const outwardZ =
      z >=
      worldCenterZ
        ? 1
        : -1;

    labelZ +=
      outwardZ *
      3.6;
  } else {
    const outwardX =
      x >=
      worldCenterX
        ? 1
        : -1;

    labelX +=
      outwardX *
      3.4;
  }

  return (
    <group>
      <mesh
        position={[
          x,
          FLOOR_Y +
            0.02,
          z,
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
            0.52,
            0.92,
            32,
          ]}
        />

        <meshBasicMaterial
          color="#e93951"
          transparent
          opacity={0.48}
          side={
            THREE.DoubleSide
          }
          depthWrite={false}
        />
      </mesh>

      <mesh
        castShadow
        position={[
          x,
          0.91,
          z,
        ]}
      >
        <boxGeometry
          args={[
            barrierWidth,
            0.56,
            barrierDepth,
          ]}
        />

        <meshStandardMaterial
          ref={
            barrierMaterialRef
          }
          color="#df3149"
          emissive="#a41028"
          emissiveIntensity={0.72}
          roughness={0.45}
        />
      </mesh>

      <mesh
        position={[
          x,
          1.26,
          z,
        ]}
        rotation={[
          0,
          0,
          Math.PI /
            4,
        ]}
      >
        <boxGeometry
          args={[
            0.12,
            1.35,
            0.10,
          ]}
        />

        <meshBasicMaterial
          color="#ffe8ec"
        />
      </mesh>

      <mesh
        position={[
          x,
          1.26,
          z,
        ]}
        rotation={[
          0,
          0,
          -Math.PI /
            4,
        ]}
      >
        <boxGeometry
          args={[
            0.12,
            1.35,
            0.10,
          ]}
        />

        <meshBasicMaterial
          color="#ffe8ec"
        />
      </mesh>

      <pointLight
        ref={
          warningLightRef
        }
        position={[
          x,
          1.9,
          z,
        ]}
        color="#ef4056"
        intensity={3}
        distance={5.5}
        decay={2}
      />

      <Html
        center
        position={[
          labelX,
          detailed
            ? 1.85
            : 1.65,
          labelZ,
        ]}
        distanceFactor={
          detailed
            ? 15
            : 12
        }
        style={{
          pointerEvents:
            "none",
        }}
      >
        <CompactWorldLabel
          symbol="×"
          title="EXIT BLOCKED"
          targetLabel={
            detailed
              ? `${targetDisplayName(
                  event.targetId,
                )} · unavailable`
              : targetDisplayName(
                  event.targetId,
                )
          }
          variant="exit"
          detailed={
            detailed
          }
        />
      </Html>
    </group>
  );
}

interface ActiveDisruptionVisualProps {
  readonly event:
    AppliedDisruptionRecord;

  readonly currentTimeSeconds:
    number;
}

function ActiveDisruptionVisual({
  event,
  currentTimeSeconds,
}: ActiveDisruptionVisualProps) {
  switch (
    event.type
  ) {
    case "HAZARD_ACTIVATE":
    case "HAZARD_EXPAND":
      return (
        <HazardVisual
          event={
            event
          }
          currentTimeSeconds={
            currentTimeSeconds
          }
        />
      );

    case "CORRIDOR_BLOCK":
      return (
        <CorridorBlockVisual
          event={
            event
          }
          currentTimeSeconds={
            currentTimeSeconds
          }
        />
      );

    case "EXIT_BLOCK":
      return (
        <ExitBlockVisual
          event={
            event
          }
          currentTimeSeconds={
            currentTimeSeconds
          }
        />
      );
  }
}

export function ArchitectureV2DisruptionLayer({
  currentFrame,
}: ArchitectureV2DisruptionLayerProps) {
  if (
    !currentFrame
  ) {
    return null;
  }

  const currentTimeSeconds =
    currentFrame
      .snapshot
      .simulationTimeSeconds;

  return (
    <>
      {currentFrame
        .appliedDisruptions
        .map(
          (
            event,
          ) => (
            <ActiveDisruptionVisual
              key={
                event.id
              }
              event={
                event
              }
              currentTimeSeconds={
                currentTimeSeconds
              }
            />
          ),
        )}
    </>
  );
}