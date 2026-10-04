import {
  describe,
  expect,
  it,
} from "vitest";

import {
  layoutAArchitectureV2,
} from "../../src/environment/layoutAArchitectureV2";

import type {
  ArchitecturePoint,
  ArchitectureRoom,
} from "../../src/environment/layoutAArchitectureV2";

interface Bounds {
  readonly minX:
    number;

  readonly maxX:
    number;

  readonly minY:
    number;

  readonly maxY:
    number;

  readonly width:
    number;

  readonly height:
    number;
}

function requireRoom(
  roomId:
    string,
): ArchitectureRoom {
  const room =
    layoutAArchitectureV2
      .rooms
      .find(
        (
          candidate,
        ) =>
          candidate.id ===
          roomId,
      );

  if (!room) {
    throw new Error(
      `Room not found: ${roomId}`,
    );
  }

  return room;
}

function boundsOf(
  polygon:
    readonly ArchitecturePoint[],
): Bounds {
  const xs =
    polygon.map(
      (
        point,
      ) =>
        point.x,
    );

  const ys =
    polygon.map(
      (
        point,
      ) =>
        point.y,
    );

  const minX =
    Math.min(
      ...xs,
    );

  const maxX =
    Math.max(
      ...xs,
    );

  const minY =
    Math.min(
      ...ys,
    );

  const maxY =
    Math.max(
      ...ys,
    );

  return {
    minX,
    maxX,
    minY,
    maxY,

    width:
      maxX -
      minX,

    height:
      maxY -
      minY,
  };
}

function doorPosition(
  room:
    ArchitectureRoom,
): ArchitecturePoint {
  const door =
    room.doors[0];

  if (!door) {
    throw new Error(
      `${room.id} has no door.`,
    );
  }

  const start =
    room.polygon[
      door.edgeIndex
    ];

  const end =
    room.polygon[
      (
        door.edgeIndex +
        1
      ) %
      room.polygon.length
    ];

  if (
    !start ||
    !end
  ) {
    throw new Error(
      `${room.id} has an invalid door edge.`,
    );
  }

  return {
    x:
      start.x +
      (
        end.x -
        start.x
      ) *
        door.centerT,

    y:
      start.y +
      (
        end.y -
        start.y
      ) *
        door.centerT,
  };
}

describe(
  "Architecture V2 northwest rectangular rooms",
  () => {
    it(
      "uses exactly three four-sided northwest rooms",
      () => {
        const roomIds = [
          "room-nw-01",
          "room-nw-02",
          "room-nw-03",
        ];

        for (
          const roomId of
            roomIds
        ) {
          const room =
            requireRoom(
              roomId,
            );

          expect(
            room.polygon,
          ).toHaveLength(
            4,
          );
        }
      },
    );

    it(
      "uses the approved unequal room dimensions",
      () => {
        const room01 =
          boundsOf(
            requireRoom(
              "room-nw-01",
            ).polygon,
          );

        const room02 =
          boundsOf(
            requireRoom(
              "room-nw-02",
            ).polygon,
          );

        const room03 =
          boundsOf(
            requireRoom(
              "room-nw-03",
            ).polygon,
          );

        expect(
          room01.width,
        ).toBeCloseTo(
          6,
          10,
        );

        expect(
          room01.height,
        ).toBeCloseTo(
          7,
          10,
        );

        expect(
          room02.width,
        ).toBeCloseTo(
          7,
          10,
        );

        expect(
          room02.height,
        ).toBeCloseTo(
          8,
          10,
        );

        expect(
          room03.width,
        ).toBeCloseTo(
          6,
          10,
        );

        expect(
          room03.height,
        ).toBeCloseTo(
          7.5,
          10,
        );

        const areas = [
          room01.width *
            room01.height,

          room02.width *
            room02.height,

          room03.width *
            room03.height,
        ];

        expect(
          new Set(
            areas,
          ).size,
        ).toBe(
          3,
        );
      },
    );

    it(
      "preserves the validated northwest door-center coordinates",
      () => {
        const expected =
          new Map<
            string,
            ArchitecturePoint
          >([
            [
              "room-nw-01",
              {
                x:
                  5.5,

                y:
                  36,
              },
            ],

            [
              "room-nw-02",
              {
                x:
                  12.5,

                y:
                  36,
              },
            ],

            [
              "room-nw-03",
              {
                x:
                  19.5,

                y:
                  36,
              },
            ],
          ]);

        for (
          const [
            roomId,
            target,
          ] of
            expected
        ) {
          const position =
            doorPosition(
              requireRoom(
                roomId,
              ),
            );

          expect(
            position.x,
          ).toBeCloseTo(
            target.x,
            10,
          );

          expect(
            position.y,
          ).toBeCloseTo(
            target.y,
            10,
          );
        }
      },
    );

    it(
      "keeps equal separation between the three northwest rooms",
      () => {
        const first =
          boundsOf(
            requireRoom(
              "room-nw-01",
            ).polygon,
          );

        const second =
          boundsOf(
            requireRoom(
              "room-nw-02",
            ).polygon,
          );

        const third =
          boundsOf(
            requireRoom(
              "room-nw-03",
            ).polygon,
          );

        const firstGap =
          second.minX -
          first.maxX;

        const secondGap =
          third.minX -
          second.maxX;

        expect(
          firstGap,
        ).toBeCloseTo(
          0.5,
          10,
        );

        expect(
          secondGap,
        ).toBeCloseTo(
          0.5,
          10,
        );

        expect(
          first.minY,
        ).toBeCloseTo(
          36,
          10,
        );

        expect(
          second.minY,
        ).toBeCloseTo(
          36,
          10,
        );

        expect(
          third.minY,
        ).toBeCloseTo(
          36,
          10,
        );
      },
    );
  },
);