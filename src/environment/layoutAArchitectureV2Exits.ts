import {
  layoutAArchitectureV2,
} from "./layoutAArchitectureV2";

import {
  LAYOUT_A_ARCHITECTURE_V2_ID,
} from "./layoutAArchitectureV2Environment";

import type {
  ExitSet,
} from "../types/exit";

function connectedZoneForExit(
  exitId:
    string,
): string {
  switch (
    exitId
  ) {
    case "exit-west":
      return "corridor-west";

    case "exit-south-central":
      return "corridor-south-central-egress";

    case "exit-east":
      return "corridor-east-egress";

    case "exit-southeast":
      return "corridor-southeast-egress";

    default:
      throw new Error(
        `Architecture V2 exit has no connected-zone mapping: ${exitId}`,
      );
  }
}

export const layoutAArchitectureV2Exits:
  ExitSet = {
  layoutId:
    LAYOUT_A_ARCHITECTURE_V2_ID,

  exits:
    layoutAArchitectureV2
      .exits
      .map(
        (
          exit,
        ) => ({
          id:
            exit.id,

          position: {
            x:
              exit.position.x,

            y:
              exit.position.y,
          },

          widthMeters:
            exit.widthMeters,

          connectedZoneId:
            connectedZoneForExit(
              exit.id,
            ),
        }),
      ),
};