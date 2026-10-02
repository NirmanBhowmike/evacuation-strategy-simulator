import type {
  DisruptionEvent,
  Position2D,
} from "./scenario";

export interface WalkingSpeedParameters {
  readonly mean: number;
  readonly standardDeviation: number;
  readonly min: number;
  readonly max: number;
}

export interface ScenarioGenerationConfig {
  readonly id: string;
  readonly seed: number;
  readonly layoutId: string;
  readonly parameterSetVersion: string;

  readonly occupantCount: number;

  readonly spawnPositions: readonly Position2D[];

  readonly walkingSpeed: WalkingSpeedParameters;

  readonly disruptionSchedule: readonly DisruptionEvent[];
}