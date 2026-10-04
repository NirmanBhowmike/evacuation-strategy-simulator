import {
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import {
  ARCHITECTURE_V2_FORMAL_FIRST_REPLICATION_SEED,
  ARCHITECTURE_V2_FORMAL_STRATEGY_IDS,
} from "../../src/experiment/architectureV2FormalExperimentDesign";

import {
  executeArchitectureV2FormalPair,
} from "../../src/experiment/architectureV2FormalExperimentExecutor";

import type {
  ArchitectureV2FormalRunResult,
} from "../../src/experiment/architectureV2FormalExperimentRunner";

import {
  ARCHITECTURE_V2_FORMAL_OUTPUT_SCHEMA_VERSION,
  createArchitectureV2FormalOutputRecord,
  createArchitectureV2FormalOutputRecords,
} from "../../src/experiment/architectureV2FormalOutput";

import type {
  ArchitectureV2FormalOutputRecord,
  ArchitectureV2FormalSoftwareProvenance,
} from "../../src/experiment/architectureV2FormalOutput";

const TEST_PROVENANCE:
  ArchitectureV2FormalSoftwareProvenance = {
  softwareVersion:
    "1.0.0",

  gitCommit:
    "test-formal-commit-abcdef1234567890",
};

let formalResults:
  readonly ArchitectureV2FormalRunResult[] =
[];

let outputRecords:
  readonly ArchitectureV2FormalOutputRecord[] =
[];

beforeAll(
  () => {
    const summary =
      executeArchitectureV2FormalPair({
        populationLevel:
          "MEDIUM",

        conditionId:
          "D0_BASELINE",

        replicationSeed:
          ARCHITECTURE_V2_FORMAL_FIRST_REPLICATION_SEED,
      });

    formalResults =
      summary.results;

    outputRecords =
      createArchitectureV2FormalOutputRecords(
        formalResults,
        TEST_PROVENANCE,
      );
  },
);

describe(
  "Architecture V2 formal output schema",
  () => {
    it(
      "creates exactly one normalized output record for each of the five paired strategy runs",
      () => {
        expect(
          formalResults,
        ).toHaveLength(
          5,
        );

        expect(
          outputRecords,
        ).toHaveLength(
          5,
        );

        expect(
          outputRecords.map(
            (
              record,
            ) =>
              record.strategyId,
          ),
        ).toEqual(
          [
            ...ARCHITECTURE_V2_FORMAL_STRATEGY_IDS,
          ],
        );

        expect(
          outputRecords.map(
            (
              record,
            ) =>
              record.runId,
          ),
        ).toEqual(
          formalResults.map(
            (
              result,
            ) =>
              result.runId,
          ),
        );
      },
    );

    it(
      "preserves the common-random-number pairing and software provenance across all five records",
      () => {
        expect(
          new Set(
            outputRecords.map(
              (
                record,
              ) =>
                record.pairKey,
            ),
          ).size,
        ).toBe(
          1,
        );

        expect(
          new Set(
            outputRecords.map(
              (
                record,
              ) =>
                record.scenarioId,
            ),
          ).size,
        ).toBe(
          1,
        );

        expect(
          new Set(
            outputRecords.map(
              (
                record,
              ) =>
                record.replicationSeed,
            ),
          ),
        ).toEqual(
          new Set([
            ARCHITECTURE_V2_FORMAL_FIRST_REPLICATION_SEED,
          ]),
        );

        expect(
          new Set(
            outputRecords.map(
              (
                record,
              ) =>
                record.populationLevel,
            ),
          ),
        ).toEqual(
          new Set([
            "MEDIUM",
          ]),
        );

        expect(
          new Set(
            outputRecords.map(
              (
                record,
              ) =>
                record.conditionId,
            ),
          ),
        ).toEqual(
          new Set([
            "D0_BASELINE",
          ]),
        );

        expect(
          new Set(
            outputRecords.map(
              (
                record,
              ) =>
                record.softwareVersion,
            ),
          ),
        ).toEqual(
          new Set([
            TEST_PROVENANCE
              .softwareVersion,
          ]),
        );

        expect(
          new Set(
            outputRecords.map(
              (
                record,
              ) =>
                record.gitCommit,
            ),
          ),
        ).toEqual(
          new Set([
            TEST_PROVENANCE
              .gitCommit,
          ]),
        );
      },
    );

    it(
      "copies authoritative research metrics without recomputing or altering them",
      () => {
        for (
          let index =
            0;
          index <
            formalResults.length;
          index +=
            1
        ) {
          const result =
            formalResults[index]!;

          const record =
            outputRecords[index]!;

          expect(
            record.totalEvacuationTimeSeconds,
          ).toBe(
            result.metrics
              .totalEvacuationTimeSeconds,
          );

          expect(
            record.meanEvacuationTimeSeconds,
          ).toBe(
            result.metrics
              .meanEvacuationTimeSeconds,
          );

          expect(
            record.p95EvacuationTimeSeconds,
          ).toBe(
            result.metrics
              .p95EvacuationTimeSeconds,
          );

          expect(
            record.populationHazardExposurePersonSeconds,
          ).toBe(
            result.metrics
              .populationHazardExposurePersonSeconds,
          );

          expect(
            record.maximumLocalDensityPersonsPerSquareMeter,
          ).toBe(
            result.metrics
              .maximumLocalDensityPersonsPerSquareMeter,
          );

          expect(
            record.populationQueueWaitPersonSeconds,
          ).toBe(
            result.metrics
              .populationQueueWaitPersonSeconds,
          );

          expect(
            record.meanQueueWaitSeconds,
          ).toBe(
            result.metrics
              .meanQueueWaitSeconds,
          );

          expect(
            record.maximumQueueWaitSeconds,
          ).toBe(
            result.metrics
              .maximumQueueWaitSeconds,
          );

          expect(
            record.completionRate,
          ).toBe(
            result.metrics
              .completionRate,
          );

          expect(
            record.unreachableAgents,
          ).toBe(
            result.metrics
              .unreachableAgents,
          );

          expect(
            record.timeoutAgents,
          ).toBe(
            result.metrics
              .timeoutAgents,
          );

          expect(
            record.totalReroutes,
          ).toBe(
            result.metrics
              .totalReroutes,
          );

          expect(
            record.totalAcceptedReroutes,
          ).toBe(
            result.metrics
              .totalAcceptedReroutes,
          );

          expect(
            record.totalExitTargetChanges,
          ).toBe(
            result.metrics
              .totalExitTargetChanges,
          );

          expect(
            record.totalRouteReversalEvents,
          ).toBe(
            result.metrics
              .totalRouteReversalEvents,
          );

          expect(
            record.exitUtilization,
          ).toEqual(
            result.metrics
              .exitUtilization,
          );
        }
      },
    );

    it(
      "records the frozen output-schema version and complete execution identity",
      () => {
        for (
          let index =
            0;
          index <
            outputRecords.length;
          index +=
            1
        ) {
          const record =
            outputRecords[index]!;

          const result =
            formalResults[index]!;

          expect(
            record.outputSchemaVersion,
          ).toBe(
            ARCHITECTURE_V2_FORMAL_OUTPUT_SCHEMA_VERSION,
          );

          expect(
            record.runId,
          ).toBe(
            result.runId,
          );

          expect(
            record.cellId,
          ).toBe(
            result.cellId,
          );

          expect(
            record.designVersion,
          ).toBe(
            result.designVersion,
          );

          expect(
            record.seedBankVersion,
          ).toBe(
            result.seedBankVersion,
          );

          expect(
            record.parameterSetVersion,
          ).toBe(
            result.parameterSetVersion,
          );

          expect(
            record.runStatus,
          ).toBe(
            result.runStatus,
          );

          expect(
            record.terminationReason,
          ).toBe(
            result.terminationReason,
          );

          expect(
            record.simulatedTimeSeconds,
          ).toBe(
            result.simulatedTimeSeconds,
          );

          expect(
            record.ticks,
          ).toBe(
            result.ticks,
          );

          expect(
            record.appliedDisruptionCount,
          ).toBe(
            result.appliedDisruptionCount,
          );
        }
      },
    );

    it(
      "rejects missing software-version or Git-commit provenance",
      () => {
        const result =
          formalResults[0];

        if (!result) {
          throw new Error(
            "Expected at least one formal test result.",
          );
        }

        expect(
          () =>
            createArchitectureV2FormalOutputRecord(
              result,
              {
                softwareVersion:
                  " ",

                gitCommit:
                  TEST_PROVENANCE
                    .gitCommit,
              },
            ),
        ).toThrow(
          /software version must be non-empty/i,
        );

        expect(
          () =>
            createArchitectureV2FormalOutputRecord(
              result,
              {
                softwareVersion:
                  TEST_PROVENANCE
                    .softwareVersion,

                gitCommit:
                  " ",
              },
            ),
        ).toThrow(
          /Git commit must be non-empty/i,
        );
      },
    );

    it(
      "rejects empty output collections and duplicate formal run identifiers",
      () => {
        expect(
          () =>
            createArchitectureV2FormalOutputRecords(
              [],
              TEST_PROVENANCE,
            ),
        ).toThrow(
          /requires at least one simulation result/i,
        );

        const first =
          formalResults[0];

        if (!first) {
          throw new Error(
            "Expected at least one formal test result.",
          );
        }

        expect(
          () =>
            createArchitectureV2FormalOutputRecords(
              [
                first,
                first,
              ],
              TEST_PROVENANCE,
            ),
        ).toThrow(
          /duplicate run identifiers/i,
        );
      },
    );
  },
);