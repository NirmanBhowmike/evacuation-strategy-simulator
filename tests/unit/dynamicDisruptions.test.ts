import {
  describe,
  expect,
  it,
} from "vitest";

import { DynamicDisruptionController } from "../../src/core/DynamicDisruptionController";
import { HazardField } from "../../src/core/HazardField";

import type { BuildingEnvironment } from "../../src/types/environment";
import type { ExitSet } from "../../src/types/exit";
import type { ScenarioInstance } from "../../src/types/scenario";

function createEnvironment(): BuildingEnvironment {
  return {
    layoutId:
      "disruption-test",

    widthMeters: 30,
    heightMeters: 20,

    zones: [
      {
        id: "corridor-a",
        type: "CORRIDOR",

        polygon: {
          vertices: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 3 },
            { x: 0, y: 3 },
          ],
        },
      },

      {
        id: "corridor-b",
        type: "CORRIDOR",

        polygon: {
          vertices: [
            { x: 10, y: 0 },
            { x: 20, y: 0 },
            { x: 20, y: 3 },
            { x: 10, y: 3 },
          ],
        },
      },

      {
        id: "room-a",
        type: "ROOM",

        polygon: {
          vertices: [
            { x: 0, y: 3 },
            { x: 8, y: 3 },
            { x: 8, y: 10 },
            { x: 0, y: 10 },
          ],
        },
      },
    ],
  };
}

function createExitSet(): ExitSet {
  return {
    layoutId:
      "disruption-test",

    exits: [
      {
        id: "exit-west",

        position: {
          x: 0,
          y: 1.5,
        },

        widthMeters: 1.8,

        connectedZoneId:
          "corridor-a",
      },

      {
        id: "exit-east",

        position: {
          x: 20,
          y: 1.5,
        },

        widthMeters: 1.8,

        connectedZoneId:
          "corridor-b",
      },
    ],
  };
}

function createScenario(): ScenarioInstance {
  return {
    id:
      "dynamic-disruption-test",

    seed: 1042,

    layoutId:
      "disruption-test",

    parameterSetVersion:
      "test-v1",

    occupants: [],

    disruptionSchedule: [
      {
        id:
          "hazard-start",

        type:
          "HAZARD_ACTIVATE",

        activationTimeSeconds:
          10,

        targetId:
          "room-a",
      },

      {
        id:
          "hazard-expand",

        type:
          "HAZARD_EXPAND",

        activationTimeSeconds:
          15,

        targetId:
          "corridor-a",
      },

      {
        id:
          "corridor-block",

        type:
          "CORRIDOR_BLOCK",

        activationTimeSeconds:
          20,

        targetId:
          "corridor-b",
      },

      {
        id:
          "exit-block",

        type:
          "EXIT_BLOCK",

        activationTimeSeconds:
          25,

        targetId:
          "exit-east",
      },
    ],
  };
}

function createController() {
  const environment =
    createEnvironment();

  const exits =
    createExitSet();

  const scenario =
    createScenario();

  const hazardField =
    new HazardField(
      environment,
    );

  const controller =
    new DynamicDisruptionController(
      scenario,
      environment,
      exits,
      hazardField,
    );

  return {
    environment,
    exits,
    scenario,
    hazardField,
    controller,
  };
}

