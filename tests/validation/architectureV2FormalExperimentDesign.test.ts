import {
  describe,
  expect,
  it,
} from "vitest";

import {
  ARCHITECTURE_V2_FORMAL_CONDITION_IDS,
  ARCHITECTURE_V2_FORMAL_EXPERIMENT_DESIGN_VERSION,
  ARCHITECTURE_V2_FORMAL_EXPERIMENTAL_CELLS,
  ARCHITECTURE_V2_FORMAL_FIRST_REPLICATION_SEED,
  ARCHITECTURE_V2_FORMAL_INITIAL_SEED_BANK,
  ARCHITECTURE_V2_FORMAL_MINIMUM_REPLICATIONS_PER_CELL,
  ARCHITECTURE_V2_FORMAL_POPULATION_LEVELS,
  ARCHITECTURE_V2_FORMAL_REPLICATION_EXTENSION_BATCH_SIZE,
  ARCHITECTURE_V2_FORMAL_SEED_BANK_VERSION,
  ARCHITECTURE_V2_FORMAL_STRATEGY_IDS,
  createArchitectureV2FormalExperimentDesign,
  createArchitectureV2FormalExperimentalCells,
  createArchitectureV2FormalRunPlan,
  createArchitectureV2FormalSeedBank,
} from "../../src/experiment/architectureV2FormalExperimentDesign";

import {
  createArchitectureV2FormalScenario,
} from "../../src/scenario/architectureV2FormalScenario";

import {
  ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,
} from "../../src/scenario/architectureV2ResearchParameterSet";

