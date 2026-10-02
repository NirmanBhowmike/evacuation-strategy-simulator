import {
  describe,
  expect,
  it,
} from "vitest";

import {
  runHeadlessSimulation,
} from "../../src/core/runHeadlessSimulation";

import {
  layoutA,
} from "../../src/environment/layoutA";
import {
  layoutAExits,
} from "../../src/environment/layoutAExits";
import {
  layoutANavigationGraph,
} from "../../src/environment/layoutANavigationGraph";
import {
  layoutASpawnZones,
} from "../../src/environment/layoutASpawnZones";

import {
  getResearchDisruptionCondition,
  RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
  RESEARCH_DENSITY_CELL_LENGTH_METERS,
  RESEARCH_DISRUPTION_CONDITIONS,
  RESEARCH_OCCUPANCY,
  RESEARCH_PARAMETER_SET_VERSION,
  RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,
  RESEARCH_TIMESTEP_SECONDS,
  type ResearchDisruptionConditionId,
} from "../../src/scenario/researchParameterSet";

import {
  createVisualizationResult,
} from "../../src/visualization/createVisualizationResult";

import type {
  Position2D,
  ScenarioInstance,
} from "../../src/types/scenario";
import type {
  RoutingStrategyId,
} from "../../src/types/routingStrategy";
import type {
  SpawnZone,
} from "../../src/types/spawn";

const STRATEGIES:
  readonly RoutingStrategyId[] =
[
  "NEAREST_EXIT",
  "STATIC_SHORTEST_PATH",
  "CONGESTION_AWARE",
  "HAZARD_AWARE",
  "ADAPTIVE_HYBRID",
];

function polygonCenter(
  zone:
    SpawnZone,
): Position2D {
  const vertices =
    zone.polygon.vertices;

  if (
    vertices.length ===
    0
  ) {
    throw new Error(
      `Spawn zone ${zone.id} has no vertices.`,
    );
  }

  const total =
    vertices.reduce(
      (
        accumulator,
        vertex,
      ) => ({
        x:
          accumulator.x +
          vertex.x,

        y:
          accumulator.y +
          vertex.y,
      }),
      {
        x:
          0,

        y:
          0,
      },
    );

  return {
    x:
      total.x /
      vertices.length,

    y:
      total.y /
      vertices.length,
  };
}

function createScenario(
  conditionId:
    ResearchDisruptionConditionId,
  strategyId:
    RoutingStrategyId,
): ScenarioInstance {
  const condition =
    getResearchDisruptionCondition(
      conditionId,
    );

  return {
    id:
      `visual-headless-${conditionId}-${strategyId}`,

    seed:
      1042,

    layoutId:
      "layout-a",

    parameterSetVersion:
      RESEARCH_PARAMETER_SET_VERSION,

    occupants:
      Array.from(
        {
          length:
            RESEARCH_OCCUPANCY
              .MEDIUM,
        },
        (
          _,
          index,
        ) => {
          const spawnZone =
            layoutASpawnZones
              .zones[
                index %
                layoutASpawnZones
                  .zones
                  .length
              ];

          if (!spawnZone) {
            throw new Error(
              "Unable to select Layout A spawn zone.",
            );
          }

          return {
            id:
              `agent-${String(
                index + 1,
              ).padStart(
                4,
                "0",
              )}`,

            spawnPosition:
              polygonCenter(
                spawnZone,
              ),

            desiredSpeedMps:
              1.34,
          };
        },
      ),

    disruptionSchedule:
      condition.events,
  };
}

function runCase(
  conditionId:
    ResearchDisruptionConditionId,
  strategyId:
    RoutingStrategyId,
) {
  return runHeadlessSimulation({
    scenario:
      createScenario(
        conditionId,
        strategyId,
      ),

    environment:
      layoutA,

    graph:
      layoutANavigationGraph,

    exits:
      layoutAExits,

    spawnZones:
      layoutASpawnZones,

    configuration: {
      strategyId,

      timestepSeconds:
        RESEARCH_TIMESTEP_SECONDS,

      maximumSimulationTimeSeconds:
        180,

      densityCellLengthMeters:
        RESEARCH_DENSITY_CELL_LENGTH_METERS,

      specificFlowPersonsPerMeterSecond:
        RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,

      adaptiveRerouteThreshold:
        RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
    },
  });
}

