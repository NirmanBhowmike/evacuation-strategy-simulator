import {
  runHeadlessSimulation,
} from "../src/core/runHeadlessSimulation";

import {
  ARCHITECTURE_V2_FORMAL_STRATEGY_IDS,
} from "../src/experiment/architectureV2FormalExperimentDesign";

import {
  createArchitectureV2FormalScenario,
} from "../src/scenario/architectureV2FormalScenario";

import {
  ARCHITECTURE_V2_RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
  ARCHITECTURE_V2_RESEARCH_DENSITY_CELL_LENGTH_METERS,
  ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS,
  ARCHITECTURE_V2_RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,
  ARCHITECTURE_V2_RESEARCH_TIMESTEP_SECONDS,
} from "../src/scenario/architectureV2ResearchParameterSet";

import type {
  NavigationEdge,
} from "../src/types/navigation";

const CALIBRATION_SEEDS =
  Object.freeze([
    910001,
    910002,
    910003,
    910004,
    910005,
  ] as const);

const POPULATION_LEVEL =
  "MEDIUM" as const;

const CONDITION_ID =
  "D0_BASELINE" as const;

const MAXIMUM_SIMULATION_TIME_SECONDS =
  180;

const REPLAY_INTERVAL_SECONDS =
  0.05;

interface ExitAggregate {
  readonly exitId:
    string;

  totalEvacuated:
    number;

  runsUsed:
    number;
}

interface EdgeAggregate {
  readonly edgeId:
    string;

  readonly zoneId:
    string;

  readonly from:
    string;

  readonly to:
    string;

  readonly lengthMeters:
    number;

  readonly widthMeters:
    number;

  totalAgentTraversals:
    number;

  runsUsed:
    number;
}

function requireEdge(
  edgeById:
    ReadonlyMap<
      string,
      NavigationEdge
    >,

  edgeId:
    string,
): NavigationEdge {
  const edge =
    edgeById.get(
      edgeId,
    );

  if (!edge) {
    throw new Error(
      `Navigation edge not found during calibration profiling: ${edgeId}`,
    );
  }

  return edge;
}

function round(
  value:
    number,
  digits =
    2,
): number {
  const factor =
    10 ** digits;

  return (
    Math.round(
      value *
      factor,
    ) /
    factor
  );
}

