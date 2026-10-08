export type SimulationApplicationMode =
  | "RESEARCH"
  | "INTERACTIVE_DEMO";

export const DEFAULT_SIMULATION_APPLICATION_MODE:
  SimulationApplicationMode =
  "RESEARCH";

export const INTERACTIVE_DEMO_NOTICE =
  "Interactive Demo — not a formal research condition.";

export type InteractiveDemoDisruptionType =
  | "HAZARD_ACTIVATE"
  | "EXIT_BLOCK"
  | "CORRIDOR_BLOCK";

export const INTERACTIVE_DEMO_DISRUPTION_TYPES:
  readonly InteractiveDemoDisruptionType[] =
Object.freeze([
  "HAZARD_ACTIVATE",
  "EXIT_BLOCK",
  "CORRIDOR_BLOCK",
]);

export type InteractiveDemoHazardTargetId =
  "corridor-main-spine";

export type InteractiveDemoExitTargetId =
  | "exit-west"
  | "exit-south-central"
  | "exit-east"
  | "exit-southeast";

export type InteractiveDemoCorridorTargetId =
  | "corridor-main-central-east-blockable"
  | "corridor-main-east-southeast-blockable";

export type InteractiveDemoTargetId =
  | InteractiveDemoHazardTargetId
  | InteractiveDemoExitTargetId
  | InteractiveDemoCorridorTargetId;

export const INTERACTIVE_DEMO_HAZARD_TARGETS:
  readonly InteractiveDemoHazardTargetId[] =
Object.freeze([
  "corridor-main-spine",
]);

export const INTERACTIVE_DEMO_EXIT_TARGETS:
  readonly InteractiveDemoExitTargetId[] =
Object.freeze([
  "exit-west",
  "exit-south-central",
  "exit-east",
  "exit-southeast",
]);

export const INTERACTIVE_DEMO_CORRIDOR_TARGETS:
  readonly InteractiveDemoCorridorTargetId[] =
Object.freeze([
  "corridor-main-central-east-blockable",
  "corridor-main-east-southeast-blockable",
]);

export interface InteractiveDemoManualEvent {
  readonly eventId:
    string;

  readonly type:
    InteractiveDemoDisruptionType;

  readonly targetId:
    InteractiveDemoTargetId;

  readonly activationTimeSeconds:
    number;
}

export const INTERACTIVE_DEMO_MAX_HAZARD_EVENTS =
  1;

export const INTERACTIVE_DEMO_MAX_CORRIDOR_BLOCK_EVENTS =
  1;

export const INTERACTIVE_DEMO_MAX_EXIT_BLOCK_EVENTS =
  INTERACTIVE_DEMO_EXIT_TARGETS.length;

export function getInteractiveDemoTargets(
  type:
    InteractiveDemoDisruptionType,
): readonly InteractiveDemoTargetId[] {
  switch (
    type
  ) {
    case "HAZARD_ACTIVATE":
      return INTERACTIVE_DEMO_HAZARD_TARGETS;

    case "EXIT_BLOCK":
      return INTERACTIVE_DEMO_EXIT_TARGETS;

    case "CORRIDOR_BLOCK":
      return INTERACTIVE_DEMO_CORRIDOR_TARGETS;
  }
}

export function isInteractiveDemoTargetValid(
  type:
    InteractiveDemoDisruptionType,

  targetId:
    InteractiveDemoTargetId,
): boolean {
  return getInteractiveDemoTargets(
    type,
  ).includes(
    targetId,
  );
}

export function countInteractiveDemoEventType(
  events:
    readonly InteractiveDemoManualEvent[],

  type:
    InteractiveDemoDisruptionType,
): number {
  return events.filter(
    (
      event,
    ) =>
      event.type ===
      type,
  ).length;
}

export function hasInteractiveDemoEventType(
  events:
    readonly InteractiveDemoManualEvent[],

  type:
    InteractiveDemoDisruptionType,
): boolean {
  return (
    countInteractiveDemoEventType(
      events,
      type,
    ) >
    0
  );
}

export function hasInteractiveDemoTarget(
  events:
    readonly InteractiveDemoManualEvent[],

  type:
    InteractiveDemoDisruptionType,

  targetId:
    InteractiveDemoTargetId,
): boolean {
  return events.some(
    (
      event,
    ) =>
      event.type ===
        type &&
      event.targetId ===
        targetId,
  );
}

