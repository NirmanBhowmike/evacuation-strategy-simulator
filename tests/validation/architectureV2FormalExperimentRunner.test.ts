import {
  describe,
  expect,
  it,
} from "vitest";

import {
  ARCHITECTURE_V2_FORMAL_FIRST_REPLICATION_SEED,
  ARCHITECTURE_V2_FORMAL_STRATEGY_IDS,
  createArchitectureV2FormalRunPlan,
} from "../../src/experiment/architectureV2FormalExperimentDesign";

import type {
  ArchitectureV2FormalRunSpecification,
} from "../../src/experiment/architectureV2FormalExperimentDesign";

import {
  ARCHITECTURE_V2_FORMAL_MAXIMUM_SIMULATION_TIME_SECONDS,
  runArchitectureV2FormalExperiment,
  runArchitectureV2FormalPair,
} from "../../src/experiment/architectureV2FormalExperimentRunner";

import {
  ARCHITECTURE_V2_RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
  ARCHITECTURE_V2_RESEARCH_DENSITY_CELL_LENGTH_METERS,
  ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS,
  ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,
  ARCHITECTURE_V2_RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,
  ARCHITECTURE_V2_RESEARCH_TIMESTEP_SECONDS,
  ARCHITECTURE_V2_RESEARCH_TIMING,
} from "../../src/scenario/architectureV2ResearchParameterSet";

const INITIAL_RUN_PLAN =
  createArchitectureV2FormalRunPlan();

function requireRun(
  populationLevel:
    ArchitectureV2FormalRunSpecification["populationLevel"],

  conditionId:
    ArchitectureV2FormalRunSpecification["conditionId"],

  strategyId:
    ArchitectureV2FormalRunSpecification["strategyId"],

  replicationSeed:
    number =
    ARCHITECTURE_V2_FORMAL_FIRST_REPLICATION_SEED,
): ArchitectureV2FormalRunSpecification {
  const run =
    INITIAL_RUN_PLAN.find(
      (
        candidate,
      ) =>
        candidate.populationLevel ===
          populationLevel &&
        candidate.conditionId ===
          conditionId &&
        candidate.strategyId ===
          strategyId &&
        candidate.replicationSeed ===
          replicationSeed,
    );

  if (!run) {
    throw new Error(
      `Formal run specification not found for ${populationLevel}/${conditionId}/${strategyId}/seed-${replicationSeed}.`,
    );
  }

  return run;
}

function requirePair(
  populationLevel:
    ArchitectureV2FormalRunSpecification["populationLevel"],

  conditionId:
    ArchitectureV2FormalRunSpecification["conditionId"],

  replicationSeed:
    number =
    ARCHITECTURE_V2_FORMAL_FIRST_REPLICATION_SEED,
): readonly ArchitectureV2FormalRunSpecification[] {
  const representative =
    requireRun(
      populationLevel,
      conditionId,
      "NEAREST_EXIT",
      replicationSeed,
    );

  const pairedRuns =
    INITIAL_RUN_PLAN.filter(
      (
        candidate,
      ) =>
        candidate.pairKey ===
        representative.pairKey,
    );

  if (
    pairedRuns.length !==
    5
  ) {
    throw new Error(
      `Expected five formal paired runs for ${representative.pairKey}, found ${pairedRuns.length}.`,
    );
  }

  return pairedRuns;
}

