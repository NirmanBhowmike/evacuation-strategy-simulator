import type { BuildingEnvironment } from "../types/environment";
import type { ExitSet } from "../types/exit";

export function validateExitSet(
  exitSet: ExitSet,
  environment: BuildingEnvironment,
): void {
  if (!exitSet.layoutId.trim()) {
    throw new Error("Exit-set layout id is required.");
  }

  if (exitSet.layoutId !== environment.layoutId) {
    throw new Error(
      "Exit-set layout id must match the building environment.",
    );
  }

  if (exitSet.exits.length === 0) {
    throw new Error("At least one exit is required.");
  }

  const validZoneIds = new Set(
    environment.zones.map((zone) => zone.id),
  );

  const exitIds = new Set<string>();

  for (const exit of exitSet.exits) {
    if (!exit.id.trim()) {
      throw new Error("Every exit requires an id.");
    }

    if (exitIds.has(exit.id)) {
      throw new Error(`Duplicate exit id: ${exit.id}`);
    }

    exitIds.add(exit.id);

    if (
      !Number.isFinite(exit.position.x) ||
      !Number.isFinite(exit.position.y)
    ) {
      throw new Error(
        `Exit ${exit.id} has a non-finite position.`,
      );
    }

    if (
      exit.position.x < 0 ||
      exit.position.y < 0 ||
      exit.position.x > environment.widthMeters ||
      exit.position.y > environment.heightMeters
    ) {
      throw new Error(
        `Exit ${exit.id} lies outside the building bounds.`,
      );
    }

    if (
      !Number.isFinite(exit.widthMeters) ||
      exit.widthMeters <= 0
    ) {
      throw new Error(
        `Exit ${exit.id} must have a positive finite width.`,
      );
    }

    if (!validZoneIds.has(exit.connectedZoneId)) {
      throw new Error(
        `Exit ${exit.id} references an unknown connected zone.`,
      );
    }
  }
}