export function getAvailableInteractiveDemoExitTargets(
  events:
    readonly InteractiveDemoManualEvent[],
): readonly InteractiveDemoExitTargetId[] {
  return INTERACTIVE_DEMO_EXIT_TARGETS.filter(
    (
      targetId,
    ) =>
      !hasInteractiveDemoTarget(
        events,
        "EXIT_BLOCK",
        targetId,
      ),
  );
}

export function canAddInteractiveDemoEvent(
  events:
    readonly InteractiveDemoManualEvent[],

  type:
    InteractiveDemoDisruptionType,

  targetId:
    InteractiveDemoTargetId,

  activationTimeSeconds:
    number,
): boolean {
  if (
    !Number.isFinite(
      activationTimeSeconds,
    ) ||
    activationTimeSeconds <
      0
  ) {
    return false;
  }

  if (
    !isInteractiveDemoTargetValid(
      type,
      targetId,
    )
  ) {
    return false;
  }

  if (
    hasInteractiveDemoTarget(
      events,
      type,
      targetId,
    )
  ) {
    return false;
  }

  switch (
    type
  ) {
    case "HAZARD_ACTIVATE":
      return (
        countInteractiveDemoEventType(
          events,
          type,
        ) <
        INTERACTIVE_DEMO_MAX_HAZARD_EVENTS
      );

    case "CORRIDOR_BLOCK":
      return (
        countInteractiveDemoEventType(
          events,
          type,
        ) <
        INTERACTIVE_DEMO_MAX_CORRIDOR_BLOCK_EVENTS
      );

    case "EXIT_BLOCK":
      return (
        countInteractiveDemoEventType(
          events,
          type,
        ) <
        INTERACTIVE_DEMO_MAX_EXIT_BLOCK_EVENTS
      );
  }
}

function normalizeEventToken(
  value:
    string,
): string {
  return value
    .trim()
    .toLowerCase()
    .replaceAll(
      "_",
      "-",
    );
}

export function createInteractiveDemoEventId(
  type:
    InteractiveDemoDisruptionType,

  targetId:
    InteractiveDemoTargetId,

  activationTimeSeconds:
    number,
): string {
  if (
    !Number.isFinite(
      activationTimeSeconds,
    ) ||
    activationTimeSeconds <
      0
  ) {
    throw new Error(
      "Interactive Demo event activation time must be a finite non-negative number.",
    );
  }

  if (
    !isInteractiveDemoTargetValid(
      type,
      targetId,
    )
  ) {
    throw new Error(
      `Interactive Demo target ${targetId} is invalid for ${type}.`,
    );
  }

  return [
    "interactive-demo",
    normalizeEventToken(
      type,
    ),
    normalizeEventToken(
      targetId,
    ),
    activationTimeSeconds
      .toFixed(
        3,
      )
      .replace(
        ".",
        "-",
      ),
  ].join(
    "__",
  );
}

export function createInteractiveDemoManualEvent(
  type:
    InteractiveDemoDisruptionType,

  targetId:
    InteractiveDemoTargetId,

  activationTimeSeconds:
    number,
): InteractiveDemoManualEvent {
  if (
    !isInteractiveDemoTargetValid(
      type,
      targetId,
    )
  ) {
    throw new Error(
      `Interactive Demo target ${targetId} is invalid for ${type}.`,
    );
  }

  if (
    !Number.isFinite(
      activationTimeSeconds,
    ) ||
    activationTimeSeconds <
      0
  ) {
    throw new Error(
      "Interactive Demo event activation time must be a finite non-negative number.",
    );
  }

  return Object.freeze({
    eventId:
      createInteractiveDemoEventId(
        type,
        targetId,
        activationTimeSeconds,
      ),

    type,

    targetId,

    activationTimeSeconds,
  });
}

export function sortInteractiveDemoEvents(
  events:
    readonly InteractiveDemoManualEvent[],
): readonly InteractiveDemoManualEvent[] {
  return Object.freeze(
    [
      ...events,
    ].sort(
      (
        left,
        right,
      ) =>
        left.activationTimeSeconds -
          right.activationTimeSeconds ||
        left.type.localeCompare(
          right.type,
        ) ||
        left.targetId.localeCompare(
          right.targetId,
        ),
    ),
  );
}