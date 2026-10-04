import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createArchitectureV2AuthoritativeBundle,
} from "../../src/app/createArchitectureV2DemoReplay";

import {
  runHeadlessSimulation,
} from "../../src/core/runHeadlessSimulation";

import {
  layoutAArchitectureV2,
} from "../../src/environment/layoutAArchitectureV2";

import {
  layoutAArchitectureV2Environment,
  LAYOUT_A_ARCHITECTURE_V2_ID,
} from "../../src/environment/layoutAArchitectureV2Environment";

import {
  layoutAArchitectureV2Exits,
} from "../../src/environment/layoutAArchitectureV2Exits";

import {
  ARCHITECTURE_V2_FORMAL_LOW_AGENT_IDS,
  ARCHITECTURE_V2_FORMAL_LOW_ROOM_IDS,
  ARCHITECTURE_V2_FORMAL_SPATIAL_BASE_SEED,
  createArchitectureV2FormalPopulationBundle,
  getArchitectureV2FormalPopulationCount,
} from "../../src/population/architectureV2FormalPopulation";

import type {
  ArchitectureV2FormalPopulationBundle,
  ArchitectureV2FormalPopulationLevel,
} from "../../src/population/architectureV2FormalPopulation";

import {
  ARCHITECTURE_V2_RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
  ARCHITECTURE_V2_RESEARCH_DENSITY_CELL_LENGTH_METERS,
  ARCHITECTURE_V2_RESEARCH_OCCUPANCY,
  ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,
  ARCHITECTURE_V2_RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,
  ARCHITECTURE_V2_RESEARCH_TIMESTEP_SECONDS,
} from "../../src/scenario/architectureV2ResearchParameterSet";

import {
  pointInOrOnRoomPolygon,
} from "../../src/visualization/createRoomOccupantPreview";

function interpolate(
  start: {
    readonly x:
      number;

    readonly y:
      number;
  },

  end: {
    readonly x:
      number;

    readonly y:
      number;
  },

  t:
    number,
) {
  return {
    x:
      start.x +
      (
        end.x -
        start.x
      ) *
        t,

    y:
      start.y +
      (
        end.y -
        start.y
      ) *
        t,
  };
}

function requireBundle(
  level:
    ArchitectureV2FormalPopulationLevel,
): ArchitectureV2FormalPopulationBundle {
  return createArchitectureV2FormalPopulationBundle(
    level,
  );
}

function positionsByAgentId(
  bundle:
    ArchitectureV2FormalPopulationBundle,
): ReadonlyMap<
  string,
  {
    readonly x:
      number;

    readonly y:
      number;
  }
> {
  return new Map(
    bundle.scenario
      .occupants
      .map(
        (
          occupant,
        ) =>
          [
            occupant.id,
            {
              x:
                occupant
                  .spawnPosition
                  .x,

              y:
                occupant
                  .spawnPosition
                  .y,
            },
          ] as const,
      ),
  );
}

function expectPopulationIsSubset(
  subset:
    ArchitectureV2FormalPopulationBundle,

  superset:
    ArchitectureV2FormalPopulationBundle,
): void {
  const supersetPositions =
    positionsByAgentId(
      superset,
    );

  for (
    const occupant of
      subset.scenario
        .occupants
  ) {
    const corresponding =
      supersetPositions.get(
        occupant.id,
      );

    expect(
      corresponding,
      `${occupant.id} should exist in ${superset.level}`,
    ).toBeDefined();

    expect(
      corresponding?.x,
    ).toBeCloseTo(
      occupant
        .spawnPosition
        .x,
      12,
    );

    expect(
      corresponding?.y,
    ).toBeCloseTo(
      occupant
        .spawnPosition
        .y,
      12,
    );
  }
}

