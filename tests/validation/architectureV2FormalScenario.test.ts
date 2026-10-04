import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createArchitectureV2FormalPopulationBundle,
} from "../../src/population/architectureV2FormalPopulation";

import type {
  ArchitectureV2FormalPopulationLevel,
} from "../../src/population/architectureV2FormalPopulation";

import {
  ARCHITECTURE_V2_FORMAL_SPEED_ASSIGNMENT_VERSION,
  ARCHITECTURE_V2_FORMAL_WALKING_SPEED,
  createArchitectureV2FormalScenario,
} from "../../src/scenario/architectureV2FormalScenario";

import {
  ARCHITECTURE_V2_RESEARCH_DISRUPTION_CONDITIONS,
  ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS,
  ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,
} from "../../src/scenario/architectureV2ResearchParameterSet";

import type {
  ArchitectureV2ResearchDisruptionConditionId,
} from "../../src/scenario/architectureV2ResearchParameterSet";

const POPULATION_LEVELS:
  readonly ArchitectureV2FormalPopulationLevel[] =
[
  "LOW",
  "MEDIUM",
  "HIGH",
];

const CONDITION_IDS:
  readonly ArchitectureV2ResearchDisruptionConditionId[] =
[
  "D0_BASELINE",
  "D1_HAZARD",
  "D2_EXIT_BLOCK",
  "D3_CORRIDOR_BLOCK",
  "D4_COMBINED",
];

function speedByAgentId(
  populationLevel:
    ArchitectureV2FormalPopulationLevel,

  conditionId:
    ArchitectureV2ResearchDisruptionConditionId,

  replicationSeed:
    number,
): ReadonlyMap<
  string,
  number
> {
  const bundle =
    createArchitectureV2FormalScenario({
      populationLevel,
      conditionId,
      replicationSeed,
    });

  return new Map(
    bundle.scenario
      .occupants
      .map(
        (
          occupant,
        ) =>
          [
            occupant.id,
            occupant.desiredSpeedMps,
          ] as const,
      ),
  );
}

