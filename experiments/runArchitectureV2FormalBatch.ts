import {
  existsSync,
  writeFileSync,
} from "node:fs";

import {
  join,
  resolve,
} from "node:path";

import {
  performance,
} from "node:perf_hooks";

import {
  pathToFileURL,
} from "node:url";

import {
  ARCHITECTURE_V2_FORMAL_INITIAL_SEED_BANK,
  ARCHITECTURE_V2_FORMAL_REPLICATION_EXTENSION_BATCH_SIZE,
} from "../src/experiment/architectureV2FormalExperimentDesign";

import {
  createArchitectureV2FormalArtifacts,
  ARCHITECTURE_V2_FORMAL_MANIFEST_JSON_FILENAME,
  ARCHITECTURE_V2_FORMAL_RECORDS_CSV_FILENAME,
  ARCHITECTURE_V2_FORMAL_RECORDS_JSON_FILENAME,
} from "../src/experiment/architectureV2FormalArtifacts";

import {
  createArchitectureV2FormalReplicationBatchPlan,
  executeArchitectureV2FormalReplicationBatch,
} from "../src/experiment/architectureV2FormalExperimentExecutor";

import type {
  ArchitectureV2FormalExecutionSummary,
} from "../src/experiment/architectureV2FormalExperimentExecutor";

import {
  createArchitectureV2FormalRepositoryProvenance,
  writeArchitectureV2FormalArtifactsToDirectory,
} from "./architectureV2FormalCliSupport";

import type {
  ArchitectureV2FormalRepositoryProvenance,
} from "./architectureV2FormalCliSupport";

export const ARCHITECTURE_V2_FORMAL_BATCH_EXECUTION_METADATA_VERSION =
  "architecture-v2-formal-batch-execution-v1";

export const ARCHITECTURE_V2_FORMAL_BATCH_EXECUTION_METADATA_FILENAME =
  "formal-batch-execution.json";

export interface ArchitectureV2FormalBatchCliArguments {
  readonly batchNumber:
    number;

  readonly outputDirectory:
    string;
}

export interface ArchitectureV2FormalBatchExecutionMetadata {
  readonly executionMetadataVersion:
    string;

  readonly batchNumber:
    number;

  readonly softwareVersion:
    string;

  readonly gitCommit:
    string;

  readonly replicationSeeds:
    readonly number[];

  readonly totalRuns:
    number;

  readonly uniqueScenarioPairs:
    number;

  readonly completedRunCount:
    number;

  readonly unreachablePresentRunCount:
    number;

  readonly timeoutRunCount:
    number;

  readonly startedAtUtc:
    string;

  readonly completedAtUtc:
    string;

  /**
   * Operational performance measurement only.
   *
   * This is not a simulation outcome and must not be used
   * as a scientific dependent variable.
   */
  readonly wallClockDurationMilliseconds:
    number;

  readonly wallClockDurationSeconds:
    number;

  readonly averageRunsPerSecond:
    number;

  readonly files: {
    readonly recordsJson:
      string;

    readonly recordsCsv:
      string;

    readonly manifestJson:
      string;

    readonly executionMetadataJson:
      string;
  };
}

interface ArchitectureV2FormalBatchOutputPaths {
  readonly outputDirectory:
    string;

  readonly recordsJsonPath:
    string;

  readonly recordsCsvPath:
    string;

  readonly manifestJsonPath:
    string;

  readonly executionMetadataPath:
    string;
}

export const ARCHITECTURE_V2_FORMAL_BATCH_CLI_USAGE =
  [
    "Usage:",
    "npm run formal:batch -- --batch <1|2|3|4> --output <directory>",
    "",
    "Example:",
    "npm run formal:batch -- --batch 1 --output ../evacuation-strategy-simulator-results/formal-batch-1",
  ].join(
    "\n",
  );

function requireOptionValue(
  argumentsList:
    readonly string[],

  index:
    number,

  optionName:
    string,
): string {
  const value =
    argumentsList[
      index +
      1
    ];

  if (
    value ===
    undefined
  ) {
    throw new Error(
      `Missing value for ${optionName}.`,
    );
  }

  return value;
}

function getFormalBatchCount():
  number {
  return (
    ARCHITECTURE_V2_FORMAL_INITIAL_SEED_BANK
      .length /
    ARCHITECTURE_V2_FORMAL_REPLICATION_EXTENSION_BATCH_SIZE
  );
}