function expectValidRoomOriginStructure(
  bundle:
    ArchitectureV2FormalPopulationBundle,
): void {
  expect(
    bundle.scenario
      .occupants,
  ).toHaveLength(
    bundle.population,
  );

  expect(
    bundle.spawnZones
      .zones,
  ).toHaveLength(
    bundle.population,
  );

  const nodeById =
    new Map(
      bundle.graph
        .nodes
        .map(
          (
            node,
          ) =>
            [
              node.id,
              node,
            ] as const,
        ),
    );

  for (
    const occupant of
      bundle.scenario
        .occupants
  ) {
    const matchingSpawnZones =
      bundle.spawnZones
        .zones
        .filter(
          (
            zone,
          ) =>
            zone.id ===
            `spawn-${occupant.id}`,
        );

    expect(
      matchingSpawnZones,
      `${occupant.id} should have exactly one spawn zone`,
    ).toHaveLength(
      1,
    );

    const spawnZone =
      matchingSpawnZones[0]!;

    expect(
      pointInOrOnRoomPolygon(
        occupant.spawnPosition,
        spawnZone.polygon
          .vertices,
      ),
      `${occupant.id} should be inside its private spawn polygon`,
    ).toBe(
      true,
    );

    const room =
      layoutAArchitectureV2
        .rooms
        .find(
          (
            candidate,
          ) =>
            candidate.id ===
            spawnZone.roomZoneId,
        );

    if (!room) {
      throw new Error(
        `Architecture V2 room not found: ${spawnZone.roomZoneId}`,
      );
    }

    expect(
      pointInOrOnRoomPolygon(
        occupant.spawnPosition,
        room.polygon,
      ),
      `${occupant.id} should originate inside ${room.id}`,
    ).toBe(
      true,
    );

    const originNode =
      nodeById.get(
        spawnZone.accessNodeId,
      );

    expect(
      originNode,
      `${occupant.id} should have a room-origin node`,
    ).toBeDefined();

    if (!originNode) {
      throw new Error(
        `Missing room-origin node for ${occupant.id}.`,
      );
    }

    expect(
      originNode.id,
    ).toBe(
      `room-origin-${occupant.id}`,
    );

    expect(
      originNode.position.x,
    ).toBeCloseTo(
      occupant
        .spawnPosition
        .x,
      12,
    );

    expect(
      originNode.position.y,
    ).toBeCloseTo(
      occupant
        .spawnPosition
        .y,
      12,
    );

    expect(
      originNode.zoneId,
    ).toBe(
      room.id,
    );

    const outgoingOriginEdges =
      bundle.graph
        .edges
        .filter(
          (
            edge,
          ) =>
            edge.from ===
            originNode.id,
        );

    expect(
      outgoingOriginEdges,
      `${occupant.id} should have exactly one room-origin edge`,
    ).toHaveLength(
      1,
    );

    const originEdge =
      outgoingOriginEdges[0]!;

    expect(
      originEdge.id,
    ).toBe(
      `room-origin-edge-${occupant.id}`,
    );

    expect(
      originEdge.bidirectional,
    ).toBe(
      false,
    );

    expect(
      originEdge.zoneId,
    ).toBe(
      room.id,
    );

    expect(
      room.doors
        .some(
          (
            door,
          ) =>
            door.id ===
            originEdge.to,
        ),
    ).toBe(
      true,
    );

    const doorNode =
      nodeById.get(
        originEdge.to,
      );

    if (!doorNode) {
      throw new Error(
        `Door node not found for ${originEdge.id}.`,
      );
    }

    /**
     * Verify that the private room-origin segment stays
     * inside the assigned room until it reaches the door.
     */
    const samples =
      Math.max(
        2,
        Math.ceil(
          originEdge.lengthMeters /
          0.10,
        ),
      );

    for (
      let sampleIndex =
        0;
      sampleIndex <=
      samples;
      sampleIndex +=
        1
    ) {
      const sample =
        interpolate(
          originNode.position,
          doorNode.position,
          sampleIndex /
            samples,
        );

      expect(
        pointInOrOnRoomPolygon(
          sample,
          room.polygon,
        ),
        `${originEdge.id} leaves ${room.id} before reaching its door`,
      ).toBe(
        true,
      );
    }
  }
}

function runD0Baseline(
  bundle:
    ArchitectureV2FormalPopulationBundle,
) {
  return runHeadlessSimulation({
    scenario: {
      ...bundle.scenario,

      disruptionSchedule:
        [],
    },

    environment:
      layoutAArchitectureV2Environment,

    graph:
      bundle.graph,

    exits:
      layoutAArchitectureV2Exits,

    spawnZones:
      bundle.spawnZones,

    configuration: {
      strategyId:
        "ADAPTIVE_HYBRID",

      timestepSeconds:
        ARCHITECTURE_V2_RESEARCH_TIMESTEP_SECONDS,

      maximumSimulationTimeSeconds:
        180,

      densityCellLengthMeters:
        ARCHITECTURE_V2_RESEARCH_DENSITY_CELL_LENGTH_METERS,

      specificFlowPersonsPerMeterSecond:
        ARCHITECTURE_V2_RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,

      adaptiveRerouteThreshold:
        ARCHITECTURE_V2_RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
    },
  });
}

