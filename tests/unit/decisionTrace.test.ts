import {
  describe,
  expect,
  it,
} from "vitest";

import { DecisionTraceLog } from "../../src/core/DecisionTraceLog";

import type {
  ReroutingDecisionInput,
  ReroutingDecisionResult,
  RouteAssessment,
} from "../../src/types/rerouting";
import type { RoutingPath } from "../../src/types/routing";
import type {
  RoutingStrategyDecision,
} from "../../src/types/routingStrategy";

function pathTo(
  exitId: string,
  edgeId: string,
): RoutingPath {
  return {
    nodeIds: [
      "start",
      exitId,
    ],

    edgeIds: [
      edgeId,
    ],

    totalCost: 10,

    targetNodeId:
      exitId,
  };
}

function currentPath():
  RoutingPath {
  return pathTo(
    "exit-current",
    "edge-current",
  );
}

function candidateDecision():
  RoutingStrategyDecision {
  return {
    strategyId:
      "ADAPTIVE_HYBRID",

    targetExitId:
      "exit-alternative",

    path:
      pathTo(
        "exit-alternative",
        "edge-alternative",
      ),

    metrics: {
      predictedRiskExposureSeconds:
        0,

      estimatedTravelTimeSeconds:
        8,
    },
  };
}

function assessment(
  risk: number,
  time: number,
  options: {
    blocked?: boolean;
    exitUnavailable?: boolean;
  } = {},
): RouteAssessment {
  return {
    isRouteBlocked:
      options.blocked ??
      false,

    isTargetExitUnavailable:
      options.exitUnavailable ??
      false,

    predictedRiskExposureSeconds:
      risk,

    estimatedTravelTimeSeconds:
      time,
  };
}

function reroutingInput(
  overrides:
    Partial<ReroutingDecisionInput> = {},
): ReroutingDecisionInput {
  return {
    trigger:
      "DECISION_NODE_REVIEW",

    threshold:
      0.10,

    candidate:
      candidateDecision(),

    ...overrides,
  };
}

function reroutingResult(
  overrides:
    Partial<ReroutingDecisionResult> = {},
): ReroutingDecisionResult {
  return {
    action:
      "REROUTE",

    reason:
      "IMPROVEMENT_THRESHOLD_MET",

    threshold:
      0.10,

    relativeImprovement:
      0.20,

    current:
      assessment(
        0,
        10,
      ),

    candidate:
      assessment(
        0,
        8,
      ),

    ...overrides,
  };
}