export function getArchitectureV2FormalBatchSeeds(
  batchNumber:
    number,
): readonly number[] {
  if (
    !Number.isInteger(
      batchNumber,
    )
  ) {
    throw new Error(
      "Formal batch number must be an integer.",
    );
  }

  const batchCount =
    getFormalBatchCount();

  if (
    batchNumber <
      1 ||
    batchNumber >
      batchCount
  ) {
    throw new Error(
      `Formal batch number must be between 1 and ${batchCount}.`,
    );
  }

  const startIndex =
    (
      batchNumber -
      1
    ) *
    ARCHITECTURE_V2_FORMAL_REPLICATION_EXTENSION_BATCH_SIZE;

  return Object.freeze(
    ARCHITECTURE_V2_FORMAL_INITIAL_SEED_BANK
      .slice(
        startIndex,
        startIndex +
          ARCHITECTURE_V2_FORMAL_REPLICATION_EXTENSION_BATCH_SIZE,
      ),
  );
}

export function parseArchitectureV2FormalBatchCliArguments(
  argumentsList:
    readonly string[],
): ArchitectureV2FormalBatchCliArguments {
  let batchText:
    string | undefined;

  let outputText:
    string | undefined;

  for (
    let index =
      0;
    index <
      argumentsList.length;
    index +=
      1
  ) {
    const argument =
      argumentsList[
        index
      ];

    switch (
      argument
    ) {
      case "--batch":
        batchText =
          requireOptionValue(
            argumentsList,
            index,
            "--batch",
          );

        index +=
          1;

        break;

      case "--output":
        outputText =
          requireOptionValue(
            argumentsList,
            index,
            "--output",
          );

        index +=
          1;

        break;

      default:
        throw new Error(
          `Unknown formal batch argument: ${String(argument)}`,
        );
    }
  }

  if (
    batchText ===
    undefined
  ) {
    throw new Error(
      "Missing required --batch argument.",
    );
  }

  const batchNumber =
    Number(
      batchText,
    );

  /**
   * Reuse the frozen seed-bank validation.
   */
  getArchitectureV2FormalBatchSeeds(
    batchNumber,
  );

  if (
    outputText ===
      undefined ||
    !outputText.trim()
  ) {
    throw new Error(
      "Missing required --output argument.",
    );
  }

  return {
    batchNumber,

    outputDirectory:
      resolve(
        outputText,
      ),
  };
}

export function createArchitectureV2FormalBatchExecutionMetadata(
  batchNumber:
    number,

  replicationSeeds:
    readonly number[],

  provenance:
    Pick<
      ArchitectureV2FormalRepositoryProvenance,
      | "softwareVersion"
      | "gitCommit"
    >,

  summary:
    Pick<
      ArchitectureV2FormalExecutionSummary,
      | "totalRuns"
      | "completedRunCount"
      | "unreachablePresentRunCount"
      | "timeoutRunCount"
    >,

  startedAtUtc:
    string,

  completedAtUtc:
    string,

  wallClockDurationMilliseconds:
    number,
): ArchitectureV2FormalBatchExecutionMetadata {
  if (
    !Number.isFinite(
      wallClockDurationMilliseconds,
    ) ||
    wallClockDurationMilliseconds <=
      0
  ) {
    throw new Error(
      "Formal batch wall-clock duration must be positive and finite.",
    );
  }

  const expectedSeeds =
    getArchitectureV2FormalBatchSeeds(
      batchNumber,
    );

  if (
    replicationSeeds.length !==
    expectedSeeds.length ||
    replicationSeeds.some(
      (
        seed,
        index,
      ) =>
        seed !==
        expectedSeeds[
          index
        ],
    )
  ) {
    throw new Error(
      `Formal batch ${batchNumber} contains an unexpected replication-seed set.`,
    );
  }

  const expectedRuns =
    750;

  if (
    summary.totalRuns !==
    expectedRuns
  ) {
    throw new Error(
      `Formal batch ${batchNumber} must contain exactly ${expectedRuns} runs.`,
    );
  }

  const classifiedRuns =
    summary.completedRunCount +
    summary.unreachablePresentRunCount +
    summary.timeoutRunCount;

  if (
    classifiedRuns !==
    summary.totalRuns
  ) {
    throw new Error(
      "Formal batch status counts do not match its total run count.",
    );
  }

  const wallClockDurationSeconds =
    wallClockDurationMilliseconds /
    1000;

  return {
    executionMetadataVersion:
      ARCHITECTURE_V2_FORMAL_BATCH_EXECUTION_METADATA_VERSION,

    batchNumber,

    softwareVersion:
      provenance.softwareVersion,

    gitCommit:
      provenance.gitCommit,

    replicationSeeds: [
      ...replicationSeeds,
    ],

    totalRuns:
      summary.totalRuns,

    /**
     * 3 occupancies
     * × 5 conditions
     * × 10 replication seeds
     * = 150 paired stochastic scenarios.
     */
    uniqueScenarioPairs:
      150,

    completedRunCount:
      summary.completedRunCount,

    unreachablePresentRunCount:
      summary.unreachablePresentRunCount,

    timeoutRunCount:
      summary.timeoutRunCount,

    startedAtUtc,

    completedAtUtc,

    wallClockDurationMilliseconds,

    wallClockDurationSeconds,

    averageRunsPerSecond:
      summary.totalRuns /
      wallClockDurationSeconds,

    files: {
      recordsJson:
        ARCHITECTURE_V2_FORMAL_RECORDS_JSON_FILENAME,

      recordsCsv:
        ARCHITECTURE_V2_FORMAL_RECORDS_CSV_FILENAME,

      manifestJson:
        ARCHITECTURE_V2_FORMAL_MANIFEST_JSON_FILENAME,

      executionMetadataJson:
        ARCHITECTURE_V2_FORMAL_BATCH_EXECUTION_METADATA_FILENAME,
    },
  };
}

