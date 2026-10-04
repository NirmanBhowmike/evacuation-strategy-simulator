import {
  resolve,
} from "node:path";

import {
  pathToFileURL,
} from "node:url";

import {
  ARCHITECTURE_V2_FORMAL_CONDITION_IDS,
  ARCHITECTURE_V2_FORMAL_INITIAL_SEED_BANK,
  ARCHITECTURE_V2_FORMAL_POPULATION_LEVELS,
} from "../src/experiment/architectureV2FormalExperimentDesign";

import {
  executeArchitectureV2FormalPair,
} from "../src/experiment/architectureV2FormalExperimentExecutor";

import {
  createArchitectureV2FormalArtifacts,
} from "../src/experiment/architectureV2FormalArtifacts";

import type {
  ArchitectureV2FormalPopulationLevel,
} from "../src/population/architectureV2FormalPopulation";

import type {
  ArchitectureV2ResearchDisruptionConditionId,
} from "../src/scenario/architectureV2ResearchParameterSet";

import {
  createArchitectureV2FormalRepositoryProvenance,
  writeArchitectureV2FormalArtifactsToDirectory,
} from "./architectureV2FormalCliSupport";

export interface ArchitectureV2FormalPairCliArguments {
  readonly populationLevel:
    ArchitectureV2FormalPopulationLevel;

  readonly conditionId:
    ArchitectureV2ResearchDisruptionConditionId;

  readonly replicationSeed:
    number;

  readonly outputDirectory:
    string;
}

export const ARCHITECTURE_V2_FORMAL_PAIR_CLI_USAGE =
  [
    "Usage:",
    "npm run formal:pair -- --population <LOW|MEDIUM|HIGH> --condition <D0_BASELINE|D1_HAZARD|D2_EXIT_BLOCK|D3_CORRIDOR_BLOCK|D4_COMBINED> --seed <formal-seed> --output <directory>",
    "",
    "Example:",
    "npm run formal:pair -- --population MEDIUM --condition D0_BASELINE --seed 100001 --output ../evacuation-strategy-simulator-results/pilot-medium-d0-seed100001",
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

function isFormalPopulationLevel(
  value:
    string,
): value is ArchitectureV2FormalPopulationLevel {
  return ARCHITECTURE_V2_FORMAL_POPULATION_LEVELS
    .some(
      (
        candidate,
      ) =>
        candidate ===
        value,
    );
}

function isFormalConditionId(
  value:
    string,
): value is ArchitectureV2ResearchDisruptionConditionId {
  return ARCHITECTURE_V2_FORMAL_CONDITION_IDS
    .some(
      (
        candidate,
      ) =>
        candidate ===
        value,
    );
}

export function parseArchitectureV2FormalPairCliArguments(
  argumentsList:
    readonly string[],
): ArchitectureV2FormalPairCliArguments {
  let populationText:
    string | undefined;

  let conditionText:
    string | undefined;

  let seedText:
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
      case "--population":
        populationText =
          requireOptionValue(
            argumentsList,
            index,
            "--population",
          );

        index +=
          1;

        break;

      case "--condition":
        conditionText =
          requireOptionValue(
            argumentsList,
            index,
            "--condition",
          );

        index +=
          1;

        break;

      case "--seed":
        seedText =
          requireOptionValue(
            argumentsList,
            index,
            "--seed",
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
          `Unknown formal pair argument: ${String(argument)}`,
        );
    }
  }

  if (
    populationText ===
    undefined
  ) {
    throw new Error(
      "Missing required --population argument.",
    );
  }

  if (
    !isFormalPopulationLevel(
      populationText,
    )
  ) {
    throw new Error(
      `Unsupported formal population level: ${populationText}.`,
    );
  }

  if (
    conditionText ===
    undefined
  ) {
    throw new Error(
      "Missing required --condition argument.",
    );
  }

  if (
    !isFormalConditionId(
      conditionText,
    )
  ) {
    throw new Error(
      `Unsupported formal disruption condition: ${conditionText}.`,
    );
  }

  if (
    seedText ===
    undefined
  ) {
    throw new Error(
      "Missing required --seed argument.",
    );
  }

  const replicationSeed =
    Number(
      seedText,
    );

  if (
    !Number.isInteger(
      replicationSeed,
    )
  ) {
    throw new Error(
      "Formal replication seed must be an integer.",
    );
  }

  if (
    !ARCHITECTURE_V2_FORMAL_INITIAL_SEED_BANK
      .includes(
        replicationSeed,
      )
  ) {
    throw new Error(
      `Replication seed ${replicationSeed} is not part of the frozen initial formal seed bank.`,
    );
  }

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
    populationLevel:
      populationText,

    conditionId:
      conditionText,

    replicationSeed,

    outputDirectory:
      resolve(
        outputText,
      ),
  };
}

export function runArchitectureV2FormalPairCli(
  cliArguments:
    ArchitectureV2FormalPairCliArguments,
): void {
  /**
   * Capture provenance BEFORE executing the experiment.
   *
   * Tracked source changes cause execution to stop.
   */
  const repositoryProvenance =
    createArchitectureV2FormalRepositoryProvenance();

  console.log(
    "Architecture V2 formal PAIR execution",
  );

  console.log(
    `Software version: ${repositoryProvenance.softwareVersion}`,
  );

  console.log(
    `Git commit: ${repositoryProvenance.gitCommit}`,
  );

  console.log(
    `Population: ${cliArguments.populationLevel}`,
  );

  console.log(
    `Condition: ${cliArguments.conditionId}`,
  );

  console.log(
    `Seed: ${cliArguments.replicationSeed}`,
  );

  const summary =
    executeArchitectureV2FormalPair(
      {
        populationLevel:
          cliArguments.populationLevel,

        conditionId:
          cliArguments.conditionId,

        replicationSeed:
          cliArguments.replicationSeed,
      },

      {
        onProgress:
          (
            progress,
          ) => {
            console.log(
              `Progress: ${progress.completedRuns}/${progress.totalRuns} runs`,
            );
          },
      },
    );

  const artifacts =
    createArchitectureV2FormalArtifacts(
      summary,
      {
        softwareVersion:
          repositoryProvenance
            .softwareVersion,

        gitCommit:
          repositoryProvenance
            .gitCommit,
      },
    );

  const written =
    writeArchitectureV2FormalArtifactsToDirectory(
      artifacts,
      cliArguments.outputDirectory,
    );

  console.log(
    `Completed runs: ${summary.completedRuns}`,
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
    `Output directory: ${written.outputDirectory}`,
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
      ARCHITECTURE_V2_FORMAL_PAIR_CLI_USAGE,
    );

    return;
  }

  const cliArguments =
    parseArchitectureV2FormalPairCliArguments(
      process.argv.slice(
        2,
      ),
    );

  runArchitectureV2FormalPairCli(
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
      `Formal PAIR execution failed: ${message}`,
    );

    console.error();

    console.error(
      ARCHITECTURE_V2_FORMAL_PAIR_CLI_USAGE,
    );

    process.exitCode =
      1;
  }
}