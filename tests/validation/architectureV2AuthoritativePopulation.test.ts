import {
  describe,
  expect,
  it,
} from "vitest";

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
  createArchitectureV2AuthoritativeBundle,
  createArchitectureV2DemoReplay,
  ARCHITECTURE_V2_OCCUPANCY,
  ARCHITECTURE_V2_STRESS_TEST_OCCUPANCY,
} from "../../src/app/createArchitectureV2DemoReplay";

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

describe(
  "Architecture V2 authoritative 42-person population",
  () => {
    it(
      "uses the calibrated Architecture V2 occupancy levels and consistent layout identifiers",
      () => {
        const bundle =
          createArchitectureV2AuthoritativeBundle();

        expect(
          ARCHITECTURE_V2_OCCUPANCY,
        ).toEqual({
          LOW:
            14,

          MEDIUM:
            42,

          HIGH:
            70,
        });

        expect(
          ARCHITECTURE_V2_STRESS_TEST_OCCUPANCY,
        ).toBe(
          84,
        );

        expect(
          ARCHITECTURE_V2_OCCUPANCY
            .MEDIUM -
            ARCHITECTURE_V2_OCCUPANCY
              .LOW,
        ).toBe(
          28,
        );

        expect(
          ARCHITECTURE_V2_OCCUPANCY
            .HIGH -
            ARCHITECTURE_V2_OCCUPANCY
              .MEDIUM,
        ).toBe(
          28,
        );

        expect(
          bundle.scenario
            .occupants,
        ).toHaveLength(
          42,
        );

        expect(
          bundle.spawnZones
            .zones,
        ).toHaveLength(
          42,
        );

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
          layoutAArchitectureV2Environment
            .layoutId,
        ).toBe(
          LAYOUT_A_ARCHITECTURE_V2_ID,
        );

        expect(
          layoutAArchitectureV2Exits
            .layoutId,
        ).toBe(
          LAYOUT_A_ARCHITECTURE_V2_ID,
        );
      },
    );

    it(
      "places every spawn access node exactly at its room-origin coordinate",
      () => {
        const bundle =
          createArchitectureV2AuthoritativeBundle();

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
          let index =
            0;
          index <
            bundle.scenario
              .occupants
              .length;
          index +=
            1
        ) {
          const occupant =
            bundle.scenario
              .occupants[
                index
              ]!;

          const spawnZone =
            bundle.spawnZones
              .zones[
                index
              ]!;

          const accessNode =
            nodeById.get(
              spawnZone
                .accessNodeId,
            );

          if (!accessNode) {
            throw new Error(
              `Missing access node for ${occupant.id}`,
            );
          }

          expect(
            accessNode.position.x,
          ).toBeCloseTo(
            occupant
              .spawnPosition
              .x,
            10,
          );

          expect(
            accessNode.position.y,
          ).toBeCloseTo(
            occupant
              .spawnPosition
              .y,
            10,
          );
        }
      },
    );

    it(
      "gives every occupant one directed room-origin edge ending at that room's real door",
      () => {
        const bundle =
          createArchitectureV2AuthoritativeBundle();

        for (
          const spawnZone of
            bundle.spawnZones
              .zones
        ) {
          const outgoing =
            bundle.graph
              .edges
              .filter(
                (
                  edge,
                ) =>
                  edge.from ===
                  spawnZone
                    .accessNodeId,
              );

          expect(
            outgoing,
            `${spawnZone.id} should have exactly one room-origin edge`,
          ).toHaveLength(
            1,
          );

          const edge =
            outgoing[0]!;

          expect(
            edge.bidirectional,
          ).toBe(
            false,
          );

          expect(
            edge.zoneId,
          ).toBe(
            spawnZone
              .roomZoneId,
          );

          const room =
            layoutAArchitectureV2
              .rooms
              .find(
                (
                  candidate,
                ) =>
                  candidate.id ===
                  spawnZone
                    .roomZoneId,
              );

          if (!room) {
            throw new Error(
              `Room not found: ${spawnZone.roomZoneId}`,
            );
          }

          expect(
            room.doors
              .some(
                (
                  door,
                ) =>
                  door.id ===
                  edge.to,
              ),
          ).toBe(
            true,
          );
        }
      },
    );

    it(
      "keeps every authoritative room-origin path inside its assigned room until the doorway",
      () => {
        const bundle =
          createArchitectureV2AuthoritativeBundle();

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
          const spawnZone of
            bundle.spawnZones
              .zones
        ) {
          const room =
            layoutAArchitectureV2
              .rooms
              .find(
                (
                  candidate,
                ) =>
                  candidate.id ===
                  spawnZone
                    .roomZoneId,
              );

          if (!room) {
            throw new Error(
              `Room not found: ${spawnZone.roomZoneId}`,
            );
          }

          const edge =
            bundle.graph
              .edges
              .find(
                (
                  candidate,
                ) =>
                  candidate.from ===
                  spawnZone
                    .accessNodeId,
              );

          if (!edge) {
            throw new Error(
              `Room-origin edge not found: ${spawnZone.id}`,
            );
          }

          const start =
            nodeById.get(
              edge.from,
            );

          const end =
            nodeById.get(
              edge.to,
            );

          if (
            !start ||
            !end
          ) {
            throw new Error(
              `Room-origin edge ${edge.id} has missing endpoints.`,
            );
          }

          const samples =
            Math.max(
              2,
              Math.ceil(
                edge.lengthMeters /
                  0.1,
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
            const t =
              sampleIndex /
              samples;

            const sample =
              interpolate(
                start.position,
                end.position,
                t,
              );

            expect(
              pointInOrOnRoomPolygon(
                sample,
                room.polygon,
              ),
              `${edge.id} leaves ${room.id} before reaching its door`,
            ).toBe(
              true,
            );
          }
        }
      },
    );

    it(
      "runs all 42 Medium occupants from room origins through Architecture V2 to real exits",
      () => {
        const replay =
          createArchitectureV2DemoReplay();

        expect(
          replay.frames.length,
        ).toBeGreaterThan(
          1,
        );

        const firstFrame =
          replay.frames[0]!;

        expect(
          firstFrame
            .snapshot
            .simulationTimeSeconds,
        ).toBe(
          0,
        );

        expect(
          firstFrame
            .metrics
            .totalAgents,
        ).toBe(
          ARCHITECTURE_V2_OCCUPANCY
            .MEDIUM,
        );

        /**
         * The first frame must still show the occupants at
         * their room origins rather than already at the doors.
         */
        const bundle =
          createArchitectureV2AuthoritativeBundle();

        const scenarioPositionById =
          new Map(
            bundle.scenario
              .occupants
              .map(
                (
                  occupant,
                ) =>
                  [
                    occupant.id,
                    occupant
                      .spawnPosition,
                  ] as const,
              ),
          );

        for (
          const agent of
            firstFrame
              .snapshot
              .agents
        ) {
          const expected =
            scenarioPositionById.get(
              agent.id,
            );

          if (!expected) {
            throw new Error(
              `Unexpected replay agent: ${agent.id}`,
            );
          }

          expect(
            agent.position.x,
          ).toBeCloseTo(
            expected.x,
            10,
          );

          expect(
            agent.position.y,
          ).toBeCloseTo(
            expected.y,
            10,
          );

          expect(
            agent.currentNodeId,
          ).toBe(
            `room-origin-${agent.id}`,
          );
        }

        expect(
          replay.result
            .metrics
            .totalAgents,
        ).toBe(
          ARCHITECTURE_V2_OCCUPANCY
            .MEDIUM,
        );

        expect(
          replay.result
            .metrics
            .evacuatedAgents,
        ).toBe(
          ARCHITECTURE_V2_OCCUPANCY
            .MEDIUM,
        );

        expect(
          replay.result
            .metrics
            .unreachableAgents,
        ).toBe(
          0,
        );

        expect(
          replay.result
            .metrics
            .timeoutAgents,
        ).toBe(
          0,
        );

        expect(
          replay.result
            .metrics
            .completionRate,
        ).toBe(
          1,
        );

        expect(
          replay.result
            .metrics
            .totalEvacuationTimeSeconds,
        ).not.toBeNull();
      },
    );
  },
);