import {
  describe,
  expect,
  it,
} from "vitest";

import {
  ARCHITECTURE_V2_FORMAL_CONDITION_IDS,
  ARCHITECTURE_V2_FORMAL_INITIAL_SEED_BANK,
  ARCHITECTURE_V2_FORMAL_STRATEGY_IDS,
} from "../../src/experiment/architectureV2FormalExperimentDesign";

import {
  ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,
} from "../../src/scenario/architectureV2ResearchParameterSet";

import {
  ARCHITECTURE_V2_FORMAL_SPEED_ASSIGNMENT_VERSION,
} from "../../src/scenario/architectureV2FormalScenario";

import type {
  RoutingStrategyId,
} from "../../src/types/routingStrategy";

import {
  ARCHITECTURE_V2_DIAGNOSTIC_MATRIX_VERSION,
  ARCHITECTURE_V2_DIAGNOSTIC_SEEDS,
  createArchitectureV2DiagnosticMatrixPlan,
  createArchitectureV2DiagnosticRunCsv,
  createArchitectureV2DiagnosticStrategySummaryCsv,
  createArchitectureV2DiagnosticSummary,
} from "../../experiments/runArchitectureV2DiagnosticMatrix";

import type {
  ArchitectureV2DiagnosticRunRecord,
} from "../../experiments/runArchitectureV2DiagnosticMatrix";

const TEST_PROVENANCE = {
  softwareVersion:
    "1.0.0",

  gitCommit:
    "abcdef1234567890abcdef1234567890abcdef12",
};

function strategyIndex(
  strategyId:
    RoutingStrategyId,
): number {
  return ARCHITECTURE_V2_FORMAL_STRATEGY_IDS
    .indexOf(
      strategyId,
    );
}

function createSyntheticRecords():
  readonly ArchitectureV2DiagnosticRunRecord[] {
  const plan =
    createArchitectureV2DiagnosticMatrixPlan();

  const records:
    ArchitectureV2DiagnosticRunRecord[] =
  [];

  for (
    const request of
      plan
  ) {
    for (
      const strategyId of
        ARCHITECTURE_V2_FORMAL_STRATEGY_IDS
    ) {
      const rawIndex =
        strategyIndex(
          strategyId,
        );

      /**
       * D0 deliberately makes Adaptive Hybrid identical
       * to Hazard-Aware.
       *
       * D1-D4 deliberately make them different.
       */
      const effectiveIndex =
        strategyId ===
          "ADAPTIVE_HYBRID" &&
        request.conditionId ===
          "D0_BASELINE"
          ? strategyIndex(
              "HAZARD_AWARE",
            )
          : rawIndex;

      const seedOffset =
        request.replicationSeed -
        ARCHITECTURE_V2_DIAGNOSTIC_SEEDS[0];

      const conditionOffset =
        ARCHITECTURE_V2_FORMAL_CONDITION_IDS
          .indexOf(
            request.conditionId,
          ) *
        10;

      const base =
        40 +
        seedOffset +
        conditionOffset +
        effectiveIndex;

      records.push({
        diagnosticVersion:
          ARCHITECTURE_V2_DIAGNOSTIC_MATRIX_VERSION,

        runId:
          `${request.pairKey}__${strategyId}`,

        pairKey:
          request.pairKey,

        softwareVersion:
          TEST_PROVENANCE
            .softwareVersion,

        gitCommit:
          TEST_PROVENANCE
            .gitCommit,

        parameterSetVersion:
          ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,

        speedAssignmentVersion:
          ARCHITECTURE_V2_FORMAL_SPEED_ASSIGNMENT_VERSION,

        scenarioId:
          `${request.pairKey}__scenario`,

        populationLevel:
          "MEDIUM",

        population:
          42,

        conditionId:
          request.conditionId,

        replicationSeed:
          request.replicationSeed,

        strategyId,

        runStatus:
          "COMPLETED",

        terminationReason:
          "ALL_RESOLVED",

        appliedDisruptionCount:
          request.conditionId ===
            "D0_BASELINE"
            ? 0
            : 1,

        totalEvacuationTimeSeconds:
          base,

        meanEvacuationTimeSeconds:
          base /
          2,

        p95EvacuationTimeSeconds:
          base -
          2,

        populationHazardExposurePersonSeconds:
          base *
          3,

        maximumLocalDensityPersonsPerSquareMeter:
          2 +
          effectiveIndex *
          0.1,

        populationQueueWaitPersonSeconds:
          base *
          2,

        meanQueueWaitSeconds:
          2 +
          effectiveIndex *
          0.1,

        maximumQueueWaitSeconds:
          5 +
          effectiveIndex,

        completionRate:
          1,

        unreachableAgents:
          0,

        timeoutAgents:
          0,

        meanTravelDistanceMeters:
          20 +
          effectiveIndex,

        totalReroutes:
          effectiveIndex,

        totalAcceptedReroutes:
          effectiveIndex,

        totalExitTargetChanges:
          effectiveIndex,

        totalRouteReversalEvents:
          effectiveIndex,

        exitUtilization:
          [],
      });
    }
  }

  return records;
}

