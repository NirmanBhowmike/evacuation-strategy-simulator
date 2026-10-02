import {
  describe,
  expect,
  it,
} from "vitest";

import { RouteStabilityTracker } from "../../src/core/RouteStabilityTracker";

import type { RoutingPath } from "../../src/types/routing";

function path(
  nodeIds:
    readonly string[],
  edgeIds:
    readonly string[],
  targetNodeId: string,
): RoutingPath {
  return {
    nodeIds,

    edgeIds,

    totalCost: 10,

    targetNodeId,
  };
}

function previousPath():
  RoutingPath {
  return path(
    [
      "decision",
      "node-forward",
      "exit-a",
    ],
    [
      "edge-forward",
      "edge-exit-a",
    ],
    "exit-a",
  );
}

function alternativePath():
  RoutingPath {
  return path(
    [
      "decision",
      "node-side",
      "exit-b",
    ],
    [
      "edge-side",
      "edge-exit-b",
    ],
    "exit-b",
  );
}

function reversalPath():
  RoutingPath {
  return path(
    [
      "decision",
      "node-arrival",
      "node-other",
      "exit-b",
    ],
    [
      "edge-back",
      "edge-other",
      "edge-exit-b",
    ],
    "exit-b",
  );
}

describe(
  "Route stability tracking",
  () => {
    it("records an accepted reroute deterministically", () => {
      const tracker =
        new RouteStabilityTracker();

      const event =
        tracker.recordAcceptedReroute(
          "agent-001",
          12,
          "decision",
          "node-arrival",
          previousPath(),
          alternativePath(),
        );

      expect(
        event.sequence,
      ).toBe(1);

      expect(
        event.eventId,
      ).toBe(
        "stability-000001",
      );

      expect(
        event.agentId,
      ).toBe(
        "agent-001",
      );

      expect(
        tracker.size,
      ).toBe(1);
    });

    it("detects an exit-target change", () => {
      const tracker =
        new RouteStabilityTracker();

      const event =
        tracker.recordAcceptedReroute(
          "agent-001",
          12,
          "decision",
          "node-arrival",
          previousPath(),
          alternativePath(),
        );

      expect(
        event.previousTargetExitId,
      ).toBe(
        "exit-a",
      );

      expect(
        event.selectedTargetExitId,
      ).toBe(
        "exit-b",
      );

      expect(
        event.exitTargetChanged,
      ).toBe(true);
    });

    it("does not count a target change when the route changes but the exit remains the same", () => {
      const tracker =
        new RouteStabilityTracker();

      const sameExitAlternative =
        path(
          [
            "decision",
            "node-side",
            "exit-a",
          ],
          [
            "edge-side",
            "edge-side-exit-a",
          ],
          "exit-a",
        );

      const event =
        tracker.recordAcceptedReroute(
          "agent-001",
          12,
          "decision",
          "node-arrival",
          previousPath(),
          sameExitAlternative,
        );

      expect(
        event.exitTargetChanged,
      ).toBe(false);
    });

    it("detects a route reversal when the new route immediately returns toward the arrival node", () => {
      const tracker =
        new RouteStabilityTracker();

      const event =
        tracker.recordAcceptedReroute(
          "agent-001",
          15,
          "decision",
          "node-arrival",
          previousPath(),
          reversalPath(),
        );

      expect(
        event.routeReversal,
      ).toBe(true);
    });

    it("does not classify an ordinary route change as a reversal", () => {
      const tracker =
        new RouteStabilityTracker();

      const event =
        tracker.recordAcceptedReroute(
          "agent-001",
          15,
          "decision",
          "node-arrival",
          previousPath(),
          alternativePath(),
        );

      expect(
        event.routeReversal,
      ).toBe(false);
    });

    it("cannot classify a reversal when there is no previous arrival node", () => {
      const tracker =
        new RouteStabilityTracker();

      const event =
        tracker.recordAcceptedReroute(
          "agent-001",
          0,
          "decision",
          null,
          previousPath(),
          reversalPath(),
        );

      expect(
        event.routeReversal,
      ).toBe(false);
    });

    it("aggregates reroutes, target changes, and reversals by agent", () => {
      const tracker =
        new RouteStabilityTracker();

      tracker.recordAcceptedReroute(
        "agent-001",
        10,
        "decision",
        "node-arrival",
        previousPath(),
        alternativePath(),
      );

      tracker.recordAcceptedReroute(
        "agent-001",
        20,
        "decision",
        "node-arrival",
        previousPath(),
        reversalPath(),
      );

      tracker.recordAcceptedReroute(
        "agent-002",
        25,
        "decision",
        "node-arrival",
        previousPath(),
        alternativePath(),
      );

      const summary =
        tracker.getSummary();

      expect(
        summary.totalAcceptedReroutes,
      ).toBe(3);

      expect(
        summary.totalExitTargetChanges,
      ).toBe(3);

      expect(
        summary.totalRouteReversalEvents,
      ).toBe(1);

      expect(
        summary.agentsWithAcceptedReroutes,
      ).toBe(2);

      expect(
        summary.byAgent,
      ).toEqual([
        {
          agentId:
            "agent-001",

          acceptedReroutes:
            2,

          exitTargetChanges:
            2,

          routeReversalEvents:
            1,
        },

        {
          agentId:
            "agent-002",

          acceptedReroutes:
            1,

          exitTargetChanges:
            1,

          routeReversalEvents:
            0,
        },
      ]);
    });

    it("supports deterministic per-agent retrieval", () => {
      const tracker =
        new RouteStabilityTracker();

      tracker.recordAcceptedReroute(
        "agent-002",
        10,
        "decision",
        "node-arrival",
        previousPath(),
        alternativePath(),
      );

      tracker.recordAcceptedReroute(
        "agent-001",
        15,
        "decision",
        "node-arrival",
        previousPath(),
        reversalPath(),
      );

      expect(
        tracker.getEventsForAgent(
          "agent-001",
        ),
      ).toHaveLength(1);

      expect(
        tracker.getEventsForAgent(
          "agent-002",
        ),
      ).toHaveLength(1);
    });

    it("rejects an identical route because it is not an accepted reroute", () => {
      const tracker =
        new RouteStabilityTracker();

      expect(() =>
        tracker.recordAcceptedReroute(
          "agent-001",
          10,
          "decision",
          "node-arrival",
          previousPath(),
          previousPath(),
        ),
      ).toThrow(
        /must change the route/,
      );
    });

    it("rejects malformed paths and invalid event information", () => {
      const tracker =
        new RouteStabilityTracker();

      expect(() =>
        tracker.recordAcceptedReroute(
          "",
          10,
          "decision",
          "node-arrival",
          previousPath(),
          alternativePath(),
        ),
      ).toThrow(
        /agent id is required/,
      );

      expect(() =>
        tracker.recordAcceptedReroute(
          "agent-001",
          -1,
          "decision",
          "node-arrival",
          previousPath(),
          alternativePath(),
        ),
      ).toThrow(
        /time must be non-negative/,
      );

      expect(() =>
        tracker.recordAcceptedReroute(
          "agent-001",
          10,
          "decision",
          "decision",
          previousPath(),
          alternativePath(),
        ),
      ).toThrow(
        /Arrival-from node cannot equal/,
      );

      const malformed:
        RoutingPath = {
        nodeIds: [
          "decision",
          "exit-a",
        ],

        edgeIds: [],

        totalCost: 10,

        targetNodeId:
          "exit-a",
      };

      expect(() =>
        tracker.recordAcceptedReroute(
          "agent-001",
          10,
          "decision",
          "node-arrival",
          malformed,
          alternativePath(),
        ),
      ).toThrow(
        /one fewer edge than nodes/,
      );
    });

    it("resets events, summaries, and deterministic sequence numbering", () => {
      const tracker =
        new RouteStabilityTracker();

      tracker.recordAcceptedReroute(
        "agent-001",
        10,
        "decision",
        "node-arrival",
        previousPath(),
        alternativePath(),
      );

      tracker.clear();

      expect(
        tracker.size,
      ).toBe(0);

      expect(
        tracker.getSummary(),
      ).toEqual({
        totalAcceptedReroutes:
          0,

        totalExitTargetChanges:
          0,

        totalRouteReversalEvents:
          0,

        agentsWithAcceptedReroutes:
          0,

        byAgent: [],
      });

      const next =
        tracker.recordAcceptedReroute(
          "agent-002",
          20,
          "decision",
          "node-arrival",
          previousPath(),
          alternativePath(),
        );

      expect(
        next.eventId,
      ).toBe(
        "stability-000001",
      );
    });
  },
);