function prepareFormalBatchOutputPaths(
  outputDirectory:
    string,
): ArchitectureV2FormalBatchOutputPaths {
  const resolvedOutputDirectory =
    resolve(
      outputDirectory,
    );

  const recordsJsonPath =
    join(
      resolvedOutputDirectory,
      ARCHITECTURE_V2_FORMAL_RECORDS_JSON_FILENAME,
    );

  const recordsCsvPath =
    join(
      resolvedOutputDirectory,
      ARCHITECTURE_V2_FORMAL_RECORDS_CSV_FILENAME,
    );

  const manifestJsonPath =
    join(
      resolvedOutputDirectory,
      ARCHITECTURE_V2_FORMAL_MANIFEST_JSON_FILENAME,
    );

  const executionMetadataPath =
    join(
      resolvedOutputDirectory,
      ARCHITECTURE_V2_FORMAL_BATCH_EXECUTION_METADATA_FILENAME,
    );

  const targetPaths = [
    recordsJsonPath,
    recordsCsvPath,
    manifestJsonPath,
    executionMetadataPath,
  ];

  const collisions =
    targetPaths.filter(
      (
        path,
      ) =>
        existsSync(
          path,
        ),
    );

  if (
    collisions.length >
    0
  ) {
    throw new Error(
      `Formal batch output already exists: ${collisions.join(", ")}. Refusing to overwrite.`,
    );
  }

  return {
    outputDirectory:
      resolvedOutputDirectory,

    recordsJsonPath,

    recordsCsvPath,

    manifestJsonPath,

    executionMetadataPath,
  };
}

function verifyRepositoryUnchanged(
  before:
    ArchitectureV2FormalRepositoryProvenance,
): void {
  const after =
    createArchitectureV2FormalRepositoryProvenance();

  if (
    after.gitCommit !==
      before.gitCommit ||
    after.softwareVersion !==
      before.softwareVersion
  ) {
    throw new Error(
      "Repository revision changed during formal batch execution. Results will not be written.",
    );
  }
}

