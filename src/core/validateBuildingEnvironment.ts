import type {
  BuildingEnvironment,
  Polygon2D,
} from "../types/environment";

function polygonArea(polygon: Polygon2D): number {
  const { vertices } = polygon;

  let area = 0;

  for (let i = 0; i < vertices.length; i += 1) {
    const current = vertices[i];
    const next = vertices[(i + 1) % vertices.length];

    if (current === undefined || next === undefined) {
      throw new Error("Invalid polygon vertex.");
    }

    area += current.x * next.y - next.x * current.y;
  }

  return Math.abs(area) / 2;
}

export function validateBuildingEnvironment(
  environment: BuildingEnvironment,
): void {
  if (!environment.layoutId.trim()) {
    throw new Error("Building layout id is required.");
  }

  if (
    !Number.isFinite(environment.widthMeters) ||
    environment.widthMeters <= 0
  ) {
    throw new Error("Building width must be positive and finite.");
  }

  if (
    !Number.isFinite(environment.heightMeters) ||
    environment.heightMeters <= 0
  ) {
    throw new Error("Building height must be positive and finite.");
  }

  const zoneIds = new Set<string>();

  for (const zone of environment.zones) {
    if (!zone.id.trim()) {
      throw new Error("Every building zone requires an id.");
    }

    if (zoneIds.has(zone.id)) {
      throw new Error(`Duplicate building zone id: ${zone.id}`);
    }

    zoneIds.add(zone.id);

    if (zone.polygon.vertices.length < 3) {
      throw new Error(
        `Zone ${zone.id} requires at least three polygon vertices.`,
      );
    }

    for (const vertex of zone.polygon.vertices) {
      if (
        !Number.isFinite(vertex.x) ||
        !Number.isFinite(vertex.y)
      ) {
        throw new Error(
          `Zone ${zone.id} contains a non-finite vertex.`,
        );
      }

      if (
        vertex.x < 0 ||
        vertex.y < 0 ||
        vertex.x > environment.widthMeters ||
        vertex.y > environment.heightMeters
      ) {
        throw new Error(
          `Zone ${zone.id} contains a vertex outside the building bounds.`,
        );
      }
    }

    if (polygonArea(zone.polygon) <= 0) {
      throw new Error(
        `Zone ${zone.id} must have a positive polygon area.`,
      );
    }
  }
}