import {
  describe,
  expect,
  it,
} from "vitest";

import {
  ARCHITECTURE_V2_FORMAL_ARTIFACT_SET_VERSION,
  ARCHITECTURE_V2_FORMAL_MANIFEST_JSON_FILENAME,
  ARCHITECTURE_V2_FORMAL_RECORDS_CSV_FILENAME,
  ARCHITECTURE_V2_FORMAL_RECORDS_JSON_FILENAME,
  createArchitectureV2FormalArtifacts,
} from "../../src/experiment/architectureV2FormalArtifacts";

import {
  ARCHITECTURE_V2_FORMAL_EXPERIMENT_DESIGN_VERSION,
  ARCHITECTURE_V2_FORMAL_SEED_BANK_VERSION,
} from "../../src/experiment/architectureV2FormalExperimentDesign";

import type {
  ArchitectureV2FormalExecutionSummary,
} from "../../src/experiment/architectureV2FormalExperimentExecutor";

import type {
  ArchitectureV2FormalRunResult,
} from "../../src/experiment/architectureV2FormalExperimentRunner";

import {
  ARCHITECTURE_V2_FORMAL_OUTPUT_SCHEMA_VERSION,
} from "../../src/experiment/architectureV2FormalOutput";

import {
  ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,
} from "../../src/scenario/architectureV2ResearchParameterSet";

import type {
  RoutingStrategyId,
} from "../../src/types/routingStrategy";

const TEST_SOFTWARE_VERSION =
  "1.0.0";

const TEST_GIT_COMMIT =
  "abcdef1234567890abcdef1234567890abcdef12";