describe(
  "Architecture V2 formal experiment design",
  () => {
    it(
      "defines the complete frozen 5 x 3 x 5 factorial structure",
      () => {
        expect(
          ARCHITECTURE_V2_FORMAL_STRATEGY_IDS,
        ).toEqual([
          "NEAREST_EXIT",
          "STATIC_SHORTEST_PATH",
          "CONGESTION_AWARE",
          "HAZARD_AWARE",
          "ADAPTIVE_HYBRID",
        ]);

        expect(
          ARCHITECTURE_V2_FORMAL_POPULATION_LEVELS,
        ).toEqual([
          "LOW",
          "MEDIUM",
          "HIGH",
        ]);

        expect(
          ARCHITECTURE_V2_FORMAL_CONDITION_IDS,
        ).toEqual([
          "D0_BASELINE",
          "D1_HAZARD",
          "D2_EXIT_BLOCK",
          "D3_CORRIDOR_BLOCK",
          "D4_COMBINED",
        ]);

        expect(
          ARCHITECTURE_V2_FORMAL_STRATEGY_IDS
            .length *
            ARCHITECTURE_V2_FORMAL_POPULATION_LEVELS
              .length *
            ARCHITECTURE_V2_FORMAL_CONDITION_IDS
              .length,
        ).toBe(
          75,
        );
      },
    );

    it(
      "creates exactly 75 unique experimental cells",
      () => {
        const cells =
          createArchitectureV2FormalExperimentalCells();

        expect(
          cells,
        ).toHaveLength(
          75,
        );

        expect(
          ARCHITECTURE_V2_FORMAL_EXPERIMENTAL_CELLS,
        ).toHaveLength(
          75,
        );

        expect(
          new Set(
            cells.map(
              (
                cell,
              ) =>
                cell.cellId,
            ),
          ).size,
        ).toBe(
          75,
        );

        const factorKeys =
          cells.map(
            (
              cell,
            ) =>
              [
                cell.strategyId,
                cell.populationLevel,
                cell.conditionId,
              ].join(
                "|",
              ),
          );

        expect(
          new Set(
            factorKeys,
          ).size,
        ).toBe(
          75,
        );

        for (
          const cell of
            cells
        ) {
          expect(
            cell.designVersion,
          ).toBe(
            ARCHITECTURE_V2_FORMAL_EXPERIMENT_DESIGN_VERSION,
          );

          expect(
            cell.parameterSetVersion,
          ).toBe(
            ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,
          );
        }
      },
    );

    it(
      "creates the frozen initial 40-seed formal seed bank",
      () => {
        expect(
          ARCHITECTURE_V2_FORMAL_MINIMUM_REPLICATIONS_PER_CELL,
        ).toBe(
          40,
        );

        expect(
          ARCHITECTURE_V2_FORMAL_REPLICATION_EXTENSION_BATCH_SIZE,
        ).toBe(
          10,
        );

        expect(
          ARCHITECTURE_V2_FORMAL_INITIAL_SEED_BANK,
        ).toHaveLength(
          40,
        );

        expect(
          ARCHITECTURE_V2_FORMAL_INITIAL_SEED_BANK[0],
        ).toBe(
          ARCHITECTURE_V2_FORMAL_FIRST_REPLICATION_SEED,
        );

        expect(
          ARCHITECTURE_V2_FORMAL_INITIAL_SEED_BANK[39],
        ).toBe(
          ARCHITECTURE_V2_FORMAL_FIRST_REPLICATION_SEED +
            39,
        );

        expect(
          new Set(
            ARCHITECTURE_V2_FORMAL_INITIAL_SEED_BANK,
          ).size,
        ).toBe(
          40,
        );
      },
    );

    it(
      "extends the seed bank only by stable 10-seed prefixes",
      () => {
        const forty =
          createArchitectureV2FormalSeedBank(
            40,
          );

        const fifty =
          createArchitectureV2FormalSeedBank(
            50,
          );

        const sixty =
          createArchitectureV2FormalSeedBank(
            60,
          );

        expect(
          fifty.slice(
            0,
            40,
          ),
        ).toEqual(
          forty,
        );

        expect(
          sixty.slice(
            0,
            50,
          ),
        ).toEqual(
          fifty,
        );

        expect(
          fifty[49],
        ).toBe(
          ARCHITECTURE_V2_FORMAL_FIRST_REPLICATION_SEED +
            49,
        );

        expect(
          sixty[59],
        ).toBe(
          ARCHITECTURE_V2_FORMAL_FIRST_REPLICATION_SEED +
            59,
        );
      },
    );

    it(
      "rejects invalid formal replication counts",
      () => {
        expect(
          () =>
            createArchitectureV2FormalSeedBank(
              39,
            ),
        ).toThrow(
          /cannot be below 40/i,
        );

        expect(
          () =>
            createArchitectureV2FormalSeedBank(
              41,
            ),
        ).toThrow(
          /batches of 10/i,
        );

        expect(
          () =>
            createArchitectureV2FormalSeedBank(
              45,
            ),
        ).toThrow(
          /batches of 10/i,
        );

        expect(
          () =>
            createArchitectureV2FormalSeedBank(
              40.5,
            ),
        ).toThrow(
          /must be an integer/i,
        );
      },
    );

    it(
      "reports 75 cells, 600 unique scenarios, and 3000 initial formal runs",
      () => {
        const design =
          createArchitectureV2FormalExperimentDesign();

        expect(
          design.designVersion,
        ).toBe(
          ARCHITECTURE_V2_FORMAL_EXPERIMENT_DESIGN_VERSION,
        );

        expect(
          design.seedBankVersion,
        ).toBe(
          ARCHITECTURE_V2_FORMAL_SEED_BANK_VERSION,
        );

        expect(
          design.parameterSetVersion,
        ).toBe(
          ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,
        );

        expect(
          design.replicationsPerCell,
        ).toBe(
          40,
        );

        expect(
          design.totalCells,
        ).toBe(
          75,
        );

        expect(
          design.totalUniqueScenarios,
        ).toBe(
          600,
        );

        expect(
          design.totalPlannedRuns,
        ).toBe(
          3000,
        );

        expect(
          design.seedBank,
        ).toHaveLength(
          40,
        );
      },
    );

    it(
      "creates exactly 3000 unique initial run specifications",
      () => {
        const runs =
          createArchitectureV2FormalRunPlan();

        expect(
          runs,
        ).toHaveLength(
          3000,
        );

        expect(
          new Set(
            runs.map(
              (
                run,
              ) =>
                run.runId,
            ),
          ).size,
        ).toBe(
          3000,
        );

        expect(
          new Set(
            runs.map(
              (
                run,
              ) =>
                run.pairKey,
            ),
          ).size,
        ).toBe(
          600,
        );

        expect(
          new Set(
            runs.map(
              (
                run,
              ) =>
                run.cellId,
            ),
          ).size,
        ).toBe(
          75,
        );
      },
    );

    it(
      "gives every experimental cell exactly the same 40-seed bank",
      () => {
        const runs =
          createArchitectureV2FormalRunPlan();

        for (
          const cell of
            ARCHITECTURE_V2_FORMAL_EXPERIMENTAL_CELLS
        ) {
          const cellRuns =
            runs.filter(
              (
                run,
              ) =>
                run.cellId ===
                cell.cellId,
            );

          expect(
            cellRuns,
            `${cell.cellId} should contain exactly 40 replications`,
          ).toHaveLength(
            40,
          );

          expect(
            cellRuns.map(
              (
                run,
              ) =>
                run.replicationSeed,
            ),
          ).toEqual(
            [
              ...ARCHITECTURE_V2_FORMAL_INITIAL_SEED_BANK,
            ],
          );
        }
      },
    );

    it(
      "creates exactly five paired strategy runs for every stochastic scenario",
      () => {
        const runs =
          createArchitectureV2FormalRunPlan();

        const runsByPair =
          new Map<
            string,
            typeof runs
          >();

        for (
          const run of
            runs
        ) {
          const existing =
            runsByPair.get(
              run.pairKey,
            ) ??
            [];

          runsByPair.set(
            run.pairKey,
            [
              ...existing,
              run,
            ],
          );
        }

        expect(
          runsByPair.size,
        ).toBe(
          600,
        );

        for (
          const [
            pairKey,
            pairedRuns,
          ] of
            runsByPair
        ) {
          expect(
            pairedRuns,
            `${pairKey} should have exactly five competing strategies`,
          ).toHaveLength(
            5,
          );

          expect(
            pairedRuns.map(
              (
                run,
              ) =>
                run.strategyId,
            ),
          ).toEqual(
            [
              ...ARCHITECTURE_V2_FORMAL_STRATEGY_IDS,
            ],
          );

          expect(
            new Set(
              pairedRuns.map(
                (
                  run,
                ) =>
                  JSON.stringify(
                    run.scenarioRequest,
                  ),
              ),
            ).size,
          ).toBe(
            1,
          );

          expect(
            new Set(
              pairedRuns.map(
                (
                  run,
                ) =>
                  run.replicationSeed,
              ),
            ).size,
          ).toBe(
            1,
          );

          expect(
            new Set(
              pairedRuns.map(
                (
                  run,
                ) =>
                  run.populationLevel,
              ),
            ).size,
          ).toBe(
            1,
          );

          expect(
            new Set(
              pairedRuns.map(
                (
                  run,
                ) =>
                  run.conditionId,
              ),
            ).size,
          ).toBe(
            1,
          );
        }
      },
    );

    it(
      "keeps scenario construction strategy-independent for paired comparisons",
      () => {
        const runs =
          createArchitectureV2FormalRunPlan();

        const samplePairKey =
          runs[0]
            ?.pairKey;

        if (!samplePairKey) {
          throw new Error(
            "Formal run plan unexpectedly contains no runs.",
          );
        }

        const pairedRuns =
          runs.filter(
            (
              run,
            ) =>
              run.pairKey ===
              samplePairKey,
          );

        expect(
          pairedRuns,
        ).toHaveLength(
          5,
        );

        const scenarios =
          pairedRuns.map(
            (
              run,
            ) =>
              createArchitectureV2FormalScenario(
                run.scenarioRequest,
              ),
          );

        for (
          const scenario of
            scenarios.slice(
              1,
            )
        ) {
          expect(
            scenario,
          ).toEqual(
            scenarios[0],
          );
        }
      },
    );

    it(
      "extends to 50 replications without changing the original 3000-run prefix design",
      () => {
        const initial =
          createArchitectureV2FormalRunPlan(
            40,
          );

        const extended =
          createArchitectureV2FormalRunPlan(
            50,
          );

        const design =
          createArchitectureV2FormalExperimentDesign(
            50,
          );

        expect(
          extended,
        ).toHaveLength(
          3750,
        );

        expect(
          design.totalCells,
        ).toBe(
          75,
        );

        expect(
          design.totalUniqueScenarios,
        ).toBe(
          750,
        );

        expect(
          design.totalPlannedRuns,
        ).toBe(
          3750,
        );

        /**
         * Verify at the experimental-cell level that the
         * original 40 seeds remain unchanged when another
         * replication batch is added.
         */
        for (
          const cell of
            ARCHITECTURE_V2_FORMAL_EXPERIMENTAL_CELLS
        ) {
          const initialCellRuns =
            initial.filter(
              (
                run,
              ) =>
                run.cellId ===
                cell.cellId,
            );

          const extendedCellRuns =
            extended.filter(
              (
                run,
              ) =>
                run.cellId ===
                cell.cellId,
            );

          expect(
            extendedCellRuns
              .slice(
                0,
                40,
              ),
          ).toEqual(
            initialCellRuns,
          );
        }
      },
    );
  },
);