describe(
  "Architecture V2 formal experiment runner",
  () => {
    it(
      "executes one LOW D0 formal run using the frozen research configuration",
      () => {
        const specification =
          requireRun(
            "LOW",
            "D0_BASELINE",
            "NEAREST_EXIT",
          );

        const result =
          runArchitectureV2FormalExperiment(
            specification,
          );

        expect(
          result.runId,
        ).toBe(
          specification.runId,
        );

        expect(
          result.pairKey,
        ).toBe(
          specification.pairKey,
        );

        expect(
          result.cellId,
        ).toBe(
          specification.cellId,
        );

        expect(
          result.parameterSetVersion,
        ).toBe(
          ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,
        );

        expect(
          result.replicationSeed,
        ).toBe(
          ARCHITECTURE_V2_FORMAL_FIRST_REPLICATION_SEED,
        );

        expect(
          result.populationLevel,
        ).toBe(
          "LOW",
        );

        expect(
          result.population,
        ).toBe(
          14,
        );

        expect(
          result.conditionId,
        ).toBe(
          "D0_BASELINE",
        );

        expect(
          result.strategyId,
        ).toBe(
          "NEAREST_EXIT",
        );

        expect(
          result.runStatus,
        ).toBe(
          "COMPLETED",
        );

        expect(
          result.terminationReason,
        ).toBe(
          "ALL_RESOLVED",
        );

        expect(
          result.appliedDisruptionCount,
        ).toBe(
          0,
        );

        expect(
          result.metrics
            .completionRate,
        ).toBe(
          1,
        );

        expect(
          result.metrics
            .evacuatedAgents,
        ).toBe(
          14,
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

        expect(
          result.metrics
            .totalEvacuationTimeSeconds,
        ).not.toBeNull();

        expect(
          result.simulation
            .timestepSeconds,
        ).toBe(
          ARCHITECTURE_V2_RESEARCH_TIMESTEP_SECONDS,
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
          ARCHITECTURE_V2_FORMAL_MAXIMUM_SIMULATION_TIME_SECONDS,
        ).toBe(
          180,
        );
      },
    );

    it(
      "executes all five strategies against one identical MEDIUM D0 stochastic scenario",
      () => {
        const specifications =
          requirePair(
            "MEDIUM",
            "D0_BASELINE",
          );

        const results =
          runArchitectureV2FormalPair(
            specifications,
          );

        expect(
          results,
        ).toHaveLength(
          5,
        );

        expect(
          results.map(
            (
              result,
            ) =>
              result.strategyId,
          ),
        ).toEqual(
          [
            ...ARCHITECTURE_V2_FORMAL_STRATEGY_IDS,
          ],
        );

        expect(
          new Set(
            results.map(
              (
                result,
              ) =>
                result.pairKey,
            ),
          ).size,
        ).toBe(
          1,
        );

        expect(
          new Set(
            results.map(
              (
                result,
              ) =>
                result.scenarioId,
            ),
          ).size,
        ).toBe(
          1,
        );

        expect(
          new Set(
            results.map(
              (
                result,
              ) =>
                result.replicationSeed,
            ),
          ).size,
        ).toBe(
          1,
        );

        expect(
          new Set(
            results.map(
              (
                result,
              ) =>
                result.population,
            ),
          ),
        ).toEqual(
          new Set([
            42,
          ]),
        );

        for (
          const result of
            results
        ) {
          expect(
            result.populationLevel,
          ).toBe(
            "MEDIUM",
          );

          expect(
            result.conditionId,
          ).toBe(
            "D0_BASELINE",
          );

          expect(
            result.appliedDisruptionCount,
          ).toBe(
            0,
          );

          expect(
            result.runStatus,
          ).toBe(
            "COMPLETED",
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
        }
      },
    );

    it(
      "executes the D3 condition through the condition-specific corridor-block research model",
      () => {
        const specification =
          requireRun(
            "MEDIUM",
            "D3_CORRIDOR_BLOCK",
            "ADAPTIVE_HYBRID",
          );

        const result =
          runArchitectureV2FormalExperiment(
            specification,
          );

        expect(
          result.conditionId,
        ).toBe(
          "D3_CORRIDOR_BLOCK",
        );

        expect(
          result.population,
        ).toBe(
          42,
        );

        expect(
          result.appliedDisruptionCount,
        ).toBe(
          1,
        );

        expect(
          result.simulation
            .appliedDisruptions,
        ).toEqual([
          {
            id:
              "v2-d3-main-central-corridor-block",

            type:
              "CORRIDOR_BLOCK",

            activationTimeSeconds:
              ARCHITECTURE_V2_RESEARCH_TIMING
                .CORRIDOR_BLOCK_SECONDS,

            targetId:
              ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS
                .CORRIDOR_ZONE,
          },
        ]);

        expect(
          result.runStatus,
        ).toBe(
          "COMPLETED",
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
      },
    );

    it(
      "applies both frozen D4 events during a formal dynamic run",
      () => {
        const specification =
          requireRun(
            "MEDIUM",
            "D4_COMBINED",
            "ADAPTIVE_HYBRID",
          );

        const result =
          runArchitectureV2FormalExperiment(
            specification,
          );

        expect(
          result.appliedDisruptionCount,
        ).toBe(
          2,
        );

        expect(
          result.simulation
            .appliedDisruptions,
        ).toEqual([
          {
            id:
              "v2-d4-main-spine-hazard",

            type:
              "HAZARD_ACTIVATE",

            activationTimeSeconds:
              ARCHITECTURE_V2_RESEARCH_TIMING
                .HAZARD_SECONDS,

            targetId:
              ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS
                .HAZARD_ZONE,
          },

          {
            id:
              "v2-d4-south-central-exit-block",

            type:
              "EXIT_BLOCK",

            activationTimeSeconds:
              ARCHITECTURE_V2_RESEARCH_TIMING
                .EXIT_BLOCK_SECONDS,

            targetId:
              ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS
                .EXIT,
          },
        ]);

        expect(
          result.runStatus,
        ).toBe(
          "COMPLETED",
        );

        expect(
          result.metrics
            .completionRate,
        ).toBe(
          1,
        );

        expect(
          result.metrics
            .populationHazardExposurePersonSeconds,
        ).toBeGreaterThanOrEqual(
          0,
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
      },
    );

    it(
      "returns deterministic results when the same formal run specification is executed again",
      () => {
        const specification =
          requireRun(
            "LOW",
            "D0_BASELINE",
            "STATIC_SHORTEST_PATH",
          );

        const first =
          runArchitectureV2FormalExperiment(
            specification,
          );

        const second =
          runArchitectureV2FormalExperiment(
            specification,
          );

        expect(
          second,
        ).toEqual(
          first,
        );
      },
    );

    it(
      "rejects a run specification whose factors disagree with its scenario request",
      () => {
        const valid =
          requireRun(
            "LOW",
            "D0_BASELINE",
            "NEAREST_EXIT",
          );

        const populationMismatch:
          ArchitectureV2FormalRunSpecification = {
          ...valid,

          populationLevel:
            "HIGH",
        };

        expect(
          () =>
            runArchitectureV2FormalExperiment(
              populationMismatch,
            ),
        ).toThrow(
          /population level does not match/i,
        );

        const conditionMismatch:
          ArchitectureV2FormalRunSpecification = {
          ...valid,

          conditionId:
            "D2_EXIT_BLOCK",
        };

        expect(
          () =>
            runArchitectureV2FormalExperiment(
              conditionMismatch,
            ),
        ).toThrow(
          /disruption condition does not match/i,
        );

        const seedMismatch:
          ArchitectureV2FormalRunSpecification = {
          ...valid,

          replicationSeed:
            valid.replicationSeed +
            1,
        };

        expect(
          () =>
            runArchitectureV2FormalExperiment(
              seedMismatch,
            ),
        ).toThrow(
          /replication seed does not match/i,
        );
      },
    );

    it(
      "rejects invalid paired-run collections before simulation execution",
      () => {
        const validPair =
          requirePair(
            "MEDIUM",
            "D0_BASELINE",
          );

        expect(
          () =>
            runArchitectureV2FormalPair(
              validPair.slice(
                0,
                4,
              ),
            ),
        ).toThrow(
          /exactly 5 strategy runs/i,
        );

        const wrongPairKey:
          ArchitectureV2FormalRunSpecification[] =
        [
          ...validPair.slice(
            0,
            4,
          ),

          {
            ...validPair[4]!,

            pairKey:
              "incorrect-pair-key",
          },
        ];

        expect(
          () =>
            runArchitectureV2FormalPair(
              wrongPairKey,
            ),
        ).toThrow(
          /shared pairKey/i,
        );

        const duplicateStrategy:
          ArchitectureV2FormalRunSpecification[] =
        [
          validPair[0]!,
          validPair[1]!,
          validPair[2]!,
          validPair[3]!,

          {
            ...validPair[4]!,

            strategyId:
              validPair[0]!
                .strategyId,
          },
        ];

        expect(
          () =>
            runArchitectureV2FormalPair(
              duplicateStrategy,
            ),
        ).toThrow(
          /five unique routing strategies/i,
        );
      },
    );
  },
);