import {
  describe,
  expect,
  it,
} from "vitest";

import { createSimulationSnapshot } from "../../src/core/createSimulationSnapshot";
import { DynamicDisruptionController } from "../../src/core/DynamicDisruptionController";
import { HazardField } from "../../src/core/HazardField";

import type { AgentState } from "../../src/types/agent";
import type { BuildingEnvironment } from "../../src/types/environment";
import type { ExitSet } from "../../src/types/exit";
import type { ScenarioInstance } from "../../src/types/scenario";

function createEnvironment(): BuildingEnvironment {
  return {
    layoutId:
      "snapshot-test",

    widthMeters: 20,
    heightMeters: 10,

    zones: [
      {
        id:
          "corridor-a",

        type:
          "CORRIDOR",

        polygon: {
          vertices: [
            {
              x: 0,
              y: 0,
            },
            {
              x: 20,
              y: 0,
            },
            {
              x: 20,
              y: 3,
            },
            {
              x: 0,
              y: 3,
            },
          ],
        },
      },
    ],
  };
}

function createExits(): ExitSet {
  return {
    layoutId:
      "snapshot-test",

    exits: [
      {
        id:
          "exit-a",

        position: {
          x: 20,
          y: 1.5,
        },

        widthMeters:
          1.8,

        connectedZoneId:
          "corridor-a",
      },
    ],
  };
}

function createScenario(): ScenarioInstance {
  return {
    id:
      "snapshot-scenario",

    seed:
      1042,

    layoutId:
      "snapshot-test",

    parameterSetVersion:
      "test-v1",

    occupants: [],

    disruptionSchedule: [
      {
        id:
          "hazard-event",

        type:
          "HAZARD_ACTIVATE",

        activationTimeSeconds:
          5,

        targetId:
          "corridor-a",
      },

      {
        id:
          "exit-event",

        type:
          "EXIT_BLOCK",

        activationTimeSeconds:
          10,

        targetId:
          "exit-a",
      },
    ],
  };
}

function createAgent(): AgentState {
  return {
    id:
      "agent-001",

    desiredSpeedMps:
      1.3,

    position: {
      x: 5,
      y: 1.5,
    },

    status:
      "ACTIVE",

    currentNodeId:
      "node-a",

    currentEdgeId:
      "edge-a",

    routeNodeIds: [
      "node-a",
      "exit-a",
    ],

    routeCursorIndex:
      0,

    targetExitId:
      "exit-a",

    rerouteCount:
      1,

    distanceTraveledMeters:
      4.5,

    hazardExposureSeconds:
      2,

    evacuationTimeSeconds:
      null,
  };
}

function createSystem() {
  const environment =
    createEnvironment();

  const exits =
    createExits();

  const hazardField =
    new HazardField(
      environment,
    );

  const disruptions =
    new DynamicDisruptionController(
      createScenario(),
      environment,
      exits,
      hazardField,
    );

  return {
    environment,
    exits,
    hazardField,
    disruptions,
  };
}

