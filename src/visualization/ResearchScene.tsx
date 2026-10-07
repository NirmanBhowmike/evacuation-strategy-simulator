import {
  useCallback,
  useEffect,
  useRef,
} from "react";

import {
  Canvas,
  useThree,
} from "@react-three/fiber";

import {
  ContactShadows,
  Grid,
  OrbitControls,
} from "@react-three/drei";

import {
  Vector3,
} from "three";

import type {
  OrbitControls as OrbitControlsImpl,
} from "three-stdlib";

import type {
  SimulationReplayFrame,
} from "../types/simulationReplay";

import {
  ArchitectureV2DisruptionLayer,
} from "./ArchitectureV2DisruptionLayer";

import {
  ArchitectureV2OccupantLayer,
} from "./ArchitectureV2OccupantLayer";

import type {
  AgentSelectionMode,
} from "./ArchitectureV2OccupantLayer";

import {
  LayoutAArchitectureV2Preview,
} from "./LayoutAArchitectureV2Preview";

import {
  SelectedAgentRouteLayer,
} from "./SelectedAgentRouteLayer";

export type ResearchCameraPreset =
  | "HOME"
  | "ANGLE"
  | "TOP"
  | "WEST"
  | "EAST";

export type ResearchVisualTheme =
  | "dark"
  | "light";

interface ResearchSceneProps {
  readonly currentFrame:
    SimulationReplayFrame | null;

  readonly nextFrame:
    SimulationReplayFrame | null;

  readonly interpolationAlpha:
    number;

  readonly cameraPreset:
    ResearchCameraPreset;

  readonly cameraRequestId:
    number;

  readonly cameraResetRequestId:
    number;

  readonly visualTheme:
    ResearchVisualTheme;

  readonly selectedAgentIds:
    ReadonlySet<string>;

  readonly primarySelectedAgentId:
    string | null;

  readonly inspectorOpen:
    boolean;

  readonly onAgentSelect:
    (
      agentId:
        string,
      mode:
        AgentSelectionMode,
    ) => void;

  readonly onClearAgentSelection:
    () => void;
}

interface CameraPresetDefinition {
  readonly position:
    readonly [
      number,
      number,
      number,
    ];

  readonly target:
    readonly [
      number,
      number,
      number,
    ];
}

interface CameraBaseView {
  readonly position:
    Vector3;

  readonly target:
    Vector3;

  readonly referenceAspect:
    number;
}

interface CameraDisplayView {
  readonly position:
    Vector3;

  readonly target:
    Vector3;
}

type CameraPresetStore =
  Record<
    ResearchCameraPreset,
    CameraPresetDefinition
  >;

const CAMERA_TRANSITION_MS =
  480;

const MIN_VALID_ASPECT =
  0.1;

const DEFAULT_CAMERA_PRESETS:
  Readonly<
    Record<
      ResearchCameraPreset,
      CameraPresetDefinition
    >
  > =
Object.freeze({
  HOME:
    Object.freeze({
      position: [
        78,
        52,
        78,
      ] as const,

      target: [
        0,
        0.8,
        0,
      ] as const,
    }),

  ANGLE:
    Object.freeze({
      position: [
        86,
        38,
        54,
      ] as const,

      target: [
        0,
        1.2,
        0,
      ] as const,
    }),

  TOP:
    Object.freeze({
      position: [
        0,
        112,
        0.1,
      ] as const,

      target: [
        0,
        0,
        0,
      ] as const,
    }),

  WEST:
    Object.freeze({
      position: [
        -104,
        38,
        18,
      ] as const,

      target: [
        0,
        1,
        0,
      ] as const,
    }),

  EAST:
    Object.freeze({
      position: [
        104,
        38,
        18,
      ] as const,

      target: [
        0,
        1,
        0,
      ] as const,
    }),
});

function clonePreset(
  definition:
    CameraPresetDefinition,
): CameraPresetDefinition {
  return {
    position: [
      definition.position[0],
      definition.position[1],
      definition.position[2],
    ],

    target: [
      definition.target[0],
      definition.target[1],
      definition.target[2],
    ],
  };
}

