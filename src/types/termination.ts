export type SimulationTerminationReason =
  | "ALL_RESOLVED"
  | "TIMEOUT"
  | null;

export interface SimulationTerminationStatus {
  readonly isTerminated: boolean;

  readonly reason: SimulationTerminationReason;

  readonly totalAgents: number;

  readonly activeAgents: number;

  readonly evacuatedAgents: number;

  readonly unreachableAgents: number;

  readonly timeoutAgents: number;
}