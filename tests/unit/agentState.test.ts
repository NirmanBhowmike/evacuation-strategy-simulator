import {
  describe,
  expect,
  it,
} from "vitest";

import { createInitialAgentStates } from "../../src/core/createInitialAgentStates";
import { validateAgentStates } from "../../src/core/validateAgentStates";

import type { AgentState } from "../../src/types/agent";
import type { ScenarioInstance } from "../../src/types/scenario";

function createScenario(): ScenarioInstance {
  return {
    id: "agent-state-test",
    seed: 1042,
    layoutId: "layout-a",
    parameterSetVersion: "test-v1",

    occupants: [
      {
        id: "agent-001",
        spawnPosition: {
          x: 10,
          y: 12,
        },
        desiredSpeedMps: 1.25,
      },

      {
        id: "agent-002",
        spawnPosition: {
          x: 30,
          y: 22,
        },
        desiredSpeedMps: 1.42,
      },
    ],

    disruptionSchedule: [],
  };
}

describe("Agent state model", () => {
  it("creates one runtime state for every scenario occupant", () => {
    const scenario =
      createScenario();

    const states =
      createInitialAgentStates(
        scenario,
      );

    expect(states).toHaveLength(
      scenario.occupants.length,
    );
  });

  it("copies immutable occupant inputs into runtime state", () => {
    const scenario =
      createScenario();

    const states =
      createInitialAgentStates(
        scenario,
      );

    expect(
      states[0]?.id,
    ).toBe("agent-001");

    expect(
      states[0]?.desiredSpeedMps,
    ).toBe(1.25);

    expect(
      states[0]?.position,
    ).toEqual({
      x: 10,
      y: 12,
    });
  });

  it("creates independent position objects", () => {
    const scenario =
      createScenario();

    const states =
      createInitialAgentStates(
        scenario,
      );

    expect(
      states[0]?.position,
    ).not.toBe(
      scenario.occupants[0]
        ?.spawnPosition,
    );
  });

  it("initializes routing state with no assigned route or exit", () => {
    const states =
      createInitialAgentStates(
        createScenario(),
      );

    for (const state of states) {
      expect(
        state.currentNodeId,
      ).toBeNull();

      expect(
        state.currentEdgeId,
      ).toBeNull();

      expect(
        state.routeNodeIds,
      ).toEqual([]);

      expect(
        state.routeCursorIndex,
      ).toBe(0);

      expect(
        state.targetExitId,
      ).toBeNull();
    }
  });

  it("initializes all agents as active with zero accumulated metrics", () => {
    const states =
      createInitialAgentStates(
        createScenario(),
      );

    for (const state of states) {
      expect(
        state.status,
      ).toBe("ACTIVE");

      expect(
        state.rerouteCount,
      ).toBe(0);

      expect(
        state.distanceTraveledMeters,
      ).toBe(0);

      expect(
        state.hazardExposureSeconds,
      ).toBe(0);

      expect(
        state.evacuationTimeSeconds,
      ).toBeNull();
    }
  });

  it("does not mutate the ScenarioInstance when runtime state changes", () => {
    const scenario =
      createScenario();

    const states =
      createInitialAgentStates(
        scenario,
      );

    states[0]!.position = {
      x: 99,
      y: 50,
    };

    states[0]!.distanceTraveledMeters =
      25;

    expect(
      scenario.occupants[0]
        ?.spawnPosition,
    ).toEqual({
      x: 10,
      y: 12,
    });

    expect(
      states[0]!.position,
    ).toEqual({
      x: 99,
      y: 50,
    });

    expect(
      states[0]!
        .distanceTraveledMeters,
    ).toBe(25);
  });

  it("accepts valid initial agent states", () => {
    const states =
      createInitialAgentStates(
        createScenario(),
      );

    expect(() =>
      validateAgentStates(states),
    ).not.toThrow();
  });

  it("rejects invalid runtime state values", () => {
    const states =
      createInitialAgentStates(
        createScenario(),
      );

    const duplicate: AgentState = {
      ...states[0]!,
      position: {
        ...states[0]!.position,
      },
    };

    expect(() =>
      validateAgentStates([
        ...states,
        duplicate,
      ]),
    ).toThrow(
      /Duplicate agent-state id/,
    );

    const invalidDistance: AgentState = {
      ...states[0]!,
      distanceTraveledMeters: -1,
    };

    expect(() =>
      validateAgentStates([
        invalidDistance,
      ]),
    ).toThrow(
      /non-negative finite traveled distance/,
    );

    const invalidExposure: AgentState = {
      ...states[0]!,
      hazardExposureSeconds: -1,
    };

    expect(() =>
      validateAgentStates([
        invalidExposure,
      ]),
    ).toThrow(
      /non-negative finite hazard exposure/,
    );

    const invalidCursor: AgentState = {
      ...states[0]!,
      routeCursorIndex: 2,
    };

    expect(() =>
      validateAgentStates([
        invalidCursor,
      ]),
    ).toThrow(
      /invalid route cursor index/,
    );
  });
});