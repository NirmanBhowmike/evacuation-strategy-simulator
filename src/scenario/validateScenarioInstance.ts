import type { ScenarioInstance } from "../types/scenario";

export function validateScenarioInstance(
  scenario: ScenarioInstance,
): void {
  if (!scenario.id.trim()) {
    throw new Error("ScenarioInstance id is required.");
  }

  if (!Number.isInteger(scenario.seed)) {
    throw new Error("ScenarioInstance seed must be an integer.");
  }

  if (!scenario.layoutId.trim()) {
    throw new Error("Layout id is required.");
  }

  if (!scenario.parameterSetVersion.trim()) {
    throw new Error("Parameter-set version is required.");
  }

  const occupantIds = new Set<string>();

  for (const occupant of scenario.occupants) {
    if (!occupant.id.trim()) {
      throw new Error("Every occupant requires an id.");
    }

    if (occupantIds.has(occupant.id)) {
      throw new Error(`Duplicate occupant id: ${occupant.id}`);
    }

    occupantIds.add(occupant.id);

    if (
      !Number.isFinite(occupant.spawnPosition.x) ||
      !Number.isFinite(occupant.spawnPosition.y)
    ) {
      throw new Error(
        `Occupant ${occupant.id} has an invalid spawn position.`,
      );
    }

    if (
      !Number.isFinite(occupant.desiredSpeedMps) ||
      occupant.desiredSpeedMps <= 0
    ) {
      throw new Error(
        `Occupant ${occupant.id} must have a positive desired speed.`,
      );
    }
  }

  const eventIds = new Set<string>();
  let previousTime = -Infinity;

  for (const event of scenario.disruptionSchedule) {
    if (!event.id.trim()) {
      throw new Error("Every disruption event requires an id.");
    }

    if (eventIds.has(event.id)) {
      throw new Error(`Duplicate disruption event id: ${event.id}`);
    }

    eventIds.add(event.id);

    if (
      !Number.isFinite(event.activationTimeSeconds) ||
      event.activationTimeSeconds < 0
    ) {
      throw new Error(
        `Event ${event.id} has an invalid activation time.`,
      );
    }

    if (event.activationTimeSeconds < previousTime) {
      throw new Error(
        "Disruption schedule must be ordered by activation time.",
      );
    }

    previousTime = event.activationTimeSeconds;

    if (!event.targetId.trim()) {
      throw new Error(`Event ${event.id} requires a target id.`);
    }
  }
}