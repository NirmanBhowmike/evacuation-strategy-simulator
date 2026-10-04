import {
  execFileSync,
} from "node:child_process";

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";

import {
  join,
  resolve,
} from "node:path";

import {
  ARCHITECTURE_V2_FORMAL_MANIFEST_JSON_FILENAME,
  ARCHITECTURE_V2_FORMAL_RECORDS_CSV_FILENAME,
  ARCHITECTURE_V2_FORMAL_RECORDS_JSON_FILENAME,
} from "../src/experiment/architectureV2FormalArtifacts";

import type {
  ArchitectureV2FormalArtifacts,
} from "../src/experiment/architectureV2FormalArtifacts";

import type {
  ArchitectureV2FormalSoftwareProvenance,
} from "../src/experiment/architectureV2FormalOutput";

interface PackageJsonShape {
  readonly version?:
    unknown;
}

export interface ArchitectureV2FormalRepositoryProvenance
  extends ArchitectureV2FormalSoftwareProvenance {
  readonly repositoryRoot:
    string;

  readonly trackedWorktreeClean:
    boolean;
}

export interface ArchitectureV2FormalRepositoryProvenanceOptions {
  readonly cwd?:
    string;

  /**
   * Formal execution should normally require a clean
   * tracked worktree.
   *
   * Untracked files are deliberately ignored because
   * generated experimental outputs may be untracked while
   * the source revision remains unchanged.
   */
  readonly requireCleanTrackedWorktree?:
    boolean;
}

export interface ArchitectureV2FormalArtifactWriteOptions {
  readonly overwrite?:
    boolean;
}

export interface ArchitectureV2FormalWrittenArtifactPaths {
  readonly outputDirectory:
    string;

  readonly recordsJsonPath:
    string;

  readonly recordsCsvPath:
    string;

  readonly manifestJsonPath:
    string;
}

type FormalArtifactPayload =
  Pick<
    ArchitectureV2FormalArtifacts,
    | "recordsJson"
    | "recordsCsv"
    | "manifestJson"
  >;

function executeGit(
  argumentsList:
    readonly string[],

  cwd:
    string,
): string {
  try {
    return execFileSync(
      "git",
      argumentsList,
      {
        cwd,

        encoding:
          "utf8",

        stdio: [
          "ignore",
          "pipe",
          "pipe",
        ],
      },
    ).trim();
  } catch (
    error
  ) {
    const detail =
      error instanceof Error
        ? error.message
        : String(
            error,
          );

    throw new Error(
      `Unable to execute Git command "git ${argumentsList.join(" ")}": ${detail}`,
    );
  }
}

function determineRepositoryRoot(
  cwd:
    string,
): string {
  const root =
    executeGit(
      [
        "rev-parse",
        "--show-toplevel",
      ],
      cwd,
    );

  if (!root) {
    throw new Error(
      "Unable to determine the Git repository root.",
    );
  }

  return resolve(
    root,
  );
}

function readSoftwareVersion(
  repositoryRoot:
    string,
): string {
  const packagePath =
    join(
      repositoryRoot,
      "package.json",
    );

  let parsed:
    PackageJsonShape;

  try {
    parsed =
      JSON.parse(
        readFileSync(
          packagePath,
          "utf8",
        ),
      ) as PackageJsonShape;
  } catch (
    error
  ) {
    const detail =
      error instanceof Error
        ? error.message
        : String(
            error,
          );

    throw new Error(
      `Unable to read repository package.json: ${detail}`,
    );
  }

  if (
    typeof parsed.version !==
      "string" ||
    !parsed.version.trim()
  ) {
    throw new Error(
      "Repository package.json must contain a non-empty version.",
    );
  }

  return parsed.version.trim();
}

function determineTrackedWorktreeClean(
  repositoryRoot:
    string,
): boolean {
  /**
   * Ignore untracked files.
   *
   * Formal output artifacts can exist outside Git without
   * invalidating the exact committed source revision.
   *
   * Tracked modifications and staged modifications are
   * still detected.
   */
  const status =
    executeGit(
      [
        "status",
        "--porcelain",
        "--untracked-files=no",
      ],
      repositoryRoot,
    );

  return (
    status.length ===
    0
  );
}

