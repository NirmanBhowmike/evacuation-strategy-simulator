import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createExperimentArtifacts,
} from "../../src/core/createExperimentArtifacts";

import type {
  BatchExperimentConfiguration,
  BatchExperimentResult,
} from "../../src/types/batchExperiment";
import type {
  ExperimentArtifactConfiguration,
} from "../../src/types/experimentArtifacts";

function createBatchConfiguration():
  BatchExperimentConfiguration {
  return {
    batchId:
      "batch-artifacts-001",

    scenarios: [
      {
        id:
          "scenario-001",

        seed:
          1042,

        layoutId:
          "layout-test",

        parameterSetVersion:
          "parameters-v1",

        occupants: [],

        disruptionSchedule: [],
      },
    ],

    strategyIds: [
      "STATIC_SHORTEST_PATH",
      "ADAPTIVE_HYBRID",
    ],

    environment: {
      layoutId:
        "layout-test",

      widthMeters:
        20,

      heightMeters:
        10,

      zones: [],
    },

    graph: {
      layoutId:
        "layout-test",

      nodes: [],

      edges: [],
    },

    exits: {
      layoutId:
        "layout-test",

      exits: [],
    },

    spawnZones: {
      layoutId:
        "layout-test",

      zones: [],
    },

    simulationConfiguration: {
      timestepSeconds:
        0.05,

      maximumSimulationTimeSeconds:
        300,

      densityCellLengthMeters:
        1,

      adaptiveRerouteThreshold:
        0.20,
    },
  };
}

