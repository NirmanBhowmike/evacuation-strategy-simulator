import { HazardField } from "./HazardField";

import type { BuildingEnvironment } from "../types/environment";
import type { ExitId, ExitSet } from "../types/exit";
import type {
  DisruptionEvent,
  ScenarioInstance,
} from "../types/scenario";

export interface AppliedDisruption {
  readonly id: string;
  readonly type: DisruptionEvent["type"];
  readonly activationTimeSeconds: number;
  readonly targetId: string;
}

/**
 * Applies deterministic scheduled disruption events to the
 * simulation environment.
 *
 * Supported events:
 *
 * HAZARD_ACTIVATE
 *   target zone becomes RISK
 *
 * HAZARD_EXPAND
 *   additional target zone becomes RISK
 *
 * CORRIDOR_BLOCK
 *   target corridor becomes BLOCKED
 *
 * EXIT_BLOCK
 *   target exit becomes unavailable
 *
 * Events are processed in schedule order and exactly once.
 */
export class DynamicDisruptionController {
  private nextEventIndex = 0;

  private lastProcessedTimeSeconds = 0;

  private readonly blockedExitIds =
    new Set<ExitId>();

  public constructor(
    private readonly scenario: ScenarioInstance,
    private readonly environment: BuildingEnvironment,
    private readonly exitSet: ExitSet,
    private readonly hazardField: HazardField,
  ) {
    this.validateConfiguration();
  }

  private validateConfiguration(): void {
    if (
      this.scenario.layoutId !==
      this.environment.layoutId
    ) {
      throw new Error(
        "Scenario layout must match the building environment.",
      );
    }

    if (
      this.exitSet.layoutId !==
      this.environment.layoutId
    ) {
      throw new Error(
        "Exit-set layout must match the building environment.",
      );
    }

    if (
      this.hazardField.layoutId !==
      this.environment.layoutId
    ) {
      throw new Error(
        "Hazard-field layout must match the building environment.",
      );
    }

    const zoneById =
      new Map(
        this.environment.zones.map(
          (zone) =>
            [zone.id, zone] as const,
        ),
      );

    const exitIds =
      new Set(
        this.exitSet.exits.map(
          (exit) => exit.id,
        ),
      );

    const eventIds =
      new Set<string>();

    let previousActivationTime =
      -Infinity;

    for (
      const event of
      this.scenario.disruptionSchedule
    ) {
      if (!event.id.trim()) {
        throw new Error(
          "Every disruption event requires an id.",
        );
      }

      if (
        eventIds.has(event.id)
      ) {
        throw new Error(
          `Duplicate disruption event id: ${event.id}`,
        );
      }

      eventIds.add(event.id);

      if (
        !Number.isFinite(
          event.activationTimeSeconds,
        ) ||
        event.activationTimeSeconds < 0
      ) {
        throw new Error(
          `Disruption event ${event.id} has an invalid activation time.`,
        );
      }

      if (
        event.activationTimeSeconds <
        previousActivationTime
      ) {
        throw new Error(
          "Disruption schedule must be ordered by activation time.",
        );
      }

      previousActivationTime =
        event.activationTimeSeconds;

      if (
        event.type ===
          "HAZARD_ACTIVATE" ||
        event.type ===
          "HAZARD_EXPAND"
      ) {
        if (
          !zoneById.has(
            event.targetId,
          )
        ) {
          throw new Error(
            `Disruption event ${event.id} references an unknown hazard zone: ${event.targetId}`,
          );
        }
      }

      if (
        event.type ===
        "CORRIDOR_BLOCK"
      ) {
        const zone =
          zoneById.get(
            event.targetId,
          );

        if (!zone) {
          throw new Error(
            `Disruption event ${event.id} references an unknown corridor zone: ${event.targetId}`,
          );
        }

        if (
          zone.type !==
          "CORRIDOR"
        ) {
          throw new Error(
            `Disruption event ${event.id} must target a CORRIDOR zone.`,
          );
        }
      }

      if (
        event.type ===
        "EXIT_BLOCK"
      ) {
        if (
          !exitIds.has(
            event.targetId,
          )
        ) {
          throw new Error(
            `Disruption event ${event.id} references an unknown exit: ${event.targetId}`,
          );
        }
      }
    }
  }

  private applyEvent(
    event: DisruptionEvent,
  ): void {
    switch (event.type) {
      case "HAZARD_ACTIVATE":
      case "HAZARD_EXPAND":
        this.hazardField.setZoneState(
          event.targetId,
          "RISK",
        );
        return;

      case "CORRIDOR_BLOCK":
        this.hazardField.setZoneState(
          event.targetId,
          "BLOCKED",
        );
        return;

      case "EXIT_BLOCK":
        this.blockedExitIds.add(
          event.targetId,
        );
        return;

      default: {
        const unreachable: never =
          event.type;

        throw new Error(
          `Unsupported disruption event type: ${String(
            unreachable,
          )}`,
        );
      }
    }
  }

  /**
   * Applies every scheduled event whose activation time is less
   * than or equal to the supplied simulation time.
   *
   * Each event is applied exactly once.
   */
  public processDueEvents(
    simulationTimeSeconds: number,
  ): readonly AppliedDisruption[] {
    if (
      !Number.isFinite(
        simulationTimeSeconds,
      ) ||
      simulationTimeSeconds < 0
    ) {
      throw new Error(
        "Simulation time must be non-negative and finite.",
      );
    }

    const tolerance = 1e-9;

    if (
      simulationTimeSeconds +
        tolerance <
      this.lastProcessedTimeSeconds
    ) {
      throw new Error(
        "Dynamic disruption time cannot move backward.",
      );
    }

    const applied:
      AppliedDisruption[] = [];

    while (
      this.nextEventIndex <
      this.scenario
        .disruptionSchedule
        .length
    ) {
      const event =
        this.scenario
          .disruptionSchedule[
          this.nextEventIndex
        ]!;

      if (
        event.activationTimeSeconds >
        simulationTimeSeconds +
          tolerance
      ) {
        break;
      }

      this.applyEvent(event);

      applied.push({
        id: event.id,
        type: event.type,
        activationTimeSeconds:
          event.activationTimeSeconds,
        targetId:
          event.targetId,
      });

      this.nextEventIndex += 1;
    }

    this.lastProcessedTimeSeconds =
      simulationTimeSeconds;

    return applied;
  }

  /**
   * Returns whether an exit remains available.
   */
  public isExitAvailable(
    exitId: ExitId,
  ): boolean {
    const exitExists =
      this.exitSet.exits.some(
        (exit) =>
          exit.id === exitId,
      );

    if (!exitExists) {
      throw new Error(
        `Unknown exit: ${exitId}`,
      );
    }

    return !this.blockedExitIds.has(
      exitId,
    );
  }

  /**
   * Returns all currently blocked exits.
   */
  public getBlockedExitIds():
    readonly ExitId[] {
    return Array.from(
      this.blockedExitIds,
    );
  }

  /**
   * Number of scheduled events already applied.
   */
  public getAppliedEventCount(): number {
    return this.nextEventIndex;
  }

  /**
   * Number of events that have not yet been applied.
   */
  public getPendingEventCount(): number {
    return (
      this.scenario
        .disruptionSchedule
        .length -
      this.nextEventIndex
    );
  }

  /**
   * Restores the controller to its initial state so that the same
   * immutable ScenarioInstance can be replayed deterministically.
   */
  public reset(): void {
    this.nextEventIndex = 0;

    this.lastProcessedTimeSeconds =
      0;

    this.blockedExitIds.clear();

    this.hazardField.resetAll();
  }
}