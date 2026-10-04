import {
  describe,
  expect,
  it,
} from "vitest";

import {
  layoutAArchitectureV2,
} from "../../src/environment/layoutAArchitectureV2";

import {
  layoutAArchitectureV2NavigationGraph,
} from "../../src/environment/layoutAArchitectureV2NavigationGraph";

import type {
  ArchitecturePoint,
} from "../../src/environment/layoutAArchitectureV2";

import type {
  NavigationNode,
} from "../../src/types/navigation";

const EPSILON =
  1e-8;

function interpolatePoint(
  start: ArchitecturePoint,
  end: ArchitecturePoint,
  t: number,
): ArchitecturePoint {
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

function pointOnSegment(
  point: ArchitecturePoint,
  start: ArchitecturePoint,
  end: ArchitecturePoint,
): boolean {
  const cross =
    (
      point.y -
      start.y
    ) *
      (
        end.x -
        start.x
      ) -
    (
      point.x -
      start.x
    ) *
      (
        end.y -
        start.y
      );

  if (
    Math.abs(
      cross,
    ) >
    EPSILON
  ) {
    return false;
  }

  const dot =
    (
      point.x -
      start.x
    ) *
      (
        end.x -
        start.x
      ) +
    (
      point.y -
      start.y
    ) *
      (
        end.y -
        start.y
      );

  if (
    dot <
    -EPSILON
  ) {
    return false;
  }

  const squaredLength =
    (
      end.x -
      start.x
    ) **
      2 +
    (
      end.y -
      start.y
    ) **
      2;

  return (
    dot <=
    squaredLength +
      EPSILON
  );
}

function pointInOrOnPolygon(
  point: ArchitecturePoint,
  polygon:
    readonly ArchitecturePoint[],
): boolean {
  for (
    let index =
      0;
    index <
      polygon.length;
    index +=
      1
  ) {
    const start =
      polygon[
        index
      ]!;

    const end =
      polygon[
        (
          index +
          1
        ) %
        polygon.length
      ]!;

    if (
      pointOnSegment(
        point,
        start,
        end,
      )
    ) {
      return true;
    }
  }

  let inside =
    false;

  for (
    let firstIndex =
      0,
      secondIndex =
        polygon.length -
        1;
    firstIndex <
    polygon.length;
    secondIndex =
      firstIndex++
  ) {
    const first =
      polygon[
        firstIndex
      ]!;

    const second =
      polygon[
        secondIndex
      ]!;

    const intersects =
      (
        first.y >
        point.y
      ) !==
        (
          second.y >
          point.y
        ) &&
      point.x <
        (
          (
            second.x -
            first.x
          ) *
            (
              point.y -
              first.y
            )
        ) /
          (
            second.y -
            first.y
          ) +
        first.x;

    if (
      intersects
    ) {
      inside =
        !inside;
    }
  }

  return inside;
}

function isWalkable(
  point: ArchitecturePoint,
): boolean {
  return (
    layoutAArchitectureV2
      .circulation
      .some(
        (
          area,
        ) =>
          pointInOrOnPolygon(
            point,
            area.polygon,
          ),
      )
  );
}

function architecturalDoorPositions():
  ReadonlyMap<
    string,
    ArchitecturePoint
  > {
  const result =
    new Map<
      string,
      ArchitecturePoint
    >();

  for (
    const room of
      layoutAArchitectureV2
        .rooms
  ) {
    for (
      const door of
        room.doors
    ) {
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
          `Door ${door.id} references an invalid room edge.`,
        );
      }

      result.set(
        door.id,
        interpolatePoint(
          start,
          end,
          door.centerT,
        ),
      );
    }
  }

  return result;
}

function requireNode(
  nodeId: string,
): NavigationNode {
  const node =
    layoutAArchitectureV2NavigationGraph
      .nodes
      .find(
        (
          candidate,
        ) =>
          candidate.id ===
          nodeId,
      );

  if (!node) {
    throw new Error(
      `Navigation node not found in test: ${nodeId}`,
    );
  }

  return node;
}

function neighborsOf(
  nodeId: string,
): readonly string[] {
  const neighbors:
    string[] =
  [];

  for (
    const edge of
      layoutAArchitectureV2NavigationGraph
        .edges
  ) {
    if (
      edge.from ===
      nodeId
    ) {
      neighbors.push(
        edge.to,
      );
    }

    if (
      edge.bidirectional &&
      edge.to ===
        nodeId
    ) {
      neighbors.push(
        edge.from,
      );
    }
  }

  return neighbors;
}

