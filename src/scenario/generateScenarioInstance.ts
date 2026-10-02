import { SeededRandom } from "../random/SeededRandom";
import { sampleTruncatedNormal } from "../random/sampleTruncatedNormal";
import type {
  OccupantScenarioInput,
  Position2D,
  ScenarioInstance,
} from "../types/scenario";
import type { ScenarioGenerationConfig } from "../types/scenarioGeneration";
import { validateScenarioInstance } from "./validateScenarioInstance";

function shufflePositions(
  positions: readonly Position2D[],
  rng: SeededRandom,
): Position2D[] {
  const shuffled = positions.map((position) => ({
    x: position.x,
    y: position.y,
  }));

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = rng.nextInt(0, i + 1);

    const current = shuffled[i];
    const selected = shuffled[j];

    if (current === undefined || selected === undefined) {
      throw new Error("Unexpected spawn-position shuffle failure.");
    }

    shuffled[i] = selected;
    shuffled[j] = current;
  }

  return shuffled;
}

export function generateScenarioInstance(
  config: ScenarioGenerationConfig,
): ScenarioInstance {
  if (!Number.isInteger(config.seed)) {
    throw new Error("Scenario-generation seed must be an integer.");
  }

  if (
    !Number.isInteger(config.occupantCount) ||
    config.occupantCount <= 0
  ) {
    throw new Error(
      "Occupant count must be a positive integer.",
    );
  }

  if (config.occupantCount > config.spawnPositions.length) {
    throw new Error(
      "Occupant count cannot exceed the number of available spawn positions.",
    );
  }

  const rng = new SeededRandom(config.seed);

  const shuffledPositions = shufflePositions(
    config.spawnPositions,
    rng,
  );

  const occupants: OccupantScenarioInput[] = Array.from(
    { length: config.occupantCount },
    (_, index) => {
      const spawnPosition = shuffledPositions[index];

      if (spawnPosition === undefined) {
        throw new Error(
          "Unable to assign a spawn position to an occupant.",
        );
      }

      return {
        id: `agent-${String(index + 1).padStart(3, "0")}`,
        spawnPosition,
        desiredSpeedMps: sampleTruncatedNormal(
          rng,
          config.walkingSpeed,
        ),
      };
    },
  );

  const scenario: ScenarioInstance = {
    id: config.id,
    seed: config.seed,
    layoutId: config.layoutId,
    parameterSetVersion: config.parameterSetVersion,
    occupants,
    disruptionSchedule: config.disruptionSchedule.map(
      (event) => ({ ...event }),
    ),
  };

  validateScenarioInstance(scenario);

  return scenario;
}