function createCameraPresetStore():
  CameraPresetStore {
  return {
    HOME:
      clonePreset(
        DEFAULT_CAMERA_PRESETS.HOME,
      ),

    ANGLE:
      clonePreset(
        DEFAULT_CAMERA_PRESETS.ANGLE,
      ),

    TOP:
      clonePreset(
        DEFAULT_CAMERA_PRESETS.TOP,
      ),

    WEST:
      clonePreset(
        DEFAULT_CAMERA_PRESETS.WEST,
      ),

    EAST:
      clonePreset(
        DEFAULT_CAMERA_PRESETS.EAST,
      ),
  };
}

function validAspect(
  width:
    number,
  height:
    number,
): number {
  if (
    width <=
      0 ||
    height <=
      0
  ) {
    return 1;
  }

  return Math.max(
    MIN_VALID_ASPECT,
    width /
      height,
  );
}

/*
 * Keeps the original camera direction and OrbitControls target.
 *
 * When the viewport becomes proportionally narrower, the camera
 * moves backward only enough to preserve the horizontal scene
 * coverage that the user selected in the reference viewport.
 *
 * This is what allows:
 *
 * normal -> fullscreen
 * normal -> inspector
 * fullscreen -> inspector
 *
 * without progressively stacking zoom adjustments.
 */
function createAspectFittedView(
  baseView:
    CameraBaseView,
  currentAspect:
    number,
): CameraDisplayView {
  const safeCurrentAspect =
    Math.max(
      MIN_VALID_ASPECT,
      currentAspect,
    );

  const safeReferenceAspect =
    Math.max(
      MIN_VALID_ASPECT,
      baseView.referenceAspect,
    );

  /*
   * Vertical FOV remains constant.
   *
   * If the viewport becomes narrower:
   *
   * referenceAspect / currentAspect > 1
   *
   * so distance increases enough to retain approximately
   * the same horizontal composition.
   *
   * We deliberately never reduce the distance below the
   * user's base distance. A wider viewport can simply reveal
   * additional space on the sides.
   */
  const distanceFactor =
    Math.max(
      1,
      safeReferenceAspect /
        safeCurrentAspect,
    );

  const cameraOffset =
    baseView.position
      .clone()
      .sub(
        baseView.target,
      )
      .multiplyScalar(
        distanceFactor,
      );

  return {
    position:
      baseView.target
        .clone()
        .add(
          cameraOffset,
        ),

    target:
      baseView.target.clone(),
  };
}

interface ResearchSceneEnvironmentProps {
  readonly visualTheme:
    ResearchVisualTheme;
}

function ResearchSceneEnvironment({
  visualTheme,
}: ResearchSceneEnvironmentProps) {
  const isLight =
    visualTheme ===
    "light";

  if (
    isLight
  ) {
    return (
      <>
        <color
          attach="background"
          args={[
            "#e7eef2",
          ]}
        />

        <fog
          attach="fog"
          args={[
            "#e7eef2",
            155,
            310,
          ]}
        />

        <ambientLight
          intensity={1.28}
          color="#f5fbfd"
        />

        <hemisphereLight
          color="#ffffff"
          groundColor="#607984"
          intensity={1.62}
        />

        <directionalLight
          castShadow
          position={[
            48,
            70,
            42,
          ]}
          intensity={2.45}
          color="#ffffff"
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={1}
          shadow-camera-far={190}
          shadow-camera-left={-78}
          shadow-camera-right={78}
          shadow-camera-top={68}
          shadow-camera-bottom={-68}
        />

        <directionalLight
          position={[
            -52,
            40,
            -34,
          ]}
          intensity={0.72}
          color="#7fa1b0"
        />

        <directionalLight
          position={[
            10,
            26,
            -68,
          ]}
          intensity={0.52}
          color="#b7ced8"
        />

        <pointLight
          position={[
            4,
            24,
            8,
          ]}
          intensity={7}
          distance={95}
          decay={2}
          color="#b9dce7"
        />
      </>
    );
  }

  return (
    <>
      <color
        attach="background"
        args={[
          "#010408",
        ]}
      />

      <fog
        attach="fog"
        args={[
          "#010408",
          115,
          230,
        ]}
      />

      <ambientLight
        intensity={0.95}
      />

      <hemisphereLight
        color="#d9edf7"
        groundColor="#071019"
        intensity={1.25}
      />

      <directionalLight
        castShadow
        position={[
          45,
          62,
          38,
        ]}
        intensity={2.75}
        color="#f4faff"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={180}
        shadow-camera-left={-75}
        shadow-camera-right={75}
        shadow-camera-top={65}
        shadow-camera-bottom={-65}
      />

      <directionalLight
        position={[
          -52,
          34,
          -42,
        ]}
        intensity={0.9}
        color="#6698b7"
      />

      <pointLight
        position={[
          5,
          26,
          4,
        ]}
        intensity={24}
        distance={110}
        decay={2}
        color="#6c9eb5"
      />
    </>
  );
}