/**
 * Captures the exact committed software revision used for
 * a formal experiment.
 *
 * Formal execution should use the default clean-worktree
 * requirement.
 */
export function createArchitectureV2FormalRepositoryProvenance(
  options:
    ArchitectureV2FormalRepositoryProvenanceOptions =
    {},
): ArchitectureV2FormalRepositoryProvenance {
  const cwd =
    resolve(
      options.cwd ??
        process.cwd(),
    );

  const repositoryRoot =
    determineRepositoryRoot(
      cwd,
    );

  const trackedWorktreeClean =
    determineTrackedWorktreeClean(
      repositoryRoot,
    );

  const requireCleanTrackedWorktree =
    options.requireCleanTrackedWorktree ??
    true;

  if (
    requireCleanTrackedWorktree &&
    !trackedWorktreeClean
  ) {
    throw new Error(
      "Formal experiment execution requires a clean tracked Git worktree. Commit or revert tracked changes before running the formal launcher.",
    );
  }

  const gitCommit =
    executeGit(
      [
        "rev-parse",
        "HEAD",
      ],
      repositoryRoot,
    );

  if (
    !/^[0-9a-f]{40,64}$/i.test(
      gitCommit,
    )
  ) {
    throw new Error(
      `Git returned an unexpected commit identifier: ${gitCommit}`,
    );
  }

  const softwareVersion =
    readSoftwareVersion(
      repositoryRoot,
    );

  return {
    softwareVersion,

    gitCommit,

    repositoryRoot,

    trackedWorktreeClean,
  };
}

/**
 * Writes one completed formal artifact set to a directory.
 *
 * Existing formal artifacts are protected by default.
 * Explicit overwrite permission is required to replace
 * them.
 */
export function writeArchitectureV2FormalArtifactsToDirectory(
  artifacts:
    FormalArtifactPayload,

  outputDirectory:
    string,

  options:
    ArchitectureV2FormalArtifactWriteOptions =
    {},
): ArchitectureV2FormalWrittenArtifactPaths {
  const normalizedOutputDirectory =
    outputDirectory.trim();

  if (
    !normalizedOutputDirectory
  ) {
    throw new Error(
      "Formal artifact output directory must be non-empty.",
    );
  }

  const resolvedOutputDirectory =
    resolve(
      normalizedOutputDirectory,
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

  const targetPaths = [
    recordsJsonPath,
    recordsCsvPath,
    manifestJsonPath,
  ];

  const overwrite =
    options.overwrite ??
    false;

  if (
    !overwrite
  ) {
    const existingPaths =
      targetPaths.filter(
        (
          path,
        ) =>
          existsSync(
            path,
          ),
      );

    if (
      existingPaths.length >
      0
    ) {
      throw new Error(
        `Formal artifact files already exist: ${existingPaths.join(", ")}. Refusing to overwrite them.`,
      );
    }
  }

  mkdirSync(
    resolvedOutputDirectory,
    {
      recursive:
        true,
    },
  );

  writeFileSync(
    recordsJsonPath,
    artifacts.recordsJson,
    {
      encoding:
        "utf8",

      flag:
        overwrite
          ? "w"
          : "wx",
    },
  );

  writeFileSync(
    recordsCsvPath,
    artifacts.recordsCsv,
    {
      encoding:
        "utf8",

      flag:
        overwrite
          ? "w"
          : "wx",
    },
  );

  writeFileSync(
    manifestJsonPath,
    artifacts.manifestJson,
    {
      encoding:
        "utf8",

      flag:
        overwrite
          ? "w"
          : "wx",
    },
  );

  return {
    outputDirectory:
      resolvedOutputDirectory,

    recordsJsonPath,

    recordsCsvPath,

    manifestJsonPath,
  };
}