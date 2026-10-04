import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createArchitectureV2AuthoritativeBundle,
} from "../../src/app/createArchitectureV2DemoReplay";

import {
  runHeadlessSimulation,
} from "../../src/core/runHeadlessSimulation";

import {
  layoutAArchitectureV2Environment,
} from "../../src/environment/layoutAArchitectureV2Environment";

import {
  layoutAArchitectureV2Exits,
} from "../../src/environment/layoutAArchitectureV2Exits";

import {
  ARCHITECTURE_V2_RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
  ARCHITECTURE_V2_RESEARCH_DENSITY_CELL_LENGTH_METERS,
  ARCHITECTURE_V2_RESEARCH_DISRUPTION_CONDITIONS,
  ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS,
  ARCHITECTURE_V2_RESEARCH_OCCUPANCY,
  ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,
  ARCHITECTURE_V2_RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,
  ARCHITECTURE_V2_RESEARCH_STRESS_TEST_OCCUPANCY,
  ARCHITECTURE_V2_RESEARCH_TIMESTEP_SECONDS,
  ARCHITECTURE_V2_RESEARCH_TIMING,
  getArchitectureV2ResearchDisruptionCondition,
} from "../../src/scenario/architectureV2ResearchParameterSet";

import {
  ARCHITECTURE_V2_D3_BLOCKABLE_ZONE,
  getArchitectureV2ResearchEnvironment,
  getArchitectureV2ResearchNavigationGraph,
  layoutAArchitectureV2D3ResearchEnvironment,
} from "../../src/scenario/architectureV2ResearchModel";

import type {
  ArchitectureV2ResearchDisruptionConditionId,
} from "../../src/scenario/architectureV2ResearchParameterSet";

import type {
  ScenarioInstance,
} from "../../src/types/scenario";

function runCase(
  conditionId:
    ArchitectureV2ResearchDisruptionConditionId,
) {
  const base =
    createArchitectureV2AuthoritativeBundle();

  const condition =
    getArchitectureV2ResearchDisruptionCondition(
      conditionId,
    );

  const scenario:
    ScenarioInstance = {
    ...base.scenario,

    id:
      `architecture-v2-${conditionId.toLowerCase()}-frozen-regression`,

    parameterSetVersion:
      ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,

    disruptionSchedule:
      condition.events,
  };

  const graph =
    getArchitectureV2ResearchNavigationGraph(
      conditionId,
      base.graph,
    );

  const environment =
    getArchitectureV2ResearchEnvironment(
      conditionId,
    );

  return runHeadlessSimulation({
    scenario,

    environment,

    graph,

    exits:
      layoutAArchitectureV2Exits,

    spawnZones:
      base.spawnZones,

    configuration: {
      strategyId:
        "ADAPTIVE_HYBRID",

      timestepSeconds:
        ARCHITECTURE_V2_RESEARCH_TIMESTEP_SECONDS,

      maximumSimulationTimeSeconds:
        180,

      densityCellLengthMeters:
        ARCHITECTURE_V2_RESEARCH_DENSITY_CELL_LENGTH_METERS,

      specificFlowPersonsPerMeterSecond:
        ARCHITECTURE_V2_RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,

      adaptiveRerouteThreshold:
        ARCHITECTURE_V2_RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
    },
  });
}

function expectSuccessfulCompletion(
  conditionId:
    ArchitectureV2ResearchDisruptionConditionId,
) {
  const result =
    runCase(
      conditionId,
    );

  expect(
    result.metrics
      .totalAgents,
  ).toBe(
    42,
  );

  expect(
    result.metrics
      .evacuatedAgents,
  ).toBe(
    42,
  );

  expect(
    result.metrics
      .completionRate,
  ).toBe(
    1,
  );

  expect(
    result.metrics
      .unreachableAgents,
  ).toBe(
    0,
  );

  expect(
    result.metrics
      .timeoutAgents,
  ).toBe(
    0,
  );

  return result;
}