function createSyntheticFormalRun(
  strategyId:
    RoutingStrategyId,

  runId:
    string,

  cellId:
    string,
): ArchitectureV2FormalRunResult {
  const scenarioId =
    "layout-a-v2-medium-d0-baseline-seed-100001";

  const pairKey =
    "architecture-v2__scenario__medium__d0-baseline__seed-100001";

  return {
    runId,

    pairKey,

    cellId,

    designVersion:
      ARCHITECTURE_V2_FORMAL_EXPERIMENT_DESIGN_VERSION,

    seedBankVersion:
      ARCHITECTURE_V2_FORMAL_SEED_BANK_VERSION,

    parameterSetVersion:
      ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,

    scenarioId,

    replicationSeed:
      100001,

    populationLevel:
      "MEDIUM",

    population:
      42,

    conditionId:
      "D0_BASELINE",

    strategyId,

    runStatus:
      "COMPLETED",

    terminationReason:
      "ALL_RESOLVED",

    simulatedTimeSeconds:
      40,

    ticks:
      800,

    appliedDisruptionCount:
      0,

    metrics: {
      totalEvacuationTimeSeconds:
        40,

      meanEvacuationTimeSeconds:
        24.5,

      p95EvacuationTimeSeconds:
        38,

      completionRate:
        1,

      evacuatedAgents:
        42,

      unreachableAgents:
        0,

      timeoutAgents:
        0,

      populationHazardExposurePersonSeconds:
        0,

      meanHazardExposureSeconds:
        0,

      maximumLocalDensityPersonsPerSquareMeter:
        1.75,

      populationQueueWaitPersonSeconds:
        92.5,

      meanQueueWaitSeconds:
        2.2,

      maximumQueueWaitSeconds:
        8.4,

      meanTravelDistanceMeters:
        28.3,

      totalReroutes:
        strategyId ===
        "ADAPTIVE_HYBRID"
          ? 2
          : 0,

      meanReroutesPerAgent:
        strategyId ===
        "ADAPTIVE_HYBRID"
          ? 2 / 42
          : 0,

      fractionRerouted:
        strategyId ===
        "ADAPTIVE_HYBRID"
          ? 2 / 42
          : 0,

      totalAcceptedReroutes:
        strategyId ===
        "ADAPTIVE_HYBRID"
          ? 2
          : 0,

      totalExitTargetChanges:
        strategyId ===
        "ADAPTIVE_HYBRID"
          ? 1
          : 0,

      totalRouteReversalEvents:
        0,

      exitUtilization: [
        {
          exitId:
            "exit-west",

          evacuatedAgents:
            14,

          fractionOfEvacuatedAgents:
            14 / 42,
        },

        {
          exitId:
            "exit-south-central",

          evacuatedAgents:
            10,

          fractionOfEvacuatedAgents:
            10 / 42,
        },

        {
          exitId:
            "exit-east",

          evacuatedAgents:
            12,

          fractionOfEvacuatedAgents:
            12 / 42,
        },

        {
          exitId:
            "exit-southeast",

          evacuatedAgents:
            6,

          fractionOfEvacuatedAgents:
            6 / 42,
        },
      ],
    },

    simulation: {
      scenarioId,

      parameterSetId:
        ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,

      seed:
        100001,

      layoutId:
        "layout-a-architecture-v2",

      strategyId,

      timestepSeconds:
        0.05,

      simulatedTimeSeconds:
        40,

      ticks:
        800,

      termination: {
        isTerminated:
          true,

        reason:
          "ALL_RESOLVED",

        totalAgents:
          42,

        activeAgents:
          0,

        evacuatedAgents:
          42,

        unreachableAgents:
          0,

        timeoutAgents:
          0,
      },

      metrics: {
        totalAgents:
          42,

        evacuatedAgents:
          42,

        unreachableAgents:
          0,

        timeoutAgents:
          0,

        activeAgents:
          0,

        completionRate:
          1,

        totalEvacuationTimeSeconds:
          40,

        latestEvacuationTimeSeconds:
          40,

        meanEvacuationTimeSeconds:
          24.5,

        p95EvacuationTimeSeconds:
          38,

        populationHazardExposurePersonSeconds:
          0,

        meanHazardExposureSeconds:
          0,

        meanTravelDistanceMeters:
          28.3,

        totalReroutes:
          strategyId ===
          "ADAPTIVE_HYBRID"
            ? 2
            : 0,

        meanReroutesPerAgent:
          strategyId ===
          "ADAPTIVE_HYBRID"
            ? 2 / 42
            : 0,

        fractionRerouted:
          strategyId ===
          "ADAPTIVE_HYBRID"
            ? 2 / 42
            : 0,

        maximumLocalDensityPersonsPerSquareMeter:
          1.75,

        exitUtilization: [
          {
            exitId:
              "exit-west",

            evacuatedAgents:
              14,

            fractionOfEvacuatedAgents:
              14 / 42,
          },

          {
            exitId:
              "exit-south-central",

            evacuatedAgents:
              10,

            fractionOfEvacuatedAgents:
              10 / 42,
          },

          {
            exitId:
              "exit-east",

            evacuatedAgents:
              12,

            fractionOfEvacuatedAgents:
              12 / 42,
          },

          {
            exitId:
              "exit-southeast",

            evacuatedAgents:
              6,

            fractionOfEvacuatedAgents:
              6 / 42,
          },
        ],
      },

      queueMetrics: {
        populationQueueWaitPersonSeconds:
          92.5,

        meanQueueWaitSeconds:
          2.2,

        maximumQueueWaitSeconds:
          8.4,
      },

      appliedDisruptions:
        [],

      decisionTrace:
        [],

      routeStability: {
        totalAcceptedReroutes:
          strategyId ===
          "ADAPTIVE_HYBRID"
            ? 2
            : 0,

        totalExitTargetChanges:
          strategyId ===
          "ADAPTIVE_HYBRID"
            ? 1
            : 0,

        totalRouteReversalEvents:
          0,

        agentsWithAcceptedReroutes:
          strategyId ===
          "ADAPTIVE_HYBRID"
            ? 2
            : 0,

        byAgent:
          [],
      },

      finalAgents:
        [],
    },
  };
}