describe(
  "Simulation snapshot boundary",
  () => {
    it("creates plain renderer-facing state from the simulation engine", () => {
      const {
        hazardField,
        disruptions,
      } =
        createSystem();

      const snapshot =
        createSimulationSnapshot(
          "snapshot-test",
          4,
          [
            createAgent(),
          ],
          hazardField,
          disruptions,
        );

      expect(
        snapshot.layoutId,
      ).toBe(
        "snapshot-test",
      );

      expect(
        snapshot.simulationTimeSeconds,
      ).toBe(4);

      expect(
        snapshot.agents,
      ).toHaveLength(1);

      expect(
        snapshot.agents[0],
      ).toEqual({
        id:
          "agent-001",

        position: {
          x: 5,
          y: 1.5,
        },

        status:
          "ACTIVE",

        desiredSpeedMps:
          1.3,

        currentNodeId:
          "node-a",

        currentEdgeId:
          "edge-a",

        targetExitId:
          "exit-a",

        rerouteCount:
          1,

        distanceTraveledMeters:
          4.5,

        hazardExposureSeconds:
          2,

        evacuationTimeSeconds:
          null,
      });
    });

    it("copies position data instead of exposing the mutable engine object", () => {
      const {
        hazardField,
        disruptions,
      } =
        createSystem();

      const agent =
        createAgent();

      const snapshot =
        createSimulationSnapshot(
          "snapshot-test",
          0,
          [
            agent,
          ],
          hazardField,
          disruptions,
        );

      expect(
        snapshot.agents[0]
          ?.position,
      ).not.toBe(
        agent.position,
      );

      agent.position = {
        x: 15,
        y: 2,
      };

      expect(
        snapshot.agents[0]
          ?.position,
      ).toEqual({
        x: 5,
        y: 1.5,
      });
    });

    it("captures current hazard state without exposing HazardField internals", () => {
      const {
        hazardField,
        disruptions,
      } =
        createSystem();

      disruptions.processDueEvents(
        5,
      );

      const snapshot =
        createSimulationSnapshot(
          "snapshot-test",
          5,
          [],
          hazardField,
          disruptions,
        );

      expect(
        snapshot.hazardZones,
      ).toEqual([
        {
          zoneId:
            "corridor-a",

          state:
            "RISK",
        },
      ]);
    });

    it("captures dynamically blocked exits", () => {
      const {
        hazardField,
        disruptions,
      } =
        createSystem();

      disruptions.processDueEvents(
        10,
      );

      const snapshot =
        createSimulationSnapshot(
          "snapshot-test",
          10,
          [],
          hazardField,
          disruptions,
        );

      expect(
        snapshot.blockedExitIds,
      ).toEqual([
        "exit-a",
      ]);
    });

    it("preserves an earlier snapshot when engine state later changes", () => {
      const {
        hazardField,
        disruptions,
      } =
        createSystem();

      const agent =
        createAgent();

      const before =
        createSimulationSnapshot(
          "snapshot-test",
          0,
          [
            agent,
          ],
          hazardField,
          disruptions,
        );

      agent.position = {
        x: 12,
        y: 1.5,
      };

      agent.rerouteCount =
        3;

      disruptions.processDueEvents(
        10,
      );

      const after =
        createSimulationSnapshot(
          "snapshot-test",
          10,
          [
            agent,
          ],
          hazardField,
          disruptions,
        );

      expect(
        before.agents[0]
          ?.position.x,
      ).toBe(5);

      expect(
        before.agents[0]
          ?.rerouteCount,
      ).toBe(1);

      expect(
        before.hazardZones[0]
          ?.state,
      ).toBe(
        "CLEAR",
      );

      expect(
        before.blockedExitIds,
      ).toEqual([]);

      expect(
        after.agents[0]
          ?.position.x,
      ).toBe(12);

      expect(
        after.agents[0]
          ?.rerouteCount,
      ).toBe(3);

      expect(
        after.hazardZones[0]
          ?.state,
      ).toBe(
        "RISK",
      );

      expect(
        after.blockedExitIds,
      ).toEqual([
        "exit-a",
      ]);
    });

    it("produces deterministic snapshots for identical engine state", () => {
      const {
        hazardField,
        disruptions,
      } =
        createSystem();

      const agent =
        createAgent();

      const first =
        createSimulationSnapshot(
          "snapshot-test",
          2,
          [
            agent,
          ],
          hazardField,
          disruptions,
        );

      const second =
        createSimulationSnapshot(
          "snapshot-test",
          2,
          [
            agent,
          ],
          hazardField,
          disruptions,
        );

      expect(first).toEqual(
        second,
      );
    });

    it("rejects invalid snapshot time", () => {
      const {
        hazardField,
        disruptions,
      } =
        createSystem();

      expect(() =>
        createSimulationSnapshot(
          "snapshot-test",
          -1,
          [],
          hazardField,
          disruptions,
        ),
      ).toThrow(
        /time must be non-negative/,
      );
    });

    it("rejects a layout mismatch", () => {
      const {
        hazardField,
        disruptions,
      } =
        createSystem();

      expect(() =>
        createSimulationSnapshot(
          "wrong-layout",
          0,
          [],
          hazardField,
          disruptions,
        ),
      ).toThrow(
        /layout must match/,
      );
    });
  },
);