function createBatchResult():
  BatchExperimentResult {
  return {
    batchId:
      "batch-artifacts-001",

    totalScenarios:
      1,

    totalStrategies:
      2,

    totalRuns:
      2,

    scenarioIds: [
      "scenario-001",
    ],

    parameterSetIds: [
      "parameters-v1",
    ],

    strategyIds: [
      "STATIC_SHORTEST_PATH",
      "ADAPTIVE_HYBRID",
    ],

    runs: [
      {
        runId:
          "scenario-001__STATIC_SHORTEST_PATH",

        pairKey:
          "scenario-001",

        scenarioId:
          "scenario-001",

        parameterSetId:
          "parameters-v1",

        seed:
          1042,

        strategyId:
          "STATIC_SHORTEST_PATH",

        result: {
          scenarioId:
            "scenario-001",

          parameterSetId:
            "parameters-v1",

          seed:
            1042,

          layoutId:
            "layout-test",

          strategyId:
            "STATIC_SHORTEST_PATH",

          timestepSeconds:
            0.05,

          simulatedTimeSeconds:
            12,

          ticks:
            240,

          termination: {
            isTerminated:
              true,

            reason:
              "ALL_RESOLVED",

            totalAgents:
              10,

            activeAgents:
              0,

            evacuatedAgents:
              10,

            unreachableAgents:
              0,

            timeoutAgents:
              0,
          },

          metrics: {
            totalAgents:
              10,

            evacuatedAgents:
              10,

            unreachableAgents:
              0,

            timeoutAgents:
              0,

            activeAgents:
              0,

            completionRate:
              1,

            totalEvacuationTimeSeconds:
              12,

            latestEvacuationTimeSeconds:
              12,

            meanEvacuationTimeSeconds:
              8,

            p95EvacuationTimeSeconds:
              11,

            populationHazardExposurePersonSeconds:
              5,

            meanHazardExposureSeconds:
              0.5,

            meanTravelDistanceMeters:
              20,

            totalReroutes:
              0,

            meanReroutesPerAgent:
              0,

            fractionRerouted:
              0,

            maximumLocalDensityPersonsPerSquareMeter:
              2,

            exitUtilization: [
              {
                exitId:
                  "exit-a",

                evacuatedAgents:
                  10,

                fractionOfEvacuatedAgents:
                  1,
              },
            ],
          },

          queueMetrics: {
            populationQueueWaitPersonSeconds:
              4,

            meanQueueWaitSeconds:
              0.4,

            maximumQueueWaitSeconds:
              1,
          },

          appliedDisruptions: [],

          decisionTrace: [],

          routeStability: {
            totalAcceptedReroutes:
              0,

            totalExitTargetChanges:
              0,

            totalRouteReversalEvents:
              0,

            agentsWithAcceptedReroutes:
              0,

            byAgent: [],
          },

          finalAgents: [],
        },
      },

      {
        runId:
          "scenario-001__ADAPTIVE_HYBRID",

        pairKey:
          "scenario-001",

        scenarioId:
          "scenario-001",

        parameterSetId:
          "parameters-v1",

        seed:
          1042,

        strategyId:
          "ADAPTIVE_HYBRID",

        result: {
          scenarioId:
            "scenario-001",

          parameterSetId:
            "parameters-v1",

          seed:
            1042,

          layoutId:
            "layout-test",

          strategyId:
            "ADAPTIVE_HYBRID",

          timestepSeconds:
            0.05,

          simulatedTimeSeconds:
            10,

          ticks:
            200,

          termination: {
            isTerminated:
              true,

            reason:
              "ALL_RESOLVED",

            totalAgents:
              10,

            activeAgents:
              0,

            evacuatedAgents:
              10,

            unreachableAgents:
              0,

            timeoutAgents:
              0,
          },

          metrics: {
            totalAgents:
              10,

            evacuatedAgents:
              10,

            unreachableAgents:
              0,

            timeoutAgents:
              0,

            activeAgents:
              0,

            completionRate:
              1,

            totalEvacuationTimeSeconds:
              10,

            latestEvacuationTimeSeconds:
              10,

            meanEvacuationTimeSeconds:
              7,

            p95EvacuationTimeSeconds:
              9,

            populationHazardExposurePersonSeconds:
              2,

            meanHazardExposureSeconds:
              0.2,

            meanTravelDistanceMeters:
              22,

            totalReroutes:
              3,

            meanReroutesPerAgent:
              0.3,

            fractionRerouted:
              0.3,

            maximumLocalDensityPersonsPerSquareMeter:
              1.5,

            exitUtilization: [
              {
                exitId:
                  "exit-a",

                evacuatedAgents:
                  6,

                fractionOfEvacuatedAgents:
                  0.6,
              },

              {
                exitId:
                  "exit-b",

                evacuatedAgents:
                  4,

                fractionOfEvacuatedAgents:
                  0.4,
              },
            ],
          },

          queueMetrics: {
            populationQueueWaitPersonSeconds:
              1,

            meanQueueWaitSeconds:
              0.1,

            maximumQueueWaitSeconds:
              0.4,
          },

          appliedDisruptions: [],

          decisionTrace: [],

          routeStability: {
            totalAcceptedReroutes:
              3,

            totalExitTargetChanges:
              2,

            totalRouteReversalEvents:
              1,

            agentsWithAcceptedReroutes:
              3,

            byAgent: [],
          },

          finalAgents: [],
        },
      },
    ],
  };
}

function createArtifactConfiguration():
  ExperimentArtifactConfiguration {
  return {
    experimentType:
      "DEV",

    researchQuestion:
      "How do evacuation routing strategies respond to changing building conditions?",

    software: {
      softwareVersion:
        "1.0.0",

      gitCommit:
        "abc123def456",
    },

    outputDirectory:
      "results/dev/batch-artifacts-001",

    scenarioMetadata: [
      {
        scenarioId:
          "scenario-001",

        scenarioFamily:
          "D0",

        occupancyCondition:
          "LOW",

        disruptionCondition:
          "NORMAL",
      },
    ],

    computationTimeMillisecondsByRunId: {
      "scenario-001__STATIC_SHORTEST_PATH":
        100,

      "scenario-001__ADAPTIVE_HYBRID":
        125,
    },
  };
}