describe(
  "Dynamic disruptions",
  () => {
    it("does not apply events before their activation time", () => {
      const {
        controller,
        hazardField,
      } =
        createController();

      const applied =
        controller.processDueEvents(
          9.99,
        );

      expect(applied).toHaveLength(
        0,
      );

      expect(
        hazardField.getZoneState(
          "room-a",
        ),
      ).toBe("CLEAR");

      expect(
        controller.getAppliedEventCount(),
      ).toBe(0);
    });

    it("activates a RISK zone at the scheduled time", () => {
      const {
        controller,
        hazardField,
      } =
        createController();

      const applied =
        controller.processDueEvents(
          10,
        );

      expect(applied).toEqual([
        {
          id:
            "hazard-start",

          type:
            "HAZARD_ACTIVATE",

          activationTimeSeconds:
            10,

          targetId:
            "room-a",
        },
      ]);

      expect(
        hazardField.getZoneState(
          "room-a",
        ),
      ).toBe("RISK");
    });

    it("expands the hazard by marking an additional zone RISK", () => {
      const {
        controller,
        hazardField,
      } =
        createController();

      controller.processDueEvents(
        15,
      );

      expect(
        hazardField.getZoneState(
          "room-a",
        ),
      ).toBe("RISK");

      expect(
        hazardField.getZoneState(
          "corridor-a",
        ),
      ).toBe("RISK");

      expect(
        controller.getAppliedEventCount(),
      ).toBe(2);
    });

    it("makes a corridor BLOCKED when its disruption activates", () => {
      const {
        controller,
        hazardField,
      } =
        createController();

      controller.processDueEvents(
        20,
      );

      expect(
        hazardField.getZoneState(
          "corridor-b",
        ),
      ).toBe("BLOCKED");

      expect(
        hazardField.isZoneTraversable(
          "corridor-b",
        ),
      ).toBe(false);
    });

    it("blocks the selected exit while leaving other exits available", () => {
      const {
        controller,
      } =
        createController();

      controller.processDueEvents(
        25,
      );

      expect(
        controller.isExitAvailable(
          "exit-east",
        ),
      ).toBe(false);

      expect(
        controller.isExitAvailable(
          "exit-west",
        ),
      ).toBe(true);

      expect(
        controller.getBlockedExitIds(),
      ).toEqual([
        "exit-east",
      ]);
    });

    it("processes every due event in deterministic schedule order when time jumps forward", () => {
      const {
        controller,
      } =
        createController();

      const applied =
        controller.processDueEvents(
          25,
        );

      expect(
        applied.map(
          (event) => event.id,
        ),
      ).toEqual([
        "hazard-start",
        "hazard-expand",
        "corridor-block",
        "exit-block",
      ]);

      expect(
        controller.getPendingEventCount(),
      ).toBe(0);
    });

    it("applies every scheduled event exactly once", () => {
      const {
        controller,
      } =
        createController();

      const first =
        controller.processDueEvents(
          20,
        );

      const second =
        controller.processDueEvents(
          20,
        );

      const third =
        controller.processDueEvents(
          24,
        );

      expect(first).toHaveLength(
        3,
      );

      expect(second).toHaveLength(
        0,
      );

      expect(third).toHaveLength(
        0,
      );

      expect(
        controller.getAppliedEventCount(),
      ).toBe(3);
    });

    it("rejects simulation time moving backward", () => {
      const {
        controller,
      } =
        createController();

      controller.processDueEvents(
        15,
      );

      expect(() =>
        controller.processDueEvents(
          14,
        ),
      ).toThrow(
        /time cannot move backward/,
      );
    });

    it("validates disruption targets during controller construction", () => {
      const environment =
        createEnvironment();

      const exits =
        createExitSet();

      const hazardField =
        new HazardField(
          environment,
        );

      const invalidScenario:
        ScenarioInstance = {
        ...createScenario(),

        disruptionSchedule: [
          {
            id: "bad-corridor",

            type:
              "CORRIDOR_BLOCK",

            activationTimeSeconds:
              5,

            targetId:
              "room-a",
          },
        ],
      };

      expect(() =>
        new DynamicDisruptionController(
          invalidScenario,
          environment,
          exits,
          hazardField,
        ),
      ).toThrow(
        /must target a CORRIDOR/,
      );

      const invalidExitScenario:
        ScenarioInstance = {
        ...createScenario(),

        disruptionSchedule: [
          {
            id: "bad-exit",

            type:
              "EXIT_BLOCK",

            activationTimeSeconds:
              5,

            targetId:
              "missing-exit",
          },
        ],
      };

      expect(() =>
        new DynamicDisruptionController(
          invalidExitScenario,
          environment,
          exits,
          hazardField,
        ),
      ).toThrow(
        /unknown exit/,
      );
    });

    it("resets disruption state for deterministic replay", () => {
      const {
        controller,
        hazardField,
      } =
        createController();

      controller.processDueEvents(
        25,
      );

      expect(
        hazardField.getZoneState(
          "room-a",
        ),
      ).toBe("RISK");

      expect(
        hazardField.getZoneState(
          "corridor-b",
        ),
      ).toBe("BLOCKED");

      expect(
        controller.isExitAvailable(
          "exit-east",
        ),
      ).toBe(false);

      controller.reset();

      expect(
        hazardField.getZoneState(
          "room-a",
        ),
      ).toBe("CLEAR");

      expect(
        hazardField.getZoneState(
          "corridor-a",
        ),
      ).toBe("CLEAR");

      expect(
        hazardField.getZoneState(
          "corridor-b",
        ),
      ).toBe("CLEAR");

      expect(
        controller.isExitAvailable(
          "exit-east",
        ),
      ).toBe(true);

      expect(
        controller.getAppliedEventCount(),
      ).toBe(0);

      expect(
        controller.getPendingEventCount(),
      ).toBe(4);

      const replayed =
        controller.processDueEvents(
          10,
        );

      expect(
        replayed.map(
          (event) => event.id,
        ),
      ).toEqual([
        "hazard-start",
      ]);
    });
  },
);