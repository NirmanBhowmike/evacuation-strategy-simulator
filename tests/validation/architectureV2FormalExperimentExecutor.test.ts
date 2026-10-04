import {
  describe,
  expect,
  it,
} from "vitest";

import {
  ARCHITECTURE_V2_FORMAL_FIRST_REPLICATION_SEED,
  ARCHITECTURE_V2_FORMAL_INITIAL_SEED_BANK,
  ARCHITECTURE_V2_FORMAL_STRATEGY_IDS,
} from "../../src/experiment/architectureV2FormalExperimentDesign";

import {
  createArchitectureV2FormalCellExecutionPlan,
  createArchitectureV2FormalInitialExecutionPlan,
  createArchitectureV2FormalPairExecutionPlan,
  createArchitectureV2FormalReplicationBatchPlan,
  executeArchitectureV2FormalPair,
} from "../../src/experiment/architectureV2FormalExperimentExecutor";

import type {
  ArchitectureV2FormalExecutionProgress,
} from "../../src/experiment/architectureV2FormalExperimentExecutor";

describe(
  "Architecture V2 formal experiment executor",
  () => {
    it(
      "creates exactly five strategy specifications for one formal pair",
      () => {
        const plan =
          createArchitectureV2FormalPairExecutionPlan({
            populationLevel:
              "MEDIUM",

            conditionId:
              "D0_BASELINE",

            replicationSeed:
              ARCHITECTURE_V2_FORMAL_FIRST_REPLICATION_SEED,
          });

        expect(
          plan,
        ).toHaveLength(
          5,
        );

        expect(
          plan.map(
            (
              specification,
            ) =>
              specification.strategyId,
          ),
        ).toEqual(
          [
            ...ARCHITECTURE_V2_FORMAL_STRATEGY_IDS,
          ],
        );

        expect(
          new Set(
            plan.map(
              (
                specification,
              ) =>
                specification.pairKey,
            ),
          ).size,
        ).toBe(
          1,
        );

        expect(
          new Set(
            plan.map(
              (
                specification,
              ) =>
                JSON.stringify(
                  specification.scenarioRequest,
                ),
            ),
          ).size,
        ).toBe(
          1,
        );
      },
    );

    it(
      "creates exactly 40 runs for one formal experimental cell",
      () => {
        const plan =
          createArchitectureV2FormalCellExecutionPlan({
            populationLevel:
              "HIGH",

            conditionId:
              "D2_EXIT_BLOCK",

            strategyId:
              "HAZARD_AWARE",
          });

        expect(
          plan,
        ).toHaveLength(
          40,
        );

        expect(
          plan.map(
            (
              specification,
            ) =>
              specification.replicationSeed,
          ),
        ).toEqual(
          [
            ...ARCHITECTURE_V2_FORMAL_INITIAL_SEED_BANK,
          ],
        );

        expect(
          new Set(
            plan.map(
              (
                specification,
              ) =>
                specification.cellId,
            ),
          ).size,
        ).toBe(
          1,
        );

        expect(
          new Set(
            plan.map(
              (
                specification,
              ) =>
                specification.strategyId,
            ),
          ),
        ).toEqual(
          new Set([
            "HAZARD_AWARE",
          ]),
        );

        expect(
          new Set(
            plan.map(
              (
                specification,
              ) =>
                specification.populationLevel,
            ),
          ),
        ).toEqual(
          new Set([
            "HIGH",
          ]),
        );

        expect(
          new Set(
            plan.map(
              (
                specification,
              ) =>
                specification.conditionId,
            ),
          ),
        ).toEqual(
          new Set([
            "D2_EXIT_BLOCK",
          ]),
        );
      },
    );

    it(
      "creates a 750-run first replication batch using exactly the first 10 formal seeds",
      () => {
        const plan =
          createArchitectureV2FormalReplicationBatchPlan({
            batchNumber:
              1,
          });

        const expectedSeeds =
          ARCHITECTURE_V2_FORMAL_INITIAL_SEED_BANK
            .slice(
              0,
              10,
            );

        expect(
          plan,
        ).toHaveLength(
          750,
        );

        expect(
          [
            ...new Set(
              plan.map(
                (
                  specification,
                ) =>
                  specification.replicationSeed,
              ),
            ),
          ],
        ).toEqual(
          expectedSeeds,
        );

        expect(
          new Set(
            plan.map(
              (
                specification,
              ) =>
                specification.pairKey,
            ),
          ).size,
        ).toBe(
          150,
        );

        expect(
          new Set(
            plan.map(
              (
                specification,
              ) =>
                specification.cellId,
            ),
          ).size,
        ).toBe(
          75,
        );

        const pairCounts =
          new Map<
            string,
            number
          >();

        for (
          const specification of
            plan
        ) {
          pairCounts.set(
            specification.pairKey,
            (
              pairCounts.get(
                specification.pairKey,
              ) ??
              0
            ) +
              1,
          );
        }

        expect(
          pairCounts.size,
        ).toBe(
          150,
        );

        for (
          const count of
            pairCounts.values()
        ) {
          expect(
            count,
          ).toBe(
            5,
          );
        }
      },
    );

    it(
      "creates a 750-run fourth replication batch using exactly seeds 31 through 40",
      () => {
        const plan =
          createArchitectureV2FormalReplicationBatchPlan({
            batchNumber:
              4,
          });

        const expectedSeeds =
          ARCHITECTURE_V2_FORMAL_INITIAL_SEED_BANK
            .slice(
              30,
              40,
            );

        expect(
          plan,
        ).toHaveLength(
          750,
        );

        expect(
          [
            ...new Set(
              plan.map(
                (
                  specification,
                ) =>
                  specification.replicationSeed,
              ),
            ),
          ],
        ).toEqual(
          expectedSeeds,
        );

        expect(
          expectedSeeds[0],
        ).toBe(
          ARCHITECTURE_V2_FORMAL_FIRST_REPLICATION_SEED +
            30,
        );

        expect(
          expectedSeeds[9],
        ).toBe(
          ARCHITECTURE_V2_FORMAL_FIRST_REPLICATION_SEED +
            39,
        );
      },
    );

    it(
      "creates the complete 3000-run initial execution plan without running simulations",
      () => {
        const plan =
          createArchitectureV2FormalInitialExecutionPlan();

        expect(
          plan,
        ).toHaveLength(
          3000,
        );

        expect(
          new Set(
            plan.map(
              (
                specification,
              ) =>
                specification.runId,
            ),
          ).size,
        ).toBe(
          3000,
        );

        expect(
          new Set(
            plan.map(
              (
                specification,
              ) =>
                specification.pairKey,
            ),
          ).size,
        ).toBe(
          600,
        );

        expect(
          new Set(
            plan.map(
              (
                specification,
              ) =>
                specification.cellId,
            ),
          ).size,
        ).toBe(
          75,
        );

        expect(
          new Set(
            plan.map(
              (
                specification,
              ) =>
                specification.replicationSeed,
            ),
          ).size,
        ).toBe(
          40,
        );
      },
    );

    it(
      "rejects invalid initial pair seeds and replication-batch numbers",
      () => {
        expect(
          () =>
            createArchitectureV2FormalPairExecutionPlan({
              populationLevel:
                "MEDIUM",

              conditionId:
                "D0_BASELINE",

              replicationSeed:
                999,
            }),
        ).toThrow(
          /not part of the frozen initial/i,
        );

        expect(
          () =>
            createArchitectureV2FormalReplicationBatchPlan({
              batchNumber:
                0,
            }),
        ).toThrow(
          /between 1 and 4/i,
        );

        expect(
          () =>
            createArchitectureV2FormalReplicationBatchPlan({
              batchNumber:
                5,
            }),
        ).toThrow(
          /between 1 and 4/i,
        );

        expect(
          () =>
            createArchitectureV2FormalReplicationBatchPlan({
              batchNumber:
                1.5,
            }),
        ).toThrow(
          /must be an integer/i,
        );
      },
    );

    it(
      "executes exactly one five-strategy pair and reports deterministic progress",
      () => {
        const progress:
          ArchitectureV2FormalExecutionProgress[] =
        [];

        const summary =
          executeArchitectureV2FormalPair(
            {
              populationLevel:
                "MEDIUM",

              conditionId:
                "D0_BASELINE",

              replicationSeed:
                ARCHITECTURE_V2_FORMAL_FIRST_REPLICATION_SEED,
            },

            {
              onProgress:
                (
                  update,
                ) => {
                  progress.push(
                    update,
                  );
                },
            },
          );

        expect(
          summary.scope,
        ).toBe(
          "PAIR",
        );

        expect(
          summary.totalRuns,
        ).toBe(
          5,
        );

        expect(
          summary.completedRuns,
        ).toBe(
          5,
        );

        expect(
          summary.results,
        ).toHaveLength(
          5,
        );

        expect(
          summary.results.map(
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
            summary.results.map(
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
            summary.results.map(
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
            summary.results.map(
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
          summary.completedRunCount,
        ).toBe(
          5,
        );

        expect(
          summary.unreachablePresentRunCount,
        ).toBe(
          0,
        );

        expect(
          summary.timeoutRunCount,
        ).toBe(
          0,
        );

        expect(
          progress,
        ).toHaveLength(
          1,
        );

        expect(
          progress[0],
        ).toEqual({
          completedRuns:
            5,

          totalRuns:
            5,

          completedGroups:
            1,

          totalGroups:
            1,

          latestPairKey:
            summary.results[0]!
              .pairKey,

          latestRunIds:
            summary.results.map(
              (
                result,
              ) =>
                result.runId,
            ),
        });
      },
    );
  },
);