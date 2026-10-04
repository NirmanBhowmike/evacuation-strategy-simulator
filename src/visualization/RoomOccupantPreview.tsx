import {
  useMemo,
} from "react";

import {
  layoutAArchitectureV2,
} from "../environment/layoutAArchitectureV2";

import {
  createRoomOccupantPreview,
} from "./createRoomOccupantPreview";

import {
  LowPolyHuman,
} from "./LowPolyHuman";

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

/**
 * Visual-only preview of room-based population distribution.
 *
 * The figures are not simulation agents yet.
 *
 * PREVIEW motion is deliberately low amplitude so the articulated
 * hands, arms, knees, lower legs, and feet can be inspected while
 * the population remains at its room starting positions.
 */
export function RoomOccupantPreview() {
  const agents =
    useMemo(
      () =>
        createRoomOccupantPreview(),
      [],
    );

  return (
    <group>
      {agents.map(
        (
          agent,
        ) => (
          <group
            key={
              agent.id
            }
            position={[
              simulationXToWorldX(
                agent.position.x,
              ),
              0.78,
              simulationYToWorldZ(
                agent.position.y,
              ),
            ]}
          >
            <LowPolyHuman
              headingRadians={
                agent.headingRadians
              }
              animationPhase={
                agent.animationPhase
              }
              bodyVariant={
                agent.bodyVariant
              }
              heightScale={
                agent.heightScale
              }
              motionMode="PREVIEW"
            />
          </group>
        ),
      )}
    </group>
  );
}