describe(
  "Decision Trace logging",
  () => {
    it("records deterministic initial-route events", () => {
      const log =
        new DecisionTraceLog();

      const decision:
        RoutingStrategyDecision = {
        strategyId:
          "NEAREST_EXIT",

        targetExitId:
          "exit-a",

        path:
          pathTo(
            "exit-a",
            "edge-a",
          ),

        metrics: {
          straightLineDistanceMeters:
            5,
        },
      };

      const entry =
        log.recordInitialRoute(
          "agent-001",
          0,
          decision,
        );

      expect(
        entry.sequence,
      ).toBe(1);

      expect(
        entry.eventId,
      ).toBe(
        "trace-000001",
      );

      expect(
        entry.reasonCodes,
      ).toEqual([
        "INITIAL_ROUTE",
        "NEAREST_EXIT",
      ]);

      expect(
        entry.action,
      ).toBe(
        "ROUTE_ASSIGNED",
      );

      expect(
        entry.selectedTargetExitId,
      ).toBe(
        "exit-a",
      );
    });

    it("records an explicit initial no-route condition", () => {
      const log =
        new DecisionTraceLog();

      const entry =
        log.recordInitialRoute(
          "agent-001",
          0,
          null,
        );

      expect(
        entry.action,
      ).toBe(
        "NO_FEASIBLE_ALTERNATIVE",
      );

      expect(
        entry.reasonCodes,
      ).toContain(
        "NO_FEASIBLE_ALTERNATIVE",
      );

      expect(
        entry.selectedTargetExitId,
      ).toBeNull();
    });

    it("records threshold-based rerouting without recalculating the decision", () => {
      const log =
        new DecisionTraceLog();

      const entry =
        log.recordReroutingDecision(
          "agent-001",
          15,
          currentPath(),
          reroutingInput(),
          reroutingResult(),
        );

      expect(
        entry.action,
      ).toBe(
        "REROUTE",
      );

      expect(
        entry.reasonCodes,
      ).toEqual([
        "DECISION_NODE_REVIEW",
        "CONGESTION_IMPROVEMENT",
        "REROUTE_THRESHOLD_MET",
      ]);

      expect(
        entry.relativeImprovement,
      ).toBeCloseTo(
        0.20,
      );

      expect(
        entry.selectedTargetExitId,
      ).toBe(
        "exit-alternative",
      );

      expect(
        entry.routeChanged,
      ).toBe(true);
    });

    it("records a threshold rejection while retaining the current route", () => {
      const log =
        new DecisionTraceLog();

      const entry =
        log.recordReroutingDecision(
          "agent-001",
          20,
          currentPath(),
          reroutingInput(),
          reroutingResult({
            action:
              "KEEP_CURRENT",

            reason:
              "IMPROVEMENT_THRESHOLD_NOT_MET",

            relativeImprovement:
              0.05,
          }),
        );

      expect(
        entry.reasonCodes,
      ).toContain(
        "REROUTE_THRESHOLD_NOT_MET",
      );

      expect(
        entry.selectedTargetExitId,
      ).toBe(
        "exit-current",
      );

      expect(
        entry.routeChanged,
      ).toBe(false);
    });

    it("records a safety-driven reroute as hazard avoidance", () => {
      const log =
        new DecisionTraceLog();

      const entry =
        log.recordReroutingDecision(
          "agent-001",
          25,
          currentPath(),

          reroutingInput({
            trigger:
              "HAZARD_CHANGE",

            threshold:
              0.90,
          }),

          reroutingResult({
            reason:
              "SAFER_ALTERNATIVE",

            threshold:
              0.90,

            current:
              assessment(
                6,
                10,
              ),

            candidate:
              assessment(
                0,
                12,
              ),
          }),
        );

      expect(
        entry.reasonCodes,
      ).toEqual([
        "HAZARD_AVOIDANCE",
      ]);

      expect(
        entry.action,
      ).toBe(
        "REROUTE",
      );
    });

    it("records forced rerouting caused by a blocked route", () => {
      const log =
        new DecisionTraceLog();

      const entry =
        log.recordReroutingDecision(
          "agent-001",
          30,
          currentPath(),

          reroutingInput({
            trigger:
              "HAZARD_CHANGE",
          }),

          reroutingResult({
            reason:
              "CURRENT_ROUTE_BLOCKED",

            relativeImprovement:
              null,

            current:
              assessment(
                0,
                10,
                {
                  blocked:
                    true,
                },
              ),
          }),
        );

      expect(
        entry.reasonCodes,
      ).toEqual([
        "ROUTE_BLOCKED",
      ]);

      expect(
        entry.routeChanged,
      ).toBe(true);
    });

    it("records forced rerouting caused by an unavailable exit", () => {
      const log =
        new DecisionTraceLog();

      const entry =
        log.recordReroutingDecision(
          "agent-001",
          35,
          currentPath(),
          reroutingInput(),
          reroutingResult({
            reason:
              "CURRENT_EXIT_UNAVAILABLE",

            relativeImprovement:
              null,

            current:
              assessment(
                0,
                10,
                {
                  exitUnavailable:
                    true,
                },
              ),
          }),
        );

      expect(
        entry.reasonCodes,
      ).toContain(
        "EXIT_UNAVAILABLE",
      );
    });

    it("records no feasible alternative explicitly", () => {
      const log =
        new DecisionTraceLog();

      const input =
        reroutingInput({
          candidate:
            null,
        });

      const result =
        reroutingResult({
          action:
            "NO_FEASIBLE_ALTERNATIVE",

          reason:
            "NO_FEASIBLE_ALTERNATIVE",

          relativeImprovement:
            null,

          candidate:
            null,
        });

      const entry =
        log.recordReroutingDecision(
          "agent-001",
          40,
          currentPath(),
          input,
          result,
        );

      expect(
        entry.reasonCodes,
      ).toContain(
        "NO_FEASIBLE_ALTERNATIVE",
      );

      expect(
        entry.selectedTargetExitId,
      ).toBeNull();

      expect(
        entry.candidateTargetExitId,
      ).toBeNull();
    });

    it("copies path data so later mutation cannot alter historical trace entries", () => {
      const log =
        new DecisionTraceLog();

      const mutableEdges = [
        "edge-current",
      ];

      const path:
        RoutingPath = {
        nodeIds: [
          "start",
          "exit-current",
        ],

        edgeIds:
          mutableEdges,

        totalCost:
          10,

        targetNodeId:
          "exit-current",
      };

      const entry =
        log.recordReroutingDecision(
          "agent-001",
          45,
          path,
          reroutingInput(),
          reroutingResult(),
        );

      mutableEdges[0] =
        "changed-edge";

      expect(
        entry.currentEdgeIds,
      ).toEqual([
        "edge-current",
      ]);
    });

    it("supports per-agent retrieval and deterministic reset", () => {
      const log =
        new DecisionTraceLog();

      log.recordInitialRoute(
        "agent-001",
        0,
        null,
      );

      log.recordInitialRoute(
        "agent-002",
        0,
        null,
      );

      expect(
        log.size,
      ).toBe(2);

      expect(
        log.getEntriesForAgent(
          "agent-001",
        ),
      ).toHaveLength(1);

      log.clear();

      expect(
        log.size,
      ).toBe(0);

      const afterReset =
        log.recordInitialRoute(
          "agent-003",
          0,
          null,
        );

      expect(
        afterReset.eventId,
      ).toBe(
        "trace-000001",
      );
    });

    it("rejects invalid log inputs and mismatched thresholds", () => {
      const log =
        new DecisionTraceLog();

      expect(() =>
        log.recordInitialRoute(
          "",
          0,
          null,
        ),
      ).toThrow(
        /agent id is required/,
      );

      expect(() =>
        log.recordInitialRoute(
          "agent-001",
          -1,
          null,
        ),
      ).toThrow(
        /time must be non-negative/,
      );

      expect(() =>
        log.recordReroutingDecision(
          "agent-001",
          10,
          currentPath(),

          reroutingInput({
            threshold:
              0.10,
          }),

          reroutingResult({
            threshold:
              0.20,
          }),
        ),
      ).toThrow(
        /thresholds must match/,
      );
    });
  },
);