interface ResearchGroundProps {
  readonly visualTheme:
    ResearchVisualTheme;
}

function ResearchGround({
  visualTheme,
}: ResearchGroundProps) {
  const isLight =
    visualTheme ===
    "light";

  if (
    isLight
  ) {
    return (
      <>
        <mesh
          receiveShadow
          rotation={[
            -Math.PI / 2,
            0,
            0,
          ]}
          position={[
            0,
            -0.14,
            0,
          ]}
        >
          <planeGeometry
            args={[
              155,
              110,
            ]}
          />

          <meshStandardMaterial
            color="#d2dde2"
            roughness={0.98}
            metalness={0.01}
          />
        </mesh>

        <Grid
          args={[
            155,
            110,
          ]}
          position={[
            0,
            -0.065,
            0,
          ]}
          cellSize={2}
          cellThickness={0.72}
          cellColor="#8299a3"
          sectionSize={10}
          sectionThickness={1.38}
          sectionColor="#536f7b"
          fadeDistance={180}
          fadeStrength={0.48}
        />

        <mesh
          receiveShadow
          rotation={[
            -Math.PI / 2,
            0,
            0,
          ]}
          position={[
            0,
            0.005,
            0,
          ]}
        >
          <planeGeometry
            args={[
              102,
              68,
            ]}
          />

          <meshStandardMaterial
            color="#8ca8b4"
            roughness={0.92}
            metalness={0.015}
          />
        </mesh>
      </>
    );
  }

  return (
    <>
      <mesh
        receiveShadow
        rotation={[
          -Math.PI / 2,
          0,
          0,
        ]}
        position={[
          0,
          -0.14,
          0,
        ]}
      >
        <planeGeometry
          args={[
            155,
            110,
          ]}
        />

        <meshStandardMaterial
          color="#061018"
          roughness={0.99}
          metalness={0.01}
        />
      </mesh>

      <Grid
        args={[
          155,
          110,
        ]}
        position={[
          0,
          -0.065,
          0,
        ]}
        cellSize={2}
        cellThickness={0.5}
        cellColor="#284859"
        sectionSize={10}
        sectionThickness={1.05}
        sectionColor="#52778a"
        fadeDistance={160}
        fadeStrength={0.72}
      />

      <mesh
        receiveShadow
        rotation={[
          -Math.PI / 2,
          0,
          0,
        ]}
        position={[
          0,
          0.005,
          0,
        ]}
      >
        <planeGeometry
          args={[
            102,
            68,
          ]}
        />

        <meshStandardMaterial
          color="#102936"
          roughness={0.94}
          metalness={0.015}
        />
      </mesh>
    </>
  );
}

interface ResearchCameraRigProps {
  readonly preset:
    ResearchCameraPreset;

  readonly requestId:
    number;

  readonly resetRequestId:
    number;

  readonly inspectorOpen:
    boolean;
}

