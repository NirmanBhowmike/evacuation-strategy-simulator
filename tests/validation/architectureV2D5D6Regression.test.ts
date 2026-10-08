import {
  describe,
  expect,
  it,
} from "vitest";

import {
  runHeadlessSimulation,
} from "../../src/core/runHeadlessSimulation";

import {
  ARCHITECTURE_V2_FORMAL_STRATEGY_IDS,
} from "../../src/experiment/architectureV2FormalExperimentDesign";

import {
  ARCHITECTURE_V2_FORMAL_MAXIMUM_SIMULATION_TIME_SECONDS,
} from "../../src/experiment/architectureV2FormalExperimentRunner";

import {
  createArchitectureV2FormalScenario,
} from "../../src/scenario/architectureV2FormalScenario";

import {
  ARCHITECTURE_V2_RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
  ARCHITECTURE_V2_RESEARCH_DENSITY_CELL_LENGTH_METERS,
  ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS,
  ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,
  ARCHITECTURE_V2_RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,
  ARCHITECTURE_V2_RESEARCH_TIMESTEP_SECONDS,
  ARCHITECTURE_V2_RESEARCH_TIMING,
} from "../../src/scenario/architectureV2ResearchParameterSet";

import type {
  RoutingStrategyId,
} from "../../src/types/routingStrategy";

const REGRESSION_SEED =
  100001;

function runCondition(
  conditionId:
    | "D5_EXIT_BLOCK_WEST"
    | "D6_CORRIDOR_BLOCK_EAST_SOUTHEAST",

  strategyId:
    RoutingStrategyId,
) {
  const bundle =
    createArchitectureV2FormalScenario({
      populationLevel:
        "MEDIUM",

      conditionId,

      replicationSeed:
        REGRESSION_SEED,
    });

  return {
    bundle,

    result:
      runHeadlessSimulation({
        scenario:
          bundle.scenario,

        environment:
          bundle.environment,

        graph:
          bundle.graph,

        exits:
          bundle.exits,

        spawnZones:
          bundle.spawnZones,

        configuration: {
          strategyId,

          timestepSeconds:
            ARCHITECTURE_V2_RESEARCH_TIMESTEP_SECONDS,

          maximumSimulationTimeSeconds:
            ARCHITECTURE_V2_FORMAL_MAXIMUM_SIMULATION_TIME_SECONDS,

          densityCellLengthMeters:
            ARCHITECTURE_V2_RESEARCH_DENSITY_CELL_LENGTH_METERS,

          specificFlowPersonsPerMeterSecond:
            ARCHITECTURE_V2_RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,

          adaptiveRerouteThreshold:
            ARCHITECTURE_V2_RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
        },
      }),
  };
}

