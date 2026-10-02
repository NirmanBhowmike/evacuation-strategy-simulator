import {
  describe,
  expect,
  it,
} from "vitest";

import { validateSpawnZoneSet } from "../../src/core/validateSpawnZoneSet";

import { layoutA } from "../../src/environment/layoutA";
import { layoutAExits } from "../../src/environment/layoutAExits";
import { layoutANavigationGraph } from "../../src/environment/layoutANavigationGraph";
import { layoutASpawnZones } from "../../src/environment/layoutASpawnZones";

import type { NavigationGraph } from "../../src/types/navigation";
import type { SpawnZoneSet } from "../../src/types/spawn";

function getReachableNodes(
  graph: NavigationGraph,
  startId: string,
): Set<string> {
  const adjacency =
    new Map<string, string[]>();

  for (const node of graph.nodes) {
    adjacency.set(node.id, []);
  }

  for (const edge of graph.edges) {
    adjacency
      .get(edge.from)
      ?.push(edge.to);

    if (edge.bidirectional) {
      adjacency
        .get(edge.to)
        ?.push(edge.from);
    }
  }

  const visited =
    new Set<string>();

  const queue: string[] = [
    startId,
  ];

  visited.add(startId);

  while (queue.length > 0) {
    const current =
      queue.shift()!;

    for (
      const next of
        adjacency.get(current) ?? []
    ) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }

  return visited;
}

describe("Layout A spawn zones", () => {
  it("passes spawn-zone validation", () => {
    expect(() =>
      validateSpawnZoneSet(
        layoutASpawnZones,
        layoutA,
        layoutANavigationGraph,
      ),
    ).not.toThrow();
  });

  it("contains twelve distributed spawn zones", () => {
    expect(
      layoutASpawnZones.zones,
    ).toHaveLength(12);
  });

  it("places every spawn zone inside a ROOM", () => {
    const roomIds = new Set(
      layoutA.zones
        .filter(
          (zone) =>
            zone.type === "ROOM",
        )
        .map((zone) => zone.id),
    );

    for (
      const spawnZone of
        layoutASpawnZones.zones
    ) {
      expect(
        roomIds.has(
          spawnZone.roomZoneId,
        ),
      ).toBe(true);
    }
  });

  it("does not use exit nodes as spawn access nodes", () => {
    const exitIds = new Set(
      layoutAExits.exits.map(
        (exit) => exit.id,
      ),
    );

    for (
      const spawnZone of
        layoutASpawnZones.zones
    ) {
      expect(
        exitIds.has(
          spawnZone.accessNodeId,
        ),
      ).toBe(false);
    }
  });

  it("allows every spawn zone to reach all four exits in the normal graph", () => {
    const exitIds =
      layoutAExits.exits.map(
        (exit) => exit.id,
      );

    for (
      const spawnZone of
        layoutASpawnZones.zones
    ) {
      const reachable =
        getReachableNodes(
          layoutANavigationGraph,
          spawnZone.accessNodeId,
        );

      for (const exitId of exitIds) {
        expect(
          reachable.has(exitId),
        ).toBe(true);
      }
    }
  });

  it("rejects duplicate spawn-zone ids", () => {
    const invalid: SpawnZoneSet = {
      ...layoutASpawnZones,

      zones: [
        ...layoutASpawnZones.zones,
        layoutASpawnZones.zones[0]!,
      ],
    };

    expect(() =>
      validateSpawnZoneSet(
        invalid,
        layoutA,
        layoutANavigationGraph,
      ),
    ).toThrow(
      /Duplicate spawn-zone id/,
    );
  });

  it("rejects spawn zones associated with non-room areas", () => {
    const original =
      layoutASpawnZones.zones[0]!;

    const invalid: SpawnZoneSet = {
      ...layoutASpawnZones,

      zones: [
        {
          ...original,
          roomZoneId:
            "corridor-main-spine",
        },
      ],
    };

    expect(() =>
      validateSpawnZoneSet(
        invalid,
        layoutA,
        layoutANavigationGraph,
      ),
    ).toThrow(
      /must be associated with a ROOM/,
    );
  });

  it("rejects unknown navigation access nodes", () => {
    const original =
      layoutASpawnZones.zones[0]!;

    const invalid: SpawnZoneSet = {
      ...layoutASpawnZones,

      zones: [
        {
          ...original,
          accessNodeId:
            "missing-navigation-node",
        },
      ],
    };

    expect(() =>
      validateSpawnZoneSet(
        invalid,
        layoutA,
        layoutANavigationGraph,
      ),
    ).toThrow(
      /unknown access node/,
    );
  });
});