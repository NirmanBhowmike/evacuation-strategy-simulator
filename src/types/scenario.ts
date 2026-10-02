export type LayoutId = string;
export type ScenarioInstanceId = string;
export type OccupantId = string;

export interface Position2D {
  readonly x: number;
  readonly y: number;
}

export interface OccupantScenarioInput {
  readonly id: OccupantId;
  readonly spawnPosition: Position2D;
  readonly desiredSpeedMps: number;
}

export type DisruptionEventType =
  | "HAZARD_ACTIVATE"
  | "HAZARD_EXPAND"
  | "CORRIDOR_BLOCK"
  | "EXIT_BLOCK";

export interface DisruptionEvent {
  readonly id: string;
  readonly type: DisruptionEventType;
  readonly activationTimeSeconds: number;
  readonly targetId: string;
}

export interface ScenarioInstance {
  readonly id: ScenarioInstanceId;
  readonly seed: number;
  readonly layoutId: LayoutId;
  readonly parameterSetVersion: string;
  readonly occupants: readonly OccupantScenarioInput[];
  readonly disruptionSchedule: readonly DisruptionEvent[];
}