function createSyntheticSummary():
  ArchitectureV2FormalExecutionSummary {
  const results = [
    createSyntheticFormalRun(
      "NEAREST_EXIT",
      "run-nearest",
      "cell-nearest",
    ),

    createSyntheticFormalRun(
      "ADAPTIVE_HYBRID",
      "run-adaptive",
      "cell-adaptive",
    ),
  ];

  return {
    scope:
      "PAIR",

    totalRuns:
      2,

    completedRuns:
      2,

    completedRunCount:
      2,

    unreachablePresentRunCount:
      0,

    timeoutRunCount:
      0,

    results,
  };
}

describe(
  "Architecture V2 formal artifact serialization",
  () => {
    it(
      "creates JSON, CSV, and manifest artifacts from formal output records",
      () => {
        const artifacts =
          createArchitectureV2FormalArtifacts(
            createSyntheticSummary(),
            {
              softwareVersion:
                TEST_SOFTWARE_VERSION,

              gitCommit:
                TEST_GIT_COMMIT,
            },
          );

        expect(
          artifacts.records,
        ).toHaveLength(
          2,
        );

        expect(
          artifacts.recordsJson.endsWith(
            "\n",
          ),
        ).toBe(
          true,
        );

        expect(
          artifacts.recordsCsv.endsWith(
            "\n",
          ),
        ).toBe(
          true,
        );

        expect(
          artifacts.manifestJson.endsWith(
            "\n",
          ),
        ).toBe(
          true,
        );

        const parsedRecords =
          JSON.parse(
            artifacts.recordsJson,
          );

        expect(
          parsedRecords,
        ).toEqual(
          artifacts.records,
        );

        const parsedManifest =
          JSON.parse(
            artifacts.manifestJson,
          );

        expect(
          parsedManifest,
        ).toEqual(
          artifacts.manifest,
        );
      },
    );

    it(
      "creates a reproducibility manifest with correct identity and run counts",
      () => {
        const artifacts =
          createArchitectureV2FormalArtifacts(
            createSyntheticSummary(),
            {
              softwareVersion:
                TEST_SOFTWARE_VERSION,

              gitCommit:
                TEST_GIT_COMMIT,
            },
          );

        expect(
          artifacts.manifest
            .artifactSetVersion,
        ).toBe(
          ARCHITECTURE_V2_FORMAL_ARTIFACT_SET_VERSION,
        );

        expect(
          artifacts.manifest
            .outputSchemaVersion,
        ).toBe(
          ARCHITECTURE_V2_FORMAL_OUTPUT_SCHEMA_VERSION,
        );

        expect(
          artifacts.manifest
            .executionScope,
        ).toBe(
          "PAIR",
        );

        expect(
          artifacts.manifest
            .softwareVersion,
        ).toBe(
          TEST_SOFTWARE_VERSION,
        );

        expect(
          artifacts.manifest
            .gitCommit,
        ).toBe(
          TEST_GIT_COMMIT,
        );

        expect(
          artifacts.manifest
            .designVersion,
        ).toBe(
          ARCHITECTURE_V2_FORMAL_EXPERIMENT_DESIGN_VERSION,
        );

        expect(
          artifacts.manifest
            .seedBankVersion,
        ).toBe(
          ARCHITECTURE_V2_FORMAL_SEED_BANK_VERSION,
        );

        expect(
          artifacts.manifest
            .parameterSetVersion,
        ).toBe(
          ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,
        );

        expect(
          artifacts.manifest
            .totalRuns,
        ).toBe(
          2,
        );

        expect(
          artifacts.manifest
            .completedRuns,
        ).toBe(
          2,
        );

        expect(
          artifacts.manifest
            .recordCount,
        ).toBe(
          2,
        );

        expect(
          artifacts.manifest
            .uniquePairCount,
        ).toBe(
          1,
        );

        expect(
          artifacts.manifest
            .uniqueScenarioCount,
        ).toBe(
          1,
        );

        expect(
          artifacts.manifest
            .uniqueCellCount,
        ).toBe(
          2,
        );

        expect(
          artifacts.manifest
            .completedRunCount,
        ).toBe(
          2,
        );

        expect(
          artifacts.manifest
            .unreachablePresentRunCount,
        ).toBe(
          0,
        );

        expect(
          artifacts.manifest
            .timeoutRunCount,
        ).toBe(
          0,
        );
      },
    );

    it(
      "records observed factors, replication seeds, and canonical artifact filenames",
      () => {
        const artifacts =
          createArchitectureV2FormalArtifacts(
            createSyntheticSummary(),
            {
              softwareVersion:
                TEST_SOFTWARE_VERSION,

              gitCommit:
                TEST_GIT_COMMIT,
            },
          );

        expect(
          artifacts.manifest
            .populationLevels,
        ).toEqual([
          "MEDIUM",
        ]);

        expect(
          artifacts.manifest
            .conditionIds,
        ).toEqual([
          "D0_BASELINE",
        ]);

        expect(
          artifacts.manifest
            .strategyIds,
        ).toEqual([
          "NEAREST_EXIT",
          "ADAPTIVE_HYBRID",
        ]);

        expect(
          artifacts.manifest
            .replicationSeeds,
        ).toEqual([
          100001,
        ]);

        expect(
          artifacts.manifest
            .files,
        ).toEqual({
          recordsJson:
            ARCHITECTURE_V2_FORMAL_RECORDS_JSON_FILENAME,

          recordsCsv:
            ARCHITECTURE_V2_FORMAL_RECORDS_CSV_FILENAME,

          manifestJson:
            ARCHITECTURE_V2_FORMAL_MANIFEST_JSON_FILENAME,
        });
      },
    );

    it(
      "creates an analysis-ready CSV with one header and one row per formal result",
      () => {
        const artifacts =
          createArchitectureV2FormalArtifacts(
            createSyntheticSummary(),
            {
              softwareVersion:
                TEST_SOFTWARE_VERSION,

              gitCommit:
                TEST_GIT_COMMIT,
            },
          );

        const lines =
          artifacts.recordsCsv
            .trimEnd()
            .split(
              "\n",
            );

        expect(
          lines,
        ).toHaveLength(
          3,
        );

        expect(
          lines[0],
        ).toContain(
          "runId",
        );

        expect(
          lines[0],
        ).toContain(
          "pairKey",
        );

        expect(
          lines[0],
        ).toContain(
          "totalEvacuationTimeSeconds",
        );

        expect(
          lines[0],
        ).toContain(
          "populationHazardExposurePersonSeconds",
        );

        expect(
          lines[0],
        ).toContain(
          "populationQueueWaitPersonSeconds",
        );

        expect(
          lines[0],
        ).toContain(
          "totalRouteReversalEvents",
        );

        expect(
          lines[1],
        ).toContain(
          "run-nearest",
        );

        expect(
          lines[2],
        ).toContain(
          "run-adaptive",
        );

        /**
         * exitUtilizationJson contains commas, so the CSV
         * serializer must quote that field.
         */
        expect(
          lines[1],
        ).toContain(
          "\"[{\"\"exitId\"\"",
        );
      },
    );

    it(
      "rejects incomplete or internally inconsistent execution summaries",
      () => {
        const base =
          createSyntheticSummary();

        expect(
          () =>
            createArchitectureV2FormalArtifacts(
              {
                ...base,

                completedRuns:
                  1,
              },
              {
                softwareVersion:
                  TEST_SOFTWARE_VERSION,

                gitCommit:
                  TEST_GIT_COMMIT,
              },
            ),
        ).toThrow(
          /incomplete/i,
        );

        expect(
          () =>
            createArchitectureV2FormalArtifacts(
              {
                ...base,

                totalRuns:
                  3,
              },
              {
                softwareVersion:
                  TEST_SOFTWARE_VERSION,

                gitCommit:
                  TEST_GIT_COMMIT,
              },
            ),
        ).toThrow(
          /totalRuns does not match/i,
        );

        expect(
          () =>
            createArchitectureV2FormalArtifacts(
              {
                ...base,

                completedRunCount:
                  1,
              },
              {
                softwareVersion:
                  TEST_SOFTWARE_VERSION,

                gitCommit:
                  TEST_GIT_COMMIT,
              },
            ),
        ).toThrow(
          /status counts do not match/i,
        );
      },
    );
  },
);