import {
  describe,
  expect,
  it,
} from "vitest";

import {
  ARCHITECTURE_V2_FORMAL_BATCH_EXECUTION_METADATA_VERSION,
  ARCHITECTURE_V2_FORMAL_BATCH_EXECUTION_METADATA_FILENAME,
  createArchitectureV2FormalBatchExecutionMetadata,
  getArchitectureV2FormalBatchSeeds,
  parseArchitectureV2FormalBatchCliArguments,
} from "../../experiments/runArchitectureV2FormalBatch";

const TEST_PROVENANCE = {
  softwareVersion:
    "1.0.0",

  gitCommit:
    "abcdef1234567890abcdef1234567890abcdef12",
};

describe(
  "Architecture V2 formal batch CLI",
  () => {
    it(
      "maps the four frozen batches to the correct ten-seed ranges",
      () => {
        expect(
          getArchitectureV2FormalBatchSeeds(
            1,
          ),
        ).toEqual([
          100001,
          100002,
          100003,
          100004,
          100005,
          100006,
          100007,
          100008,
          100009,
          100010,
        ]);

        expect(
          getArchitectureV2FormalBatchSeeds(
            4,
          ),
        ).toEqual([
          100031,
          100032,
          100033,
          100034,
          100035,
          100036,
          100037,
          100038,
          100039,
          100040,
        ]);
      },
    );

    it(
      "parses a valid formal batch request",
      () => {
        const parsed =
          parseArchitectureV2FormalBatchCliArguments([
            "--batch",
            "2",
            "--output",
            "formal-batch-2",
          ]);

        expect(
          parsed.batchNumber,
        ).toBe(
          2,
        );

        expect(
          parsed.outputDirectory,
        ).toMatch(
          /formal-batch-2$/,
        );
      },
    );

    it(
      "rejects invalid batch and incomplete CLI requests",
      () => {
        expect(
          () =>
            parseArchitectureV2FormalBatchCliArguments([
              "--batch",
              "0",
              "--output",
              "output",
            ]),
        ).toThrow(
          /between 1 and 4/i,
        );

        expect(
          () =>
            parseArchitectureV2FormalBatchCliArguments([
              "--batch",
              "5",
              "--output",
              "output",
            ]),
        ).toThrow(
          /between 1 and 4/i,
        );

        expect(
          () =>
            parseArchitectureV2FormalBatchCliArguments([
              "--batch",
              "1",
            ]),
        ).toThrow(
          /missing required --output/i,
        );
      },
    );

    it(
      "creates operational timing metadata without executing simulations",
      () => {
        const metadata =
          createArchitectureV2FormalBatchExecutionMetadata(
            1,

            getArchitectureV2FormalBatchSeeds(
              1,
            ),

            TEST_PROVENANCE,

            {
              totalRuns:
                750,

              completedRunCount:
                748,

              unreachablePresentRunCount:
                1,

              timeoutRunCount:
                1,
            },

            "2026-10-04T20:00:00.000Z",

            "2026-10-04T20:02:00.000Z",

            120000,
          );

        expect(
          metadata.executionMetadataVersion,
        ).toBe(
          ARCHITECTURE_V2_FORMAL_BATCH_EXECUTION_METADATA_VERSION,
        );

        expect(
          metadata.batchNumber,
        ).toBe(
          1,
        );

        expect(
          metadata.totalRuns,
        ).toBe(
          750,
        );

        expect(
          metadata.uniqueScenarioPairs,
        ).toBe(
          150,
        );

        expect(
          metadata.wallClockDurationSeconds,
        ).toBe(
          120,
        );

        expect(
          metadata.averageRunsPerSecond,
        ).toBeCloseTo(
          6.25,
        );

        expect(
          metadata.files
            .executionMetadataJson,
        ).toBe(
          ARCHITECTURE_V2_FORMAL_BATCH_EXECUTION_METADATA_FILENAME,
        );
      },
    );

    it(
      "rejects inconsistent formal batch metadata",
      () => {
        expect(
          () =>
            createArchitectureV2FormalBatchExecutionMetadata(
              1,

              getArchitectureV2FormalBatchSeeds(
                1,
              ),

              TEST_PROVENANCE,

              {
                totalRuns:
                  749,

                completedRunCount:
                  749,

                unreachablePresentRunCount:
                  0,

                timeoutRunCount:
                  0,
              },

              "2026-10-04T20:00:00.000Z",

              "2026-10-04T20:02:00.000Z",

              120000,
            ),
        ).toThrow(
          /exactly 750 runs/i,
        );

        expect(
          () =>
            createArchitectureV2FormalBatchExecutionMetadata(
              1,

              getArchitectureV2FormalBatchSeeds(
                1,
              ),

              TEST_PROVENANCE,

              {
                totalRuns:
                  750,

                completedRunCount:
                  749,

                unreachablePresentRunCount:
                  0,

                timeoutRunCount:
                  0,
              },

              "2026-10-04T20:00:00.000Z",

              "2026-10-04T20:02:00.000Z",

              120000,
            ),
        ).toThrow(
          /status counts/i,
        );
      },
    );
  },
);