async function main():
  Promise<void> {
  const exitAggregates =
    new Map<
      string,
      ExitAggregate
    >();

  const edgeAggregates =
    new Map<
      string,
      EdgeAggregate
    >();

  let completedRuns =
    0;

  for (
    const replicationSeed of
      CALIBRATION_SEEDS
  ) {
    for (
      const strategyId of
        ARCHITECTURE_V2_FORMAL_STRATEGY_IDS
    ) {
      const bundle =
        createArchitectureV2FormalScenario({
          populationLevel:
            POPULATION_LEVEL,

          conditionId:
            CONDITION_ID,

          replicationSeed,
        });

      const edgeById =
        new Map<
          string,
          NavigationEdge
        >(
          bundle.graph.edges.map(
            (
              edge,
            ) => [
              edge.id,
              edge,
            ],
          ),
        );

      const agentsByTraversedEdge =
        new Map<
          string,
          Set<string>
        >();

      const result =
        runHeadlessSimulation({
          scenario:
            bundle.scenario,

          environment:
            bundle.environment,

          graph:
            bundle.graph,

          exits:
            bundle.exits,

          spawnZones:
            bundle.spawnZones,

          configuration: {
            strategyId,

            timestepSeconds:
              ARCHITECTURE_V2_RESEARCH_TIMESTEP_SECONDS,

            maximumSimulationTimeSeconds:
              MAXIMUM_SIMULATION_TIME_SECONDS,

            densityCellLengthMeters:
              ARCHITECTURE_V2_RESEARCH_DENSITY_CELL_LENGTH_METERS,

            specificFlowPersonsPerMeterSecond:
              ARCHITECTURE_V2_RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,

            adaptiveRerouteThreshold:
              ARCHITECTURE_V2_RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
          },

          replayIntervalSeconds:
            REPLAY_INTERVAL_SECONDS,

          replayObserver:
            (
              frame,
            ) => {
              for (
                const agent of
                  frame.snapshot.agents
              ) {
                if (
                  agent.currentEdgeId ===
                  null
                ) {
                  continue;
                }

                let agents =
                  agentsByTraversedEdge.get(
                    agent.currentEdgeId,
                  );

                if (!agents) {
                  agents =
                    new Set<string>();

                  agentsByTraversedEdge.set(
                    agent.currentEdgeId,
                    agents,
                  );
                }

                agents.add(
                  agent.id,
                );
              }
            },
        });

      if (
        result.metrics
          .completionRate !==
        1
      ) {
        throw new Error(
          [
            "Baseline calibration run did not complete.",
            `seed=${replicationSeed}`,
            `strategy=${strategyId}`,
            `completion=${result.metrics.completionRate}`,
          ].join(
            " ",
          ),
        );
      }

      completedRuns +=
        1;

      for (
        const exitMetric of
          result.metrics
            .exitUtilization
      ) {
        let aggregate =
          exitAggregates.get(
            exitMetric.exitId,
          );

        if (!aggregate) {
          aggregate = {
            exitId:
              exitMetric.exitId,

            totalEvacuated:
              0,

            runsUsed:
              0,
          };

          exitAggregates.set(
            exitMetric.exitId,
            aggregate,
          );
        }

        aggregate.totalEvacuated +=
          exitMetric.evacuatedAgents;

        if (
          exitMetric.evacuatedAgents >
          0
        ) {
          aggregate.runsUsed +=
            1;
        }
      }

      for (
        const [
          edgeId,
          agents,
        ] of
          agentsByTraversedEdge
      ) {
        const edge =
          requireEdge(
            edgeById,
            edgeId,
          );

        let aggregate =
          edgeAggregates.get(
            edgeId,
          );

        if (!aggregate) {
          aggregate = {
            edgeId:
              edge.id,

            zoneId:
              edge.zoneId,

            from:
              edge.from,

            to:
              edge.to,

            lengthMeters:
              edge.lengthMeters,

            widthMeters:
              edge.widthMeters,

            totalAgentTraversals:
              0,

            runsUsed:
              0,
          };

          edgeAggregates.set(
            edgeId,
            aggregate,
          );
        }

        aggregate.totalAgentTraversals +=
          agents.size;

        aggregate.runsUsed +=
          1;
      }
    }
  }

  const totalRuns =
    CALIBRATION_SEEDS.length *
    ARCHITECTURE_V2_FORMAL_STRATEGY_IDS.length;

  if (
    completedRuns !==
    totalRuns
  ) {
    throw new Error(
      `Expected ${totalRuns} completed calibration runs, found ${completedRuns}.`,
    );
  }

  const exitRanking =
    [
      ...exitAggregates.values(),
    ]
      .map(
        (
          aggregate,
        ) => ({
          exitId:
            aggregate.exitId,

          meanEvacuatedPerRun:
            round(
              aggregate.totalEvacuated /
              totalRuns,
            ),

          runsUsed:
            aggregate.runsUsed,

          totalRuns,
        }),
      )
      .sort(
        (
          left,
          right,
        ) =>
          right.meanEvacuatedPerRun -
          left.meanEvacuatedPerRun,
      );

  const corridorRanking =
    [
      ...edgeAggregates.values(),
    ]
      .filter(
        (
          aggregate,
        ) =>
          aggregate.zoneId
            .startsWith(
              "corridor-",
            ) &&
          aggregate.edgeId !==
            ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS
              .CORRIDOR_EDGE,
      )
      .map(
        (
          aggregate,
        ) => ({
          edgeId:
            aggregate.edgeId,

          zoneId:
            aggregate.zoneId,

          from:
            aggregate.from,

          to:
            aggregate.to,

          lengthMeters:
            aggregate.lengthMeters,

          widthMeters:
            aggregate.widthMeters,

          meanAgentsUsingPerRun:
            round(
              aggregate.totalAgentTraversals /
              totalRuns,
            ),

          runsUsed:
            aggregate.runsUsed,

          totalRuns,
        }),
      )
      .sort(
        (
          left,
          right,
        ) =>
          right.meanAgentsUsingPerRun -
          left.meanAgentsUsingPerRun,
      );

  console.log(
    "",
  );

  console.log(
    "Architecture V2 Alternate Disruption Calibration Profile",
  );

  console.log(
    "=======================================================",
  );

  console.log(
    `Population: ${POPULATION_LEVEL}`,
  );

  console.log(
    `Condition: ${CONDITION_ID}`,
  );

  console.log(
    `Seeds: ${CALIBRATION_SEEDS.join(", ")}`,
  );

  console.log(
    `Strategies: ${ARCHITECTURE_V2_FORMAL_STRATEGY_IDS.length}`,
  );

  console.log(
    `Completed runs: ${completedRuns}`,
  );

  console.log(
    "",
  );

  console.log(
    "EXIT USAGE",
  );

  console.table(
    exitRanking,
  );

  console.log(
    "",
  );

  console.log(
    "CORRIDOR EDGE USAGE",
  );

  console.log(
    "Current D3 target edge is excluded from this table.",
  );

  console.table(
    corridorRanking,
  );

  console.log(
    "",
  );

  console.log(
    "Use this profile only to select D5/D6 calibration candidates.",
  );

  console.log(
    "Do not change the frozen formal parameter set until the candidates are tested.",
  );
}

void main();