export function runArchitectureV2FormalBatchCli(
  cliArguments:
    ArchitectureV2FormalBatchCliArguments,
): void {
  /**
   * Preflight output collision before spending time on
   * 750 simulations.
   */
  const outputPaths =
    prepareFormalBatchOutputPaths(
      cliArguments.outputDirectory,
    );

  /**
   * Formal execution requires a clean tracked worktree.
   */
  const provenance =
    createArchitectureV2FormalRepositoryProvenance();

  const replicationSeeds =
    getArchitectureV2FormalBatchSeeds(
      cliArguments.batchNumber,
    );

  /**
   * Validate the existing frozen plan before execution.
   * No simulations are run by this call.
   */
  const plan =
    createArchitectureV2FormalReplicationBatchPlan({
      batchNumber:
        cliArguments.batchNumber,
    });

  if (
    plan.length !==
    750
  ) {
    throw new Error(
      `Expected 750 runs in formal batch ${cliArguments.batchNumber}, found ${plan.length}.`,
    );
  }

  console.log(
    `Architecture V2 formal batch ${cliArguments.batchNumber}`,
  );

  console.log(
    `Software version: ${provenance.softwareVersion}`,
  );

  console.log(
    `Git commit: ${provenance.gitCommit}`,
  );

  console.log(
    `Seeds: ${replicationSeeds.join(", ")}`,
  );

  console.log(
    "Planned execution: 150 paired scenarios / 750 simulations",
  );

  const startedAtUtc =
    new Date()
      .toISOString();

  const startedPerformance =
    performance.now();

  const summary =
    executeArchitectureV2FormalReplicationBatch(
      {
        batchNumber:
          cliArguments.batchNumber,
      },

      {
        onProgress:
          (
            progress,
          ) => {
            if (
              progress.completedGroups %
                10 ===
                0 ||
              progress.completedGroups ===
                progress.totalGroups
            ) {
              console.log(
                `Progress: ${progress.completedGroups}/${progress.totalGroups} pairs, ${progress.completedRuns}/${progress.totalRuns} runs`,
              );
            }
          },
      },
    );

  const completedPerformance =
    performance.now();

  const completedAtUtc =
    new Date()
      .toISOString();

  const wallClockDurationMilliseconds =
    completedPerformance -
    startedPerformance;

  /**
   * Ensure the committed source revision did not change
   * while the experiment was running.
   */
  verifyRepositoryUnchanged(
    provenance,
  );

  const artifacts =
    createArchitectureV2FormalArtifacts(
      summary,
      {
        softwareVersion:
          provenance.softwareVersion,

        gitCommit:
          provenance.gitCommit,
      },
    );

  const executionMetadata =
    createArchitectureV2FormalBatchExecutionMetadata(
      cliArguments.batchNumber,
      replicationSeeds,
      provenance,
      summary,
      startedAtUtc,
      completedAtUtc,
      wallClockDurationMilliseconds,
    );

  const written =
    writeArchitectureV2FormalArtifactsToDirectory(
      artifacts,
      outputPaths.outputDirectory,
    );

  writeFileSync(
    outputPaths.executionMetadataPath,
    `${JSON.stringify(
      executionMetadata,
      null,
      2,
    )}\n`,
    {
      encoding:
        "utf8",

      flag:
        "wx",
    },
  );

  console.log(
    `Formal batch ${cliArguments.batchNumber} complete.`,
  );

  console.log(
    `Completed status: ${summary.completedRunCount}`,
  );

  console.log(
    `Unreachable-present status: ${summary.unreachablePresentRunCount}`,
  );

  console.log(
    `Timeout status: ${summary.timeoutRunCount}`,
  );

  console.log(
    `Wall-clock duration: ${executionMetadata.wallClockDurationSeconds.toFixed(2)} s`,
  );

  console.log(
    `Average throughput: ${executionMetadata.averageRunsPerSecond.toFixed(2)} runs/s`,
  );

  console.log(
    `JSON: ${written.recordsJsonPath}`,
  );

  console.log(
    `CSV: ${written.recordsCsvPath}`,
  );

  console.log(
    `Manifest: ${written.manifestJsonPath}`,
  );

  console.log(
    `Execution metadata: ${outputPaths.executionMetadataPath}`,
  );
}

function main():
  void {
  if (
    process.argv
      .slice(
        2,
      )
      .includes(
        "--help",
      )
  ) {
    console.log(
      ARCHITECTURE_V2_FORMAL_BATCH_CLI_USAGE,
    );

    return;
  }

  const cliArguments =
    parseArchitectureV2FormalBatchCliArguments(
      process.argv.slice(
        2,
      ),
    );

  runArchitectureV2FormalBatchCli(
    cliArguments,
  );
}

const executedFile =
  process.argv[1];

if (
  executedFile &&
  import.meta.url ===
    pathToFileURL(
      executedFile,
    ).href
) {
  try {
    main();
  } catch (
    error
  ) {
    const message =
      error instanceof Error
        ? error.message
        : String(
            error,
          );

    console.error(
      `Formal batch execution failed: ${message}`,
    );

    console.error();

    console.error(
      ARCHITECTURE_V2_FORMAL_BATCH_CLI_USAGE,
    );

    process.exitCode =
      1;
  }
}