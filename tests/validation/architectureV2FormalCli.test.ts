import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";

import {
  tmpdir,
} from "node:os";

import {
  join,
} from "node:path";

import {
  describe,
  expect,
  it,
} from "vitest";

import packageJson from "../../package.json";

import {
  ARCHITECTURE_V2_FORMAL_MANIFEST_JSON_FILENAME,
  ARCHITECTURE_V2_FORMAL_RECORDS_CSV_FILENAME,
  ARCHITECTURE_V2_FORMAL_RECORDS_JSON_FILENAME,
} from "../../src/experiment/architectureV2FormalArtifacts";

import {
  createArchitectureV2FormalRepositoryProvenance,
  writeArchitectureV2FormalArtifactsToDirectory,
} from "../../experiments/architectureV2FormalCliSupport";

import {
  parseArchitectureV2FormalPairCliArguments,
} from "../../experiments/runArchitectureV2FormalPair";

describe(
  "Architecture V2 formal CLI support",
  () => {
    it(
      "parses one safe formal PAIR request",
      () => {
        const parsed =
          parseArchitectureV2FormalPairCliArguments([
            "--population",
            "MEDIUM",
            "--condition",
            "D0_BASELINE",
            "--seed",
            "100001",
            "--output",
            "formal-test-output",
          ]);

        expect(
          parsed.populationLevel,
        ).toBe(
          "MEDIUM",
        );

        expect(
          parsed.conditionId,
        ).toBe(
          "D0_BASELINE",
        );

        expect(
          parsed.replicationSeed,
        ).toBe(
          100001,
        );

        expect(
          parsed.outputDirectory,
        ).toMatch(
          /formal-test-output$/,
        );
      },
    );

    it(
      "rejects invalid population, condition, seed, and missing output arguments",
      () => {
        expect(
          () =>
            parseArchitectureV2FormalPairCliArguments([
              "--population",
              "EXTREME",
              "--condition",
              "D0_BASELINE",
              "--seed",
              "100001",
              "--output",
              "output",
            ]),
        ).toThrow(
          /unsupported formal population/i,
        );

        expect(
          () =>
            parseArchitectureV2FormalPairCliArguments([
              "--population",
              "MEDIUM",
              "--condition",
              "D99_UNKNOWN",
              "--seed",
              "100001",
              "--output",
              "output",
            ]),
        ).toThrow(
          /unsupported formal disruption/i,
        );

        expect(
          () =>
            parseArchitectureV2FormalPairCliArguments([
              "--population",
              "MEDIUM",
              "--condition",
              "D0_BASELINE",
              "--seed",
              "999",
              "--output",
              "output",
            ]),
        ).toThrow(
          /not part of the frozen initial formal seed bank/i,
        );

        expect(
          () =>
            parseArchitectureV2FormalPairCliArguments([
              "--population",
              "MEDIUM",
              "--condition",
              "D0_BASELINE",
              "--seed",
              "100001",
            ]),
        ).toThrow(
          /missing required --output/i,
        );
      },
    );

    it(
      "captures the repository software version and exact Git commit",
      () => {
        /**
         * The current development worktree is allowed to
         * contain tracked changes during this validation.
         *
         * The production launcher itself uses the strict
         * clean-worktree default.
         */
        const provenance =
          createArchitectureV2FormalRepositoryProvenance({
            requireCleanTrackedWorktree:
              false,
          });

        expect(
          provenance.softwareVersion,
        ).toBe(
          packageJson.version,
        );

        expect(
          provenance.gitCommit,
        ).toMatch(
          /^[0-9a-f]{40,64}$/i,
        );

        expect(
          provenance.repositoryRoot,
        ).toMatch(
          /evacuation-strategy-simulator$/,
        );
      },
    );

    it(
      "writes the three formal artifacts and protects them from accidental overwrite",
      () => {
        const temporaryDirectory =
          mkdtempSync(
            join(
              tmpdir(),
              "evac-formal-cli-",
            ),
          );

        try {
          const artifacts = {
            recordsJson:
              "[{\"runId\":\"synthetic-run\"}]\n",

            recordsCsv:
              "runId\nsynthetic-run\n",

            manifestJson:
              "{\"recordCount\":1}\n",
          };

          const written =
            writeArchitectureV2FormalArtifactsToDirectory(
              artifacts,
              temporaryDirectory,
            );

          expect(
            existsSync(
              written.recordsJsonPath,
            ),
          ).toBe(
            true,
          );

          expect(
            existsSync(
              written.recordsCsvPath,
            ),
          ).toBe(
            true,
          );

          expect(
            existsSync(
              written.manifestJsonPath,
            ),
          ).toBe(
            true,
          );

          expect(
            readFileSync(
              written.recordsJsonPath,
              "utf8",
            ),
          ).toBe(
            artifacts.recordsJson,
          );

          expect(
            readFileSync(
              written.recordsCsvPath,
              "utf8",
            ),
          ).toBe(
            artifacts.recordsCsv,
          );

          expect(
            readFileSync(
              written.manifestJsonPath,
              "utf8",
            ),
          ).toBe(
            artifacts.manifestJson,
          );

          expect(
            written.recordsJsonPath.endsWith(
              ARCHITECTURE_V2_FORMAL_RECORDS_JSON_FILENAME,
            ),
          ).toBe(
            true,
          );

          expect(
            written.recordsCsvPath.endsWith(
              ARCHITECTURE_V2_FORMAL_RECORDS_CSV_FILENAME,
            ),
          ).toBe(
            true,
          );

          expect(
            written.manifestJsonPath.endsWith(
              ARCHITECTURE_V2_FORMAL_MANIFEST_JSON_FILENAME,
            ),
          ).toBe(
            true,
          );

          expect(
            () =>
              writeArchitectureV2FormalArtifactsToDirectory(
                artifacts,
                temporaryDirectory,
              ),
          ).toThrow(
            /refusing to overwrite/i,
          );

          const replacement = {
            recordsJson:
              "[]\n",

            recordsCsv:
              "runId\n",

            manifestJson:
              "{\"recordCount\":0}\n",
          };

          writeArchitectureV2FormalArtifactsToDirectory(
            replacement,
            temporaryDirectory,
            {
              overwrite:
                true,
            },
          );

          expect(
            readFileSync(
              written.recordsJsonPath,
              "utf8",
            ),
          ).toBe(
            replacement.recordsJson,
          );
        } finally {
          rmSync(
            temporaryDirectory,
            {
              recursive:
                true,

              force:
                true,
            },
          );
        }
      },
    );
  },
);