function reachableFrom(
  startNodeId: string,
): ReadonlySet<string> {
  const visited =
    new Set<string>();

  const queue:
    string[] =
    [
      startNodeId,
    ];

  while (
    queue.length >
    0
  ) {
    const current =
      queue.shift();

    if (
      !current ||
      visited.has(
        current,
      )
    ) {
      continue;
    }

    visited.add(
      current,
    );

    for (
      const neighbor of
        neighborsOf(
          current,
        )
    ) {
      if (
        !visited.has(
          neighbor,
        )
      ) {
        queue.push(
          neighbor,
        );
      }
    }
  }

  return visited;
}

describe(
  "Layout A Architecture V2 navigation geometry",
  () => {
    it(
      "creates exactly one navigation DOOR node for every architectural door",
      () => {
        const architecturalDoors =
          architecturalDoorPositions();

        const doorNodes =
          layoutAArchitectureV2NavigationGraph
            .nodes
            .filter(
              (
                node,
              ) =>
                node.type ===
                "DOOR",
            );

        expect(
          doorNodes,
        ).toHaveLength(
          architecturalDoors.size,
        );

        for (
          const [
            doorId,
            position,
          ] of
            architecturalDoors
        ) {
          const node =
            requireNode(
              doorId,
            );

          expect(
            node.type,
          ).toBe(
            "DOOR",
          );

          expect(
            node.position.x,
          ).toBeCloseTo(
            position.x,
            10,
          );

          expect(
            node.position.y,
          ).toBeCloseTo(
            position.y,
            10,
          );
        }
      },
    );

    it(
      "places every room door directly on walkable circulation",
      () => {
        for (
          const position of
            architecturalDoorPositions()
              .values()
        ) {
          expect(
            isWalkable(
              position,
            ),
          ).toBe(
            true,
          );
        }
      },
    );

    it(
      "places every navigation node on walkable circulation",
      () => {
        for (
          const node of
            layoutAArchitectureV2NavigationGraph
              .nodes
        ) {
          expect(
            isWalkable(
              node.position,
            ),
            `${node.id} is not on walkable Architecture V2 circulation`,
          ).toBe(
            true,
          );
        }
      },
    );

    it(
      "keeps every navigation edge completely inside walkable circulation",
      () => {
        for (
          const edge of
            layoutAArchitectureV2NavigationGraph
              .edges
        ) {
          const from =
            requireNode(
              edge.from,
            );

          const to =
            requireNode(
              edge.to,
            );

          const sampleCount =
            Math.max(
              2,
              Math.ceil(
                edge.lengthMeters /
                  0.1,
              ),
            );

          for (
            let index =
              0;
            index <=
            sampleCount;
            index +=
              1
          ) {
            const t =
              index /
              sampleCount;

            const sample =
              interpolatePoint(
                from.position,
                to.position,
                t,
              );

            expect(
              isWalkable(
                sample,
              ),
              `${edge.id} leaves walkable circulation near t=${t.toFixed(
                3,
              )}`,
            ).toBe(
              true,
            );
          }
        }
      },
    );

    it(
      "uses valid endpoints, positive widths, and geometrically correct edge lengths",
      () => {
        for (
          const edge of
            layoutAArchitectureV2NavigationGraph
              .edges
        ) {
          const from =
            requireNode(
              edge.from,
            );

          const to =
            requireNode(
              edge.to,
            );

          const expectedLength =
            Math.hypot(
              to.position.x -
                from.position.x,

              to.position.y -
                from.position.y,
            );

          expect(
            edge.widthMeters,
          ).toBeGreaterThan(
            0,
          );

          expect(
            edge.lengthMeters,
          ).toBeCloseTo(
            expectedLength,
            10,
          );
        }
      },
    );

    it(
      "gives every room door a path to at least one true exterior exit",
      () => {
        const exitIds =
          new Set(
            layoutAArchitectureV2
              .exits
              .map(
                (
                  exit,
                ) =>
                  exit.id,
              ),
          );

        for (
          const doorId of
            architecturalDoorPositions()
              .keys()
        ) {
          const reachable =
            reachableFrom(
              doorId,
            );

          const reachesExit =
            [
              ...exitIds,
            ].some(
              (
                exitId,
              ) =>
                reachable.has(
                  exitId,
                ),
            );

          expect(
            reachesExit,
            `${doorId} cannot reach an exterior exit`,
          ).toBe(
            true,
          );
        }
      },
    );

    it(
      "keeps all four exterior exits connected within one evacuation network",
      () => {
        const [
          firstExit,
          ...otherExits
        ] =
          layoutAArchitectureV2
            .exits
            .map(
              (
                exit,
              ) =>
                exit.id,
            );

        if (!firstExit) {
          throw new Error(
            "Architecture V2 defines no exits.",
          );
        }

        const reachable =
          reachableFrom(
            firstExit,
          );

        for (
          const exitId of
            otherExits
        ) {
          expect(
            reachable.has(
              exitId,
            ),
            `${exitId} is disconnected from the evacuation network`,
          ).toBe(
            true,
          );
        }
      },
    );
  },
);