function ResearchCameraRig({
  preset,
  requestId,
  resetRequestId,
  inspectorOpen,
}: ResearchCameraRigProps) {
  const {
    camera,
    size,
  } =
    useThree();

  const controlsRef =
    useRef<
      OrbitControlsImpl | null
    >(
      null,
    );

  const savedPresetsRef =
    useRef<
      CameraPresetStore
    >(
      createCameraPresetStore(),
    );

  const baseViewRef =
    useRef<
      CameraBaseView | null
    >(
      null,
    );

  const previousResetRequestIdRef =
    useRef(
      resetRequestId,
    );

  const transitionFrameRef =
    useRef<
      number | null
    >(
      null,
    );

  const currentAspect =
    validAspect(
      size.width,
      size.height,
    );

  const isTemporaryViewport =
    inspectorOpen ||
    document.fullscreenElement !==
      null;

  const cancelTransition =
    useCallback(
      () => {
        if (
          transitionFrameRef.current ===
          null
        ) {
          return;
        }

        cancelAnimationFrame(
          transitionFrameRef.current,
        );

        transitionFrameRef.current =
          null;
      },
      [],
    );

  const applyViewImmediately =
    useCallback(
      (
        destination:
          CameraDisplayView,
      ) => {
        const controls =
          controlsRef.current;

        if (
          !controls
        ) {
          return;
        }

        cancelTransition();

        camera.position.copy(
          destination.position,
        );

        controls.target.copy(
          destination.target,
        );

        controls.update();
      },
      [
        camera,
        cancelTransition,
      ],
    );

  const animateToView =
    useCallback(
      (
        destination:
          CameraDisplayView,
        durationMs:
          number =
            CAMERA_TRANSITION_MS,
      ) => {
        const controls =
          controlsRef.current;

        if (
          !controls
        ) {
          return;
        }

        cancelTransition();

        const startPosition =
          camera.position.clone();

        const startTarget =
          controls.target.clone();

        const transitionStart =
          performance.now();

        const animate =
          (
            now:
              number,
          ) => {
            const activeControls =
              controlsRef.current;

            if (
              !activeControls
            ) {
              transitionFrameRef.current =
                null;

              return;
            }

            const rawProgress =
              Math.min(
                1,
                (
                  now -
                  transitionStart
                ) /
                  durationMs,
              );

            const easedProgress =
              1 -
              Math.pow(
                1 -
                  rawProgress,
                3,
              );

            camera.position
              .lerpVectors(
                startPosition,
                destination.position,
                easedProgress,
              );

            activeControls.target
              .lerpVectors(
                startTarget,
                destination.target,
                easedProgress,
              );

            activeControls.update();

            if (
              rawProgress <
              1
            ) {
              transitionFrameRef.current =
                requestAnimationFrame(
                  animate,
                );
            } else {
              transitionFrameRef.current =
                null;
            }
          };

        transitionFrameRef.current =
          requestAnimationFrame(
            animate,
          );
      },
      [
        camera,
        cancelTransition,
      ],
    );

  /*
   * Preset changes define a new base composition.
   *
   * In normal mode, the current viewport becomes the reference
   * aspect ratio.
   *
   * If the user selects a preset while fullscreen or while the
   * inspector is open, we retain the previous normal reference
   * aspect. That prevents the temporary viewport from becoming
   * the new permanent camera definition.
   */
  useEffect(
    () => {
      if (
        previousResetRequestIdRef.current !==
        resetRequestId
      ) {
        savedPresetsRef.current =
          createCameraPresetStore();

        previousResetRequestIdRef.current =
          resetRequestId;
      }

      const controls =
        controlsRef.current;

      if (
        !controls
      ) {
        return;
      }

      const definition =
        savedPresetsRef.current[
          preset
        ];

      const previousBase =
        baseViewRef.current;

      const referenceAspect =
        isTemporaryViewport &&
        previousBase
          ? previousBase.referenceAspect
          : currentAspect;

      const newBaseView:
        CameraBaseView = {
        position:
          new Vector3(
            definition.position[0],
            definition.position[1],
            definition.position[2],
          ),

        target:
          new Vector3(
            definition.target[0],
            definition.target[1],
            definition.target[2],
          ),

        referenceAspect,
      };

      baseViewRef.current =
        newBaseView;

      animateToView(
        createAspectFittedView(
          newBaseView,
          currentAspect,
        ),
      );
    },
    [
      animateToView,
      currentAspect,
      isTemporaryViewport,
      preset,
      requestId,
      resetRequestId,
    ],
  );

  /*
   * Recalculate the DISPLAY camera whenever the actual Canvas
   * dimensions change.
   *
   * Important:
   * this never modifies baseViewRef.
   *
   * Therefore fullscreen and inspector changes cannot accumulate
   * additional zoom every time they are opened and closed.
   */
  useEffect(
    () => {
      const controls =
        controlsRef.current;

      if (
        !controls
      ) {
        return;
      }

      if (
        !baseViewRef.current
      ) {
        baseViewRef.current = {
          position:
            camera.position.clone(),

          target:
            controls.target.clone(),

          referenceAspect:
            currentAspect,
        };
      }

      const baseView =
        baseViewRef.current;

      applyViewImmediately(
        createAspectFittedView(
          baseView,
          currentAspect,
        ),
      );
    },
    [
      applyViewImmediately,
      camera,
      currentAspect,
      inspectorOpen,
      size.height,
      size.width,
    ],
  );

  /*
   * A manual OrbitControls change becomes the new permanent
   * composition only in the normal, uninspected viewport.
   *
   * Manual camera changes made while Present mode or the Agent
   * Inspector is active remain temporary. Returning to the normal
   * viewport therefore restores the user's original composition.
   */
  const saveCurrentBaseView =
    () => {
      const controls =
        controlsRef.current;

      if (
        !controls
      ) {
        return;
      }

      const temporaryNow =
        inspectorOpen ||
        document.fullscreenElement !==
          null;

      if (
        temporaryNow
      ) {
        return;
      }

      const nextBaseView:
        CameraBaseView = {
        position:
          camera.position.clone(),

        target:
          controls.target.clone(),

        referenceAspect:
          validAspect(
            size.width,
            size.height,
          ),
      };

      baseViewRef.current =
        nextBaseView;

      savedPresetsRef.current[
        preset
      ] = {
        position: [
          nextBaseView.position.x,
          nextBaseView.position.y,
          nextBaseView.position.z,
        ],

        target: [
          nextBaseView.target.x,
          nextBaseView.target.y,
          nextBaseView.target.z,
        ],
      };
    };

  useEffect(
    () => {
      return () => {
        cancelTransition();
      };
    },
    [
      cancelTransition,
    ],
  );

  return (
    <OrbitControls
      ref={
        controlsRef
      }
      makeDefault
      enableDamping
      dampingFactor={0.16}
      rotateSpeed={0.30}
      panSpeed={0.40}
      zoomSpeed={0.52}
      screenSpacePanning
      target={[
        0,
        0.8,
        0,
      ]}
      minDistance={30}
      maxDistance={240}
      minPolarAngle={0.05}
      maxPolarAngle={
        Math.PI /
        2.025
      }
      onEnd={
        saveCurrentBaseView
      }
    />
  );
}

