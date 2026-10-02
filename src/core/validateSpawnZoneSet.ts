import type {
  BuildingEnvironment,
  Polygon2D,
} from "../types/environment";

import type { NavigationGraph } from "../types/navigation";
import type { Position2D } from "../types/scenario";
import type { SpawnZoneSet } from "../types/spawn";

function polygonArea(
  polygon: Polygon2D,
): number {
  const vertices = polygon.vertices;

  let area = 0;

  for (let i = 0; i < vertices.length; i += 1) {
    const current = vertices[i]!;
    const next =
      vertices[(i + 1) % vertices.length]!;

    area +=
      current.x * next.y -
      next.x * current.y;
  }

  return Math.abs(area) / 2;
}

function pointOnSegment(
  point: Position2D,
  a: Position2D,
  b: Position2D,
): boolean {
  const tolerance = 1e-9;

  const cross =
    (point.y - a.y) * (b.x - a.x) -
    (point.x - a.x) * (b.y - a.y);

  if (Math.abs(cross) > tolerance) {
    return false;
  }

  const dot =
    (point.x - a.x) * (b.x - a.x) +
    (point.y - a.y) * (b.y - a.y);

  if (dot < -tolerance) {
    return false;
  }

  const squaredLength =
    (b.x - a.x) ** 2 +
    (b.y - a.y) ** 2;

  return dot <= squaredLength + tolerance;
}

function pointInPolygon(
  point: Position2D,
  polygon: Polygon2D,
): boolean {
  const vertices = polygon.vertices;

  for (let i = 0; i < vertices.length; i += 1) {
    const a = vertices[i]!;
    const b =
      vertices[(i + 1) % vertices.length]!;

    if (pointOnSegment(point, a, b)) {
      return true;
    }
  }

  let inside = false;

  for (
    let i = 0, j = vertices.length - 1;
    i < vertices.length;
    j = i, i += 1
  ) {
    const a = vertices[i]!;
    const b = vertices[j]!;

    const intersects =
      a.y > point.y !== b.y > point.y &&
      point.x <
        ((b.x - a.x) *
          (point.y - a.y)) /
          (b.y - a.y) +
          a.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

export function validateSpawnZoneSet(
  spawnZoneSet: SpawnZoneSet,
  environment: BuildingEnvironment,
  navigationGraph: NavigationGraph,
): void {
  if (!spawnZoneSet.layoutId.trim()) {
    throw new Error(
      "Spawn-zone layout id is required.",
    );
  }

  if (
    spawnZoneSet.layoutId !==
    environment.layoutId
  ) {
    throw new Error(
      "Spawn-zone layout id must match the building environment.",
    );
  }

  if (
    spawnZoneSet.layoutId !==
    navigationGraph.layoutId
  ) {
    throw new Error(
      "Spawn-zone layout id must match the navigation graph.",
    );
  }

  if (spawnZoneSet.zones.length === 0) {
    throw new Error(
      "At least one spawn zone is required.",
    );
  }

  const buildingZones = new Map(
    environment.zones.map(
      (zone) => [zone.id, zone] as const,
    ),
  );

  const navigationNodes = new Map(
    navigationGraph.nodes.map(
      (node) => [node.id, node] as const,
    ),
  );

  const spawnZoneIds = new Set<string>();

  for (const spawnZone of spawnZoneSet.zones) {
    if (!spawnZone.id.trim()) {
      throw new Error(
        "Every spawn zone requires an id.",
      );
    }

    if (spawnZoneIds.has(spawnZone.id)) {
      throw new Error(
        `Duplicate spawn-zone id: ${spawnZone.id}`,
      );
    }

    spawnZoneIds.add(spawnZone.id);

    const room =
      buildingZones.get(
        spawnZone.roomZoneId,
      );

    if (!room) {
      throw new Error(
        `Spawn zone ${spawnZone.id} references an unknown room zone.`,
      );
    }

    if (room.type !== "ROOM") {
      throw new Error(
        `Spawn zone ${spawnZone.id} must be associated with a ROOM zone.`,
      );
    }

    const accessNode =
      navigationNodes.get(
        spawnZone.accessNodeId,
      );

    if (!accessNode) {
      throw new Error(
        `Spawn zone ${spawnZone.id} references an unknown access node.`,
      );
    }

    if (accessNode.type === "EXIT") {
      throw new Error(
        `Spawn zone ${spawnZone.id} cannot use an EXIT node as its room access node.`,
      );
    }

    if (
      spawnZone.polygon.vertices.length < 3
    ) {
      throw new Error(
        `Spawn zone ${spawnZone.id} must contain at least three vertices.`,
      );
    }

    if (
      polygonArea(spawnZone.polygon) <= 0
    ) {
      throw new Error(
        `Spawn zone ${spawnZone.id} must have positive area.`,
      );
    }

    for (
      const vertex of
        spawnZone.polygon.vertices
    ) {
      if (
        !Number.isFinite(vertex.x) ||
        !Number.isFinite(vertex.y)
      ) {
        throw new Error(
          `Spawn zone ${spawnZone.id} contains a non-finite coordinate.`,
        );
      }

      if (
        vertex.x < 0 ||
        vertex.y < 0 ||
        vertex.x >
          environment.widthMeters ||
        vertex.y >
          environment.heightMeters
      ) {
        throw new Error(
          `Spawn zone ${spawnZone.id} lies outside the building bounds.`,
        );
      }

      if (
        !pointInPolygon(
          vertex,
          room.polygon,
        )
      ) {
        throw new Error(
          `Spawn zone ${spawnZone.id} must lie inside its associated room.`,
        );
      }
    }
  }
}