import {
  Canvas,
} from "@react-three/fiber";

import {
  ContactShadows,
  Grid,
  OrbitControls,
} from "@react-three/drei";

import type {
  SimulationReplayFrame,
} from "../types/simulationReplay";

import {
  LayoutAArchitectureV2Preview,
} from "./LayoutAArchitectureV2Preview";

interface ResearchSceneProps {
  readonly currentFrame:
    SimulationReplayFrame | null;

  readonly nextFrame:
    SimulationReplayFrame | null;

  readonly interpolationAlpha:
    number;
}

function ResearchSceneEnvironment() {
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

function ResearchGround() {
  return (
    <>
      <mesh
        receiveShadow
        rotation={[
          -Math.PI /
            2,
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
          -Math.PI /
            2,
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

/**
 * Architecture V2 review scene.
 *
 * Navigation and occupants are intentionally hidden.
 * This allows the physical floor plan, doors, circulation,
 * and exterior exits to be reviewed without contamination
 * from the frozen v1.0 routing model.
 */
export function ResearchScene(
  _props:
    ResearchSceneProps,
) {
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

        fov:
          38,

        near:
          0.1,

        far:
          320,
      }}
      gl={{
        antialias:
          true,

        alpha:
          false,
      }}
    >
      <ResearchSceneEnvironment />

      <ResearchGround />

      <LayoutAArchitectureV2Preview />

      <ContactShadows
        position={[
          0,
          0.015,
          0,
        ]}
        opacity={0.53}
        scale={118}
        blur={2.6}
        far={65}
      />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.075}
        target={[
          0,
          0.8,
          0,
        ]}
        minDistance={42}
        maxDistance={180}
        minPolarAngle={0.25}
        maxPolarAngle={
          Math.PI /
          2.025
        }
      />
    </Canvas>
  );
}