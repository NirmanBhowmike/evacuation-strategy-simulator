import type { ExitSet } from "../types/exit";

/**
 * Four primary exits for Layout A.
 *
 * Exit locations are part of the fictional research environment.
 * They are not intended to reproduce exits from a real building.
 *
 * All exits initially use the same nominal width so that the
 * primary routing experiment is not unintentionally biased by
 * different exit capacities.
 */
export const layoutAExits: ExitSet = {
  layoutId: "layout-a",

  exits: [
    {
      id: "exit-west",
      position: {
        x: 8,
        y: 24.75,
      },
      widthMeters: 1.8,
      connectedZoneId: "corridor-west-central",
    },

    {
      id: "exit-south-central",
      position: {
        x: 36.75,
        y: 17,
      },
      widthMeters: 1.8,
      connectedZoneId: "corridor-main-spine",
    },

    {
      id: "exit-east",
      position: {
        x: 75.5,
        y: 18.25,
      },
      widthMeters: 1.8,
      connectedZoneId: "corridor-far-east",
    },

    {
      id: "exit-southeast",
      position: {
        x: 68.5,
        y: 13,
      },
      widthMeters: 1.8,
      connectedZoneId: "corridor-southeast",
    },
  ],
};