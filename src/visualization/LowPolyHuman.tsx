import {
  useRef,
} from "react";

import {
  useFrame,
} from "@react-three/fiber";

import * as THREE from "three";

export type HumanMotionMode =
  | "IDLE"
  | "PREVIEW"
  | "WALK";

interface LowPolyHumanProps {
  readonly headingRadians:
    number;

  readonly animationPhase:
    number;

  readonly bodyVariant:
    number;

  readonly heightScale:
    number;

  readonly motionMode:
    HumanMotionMode;
}

interface HumanPalette {
  readonly torso:
    string;

  readonly torsoEmissive:
    string;

  readonly lowerBody:
    string;

  readonly skin:
    string;

  readonly shoes:
    string;
}

const HUMAN_PALETTES:
  readonly HumanPalette[] =
[
  {
    torso:
      "#7fc6cf",

    torsoEmissive:
      "#153f45",

    lowerBody:
      "#4f7180",

    skin:
      "#d8b28f",

    shoes:
      "#24353e",
  },

  {
    torso:
      "#93b9d1",

    torsoEmissive:
      "#203e52",

    lowerBody:
      "#526576",

    skin:
      "#c58f6c",

    shoes:
      "#26353b",
  },

  {
    torso:
      "#8bc2ad",

    torsoEmissive:
      "#1c4539",

    lowerBody:
      "#4d6864",

    skin:
      "#e0bc9b",

    shoes:
      "#25383a",
  },

  {
    torso:
      "#c0b38a",

    torsoEmissive:
      "#4d4527",

    lowerBody:
      "#5e6570",

    skin:
      "#a97454",

    shoes:
      "#2a343a",
  },

  {
    torso:
      "#aa9bc7",

    torsoEmissive:
      "#403455",

    lowerBody:
      "#515b73",

    skin:
      "#d7a985",

    shoes:
      "#26333c",
  },
];

function paletteFor(
  variant:
    number,
): HumanPalette {
  return (
    HUMAN_PALETTES[
      Math.abs(
        variant,
      ) %
      HUMAN_PALETTES.length
    ] ??
    HUMAN_PALETTES[0]!
  );
}

function LimbMaterial({
  color,
}: {
  readonly color:
    string;
}) {
  return (
    <meshStandardMaterial
      color={
        color
      }
      roughness={0.68}
      metalness={0.01}
    />
  );
}