export function ResearchScene({
  currentFrame,
  nextFrame,
  interpolationAlpha,
  cameraPreset,
  cameraRequestId,
  cameraResetRequestId,
  visualTheme,
  selectedAgentIds,
  primarySelectedAgentId,
  inspectorOpen,
  onAgentSelect,
  onClearAgentSelection,
}: ResearchSceneProps) {
  const isLight =
    visualTheme ===
    "light";

  return (
    <Canvas
      shadows
      dpr={[
        1,
        2,
      ]}
      camera={{
        position: [
          78,
          52,
          78,
        ],

        fov: 38,

        near: 0.1,

        far: 340,
      }}
      gl={{
        antialias: true,

        alpha: false,
      }}
      onPointerMissed={
        onClearAgentSelection
      }
    >
      <ResearchSceneEnvironment
        visualTheme={
          visualTheme
        }
      />

      <ResearchGround
        visualTheme={
          visualTheme
        }
      />

      <LayoutAArchitectureV2Preview />

      <ArchitectureV2DisruptionLayer
        currentFrame={
          currentFrame
        }
      />

      <SelectedAgentRouteLayer
        currentFrame={
          currentFrame
        }
        primarySelectedAgentId={
          primarySelectedAgentId
        }
      />

      <ArchitectureV2OccupantLayer
        currentFrame={
          currentFrame
        }
        nextFrame={
          nextFrame
        }
        interpolationAlpha={
          interpolationAlpha
        }
        selectedAgentIds={
          selectedAgentIds
        }
        primarySelectedAgentId={
          primarySelectedAgentId
        }
        onAgentSelect={
          onAgentSelect
        }
      />

      <ContactShadows
        position={[
          0,
          0.015,
          0,
        ]}
        opacity={
          isLight
            ? 0.36
            : 0.53
        }
        scale={118}
        blur={
          isLight
            ? 2.1
            : 2.6
        }
        far={65}
      />

      <ResearchCameraRig
        preset={
          cameraPreset
        }
        requestId={
          cameraRequestId
        }
        resetRequestId={
          cameraResetRequestId
        }
        inspectorOpen={
          inspectorOpen
        }
      />
    </Canvas>
  );
}