describe(
  "Architecture V2 formal population system",
  () => {
    it(
      "builds only the frozen LOW, MEDIUM, and HIGH population levels",
      () => {
        const low =
          requireBundle(
            "LOW",
          );

        const medium =
          requireBundle(
            "MEDIUM",
          );

        const high =
          requireBundle(
            "HIGH",
          );

        expect(
          getArchitectureV2FormalPopulationCount(
            "LOW",
          ),
        ).toBe(
          14,
        );

        expect(
          getArchitectureV2FormalPopulationCount(
            "MEDIUM",
          ),
        ).toBe(
          42,
        );

        expect(
          getArchitectureV2FormalPopulationCount(
            "HIGH",
          ),
        ).toBe(
          70,
        );

        expect(
          low.population,
        ).toBe(
          ARCHITECTURE_V2_RESEARCH_OCCUPANCY
            .LOW,
        );

        expect(
          medium.population,
        ).toBe(
          ARCHITECTURE_V2_RESEARCH_OCCUPANCY
            .MEDIUM,
        );

        expect(
          high.population,
        ).toBe(
          ARCHITECTURE_V2_RESEARCH_OCCUPANCY
            .HIGH,
        );

        expect(
          low.scenario
            .occupants,
        ).toHaveLength(
          14,
        );

        expect(
          medium.scenario
            .occupants,
        ).toHaveLength(
          42,
        );

        expect(
          high.scenario
            .occupants,
        ).toHaveLength(
          70,
        );

        for (
          const bundle of
            [
              low,
              medium,
              high,
            ]
        ) {
          expect(
            bundle.scenario
              .layoutId,
          ).toBe(
            LAYOUT_A_ARCHITECTURE_V2_ID,
          );

          expect(
            bundle.graph
              .layoutId,
          ).toBe(
            LAYOUT_A_ARCHITECTURE_V2_ID,
          );

          expect(
            bundle.spawnZones
              .layoutId,
          ).toBe(
            LAYOUT_A_ARCHITECTURE_V2_ID,
          );

          expect(
            bundle.scenario
              .parameterSetVersion,
          ).toBe(
            ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,
          );

          expect(
            bundle.scenario
              .seed,
          ).toBe(
            ARCHITECTURE_V2_FORMAL_SPATIAL_BASE_SEED,
          );

          expect(
            bundle.scenario
              .disruptionSchedule,
          ).toEqual(
            [],
          );
        }
      },
    );

    it(
      "freezes the approved LOW room and occupant selection",
      () => {
        const low =
          requireBundle(
            "LOW",
          );

        const lowAgentIds =
          low.scenario
            .occupants
            .map(
              (
                occupant,
              ) =>
                occupant.id,
            );

        expect(
          lowAgentIds,
        ).toEqual(
          [
            ...ARCHITECTURE_V2_FORMAL_LOW_AGENT_IDS,
          ],
        );

        const lowRoomIds =
          low.spawnZones
            .zones
            .map(
              (
                zone,
              ) =>
                zone.roomZoneId,
            );

        expect(
          lowRoomIds,
        ).toEqual(
          [
            ...ARCHITECTURE_V2_FORMAL_LOW_ROOM_IDS,
          ],
        );

        expect(
          new Set(
            lowAgentIds,
          ).size,
        ).toBe(
          14,
        );

        expect(
          new Set(
            lowRoomIds,
          ).size,
        ).toBe(
          14,
        );
      },
    );

    it(
      "preserves the nested LOW subset MEDIUM subset HIGH spatial hierarchy",
      () => {
        const low =
          requireBundle(
            "LOW",
          );

        const medium =
          requireBundle(
            "MEDIUM",
          );

        const high =
          requireBundle(
            "HIGH",
          );

        expectPopulationIsSubset(
          low,
          medium,
        );

        expectPopulationIsSubset(
          medium,
          high,
        );

        const lowIds =
          new Set(
            low.scenario
              .occupants
              .map(
                (
                  occupant,
                ) =>
                  occupant.id,
              ),
          );

        const mediumIds =
          new Set(
            medium.scenario
              .occupants
              .map(
                (
                  occupant,
                ) =>
                  occupant.id,
              ),
          );

        const highIds =
          new Set(
            high.scenario
              .occupants
              .map(
                (
                  occupant,
                ) =>
                  occupant.id,
              ),
          );

        expect(
          [
            ...lowIds,
          ].every(
            (
              id,
            ) =>
              mediumIds.has(
                id,
              ),
          ),
        ).toBe(
          true,
        );

        expect(
          [
            ...mediumIds,
          ].every(
            (
              id,
            ) =>
              highIds.has(
                id,
              ),
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "keeps the frozen 42-person Medium population spatially unchanged",
      () => {
        const previousAuthoritative =
          createArchitectureV2AuthoritativeBundle();

        const formalMedium =
          requireBundle(
            "MEDIUM",
          );

        /**
         * IDs, positions, desired speeds, graph geometry,
         * and private spawn zones must remain identical.
         *
         * Scenario ID and parameter-set version intentionally
         * differ because the formal module now belongs to the
         * frozen Architecture V2 research configuration.
         */
        expect(
          formalMedium.scenario
            .occupants,
        ).toEqual(
          previousAuthoritative
            .scenario
            .occupants,
        );

        expect(
          formalMedium.graph,
        ).toEqual(
          previousAuthoritative
            .graph,
        );

        expect(
          formalMedium.spawnZones,
        ).toEqual(
          previousAuthoritative
            .spawnZones,
        );
      },
    );

    it(
      "gives every formal occupant a valid room origin, private spawn zone, and room-to-door edge",
      () => {
        expectValidRoomOriginStructure(
          requireBundle(
            "LOW",
          ),
        );

        expectValidRoomOriginStructure(
          requireBundle(
            "MEDIUM",
          ),
        );

        expectValidRoomOriginStructure(
          requireBundle(
            "HIGH",
          ),
        );
      },
    );

    it(
      "reproduces identical spatial populations on repeated generation",
      () => {
        const levels:
          readonly ArchitectureV2FormalPopulationLevel[] =
        [
          "LOW",
          "MEDIUM",
          "HIGH",
        ];

        for (
          const level of
            levels
        ) {
          const first =
            requireBundle(
              level,
            );

          const second =
            requireBundle(
              level,
            );

          expect(
            second.scenario
              .occupants,
          ).toEqual(
            first.scenario
              .occupants,
          );

          expect(
            second.graph,
          ).toEqual(
            first.graph,
          );

          expect(
            second.spawnZones,
          ).toEqual(
            first.spawnZones,
          );
        }
      },
    );

    it(
      "reproduces the calibrated LOW, MEDIUM, and HIGH D0 baseline signatures",
      () => {
        const low =
          runD0Baseline(
            requireBundle(
              "LOW",
            ),
          );

        const medium =
          runD0Baseline(
            requireBundle(
              "MEDIUM",
            ),
          );

        const high =
          runD0Baseline(
            requireBundle(
              "HIGH",
            ),
          );

        for (
          const [
            expectedPopulation,
            result,
          ] of
            [
              [
                14,
                low,
              ],
              [
                42,
                medium,
              ],
              [
                70,
                high,
              ],
            ] as const
        ) {
          expect(
            result.metrics
              .totalAgents,
          ).toBe(
            expectedPopulation,
          );

          expect(
            result.metrics
              .evacuatedAgents,
          ).toBe(
            expectedPopulation,
          );

          expect(
            result.metrics
              .completionRate,
          ).toBe(
            1,
          );

          expect(
            result.metrics
              .unreachableAgents,
          ).toBe(
            0,
          );

          expect(
            result.metrics
              .timeoutAgents,
          ).toBe(
            0,
          );
        }

        /**
         * LOW V2 approved spatial-design smoke signature.
         */
        expect(
          low.metrics
            .totalEvacuationTimeSeconds,
        ).toBeCloseTo(
          37.55,
          8,
        );

        expect(
          low.metrics
            .maximumLocalDensityPersonsPerSquareMeter,
        ).toBeCloseTo(
          1.11,
          2,
        );

        expect(
          low.queueMetrics
            .populationQueueWaitPersonSeconds,
        ).toBeCloseTo(
          28.95,
          8,
        );

        /**
         * Frozen Medium calibration signature.
         */
        expect(
          medium.metrics
            .totalEvacuationTimeSeconds,
        ).toBeCloseTo(
          39.90,
          8,
        );

        expect(
          medium.metrics
            .maximumLocalDensityPersonsPerSquareMeter,
        ).toBeCloseTo(
          1.6666666666666665,
          8,
        );

        expect(
          medium.queueMetrics
            .populationQueueWaitPersonSeconds,
        ).toBeCloseTo(
          91.80,
          8,
        );

        /**
         * Frozen High = 70 occupancy calibration signature.
         */
        expect(
          high.metrics
            .totalEvacuationTimeSeconds,
        ).toBeCloseTo(
          40.70,
          8,
        );

        expect(
          high.metrics
            .maximumLocalDensityPersonsPerSquareMeter,
        ).toBeCloseTo(
          2.78,
          2,
        );

        expect(
          high.queueMetrics
            .populationQueueWaitPersonSeconds,
        ).toBeCloseTo(
          160.20,
          8,
        );
      },
    );
  },
);