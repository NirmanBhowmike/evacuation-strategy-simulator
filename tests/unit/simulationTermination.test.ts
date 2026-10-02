import {
  describe,
  expect,
  it,
} from "vitest";

import { updateSimulationTermination } from "../../src/core/simulationTermination";

import type { AgentState } from "../../src/types/agent";

function createAgent(
  id: string,
  status:
    | "ACTIVE"
    | "EVACUATED"
    | "UNREACHABLE"
    | "TIMEOUT" =
      "ACTIVE",
): AgentState {
  return {
    id,

    desiredSpeedMps:
      1.3,

    position: {
      x: 5,
      y: 5,
    },

    status,

    currentNodeId:
      "node-a",

    currentEdgeId:
      status === "ACTIVE"
        ? "edge-a-b"
        : null,

    routeNodeIds:
      status === "ACTIVE"
        ? [
            "node-a",
            "node-b",
          ]
        : [],

    routeCursorIndex: 0,

    targetExitId:
      status ===
      "EVACUATED"
        ? "exit-a"
        : null,

    rerouteCount: 0,

    distanceTraveledMeters:
      10,

    hazardExposureSeconds:
      0,

    evacuationTimeSeconds:
      status ===
      "EVACUATED"
        ? 15
        : null,
  };
}

describe(
  "Simulation termination",
  () => {
    it("continues while ACTIVE agents remain before the time ceiling", () => {
      const agents = [
        createAgent(
          "agent-001",
          "ACTIVE",
        ),

        createAgent(
          "agent-002",
          "EVACUATED",
        ),
      ];

      const result =
        updateSimulationTermination(
          agents,
          30,
          300,
        );

      expect(
        result.isTerminated,
      ).toBe(false);

      expect(
        result.reason,
      ).toBeNull();

      expect(
        result.activeAgents,
      ).toBe(1);

      expect(
        agents[0]?.status,
      ).toBe("ACTIVE");
    });

    it("terminates normally when every agent is EVACUATED", () => {
      const agents = [
        createAgent(
          "agent-001",
          "EVACUATED",
        ),

        createAgent(
          "agent-002",
          "EVACUATED",
        ),
      ];

      const result =
        updateSimulationTermination(
          agents,
          20,
          300,
        );

      expect(
        result.isTerminated,
      ).toBe(true);

      expect(
        result.reason,
      ).toBe(
        "ALL_RESOLVED",
      );

      expect(
        result.evacuatedAgents,
      ).toBe(2);

      expect(
        result.activeAgents,
      ).toBe(0);
    });

    it("terminates normally with a mixture of EVACUATED and UNREACHABLE agents", () => {
      const agents = [
        createAgent(
          "agent-001",
          "EVACUATED",
        ),

        createAgent(
          "agent-002",
          "UNREACHABLE",
        ),

        createAgent(
          "agent-003",
          "EVACUATED",
        ),
      ];

      const result =
        updateSimulationTermination(
          agents,
          50,
          300,
        );

      expect(
        result.isTerminated,
      ).toBe(true);

      expect(
        result.reason,
      ).toBe(
        "ALL_RESOLVED",
      );

      expect(
        result.evacuatedAgents,
      ).toBe(2);

      expect(
        result.unreachableAgents,
      ).toBe(1);

      expect(
        result.timeoutAgents,
      ).toBe(0);
    });

    it("marks remaining ACTIVE agents TIMEOUT exactly at the time ceiling", () => {
      const agents = [
        createAgent(
          "agent-001",
          "ACTIVE",
        ),

        createAgent(
          "agent-002",
          "EVACUATED",
        ),
      ];

      const result =
        updateSimulationTermination(
          agents,
          300,
          300,
        );

      expect(
        result.isTerminated,
      ).toBe(true);

      expect(
        result.reason,
      ).toBe(
        "TIMEOUT",
      );

      expect(
        agents[0]?.status,
      ).toBe(
        "TIMEOUT",
      );

      expect(
        result.timeoutAgents,
      ).toBe(1);

      expect(
        result.evacuatedAgents,
      ).toBe(1);
    });

    it("also applies TIMEOUT when simulation time exceeds the ceiling", () => {
      const agents = [
        createAgent(
          "agent-001",
          "ACTIVE",
        ),
      ];

      const result =
        updateSimulationTermination(
          agents,
          305,
          300,
        );

      expect(
        result.isTerminated,
      ).toBe(true);

      expect(
        result.reason,
      ).toBe(
        "TIMEOUT",
      );

      expect(
        result.timeoutAgents,
      ).toBe(1);
    });

    it("does not alter agents already EVACUATED or UNREACHABLE when timeout occurs", () => {
      const evacuated =
        createAgent(
          "agent-001",
          "EVACUATED",
        );

      const unreachable =
        createAgent(
          "agent-002",
          "UNREACHABLE",
        );

      const active =
        createAgent(
          "agent-003",
          "ACTIVE",
        );

      const agents = [
        evacuated,
        unreachable,
        active,
      ];

      updateSimulationTermination(
        agents,
        300,
        300,
      );

      expect(
        evacuated.status,
      ).toBe(
        "EVACUATED",
      );

      expect(
        evacuated.evacuationTimeSeconds,
      ).toBe(15);

      expect(
        unreachable.status,
      ).toBe(
        "UNREACHABLE",
      );

      expect(
        active.status,
      ).toBe(
        "TIMEOUT",
      );
    });

    it("clears movement state for agents that TIMEOUT", () => {
      const active =
        createAgent(
          "agent-001",
          "ACTIVE",
        );

      updateSimulationTermination(
        [active],
        300,
        300,
      );

      expect(
        active.status,
      ).toBe(
        "TIMEOUT",
      );

      expect(
        active.currentEdgeId,
      ).toBeNull();

      expect(
        active.routeNodeIds,
      ).toEqual([]);

      expect(
        active.routeCursorIndex,
      ).toBe(0);

      expect(
        active.evacuationTimeSeconds,
      ).toBeNull();
    });

    it("preserves TIMEOUT as the run-level reason on later evaluations", () => {
      const agents = [
        createAgent(
          "agent-001",
          "ACTIVE",
        ),
      ];

      updateSimulationTermination(
        agents,
        300,
        300,
      );

      const second =
        updateSimulationTermination(
          agents,
          300,
          300,
        );

      expect(
        second.isTerminated,
      ).toBe(true);

      expect(
        second.reason,
      ).toBe(
        "TIMEOUT",
      );

      expect(
        second.timeoutAgents,
      ).toBe(1);
    });

    it("treats an empty population as already resolved", () => {
      const result =
        updateSimulationTermination(
          [],
          0,
          300,
        );

      expect(
        result.isTerminated,
      ).toBe(true);

      expect(
        result.reason,
      ).toBe(
        "ALL_RESOLVED",
      );

      expect(
        result.totalAgents,
      ).toBe(0);
    });

    it("rejects invalid simulation times and invalid time ceilings", () => {
      expect(() =>
        updateSimulationTermination(
          [],
          -1,
          300,
        ),
      ).toThrow(
        /Simulation time must be non-negative/,
      );

      expect(() =>
        updateSimulationTermination(
          [],
          0,
          0,
        ),
      ).toThrow(
        /Maximum simulation time must be positive/,
      );

      expect(() =>
        updateSimulationTermination(
          [],
          0,
          -1,
        ),
      ).toThrow(
        /Maximum simulation time must be positive/,
      );
    });
  },
);