describe(
  "Frozen Architecture V2 research parameter set",
  () => {
    it("contains the calibrated numerical and factorial parameters", () => {
      expect(
        ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,
      ).toBe(
        "architecture-v2-research-v1.0-frozen",
      );

      expect(
        ARCHITECTURE_V2_RESEARCH_TIMESTEP_SECONDS,
      ).toBe(
        0.05,
      );

      expect(
        ARCHITECTURE_V2_RESEARCH_DENSITY_CELL_LENGTH_METERS,
      ).toBe(
        1,
      );

      expect(
        ARCHITECTURE_V2_RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,
      ).toBe(
        1.3,
      );

      expect(
        ARCHITECTURE_V2_RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
      ).toBe(
        0.10,
      );

      expect(
        ARCHITECTURE_V2_RESEARCH_OCCUPANCY,
      ).toEqual({
        LOW:
          14,

        MEDIUM:
          42,

        HIGH:
          70,
      });

      expect(
        ARCHITECTURE_V2_RESEARCH_STRESS_TEST_OCCUPANCY,
      ).toBe(
        84,
      );

      expect(
        ARCHITECTURE_V2_RESEARCH_TIMING,
      ).toEqual({
        HAZARD_SECONDS:
          12,

        EXIT_BLOCK_SECONDS:
          18,

        CORRIDOR_BLOCK_SECONDS:
          12,
      });

      expect(
        ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS,
      ).toEqual({
        HAZARD_ZONE:
          "corridor-main-spine",

        EXIT:
          "exit-south-central",

        CORRIDOR_ZONE:
          "corridor-main-central-east-blockable",

        CORRIDOR_EDGE:
          "edge-main-central-central-01",
      });

      expect(
        ARCHITECTURE_V2_RESEARCH_DISRUPTION_CONDITIONS,
      ).toHaveLength(
        5,
      );
    });

    it("preserves room-origin nodes while applying the D3-only corridor mapping", () => {
      const base =
        createArchitectureV2AuthoritativeBundle();

      /**
       * The authoritative bundle must contain the private
       * origin nodes used by its spawn zones.
       */
      const firstOriginNode =
        base.graph
          .nodes
          .find(
            (
              node,
            ) =>
              node.id ===
              "room-origin-agent-0001",
          );

      expect(
        firstOriginNode,
      ).toBeDefined();

      const d0Graph =
        getArchitectureV2ResearchNavigationGraph(
          "D0_BASELINE",
          base.graph,
        );

      /**
       * Non-D3 conditions use the exact authoritative graph.
       */
      expect(
        d0Graph,
      ).toBe(
        base.graph,
      );

      expect(
        d0Graph
          .nodes
          .some(
            (
              node,
            ) =>
              node.id ===
              "room-origin-agent-0001",
          ),
      ).toBe(
        true,
      );

      const baseTargetEdge =
        base.graph
          .edges
          .find(
            (
              edge,
            ) =>
              edge.id ===
              ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS
                .CORRIDOR_EDGE,
          );

      expect(
        baseTargetEdge,
      ).toBeDefined();

      expect(
        baseTargetEdge
          ?.zoneId,
      ).toBe(
        "corridor-main-spine",
      );

      const d3Graph =
        getArchitectureV2ResearchNavigationGraph(
          "D3_CORRIDOR_BLOCK",
          base.graph,
        );

      /**
       * D3 must preserve the authoritative population-specific
       * graph rather than replacing it with the static graph.
       */
      expect(
        d3Graph.nodes,
      ).toHaveLength(
        base.graph.nodes.length,
      );

      expect(
        d3Graph.edges,
      ).toHaveLength(
        base.graph.edges.length,
      );

      expect(
        d3Graph
          .nodes
          .some(
            (
              node,
            ) =>
              node.id ===
              "room-origin-agent-0001",
          ),
      ).toBe(
        true,
      );

      expect(
        d3Graph
          .edges
          .some(
            (
              edge,
            ) =>
              edge.id ===
              "room-origin-edge-agent-0001",
          ),
      ).toBe(
        true,
      );

      const d3TargetEdges =
        d3Graph
          .edges
          .filter(
            (
              edge,
            ) =>
              edge.zoneId ===
              ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS
                .CORRIDOR_ZONE,
          );

      expect(
        d3TargetEdges,
      ).toHaveLength(
        1,
      );

      expect(
        d3TargetEdges[0]
          ?.id,
      ).toBe(
        "edge-main-central-central-01",
      );

      /**
       * Verify that creating D3 did not mutate the base graph.
       */
      expect(
        baseTargetEdge
          ?.zoneId,
      ).toBe(
        "corridor-main-spine",
      );

      /**
       * D3 alone receives the research blockable zone.
       */
      expect(
        getArchitectureV2ResearchEnvironment(
          "D0_BASELINE",
        ),
      ).toBe(
        layoutAArchitectureV2Environment,
      );

      expect(
        getArchitectureV2ResearchEnvironment(
          "D3_CORRIDOR_BLOCK",
        ),
      ).toBe(
        layoutAArchitectureV2D3ResearchEnvironment,
      );

      const d3Zones =
        layoutAArchitectureV2D3ResearchEnvironment
          .zones
          .filter(
            (
              zone,
            ) =>
              zone.id ===
              ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS
                .CORRIDOR_ZONE,
          );

      expect(
        d3Zones,
      ).toHaveLength(
        1,
      );

      expect(
        d3Zones[0],
      ).toEqual(
        ARCHITECTURE_V2_D3_BLOCKABLE_ZONE,
      );
    });

    it("reproduces frozen D0 through D2 signatures", () => {
      const d0 =
        expectSuccessfulCompletion(
          "D0_BASELINE",
        );

      expect(
        d0.metrics
          .totalEvacuationTimeSeconds,
      ).toBeCloseTo(
        39.90,
        8,
      );

      expect(
        d0.metrics
          .p95EvacuationTimeSeconds,
      ).toBeCloseTo(
        38.45,
        8,
      );

      expect(
        d0.metrics
          .maximumLocalDensityPersonsPerSquareMeter,
      ).toBeCloseTo(
        1.6666666666666665,
        8,
      );

      expect(
        d0.queueMetrics
          .populationQueueWaitPersonSeconds,
      ).toBeCloseTo(
        91.80,
        8,
      );

      expect(
        d0.metrics
          .totalReroutes,
      ).toBe(
        0,
      );

      const d1 =
        expectSuccessfulCompletion(
          "D1_HAZARD",
        );

      expect(
        d1.metrics
          .totalEvacuationTimeSeconds,
      ).toBeCloseTo(
        56.65,
        8,
      );

      expect(
        d1.metrics
          .p95EvacuationTimeSeconds,
      ).toBeCloseTo(
        54.20,
        8,
      );

      expect(
        d1.metrics
          .populationHazardExposurePersonSeconds,
      ).toBeCloseTo(
        74.95,
        2,
      );

      expect(
        d1.queueMetrics
          .populationQueueWaitPersonSeconds,
      ).toBeCloseTo(
        94.95,
        8,
      );

      expect(
        d1.metrics
          .totalReroutes,
      ).toBe(
        6,
      );

      const d1HazardReviews =
        d1
          .decisionTrace
          .filter(
            (
              entry,
            ) =>
              entry.reasonCodes.includes(
                "HAZARD_AVOIDANCE",
              ),
          );

      expect(
        d1HazardReviews,
      ).toHaveLength(
        6,
      );

      const d2 =
        expectSuccessfulCompletion(
          "D2_EXIT_BLOCK",
        );

      expect(
        d2.metrics
          .totalEvacuationTimeSeconds,
      ).toBeCloseTo(
        56.45,
        8,
      );

      expect(
        d2.metrics
          .p95EvacuationTimeSeconds,
      ).toBeCloseTo(
        54.60,
        8,
      );

      expect(
        d2.queueMetrics
          .populationQueueWaitPersonSeconds,
      ).toBeCloseTo(
        106.15,
        8,
      );

      expect(
        d2.metrics
          .totalReroutes,
      ).toBe(
        10,
      );

      const d2ExitReviews =
        d2
          .decisionTrace
          .filter(
            (
              entry,
            ) =>
              entry.reasonCodes.includes(
                "EXIT_UNAVAILABLE",
              ),
          );

      expect(
        d2ExitReviews,
      ).toHaveLength(
        10,
      );
    });

    it("reproduces the frozen D3 corridor-block signature", () => {
      const d3 =
        expectSuccessfulCompletion(
          "D3_CORRIDOR_BLOCK",
        );

      expect(
        d3.appliedDisruptions,
      ).toHaveLength(
        1,
      );

      expect(
        d3.appliedDisruptions[0]
          ?.type,
      ).toBe(
        "CORRIDOR_BLOCK",
      );

      expect(
        d3.appliedDisruptions[0]
          ?.activationTimeSeconds,
      ).toBe(
        12,
      );

      expect(
        d3.appliedDisruptions[0]
          ?.targetId,
      ).toBe(
        "corridor-main-central-east-blockable",
      );

      expect(
        d3.metrics
          .totalEvacuationTimeSeconds,
      ).toBeCloseTo(
        49.05,
        8,
      );

      expect(
        d3.metrics
          .p95EvacuationTimeSeconds,
      ).toBeCloseTo(
        46.15,
        8,
      );

      expect(
        d3.queueMetrics
          .populationQueueWaitPersonSeconds,
      ).toBeCloseTo(
        94.70,
        8,
      );

      expect(
        d3.metrics
          .totalReroutes,
      ).toBe(
        4,
      );

      const routeBlockedReviews =
        d3
          .decisionTrace
          .filter(
            (
              entry,
            ) =>
              entry.reasonCodes.includes(
                "ROUTE_BLOCKED",
              ),
          );

      expect(
        routeBlockedReviews,
      ).toHaveLength(
        4,
      );

      expect(
        routeBlockedReviews
          .filter(
            (
              entry,
            ) =>
              entry.routeChanged,
          ),
      ).toHaveLength(
        4,
      );
    });

    it("reproduces the frozen D4 combined-disruption signature", () => {
      const d4 =
        expectSuccessfulCompletion(
          "D4_COMBINED",
        );

      expect(
        d4.appliedDisruptions,
      ).toHaveLength(
        2,
      );

      expect(
        d4.appliedDisruptions[0]
          ?.type,
      ).toBe(
        "HAZARD_ACTIVATE",
      );

      expect(
        d4.appliedDisruptions[0]
          ?.activationTimeSeconds,
      ).toBe(
        12,
      );

      expect(
        d4.appliedDisruptions[1]
          ?.type,
      ).toBe(
        "EXIT_BLOCK",
      );

      expect(
        d4.appliedDisruptions[1]
          ?.activationTimeSeconds,
      ).toBe(
        18,
      );

      expect(
        d4.metrics
          .totalEvacuationTimeSeconds,
      ).toBeCloseTo(
        86.25,
        8,
      );

      expect(
        d4.metrics
          .p95EvacuationTimeSeconds,
      ).toBeCloseTo(
        83.55,
        8,
      );

      expect(
        d4.metrics
          .populationHazardExposurePersonSeconds,
      ).toBeCloseTo(
        202.66,
        2,
      );

      expect(
        d4.queueMetrics
          .populationQueueWaitPersonSeconds,
      ).toBeCloseTo(
        120.00,
        8,
      );

      expect(
        d4.metrics
          .totalReroutes,
      ).toBe(
        19,
      );

      expect(
        d4.metrics
          .fractionRerouted,
      ).toBeCloseTo(
        15 /
          42,
        8,
      );

      const hazardAvoidanceReviews =
        d4
          .decisionTrace
          .filter(
            (
              entry,
            ) =>
              entry.reasonCodes.includes(
                "HAZARD_AVOIDANCE",
              ),
          );

      expect(
        hazardAvoidanceReviews,
      ).toHaveLength(
        6,
      );

      const exitUnavailableReviews =
        d4
          .decisionTrace
          .filter(
            (
              entry,
            ) =>
              entry.reasonCodes.includes(
                "EXIT_UNAVAILABLE",
              ),
          );

      expect(
        exitUnavailableReviews,
      ).toHaveLength(
        13,
      );
    });
  },
);