describe(
  "Architecture V2 D5/D6 frozen regression",
  () => {
    it(
      "freezes the validated D5 west-exit disruption target and timing",
      () => {
        const bundle =
          createArchitectureV2FormalScenario({
            populationLevel:
              "MEDIUM",

            conditionId:
              "D5_EXIT_BLOCK_WEST",

            replicationSeed:
              REGRESSION_SEED,
          });

        expect(
          bundle.scenario
            .parameterSetVersion,
        ).toBe(
          "architecture-v2-research-v1.2-frozen",
        );

        expect(
          ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,
        ).toBe(
          "architecture-v2-research-v1.2-frozen",
        );

        expect(
          ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS
            .D5_EXIT,
        ).toBe(
          "exit-west",
        );

        expect(
          ARCHITECTURE_V2_RESEARCH_TIMING
            .EXIT_BLOCK_SECONDS,
        ).toBe(
          18,
        );

        expect(
          bundle.scenario
            .disruptionSchedule,
        ).toHaveLength(
          1,
        );

        const event =
          bundle.scenario
            .disruptionSchedule[0];

        expect(
          event,
        ).toBeDefined();

        expect(
          event?.type,
        ).toBe(
          "EXIT_BLOCK",
        );

        expect(
          event?.activationTimeSeconds,
        ).toBe(
          18,
        );

        expect(
          event?.targetId,
        ).toBe(
          "exit-west",
        );

        expect(
          bundle.exits.exits
            .some(
              (
                exit,
              ) =>
                exit.id ===
                "exit-west",
            ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "freezes the validated D6 corridor target, timing, zone, and edge mapping",
      () => {
        const baseline =
          createArchitectureV2FormalScenario({
            populationLevel:
              "MEDIUM",

            conditionId:
              "D0_BASELINE",

            replicationSeed:
              REGRESSION_SEED,
          });

        const d6 =
          createArchitectureV2FormalScenario({
            populationLevel:
              "MEDIUM",

            conditionId:
              "D6_CORRIDOR_BLOCK_EAST_SOUTHEAST",

            replicationSeed:
              REGRESSION_SEED,
          });

        expect(
          ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS
            .D6_CORRIDOR_EDGE,
        ).toBe(
          "edge-main-east-main-southeast",
        );

        expect(
          ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS
            .D6_CORRIDOR_ZONE,
        ).toBe(
          "corridor-main-east-southeast-blockable",
        );

        expect(
          ARCHITECTURE_V2_RESEARCH_TIMING
            .CORRIDOR_BLOCK_SECONDS,
        ).toBe(
          12,
        );

        expect(
          d6.scenario
            .disruptionSchedule,
        ).toHaveLength(
          1,
        );

        const event =
          d6.scenario
            .disruptionSchedule[0];

        expect(
          event?.type,
        ).toBe(
          "CORRIDOR_BLOCK",
        );

        expect(
          event?.activationTimeSeconds,
        ).toBe(
          12,
        );

        expect(
          event?.targetId,
        ).toBe(
          "corridor-main-east-southeast-blockable",
        );

        const baselineTargetEdge =
          baseline.graph
            .edges
            .find(
              (
                edge,
              ) =>
                edge.id ===
                "edge-main-east-main-southeast",
            );

        expect(
          baselineTargetEdge,
        ).toBeDefined();

        expect(
          baselineTargetEdge
            ?.zoneId,
        ).toBe(
          "corridor-main-spine",
        );

        const d6TargetEdges =
          d6.graph
            .edges
            .filter(
              (
                edge,
              ) =>
                edge.zoneId ===
                "corridor-main-east-southeast-blockable",
            );

        expect(
          d6TargetEdges,
        ).toHaveLength(
          1,
        );

        expect(
          d6TargetEdges[0]
            ?.id,
        ).toBe(
          "edge-main-east-main-southeast",
        );

        expect(
          d6.graph.nodes,
        ).toHaveLength(
          baseline.graph.nodes.length,
        );

        expect(
          d6.graph.edges,
        ).toHaveLength(
          baseline.graph.edges.length,
        );

        const d6Zones =
          d6.environment
            .zones
            .filter(
              (
                zone,
              ) =>
                zone.id ===
                "corridor-main-east-southeast-blockable",
            );

        expect(
          d6Zones,
        ).toHaveLength(
          1,
        );

        expect(
          baseline.environment
            .zones
            .some(
              (
                zone,
              ) =>
                zone.id ===
                "corridor-main-east-southeast-blockable",
            ),
        ).toBe(
          false,
        );
      },
    );

    it(
      "completes D5 and D6 across all five formal routing strategies",
      () => {
        const conditions =
          [
            "D5_EXIT_BLOCK_WEST",
            "D6_CORRIDOR_BLOCK_EAST_SOUTHEAST",
          ] as const;

        for (
          const conditionId of
            conditions
        ) {
          for (
            const strategyId of
              ARCHITECTURE_V2_FORMAL_STRATEGY_IDS
          ) {
            const {
              result,
            } =
              runCondition(
                conditionId,
                strategyId,
              );

            expect(
              result.appliedDisruptions,
              `${conditionId} / ${strategyId}`,
            ).toHaveLength(
              1,
            );

            expect(
              result.termination.reason,
              `${conditionId} / ${strategyId}`,
            ).toBe(
              "ALL_RESOLVED",
            );

            expect(
              result.metrics
                .completionRate,
              `${conditionId} / ${strategyId}`,
            ).toBe(
              1,
            );

            expect(
              result.metrics
                .evacuatedAgents,
              `${conditionId} / ${strategyId}`,
            ).toBe(
              42,
            );

            expect(
              result.metrics
                .unreachableAgents,
              `${conditionId} / ${strategyId}`,
            ).toBe(
              0,
            );

            expect(
              result.metrics
                .timeoutAgents,
              `${conditionId} / ${strategyId}`,
            ).toBe(
              0,
            );

            expect(
              result.metrics
                .totalEvacuationTimeSeconds,
              `${conditionId} / ${strategyId}`,
            ).not.toBeNull();
          }
        }
      },
      15000,
    );
  },
);