describe(
  "Architecture V2 formal scenario generation",
  () => {
    it(
      "is exactly deterministic for the same formal request",
      () => {
        const first =
          createArchitectureV2FormalScenario({
            populationLevel:
              "MEDIUM",

            conditionId:
              "D4_COMBINED",

            replicationSeed:
              1001,
          });

        const second =
          createArchitectureV2FormalScenario({
            populationLevel:
              "MEDIUM",

            conditionId:
              "D4_COMBINED",

            replicationSeed:
              1001,
          });

        expect(
          second,
        ).toEqual(
          first,
        );
      },
    );

    it(
      "assigns the same walking speed to the same agent across LOW, MEDIUM, and HIGH for one seed",
      () => {
        const seed =
          1007;

        const low =
          speedByAgentId(
            "LOW",
            "D0_BASELINE",
            seed,
          );

        const medium =
          speedByAgentId(
            "MEDIUM",
            "D0_BASELINE",
            seed,
          );

        const high =
          speedByAgentId(
            "HIGH",
            "D0_BASELINE",
            seed,
          );

        for (
          const [
            agentId,
            lowSpeed,
          ] of low
        ) {
          expect(
            medium.has(
              agentId,
            ),
          ).toBe(
            true,
          );

          expect(
            high.has(
              agentId,
            ),
          ).toBe(
            true,
          );

          expect(
            medium.get(
              agentId,
            ),
          ).toBe(
            lowSpeed,
          );

          expect(
            high.get(
              agentId,
            ),
          ).toBe(
            lowSpeed,
          );
        }

        for (
          const [
            agentId,
            mediumSpeed,
          ] of medium
        ) {
          expect(
            high.has(
              agentId,
            ),
          ).toBe(
            true,
          );

          expect(
            high.get(
              agentId,
            ),
          ).toBe(
            mediumSpeed,
          );
        }
      },
    );

    it(
      "keeps the stochastic population identical across all disruption conditions for one seed",
      () => {
        const seed =
          1013;

        const reference =
          speedByAgentId(
            "MEDIUM",
            "D0_BASELINE",
            seed,
          );

        for (
          const conditionId of CONDITION_IDS
        ) {
          const candidate =
            speedByAgentId(
              "MEDIUM",
              conditionId,
              seed,
            );

          expect(
            candidate,
          ).toEqual(
            reference,
          );
        }
      },
    );

    it(
      "changes the stochastic speed realization when the replication seed changes",
      () => {
        const first =
          createArchitectureV2FormalScenario({
            populationLevel:
              "MEDIUM",

            conditionId:
              "D0_BASELINE",

            replicationSeed:
              2001,
          });

        const second =
          createArchitectureV2FormalScenario({
            populationLevel:
              "MEDIUM",

            conditionId:
              "D0_BASELINE",

            replicationSeed:
              2002,
          });

        const firstSpeeds =
          first.scenario
            .occupants
            .map(
              (
                occupant,
              ) =>
                occupant.desiredSpeedMps,
            );

        const secondSpeeds =
          second.scenario
            .occupants
            .map(
              (
                occupant,
              ) =>
                occupant.desiredSpeedMps,
            );

        expect(
          secondSpeeds,
        ).not.toEqual(
          firstSpeeds,
        );

        for (
          const speed of
            [
              ...firstSpeeds,
              ...secondSpeeds,
            ]
        ) {
          expect(
            speed,
          ).toBeGreaterThanOrEqual(
            ARCHITECTURE_V2_FORMAL_WALKING_SPEED
              .min,
          );

          expect(
            speed,
          ).toBeLessThanOrEqual(
            ARCHITECTURE_V2_FORMAL_WALKING_SPEED
              .max,
          );
        }
      },
    );

    it(
      "changes only stochastic speed and formal scenario metadata while preserving frozen spatial populations",
      () => {
        for (
          const populationLevel of POPULATION_LEVELS
        ) {
          const spatial =
            createArchitectureV2FormalPopulationBundle(
              populationLevel,
            );

          const formal =
            createArchitectureV2FormalScenario({
              populationLevel,

              conditionId:
                "D0_BASELINE",

              replicationSeed:
                3001,
            });

          expect(
            formal.scenario
              .occupants
              .map(
                (
                  occupant,
                ) => ({
                  id:
                    occupant.id,

                  spawnPosition:
                    occupant.spawnPosition,
                }),
              ),
          ).toEqual(
            spatial.scenario
              .occupants
              .map(
                (
                  occupant,
                ) => ({
                  id:
                    occupant.id,

                  spawnPosition:
                    occupant.spawnPosition,
                }),
              ),
          );

          expect(
            formal.graph,
          ).toEqual(
            spatial.graph,
          );

          expect(
            formal.spawnZones,
          ).toEqual(
            spatial.spawnZones,
          );
        }
      },
    );

    it(
      "attaches exactly the frozen disruption schedule for D0 through D4",
      () => {
        for (
          const condition of
            ARCHITECTURE_V2_RESEARCH_DISRUPTION_CONDITIONS
        ) {
          const bundle =
            createArchitectureV2FormalScenario({
              populationLevel:
                "MEDIUM",

              conditionId:
                condition.id,

              replicationSeed:
                4001,
            });

          expect(
            bundle.scenario
              .disruptionSchedule,
          ).toEqual(
            condition.events,
          );

          expect(
            bundle.metadata
              .disruptionEventCount,
          ).toBe(
            condition.events.length,
          );

          expect(
            bundle.metadata
              .conditionId,
          ).toBe(
            condition.id,
          );

          expect(
            bundle.metadata
              .conditionLabel,
          ).toBe(
            condition.label,
          );
        }
      },
    );

    it(
      "uses the D3-specific environment and edge mapping only for D3",
      () => {
        const d3 =
          createArchitectureV2FormalScenario({
            populationLevel:
              "MEDIUM",

            conditionId:
              "D3_CORRIDOR_BLOCK",

            replicationSeed:
              5001,
          });

        const d0 =
          createArchitectureV2FormalScenario({
            populationLevel:
              "MEDIUM",

            conditionId:
              "D0_BASELINE",

            replicationSeed:
              5001,
          });

        const targetEdgeId =
          ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS
            .CORRIDOR_EDGE;

        const targetZoneId =
          ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS
            .CORRIDOR_ZONE;

        const d3TargetEdge =
          d3.graph
            .edges
            .find(
              (
                edge,
              ) =>
                edge.id ===
                targetEdgeId,
            );

        const d0TargetEdge =
          d0.graph
            .edges
            .find(
              (
                edge,
              ) =>
                edge.id ===
                targetEdgeId,
            );

        expect(
          d3TargetEdge,
        ).toBeDefined();

        expect(
          d0TargetEdge,
        ).toBeDefined();

        expect(
          d3TargetEdge
            ?.zoneId,
        ).toBe(
          targetZoneId,
        );

        expect(
          d0TargetEdge
            ?.zoneId,
        ).toBe(
          "corridor-main-spine",
        );

        expect(
          d3.environment
            .zones
            .some(
              (
                zone,
              ) =>
                zone.id ===
                targetZoneId,
            ),
        ).toBe(
          true,
        );

        expect(
          d0.environment
            .zones
            .some(
              (
                zone,
              ) =>
                zone.id ===
                targetZoneId,
            ),
        ).toBe(
          false,
        );

        expect(
          d3.graph
            .nodes
            .filter(
              (
                node,
              ) =>
                node.id.startsWith(
                  "room-origin-agent-",
                ),
            ),
        ).toHaveLength(
          42,
        );

        expect(
          d3.graph
            .edges
            .filter(
              (
                edge,
              ) =>
                edge.id.startsWith(
                  "room-origin-edge-agent-",
                ),
            ),
        ).toHaveLength(
          42,
        );
      },
    );

    it(
      "records reproducibility metadata and stable formal scenario identifiers",
      () => {
        const bundle =
          createArchitectureV2FormalScenario({
            populationLevel:
              "HIGH",

            conditionId:
              "D2_EXIT_BLOCK",

            replicationSeed:
              6001,
          });

        expect(
          bundle.scenario.id,
        ).toBe(
          "layout-a-v2-high-d2-exit-block-seed-6001",
        );

        expect(
          bundle.metadata
            .scenarioId,
        ).toBe(
          bundle.scenario.id,
        );

        expect(
          bundle.scenario
            .seed,
        ).toBe(
          6001,
        );

        expect(
          bundle.metadata
            .replicationSeed,
        ).toBe(
          6001,
        );

        expect(
          bundle.metadata
            .populationLevel,
        ).toBe(
          "HIGH",
        );

        expect(
          bundle.metadata
            .population,
        ).toBe(
          70,
        );

        expect(
          bundle.scenario
            .parameterSetVersion,
        ).toBe(
          ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,
        );

        expect(
          bundle.metadata
            .parameterSetVersion,
        ).toBe(
          ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,
        );

        expect(
          bundle.metadata
            .speedAssignmentVersion,
        ).toBe(
          ARCHITECTURE_V2_FORMAL_SPEED_ASSIGNMENT_VERSION,
        );

        expect(
          bundle.metadata
            .walkingSpeedMeanMps,
        ).toBe(
          1.34,
        );

        expect(
          bundle.metadata
            .walkingSpeedStandardDeviationMps,
        ).toBe(
          0.26,
        );

        expect(
          bundle.metadata
            .walkingSpeedMinimumMps,
        ).toBe(
          0.60,
        );

        expect(
          bundle.metadata
            .walkingSpeedMaximumMps,
        ).toBe(
          2.10,
        );
      },
    );

    it(
      "rejects non-integer replication seeds",
      () => {
        expect(
          () =>
            createArchitectureV2FormalScenario({
              populationLevel:
                "MEDIUM",

              conditionId:
                "D0_BASELINE",

              replicationSeed:
                1000.5,
            }),
        ).toThrow(
          /must be an integer/i,
        );
      },
    );
  },
);