export function LowPolyHuman({
  headingRadians,
  animationPhase,
  bodyVariant,
  heightScale,
  motionMode,
}: LowPolyHumanProps) {
  const rootRef =
    useRef<THREE.Group>(
      null,
    );

  const torsoRef =
    useRef<THREE.Group>(
      null,
    );

  const leftUpperArmRef =
    useRef<THREE.Group>(
      null,
    );

  const rightUpperArmRef =
    useRef<THREE.Group>(
      null,
    );

  const leftForearmRef =
    useRef<THREE.Group>(
      null,
    );

  const rightForearmRef =
    useRef<THREE.Group>(
      null,
    );

  const leftUpperLegRef =
    useRef<THREE.Group>(
      null,
    );

  const rightUpperLegRef =
    useRef<THREE.Group>(
      null,
    );

  const leftLowerLegRef =
    useRef<THREE.Group>(
      null,
    );

  const rightLowerLegRef =
    useRef<THREE.Group>(
      null,
    );

  const leftFootRef =
    useRef<THREE.Group>(
      null,
    );

  const rightFootRef =
    useRef<THREE.Group>(
      null,
    );

  const palette =
    paletteFor(
      bodyVariant,
    );

  useFrame(
    (
      state,
    ) => {
      const elapsed =
        state.clock
          .elapsedTime +
        animationPhase;

      const isWalking =
        motionMode ===
          "WALK" ||
        motionMode ===
          "PREVIEW";

      const speed =
        motionMode ===
        "WALK"
          ? 7.0
          : motionMode ===
              "PREVIEW"
            ? 2.1
            : 1.25;

      const stride =
        motionMode ===
        "WALK"
          ? 0.62
          : motionMode ===
              "PREVIEW"
            ? 0.20
            : 0.025;

      const armStride =
        stride *
        0.9;

      const phase =
        Math.sin(
          elapsed *
          speed,
        );

      const oppositePhase =
        -phase;

      const kneeLeft =
        Math.max(
          0,
          -phase,
        );

      const kneeRight =
        Math.max(
          0,
          phase,
        );

      if (
        rootRef.current
      ) {
        rootRef.current.position.y =
          isWalking
            ? Math.abs(
                Math.sin(
                  elapsed *
                  speed *
                  2,
                ),
              ) *
              (
                motionMode ===
                "WALK"
                  ? 0.025
                  : 0.008
              )
            : Math.sin(
                elapsed *
                1.4,
              ) *
              0.004;
      }

      if (
        torsoRef.current
      ) {
        torsoRef.current.rotation.z =
          isWalking
            ? phase *
              0.018
            : Math.sin(
                elapsed *
                0.9,
              ) *
              0.008;
      }

      if (
        leftUpperArmRef.current
      ) {
        leftUpperArmRef.current.rotation.x =
          oppositePhase *
          armStride;
      }

      if (
        rightUpperArmRef.current
      ) {
        rightUpperArmRef.current.rotation.x =
          phase *
          armStride;
      }

      if (
        leftForearmRef.current
      ) {
        leftForearmRef.current.rotation.x =
          isWalking
            ? -0.18 -
              Math.max(
                0,
                phase,
              ) *
                0.24
            : -0.08;
      }

      if (
        rightForearmRef.current
      ) {
        rightForearmRef.current.rotation.x =
          isWalking
            ? -0.18 -
              Math.max(
                0,
                oppositePhase,
              ) *
                0.24
            : -0.08;
      }

      if (
        leftUpperLegRef.current
      ) {
        leftUpperLegRef.current.rotation.x =
          phase *
          stride;
      }

      if (
        rightUpperLegRef.current
      ) {
        rightUpperLegRef.current.rotation.x =
          oppositePhase *
          stride;
      }

      if (
        leftLowerLegRef.current
      ) {
        leftLowerLegRef.current.rotation.x =
          kneeLeft *
          (
            motionMode ===
            "WALK"
              ? 0.65
              : 0.23
          );
      }

      if (
        rightLowerLegRef.current
      ) {
        rightLowerLegRef.current.rotation.x =
          kneeRight *
          (
            motionMode ===
            "WALK"
              ? 0.65
              : 0.23
          );
      }

      if (
        leftFootRef.current
      ) {
        leftFootRef.current.rotation.x =
          isWalking
            ? -phase *
              stride *
              0.28
            : 0;
      }

      if (
        rightFootRef.current
      ) {
        rightFootRef.current.rotation.x =
          isWalking
            ? phase *
              stride *
              0.28
            : 0;
      }
    },
  );

  return (
    <group
      rotation={[
        0,
        headingRadians,
        0,
      ]}
      scale={[
        heightScale,
        heightScale,
        heightScale,
      ]}
    >
      <group
        ref={
          rootRef
        }
      >
        {/* ground presence */}
        <mesh
          rotation={[
            -Math.PI /
              2,
            0,
            0,
          ]}
          position={[
            0,
            0.012,
            0,
          ]}
        >
          <circleGeometry
            args={[
              0.18,
              16,
            ]}
          />

          <meshBasicMaterial
            color="#152f39"
            transparent
            opacity={0.28}
            depthWrite={
              false
            }
          />
        </mesh>

        {/* pelvis */}
        <mesh
          castShadow
          position={[
            0,
            0.66,
            0,
          ]}
        >
          <boxGeometry
            args={[
              0.25,
              0.18,
              0.18,
            ]}
          />

          <LimbMaterial
            color={
              palette.lowerBody
            }
          />
        </mesh>

        {/* torso */}
        <group
          ref={
            torsoRef
          }
          position={[
            0,
            0.83,
            0,
          ]}
        >
          <mesh
            castShadow
            position={[
              0,
              0.17,
              0,
            ]}
          >
            <cylinderGeometry
              args={[
                0.16,
                0.20,
                0.42,
                8,
              ]}
            />

            <meshStandardMaterial
              color={
                palette.torso
              }
              emissive={
                palette.torsoEmissive
              }
              emissiveIntensity={0.18}
              roughness={0.58}
              metalness={0.02}
            />
          </mesh>

          {/* neck */}
          <mesh
            castShadow
            position={[
              0,
              0.43,
              0,
            ]}
          >
            <cylinderGeometry
              args={[
                0.065,
                0.075,
                0.10,
                8,
              ]}
            />

            <LimbMaterial
              color={
                palette.skin
              }
            />
          </mesh>

          {/* head */}
          <mesh
            castShadow
            position={[
              0,
              0.58,
              0,
            ]}
          >
            <sphereGeometry
              args={[
                0.135,
                10,
                8,
              ]}
            />

            <LimbMaterial
              color={
                palette.skin
              }
            />
          </mesh>

          {/* left arm */}
          <group
            ref={
              leftUpperArmRef
            }
            position={[
              -0.22,
              0.32,
              0,
            ]}
          >
            <mesh
              castShadow
              position={[
                0,
                -0.15,
                0,
              ]}
            >
              <cylinderGeometry
                args={[
                  0.045,
                  0.052,
                  0.30,
                  7,
                ]}
              />

              <LimbMaterial
                color={
                  palette.torso
                }
              />
            </mesh>

            <group
              ref={
                leftForearmRef
              }
              position={[
                0,
                -0.30,
                0,
              ]}
            >
              <mesh
                castShadow
                position={[
                  0,
                  -0.13,
                  0,
                ]}
              >
                <cylinderGeometry
                  args={[
                    0.038,
                    0.044,
                    0.26,
                    7,
                  ]}
                />

                <LimbMaterial
                  color={
                    palette.skin
                  }
                />
              </mesh>

              {/* left hand */}
              <mesh
                castShadow
                position={[
                  0,
                  -0.29,
                  0,
                ]}
              >
                <sphereGeometry
                  args={[
                    0.055,
                    8,
                    7,
                  ]}
                />

                <LimbMaterial
                  color={
                    palette.skin
                  }
                />
              </mesh>
            </group>
          </group>

          {/* right arm */}
          <group
            ref={
              rightUpperArmRef
            }
            position={[
              0.22,
              0.32,
              0,
            ]}
          >
            <mesh
              castShadow
              position={[
                0,
                -0.15,
                0,
              ]}
            >
              <cylinderGeometry
                args={[
                  0.045,
                  0.052,
                  0.30,
                  7,
                ]}
              />

              <LimbMaterial
                color={
                  palette.torso
                }
              />
            </mesh>

            <group
              ref={
                rightForearmRef
              }
              position={[
                0,
                -0.30,
                0,
              ]}
            >
              <mesh
                castShadow
                position={[
                  0,
                  -0.13,
                  0,
                ]}
              >
                <cylinderGeometry
                  args={[
                    0.038,
                    0.044,
                    0.26,
                    7,
                  ]}
                />

                <LimbMaterial
                  color={
                    palette.skin
                  }
                />
              </mesh>

              {/* right hand */}
              <mesh
                castShadow
                position={[
                  0,
                  -0.29,
                  0,
                ]}
              >
                <sphereGeometry
                  args={[
                    0.055,
                    8,
                    7,
                  ]}
                />

                <LimbMaterial
                  color={
                    palette.skin
                  }
                />
              </mesh>
            </group>
          </group>
        </group>

        {/* left leg */}
        <group
          ref={
            leftUpperLegRef
          }
          position={[
            -0.075,
            0.61,
            0,
          ]}
        >
          <mesh
            castShadow
            position={[
              0,
              -0.19,
              0,
            ]}
          >
            <cylinderGeometry
              args={[
                0.058,
                0.067,
                0.38,
                8,
              ]}
            />

            <LimbMaterial
              color={
                palette.lowerBody
              }
            />
          </mesh>

          <group
            ref={
              leftLowerLegRef
            }
            position={[
              0,
              -0.38,
              0,
            ]}
          >
            <mesh
              castShadow
              position={[
                0,
                -0.18,
                0,
              ]}
            >
              <cylinderGeometry
                args={[
                  0.047,
                  0.055,
                  0.36,
                  8,
                ]}
              />

              <LimbMaterial
                color={
                  palette.lowerBody
                }
              />
            </mesh>

            <group
              ref={
                leftFootRef
              }
              position={[
                0,
                -0.39,
                0.055,
              ]}
            >
              <mesh
                castShadow
                position={[
                  0,
                  0,
                  0.07,
                ]}
              >
                <boxGeometry
                  args={[
                    0.13,
                    0.075,
                    0.25,
                  ]}
                />

                <LimbMaterial
                  color={
                    palette.shoes
                  }
                />
              </mesh>
            </group>
          </group>
        </group>

        {/* right leg */}
        <group
          ref={
            rightUpperLegRef
          }
          position={[
            0.075,
            0.61,
            0,
          ]}
        >
          <mesh
            castShadow
            position={[
              0,
              -0.19,
              0,
            ]}
          >
            <cylinderGeometry
              args={[
                0.058,
                0.067,
                0.38,
                8,
              ]}
            />

            <LimbMaterial
              color={
                palette.lowerBody
              }
            />
          </mesh>

          <group
            ref={
              rightLowerLegRef
            }
            position={[
              0,
              -0.38,
              0,
            ]}
          >
            <mesh
              castShadow
              position={[
                0,
                -0.18,
                0,
              ]}
            >
              <cylinderGeometry
                args={[
                  0.047,
                  0.055,
                  0.36,
                  8,
                ]}
              />

              <LimbMaterial
                color={
                  palette.lowerBody
                }
              />
            </mesh>

            <group
              ref={
                rightFootRef
              }
              position={[
                0,
                -0.39,
                0.055,
              ]}
            >
              <mesh
                castShadow
                position={[
                  0,
                  0,
                  0.07,
                ]}
              >
                <boxGeometry
                  args={[
                    0.13,
                    0.075,
                    0.25,
                  ]}
                />

                <LimbMaterial
                  color={
                    palette.shoes
                  }
                />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}