describe(
  "Experiment artifact generation",
  () => {
    it("records software version and Git commit for every run", () => {
      const artifacts =
        createExperimentArtifacts(
          createBatchConfiguration(),
          createBatchResult(),
          createArtifactConfiguration(),
        );

      for (
        const record of
          artifacts.registryRecords
      ) {
        expect(
          record.softwareVersion,
        ).toBe(
          "1.0.0",
        );

        expect(
          record.softwareCommit,
        ).toBe(
          "abc123def456",
        );
      }
    });

    it("creates experiment-registry records using the documented research fields", () => {
      const artifacts =
        createExperimentArtifacts(
          createBatchConfiguration(),
          createBatchResult(),
          createArtifactConfiguration(),
        );

      const record =
        artifacts
          .registryRecords[0]!;

      expect(
        record.experimentType,
      ).toBe(
        "DEV",
      );

      expect(
        record.scenarioInstanceId,
      ).toBe(
        "scenario-001",
      );

      expect(
        record.seed,
      ).toBe(
        1042,
      );

      expect(
        record.scenarioFamily,
      ).toBe(
        "D0",
      );

      expect(
        record.occupancyCondition,
      ).toBe(
        "LOW",
      );

      expect(
        record.disruptionCondition,
      ).toBe(
        "NORMAL",
      );

      expect(
        record.parameterSetVersion,
      ).toBe(
        "parameters-v1",
      );
    });

    it("records the adaptive threshold only for Adaptive Hybrid", () => {
      const artifacts =
        createExperimentArtifacts(
          createBatchConfiguration(),
          createBatchResult(),
          createArtifactConfiguration(),
        );

      const staticRecord =
        artifacts.registryRecords.find(
          (record) =>
            record.strategy ===
            "STATIC_SHORTEST_PATH",
        )!;

      const adaptiveRecord =
        artifacts.registryRecords.find(
          (record) =>
            record.strategy ===
            "ADAPTIVE_HYBRID",
        )!;

      expect(
        staticRecord
          .adaptiveThreshold,
      ).toBeNull();

      expect(
        adaptiveRecord
          .adaptiveThreshold,
      ).toBeCloseTo(
        0.20,
      );
    });

    it("exports a reproducibility JSON configuration", () => {
      const artifacts =
        createExperimentArtifacts(
          createBatchConfiguration(),
          createBatchResult(),
          createArtifactConfiguration(),
        );

      const parsed =
        JSON.parse(
          artifacts
            .configurationJson,
        ) as {
          batchId: string;
          software: {
            gitCommit: string;
          };
          scenarios:
            Array<{
              id: string;
              seed: number;
            }>;
        };

      expect(
        parsed.batchId,
      ).toBe(
        "batch-artifacts-001",
      );

      expect(
        parsed.software
          .gitCommit,
      ).toBe(
        "abc123def456",
      );

      expect(
        parsed.scenarios[0]
          ?.id,
      ).toBe(
        "scenario-001",
      );

      expect(
        parsed.scenarios[0]
          ?.seed,
      ).toBe(
        1042,
      );
    });

    it("exports an analysis-ready CSV with one row per run", () => {
      const artifacts =
        createExperimentArtifacts(
          createBatchConfiguration(),
          createBatchResult(),
          createArtifactConfiguration(),
        );

      const lines =
        artifacts.resultsCsv
          .split("\n");

      expect(
        lines,
      ).toHaveLength(3);

      expect(
        lines[0],
      ).toContain(
        "experimentId",
      );

      expect(
        lines[0],
      ).toContain(
        "softwareCommit",
      );

      expect(
        lines[0],
      ).toContain(
        "routeReversalCount",
      );

      expect(
        artifacts.resultsCsv,
      ).toContain(
        "STATIC_SHORTEST_PATH",
      );

      expect(
        artifacts.resultsCsv,
      ).toContain(
        "ADAPTIVE_HYBRID",
      );
    });

    it("escapes structured exit-utilization data correctly in CSV", () => {
      const artifacts =
        createExperimentArtifacts(
          createBatchConfiguration(),
          createBatchResult(),
          createArtifactConfiguration(),
        );

      expect(
        artifacts.resultsCsv,
      ).toContain(
        "\"[{\"\"exitId\"\"",
      );
    });

    it("automatically aggregates metrics by strategy", () => {
      const artifacts =
        createExperimentArtifacts(
          createBatchConfiguration(),
          createBatchResult(),
          createArtifactConfiguration(),
        );

      expect(
        artifacts
          .aggregateByStrategy,
      ).toHaveLength(2);

      const adaptive =
        artifacts
          .aggregateByStrategy
          .find(
            (aggregate) =>
              aggregate.strategyId ===
              "ADAPTIVE_HYBRID",
          )!;

      expect(
        adaptive.runCount,
      ).toBe(1);

      expect(
        adaptive
          .meanTotalEvacuationTimeSeconds,
      ).toBe(10);

      expect(
        adaptive
          .meanHazardExposurePersonSeconds,
      ).toBe(2);

      expect(
        adaptive
          .meanQueueExposurePersonSeconds,
      ).toBe(1);

      expect(
        adaptive
          .meanRouteReversalEvents,
      ).toBe(1);
    });

    it("records run status from simulation outcomes", () => {
      const result =
        createBatchResult();

      const modifiedResult:
        BatchExperimentResult = {
        ...result,

        runs:
          result.runs.map(
            (
              run,
              index,
            ) => {
              if (
                index !== 0
              ) {
                return run;
              }

              return {
                ...run,

                result: {
                  ...run.result,

                  termination: {
                    ...run.result
                      .termination,

                    reason:
                      "TIMEOUT",

                    timeoutAgents:
                      1,
                  },

                  metrics: {
                    ...run.result
                      .metrics,

                    evacuatedAgents:
                      9,

                    timeoutAgents:
                      1,

                    completionRate:
                      0.9,

                    totalEvacuationTimeSeconds:
                      null,
                  },
                },
              };
            },
          ),
      };

      const artifacts =
        createExperimentArtifacts(
          createBatchConfiguration(),
          modifiedResult,
          createArtifactConfiguration(),
        );

      expect(
        artifacts
          .registryRecords[0]
          ?.runStatus,
      ).toBe(
        "TIMEOUT",
      );

      expect(
        artifacts
          .registryRecords[1]
          ?.runStatus,
      ).toBe(
        "COMPLETED",
      );
    });

    it("records optional computation-time metadata without making simulation results nondeterministic", () => {
      const artifacts =
        createExperimentArtifacts(
          createBatchConfiguration(),
          createBatchResult(),
          createArtifactConfiguration(),
        );

      expect(
        artifacts
          .registryRecords[0]
          ?.computationTimeMilliseconds,
      ).toBe(100);

      expect(
        artifacts
          .registryRecords[1]
          ?.computationTimeMilliseconds,
      ).toBe(125);
    });

    it("rejects incomplete provenance and scenario metadata", () => {
      const batchConfiguration =
        createBatchConfiguration();

      const batchResult =
        createBatchResult();

      const artifactConfiguration =
        createArtifactConfiguration();

      expect(() =>
        createExperimentArtifacts(
          batchConfiguration,
          batchResult,
          {
            ...artifactConfiguration,

            software: {
              ...artifactConfiguration
                .software,

              gitCommit:
                " ",
            },
          },
        ),
      ).toThrow(
        /Git commit must be non-empty/,
      );

      expect(() =>
        createExperimentArtifacts(
          batchConfiguration,
          batchResult,
          {
            ...artifactConfiguration,

            scenarioMetadata: [],
          },
        ),
      ).toThrow(
        /Missing experiment metadata/,
      );
    });
  },
);