describe(
  "Architecture V2 diagnostic matrix",
  () => {
    it(
      "creates exactly 25 diagnostic scenario pairs and keeps diagnostic seeds outside the formal seed bank",
      () => {
        const plan =
          createArchitectureV2DiagnosticMatrixPlan();

        expect(
          plan,
        ).toHaveLength(
          25,
        );

        expect(
          new Set(
            plan.map(
              (
                request,
              ) =>
                request.pairKey,
            ),
          ).size,
        ).toBe(
          25,
        );

        expect(
          new Set(
            plan.map(
              (
                request,
              ) =>
                request.conditionId,
            ),
          ).size,
        ).toBe(
          5,
        );

        expect(
          new Set(
            plan.map(
              (
                request,
              ) =>
                request.replicationSeed,
            ),
          ).size,
        ).toBe(
          5,
        );

        for (
          const seed of
            ARCHITECTURE_V2_DIAGNOSTIC_SEEDS
        ) {
          expect(
            ARCHITECTURE_V2_FORMAL_INITIAL_SEED_BANK
              .includes(
                seed,
              ),
          ).toBe(
            false,
          );
        }
      },
    );

    it(
      "summarizes 125 synthetic runs into 25 condition-strategy aggregates",
      () => {
        const records =
          createSyntheticRecords();

        expect(
          records,
        ).toHaveLength(
          125,
        );

        const summary =
          createArchitectureV2DiagnosticSummary(
            records,
            TEST_PROVENANCE,
          );

        expect(
          summary.totalPairs,
        ).toBe(
          25,
        );

        expect(
          summary.totalRuns,
        ).toBe(
          125,
        );

        expect(
          summary.completedRunCount,
        ).toBe(
          125,
        );

        expect(
          summary.strategyAggregates,
        ).toHaveLength(
          25,
        );

        for (
          const aggregate of
            summary.strategyAggregates
        ) {
          expect(
            aggregate.sampleCount,
          ).toBe(
            5,
          );

          expect(
            aggregate.completedCount,
          ).toBe(
            5,
          );
        }
      },
    );

    it(
      "detects Adaptive Hybrid versus Hazard-Aware equality and divergence by condition",
      () => {
        const summary =
          createArchitectureV2DiagnosticSummary(
            createSyntheticRecords(),
            TEST_PROVENANCE,
          );

        const d0 =
          summary.adaptiveVsHazardByCondition
            .find(
              (
                comparison,
              ) =>
                comparison.conditionId ===
                "D0_BASELINE",
            );

        expect(
          d0,
        ).toBeDefined();

        expect(
          d0?.identicalMeasuredOutcomeReplications,
        ).toBe(
          5,
        );

        expect(
          d0?.differingMeasuredOutcomeReplications,
        ).toBe(
          0,
        );

        expect(
          d0?.allMeasuredOutcomesIdentical,
        ).toBe(
          true,
        );

        for (
          const conditionId of
            [
              "D1_HAZARD",
              "D2_EXIT_BLOCK",
              "D3_CORRIDOR_BLOCK",
              "D4_COMBINED",
            ] as const
        ) {
          const comparison =
            summary.adaptiveVsHazardByCondition
              .find(
                (
                  candidate,
                ) =>
                  candidate.conditionId ===
                  conditionId,
              );

          expect(
            comparison,
          ).toBeDefined();

          expect(
            comparison?.identicalMeasuredOutcomeReplications,
          ).toBe(
            0,
          );

          expect(
            comparison?.differingMeasuredOutcomeReplications,
          ).toBe(
            5,
          );

          expect(
            comparison?.allMeasuredOutcomesIdentical,
          ).toBe(
            false,
          );
        }
      },
    );

    it(
      "creates one combined run CSV and one 25-row strategy summary CSV",
      () => {
        const records =
          createSyntheticRecords();

        const summary =
          createArchitectureV2DiagnosticSummary(
            records,
            TEST_PROVENANCE,
          );

        const runLines =
          createArchitectureV2DiagnosticRunCsv(
            records,
          )
            .split(
              "\n",
            );

        const summaryLines =
          createArchitectureV2DiagnosticStrategySummaryCsv(
            summary,
          )
            .split(
              "\n",
            );

        expect(
          runLines,
        ).toHaveLength(
          126,
        );

        expect(
          summaryLines,
        ).toHaveLength(
          26,
        );

        expect(
          runLines[0],
        ).toContain(
          "populationHazardExposurePersonSeconds",
        );

        expect(
          summaryLines[0],
        ).toContain(
          "meanRouteReversalEvents",
        );
      },
    );
  },
);