describe(
  "Visual vs headless result consistency",
  () => {
    it("copies the authoritative Layout A geometry without changing it", () => {
      const result =
        runCase(
          "D0_BASELINE",
          "STATIC_SHORTEST_PATH",
        );

      const visual =
        createVisualizationResult({
          result,

          environment:
            layoutA,

          graph:
            layoutANavigationGraph,

          exits:
            layoutAExits,
        });

      expect(
        visual.layout
          .layoutId,
      ).toBe(
        layoutA.layoutId,
      );

      expect(
        visual.layout
          .widthMeters,
      ).toBe(
        layoutA.widthMeters,
      );

      expect(
        visual.layout
          .heightMeters,
      ).toBe(
        layoutA.heightMeters,
      );

      expect(
        visual.layout
          .zones,
      ).toEqual(
        layoutA.zones,
      );

      expect(
        visual.layout
          .navigationNodes,
      ).toEqual(
        layoutANavigationGraph
          .nodes,
      );

      expect(
        visual.layout
          .navigationEdges,
      ).toEqual(
        layoutANavigationGraph
          .edges,
      );

      expect(
        visual.layout
          .exits,
      ).toEqual(
        layoutAExits.exits,
      );
    });

    it("matches headless results across every frozen disruption condition and routing strategy", () => {
      for (
        const condition of
          RESEARCH_DISRUPTION_CONDITIONS
      ) {
        for (
          const strategyId of
            STRATEGIES
        ) {
          const result =
            runCase(
              condition.id,
              strategyId,
            );

          const visual =
            createVisualizationResult({
              result,

              environment:
                layoutA,

              graph:
                layoutANavigationGraph,

              exits:
                layoutAExits,
            });

          expect(
            visual.scenarioId,
          ).toBe(
            result.scenarioId,
          );

          expect(
            visual.parameterSetId,
          ).toBe(
            result.parameterSetId,
          );

          expect(
            visual.seed,
          ).toBe(
            result.seed,
          );

          expect(
            visual.layoutId,
          ).toBe(
            result.layoutId,
          );

          expect(
            visual.strategyId,
          ).toBe(
            result.strategyId,
          );

          expect(
            visual.timestepSeconds,
          ).toBe(
            result.timestepSeconds,
          );

          expect(
            visual.simulatedTimeSeconds,
          ).toBe(
            result.simulatedTimeSeconds,
          );

          expect(
            visual.ticks,
          ).toBe(
            result.ticks,
          );

          expect(
            visual.termination,
          ).toEqual(
            result.termination,
          );

          expect(
            visual.metrics,
          ).toEqual(
            result.metrics,
          );

          expect(
            visual.queueMetrics,
          ).toEqual(
            result.queueMetrics,
          );

          expect(
            visual.appliedDisruptions,
          ).toEqual(
            result.appliedDisruptions,
          );

          expect(
            visual.agents,
          ).toEqual(
            result.finalAgents,
          );

          expect(
            visual.agents.length,
          ).toBe(
            result.metrics
              .totalAgents,
          );

          for (
            let index = 0;
            index <
            visual.agents.length;
            index += 1
          ) {
            const visualAgent =
              visual.agents[
                index
              ];

            const headlessAgent =
              result.finalAgents[
                index
              ];

            expect(
              visualAgent,
            ).toBeDefined();

            expect(
              headlessAgent,
            ).toBeDefined();

            expect(
              visualAgent!
                .id,
            ).toBe(
              headlessAgent!
                .id,
            );

            expect(
              visualAgent!
                .position.x,
            ).toBe(
              headlessAgent!
                .position.x,
            );

            expect(
              visualAgent!
                .position.y,
            ).toBe(
              headlessAgent!
                .position.y,
            );

            expect(
              visualAgent!
                .status,
            ).toBe(
              headlessAgent!
                .status,
            );

            expect(
              visualAgent!
                .currentNodeId,
            ).toBe(
              headlessAgent!
                .currentNodeId,
            );

            expect(
              visualAgent!
                .currentEdgeId,
            ).toBe(
              headlessAgent!
                .currentEdgeId,
            );

            expect(
              visualAgent!
                .routeNodeIds,
            ).toEqual(
              headlessAgent!
                .routeNodeIds,
            );

            expect(
              visualAgent!
                .routeCursorIndex,
            ).toBe(
              headlessAgent!
                .routeCursorIndex,
            );

            expect(
              visualAgent!
                .targetExitId,
            ).toBe(
              headlessAgent!
                .targetExitId,
            );

            expect(
              visualAgent!
                .rerouteCount,
            ).toBe(
              headlessAgent!
                .rerouteCount,
            );

            expect(
              visualAgent!
                .distanceTraveledMeters,
            ).toBe(
              headlessAgent!
                .distanceTraveledMeters,
            );

            expect(
              visualAgent!
                .hazardExposureSeconds,
            ).toBe(
              headlessAgent!
                .hazardExposureSeconds,
            );

            expect(
              visualAgent!
                .evacuationTimeSeconds,
            ).toBe(
              headlessAgent!
                .evacuationTimeSeconds,
            );
          }
        }
      }
    });

    it("returns a detached read-only visualization projection", () => {
      const result =
        runCase(
          "D4_COMBINED",
          "ADAPTIVE_HYBRID",
        );

      const visual =
        createVisualizationResult({
          result,

          environment:
            layoutA,

          graph:
            layoutANavigationGraph,

          exits:
            layoutAExits,
        });

      expect(
        Object.isFrozen(
          visual,
        ),
      ).toBe(true);

      expect(
        Object.isFrozen(
          visual.layout,
        ),
      ).toBe(true);

      expect(
        Object.isFrozen(
          visual.agents,
        ),
      ).toBe(true);

      expect(
        Object.isFrozen(
          visual.appliedDisruptions,
        ),
      ).toBe(true);

      expect(
        Object.isFrozen(
          visual.metrics,
        ),
      ).toBe(true);

      expect(
        Object.isFrozen(
          visual.queueMetrics,
        ),
      ).toBe(true);

      expect(
        Object.isFrozen(
          visual.termination,
        ),
      ).toBe(true);

      for (
        const agent of
          visual.agents
      ) {
        expect(
          Object.isFrozen(
            agent,
          ),
        ).toBe(true);

        expect(
          Object.isFrozen(
            agent.position,
          ),
        ).toBe(true);

        expect(
          Object.isFrozen(
            agent.routeNodeIds,
          ),
        ).toBe(true);
      }

      expect(
        visual.agents,
      ).not.toBe(
        result.finalAgents,
      );

      expect(
        visual.layout.zones,
      ).not.toBe(
        layoutA.zones,
      );

      expect(
        visual.layout
          .navigationEdges,
      ).not.toBe(
        layoutANavigationGraph
          .edges,
      );

      expect(
        visual.layout.exits,
      ).not.toBe(
        layoutAExits.exits,
      );
    });
  },
);