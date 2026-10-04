import {
  describe,
  expect,
  it,
} from "vitest";

import {
  layoutAArchitectureV2,
} from "../../src/environment/layoutAArchitectureV2";

import {
  createRoomOccupantDistribution,
  createRoomOccupantPreview,
  pointInOrOnRoomPolygon,
  ROOM_OCCUPANT_PREVIEW_COUNT,
} from "../../src/visualization/createRoomOccupantPreview";

function distance(
  first: {
    readonly x:
      number;

    readonly y:
      number;
  },

  second: {
    readonly x:
      number;

    readonly y:
      number;
  },
): number {
  return Math.hypot(
    second.x -
      first.x,
    second.y -
      first.y,
  );
}

describe(
  "Architecture V2 room occupant preview",
  () => {
    it(
      "creates exactly 42 occupants and represents every room",
      () => {
        const agents =
          createRoomOccupantPreview();

        expect(
          ROOM_OCCUPANT_PREVIEW_COUNT,
        ).toBe(
          42,
        );

        expect(
          agents,
        ).toHaveLength(
          42,
        );

        const representedRooms =
          new Set(
            agents.map(
              (
                agent,
              ) =>
                agent.roomId,
            ),
          );

        expect(
          representedRooms.size,
        ).toBe(
          layoutAArchitectureV2
            .rooms
            .length,
        );

        for (
          const room of
            layoutAArchitectureV2
              .rooms
        ) {
          expect(
            representedRooms.has(
              room.id,
            ),
            `${room.id} has no preview occupant`,
          ).toBe(
            true,
          );
        }
      },
    );

    it(
      "keeps the deterministic distribution total at exactly 42",
      () => {
        const distribution =
          createRoomOccupantDistribution();

        const total =
          [
            ...distribution
              .values(),
          ].reduce(
            (
              sum,
              value,
            ) =>
              sum +
              value,
            0,
          );

        expect(
          total,
        ).toBe(
          42,
        );

        for (
          const room of
            layoutAArchitectureV2
              .rooms
        ) {
          expect(
            distribution.get(
              room.id,
            ),
            `${room.id} must receive at least one occupant`,
          ).toBeGreaterThanOrEqual(
            1,
          );
        }
      },
    );

    it(
      "places every preview occupant inside its assigned room",
      () => {
        const agents =
          createRoomOccupantPreview();

        const roomById =
          new Map(
            layoutAArchitectureV2
              .rooms
              .map(
                (
                  room,
                ) =>
                  [
                    room.id,
                    room,
                  ] as const,
              ),
          );

        for (
          const agent of
            agents
        ) {
          const room =
            roomById.get(
              agent.roomId,
            );

          if (!room) {
            throw new Error(
              `Unknown preview room: ${agent.roomId}`,
            );
          }

          expect(
            pointInOrOnRoomPolygon(
              agent.position,
              room.polygon,
            ),
            `${agent.id} is outside ${agent.roomId}`,
          ).toBe(
            true,
          );
        }
      },
    );

    it(
      "is reproducible and does not colocate occupants within a room",
      () => {
        const first =
          createRoomOccupantPreview();

        const second =
          createRoomOccupantPreview();

        expect(
          second,
        ).toEqual(
          first,
        );

        for (
          let firstIndex =
            0;
          firstIndex <
            first.length;
          firstIndex +=
            1
        ) {
          const firstAgent =
            first[
              firstIndex
            ]!;

          for (
            let secondIndex =
              firstIndex +
              1;
            secondIndex <
              first.length;
            secondIndex +=
              1
          ) {
            const secondAgent =
              first[
                secondIndex
              ]!;

            if (
              firstAgent.roomId !==
              secondAgent.roomId
            ) {
              continue;
            }

            expect(
              distance(
                firstAgent.position,
                secondAgent.position,
              ),
              `${firstAgent.id} and ${secondAgent.id} are too close`,
            ).toBeGreaterThanOrEqual(
              0.84,
            );
          }
        }
      },
    );

    it(
      "gives larger rooms additional population while keeping every room represented",
      () => {
        const distribution =
          createRoomOccupantDistribution();

        const eastLarge =
          distribution.get(
            "room-east-large",
          ) ??
          0;

        const southeast01 =
          distribution.get(
            "room-southeast-01",
          ) ??
          0;

        const southeast02 =
          distribution.get(
            "room-southeast-02",
          ) ??
          0;

        expect(
          eastLarge,
        ).toBeGreaterThan(
          1,
        );

        expect(
          southeast01,
        ).toBeGreaterThan(
          1,
        );

        expect(
          southeast02,
        ).toBeGreaterThan(
          1,
        );
      },
    );
  },
);