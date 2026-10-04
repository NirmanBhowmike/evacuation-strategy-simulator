import type {
  DisruptionEvent,
} from "../types/scenario";

/**
 * Frozen Architecture V2 research configuration.
 *
 * Calibration completed before formal experimental runs.
 *
 * Do not change these values without creating a new
 * parameter-set version and repeating the required
 * calibration / validation work.
 */
export const ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION =
  "architecture-v2-research-v1.0-frozen";

export const ARCHITECTURE_V2_RESEARCH_TIMESTEP_SECONDS =
  0.05;

export const ARCHITECTURE_V2_RESEARCH_DENSITY_CELL_LENGTH_METERS =
  1.0;

export const ARCHITECTURE_V2_RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND =
  1.3;

export const ARCHITECTURE_V2_RESEARCH_ADAPTIVE_REROUTE_THRESHOLD =
  0.10;

/**
 * Calibrated formal occupancy levels.
 *
 * Low    = 14
 * Medium = 42
 * High   = 70
 *
 * 84 occupants is retained only as a separate
 * overload / stress-test condition.
 */
export const ARCHITECTURE_V2_RESEARCH_OCCUPANCY =
  Object.freeze({
    LOW:
      14,

    MEDIUM:
      42,

    HIGH:
      70,
  });

export const ARCHITECTURE_V2_RESEARCH_STRESS_TEST_OCCUPANCY =
  84;

/**
 * Independently calibrated disruption timings.
 */
export const ARCHITECTURE_V2_RESEARCH_TIMING =
  Object.freeze({
    HAZARD_SECONDS:
      12,

    EXIT_BLOCK_SECONDS:
      18,

    CORRIDOR_BLOCK_SECONDS:
      12,
  });

/**
 * Frozen disruption targets.
 */
export const ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS =
  Object.freeze({
    HAZARD_ZONE:
      "corridor-main-spine",

    EXIT:
      "exit-south-central",

    CORRIDOR_ZONE:
      "corridor-main-central-east-blockable",

    CORRIDOR_EDGE:
      "edge-main-central-central-01",
  });

export type ArchitectureV2ResearchDisruptionConditionId =
  | "D0_BASELINE"
  | "D1_HAZARD"
  | "D2_EXIT_BLOCK"
  | "D3_CORRIDOR_BLOCK"
  | "D4_COMBINED";

export interface ArchitectureV2ResearchDisruptionCondition {
  readonly id:
    ArchitectureV2ResearchDisruptionConditionId;

  readonly label:
    string;

  readonly events:
    readonly DisruptionEvent[];
}

const NO_EVENTS:
  readonly DisruptionEvent[] =
Object.freeze([]);

const D1_HAZARD_EVENTS:
  readonly DisruptionEvent[] =
Object.freeze([
  {
    id:
      "v2-d1-main-spine-hazard",

    type:
      "HAZARD_ACTIVATE",

    activationTimeSeconds:
      ARCHITECTURE_V2_RESEARCH_TIMING
        .HAZARD_SECONDS,

    targetId:
      ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS
        .HAZARD_ZONE,
  },
]);

const D2_EXIT_BLOCK_EVENTS:
  readonly DisruptionEvent[] =
Object.freeze([
  {
    id:
      "v2-d2-south-central-exit-block",

    type:
      "EXIT_BLOCK",

    activationTimeSeconds:
      ARCHITECTURE_V2_RESEARCH_TIMING
        .EXIT_BLOCK_SECONDS,

    targetId:
      ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS
        .EXIT,
  },
]);

const D3_CORRIDOR_BLOCK_EVENTS:
  readonly DisruptionEvent[] =
Object.freeze([
  {
    id:
      "v2-d3-main-central-corridor-block",

    type:
      "CORRIDOR_BLOCK",

    activationTimeSeconds:
      ARCHITECTURE_V2_RESEARCH_TIMING
        .CORRIDOR_BLOCK_SECONDS,

    targetId:
      ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS
        .CORRIDOR_ZONE,
  },
]);

/**
 * D4 deliberately combines only the independently
 * calibrated D1 and D2 events.
 *
 * D3 remains a separate experimental mechanism.
 */
const D4_COMBINED_EVENTS:
  readonly DisruptionEvent[] =
Object.freeze([
  {
    id:
      "v2-d4-main-spine-hazard",

    type:
      "HAZARD_ACTIVATE",

    activationTimeSeconds:
      ARCHITECTURE_V2_RESEARCH_TIMING
        .HAZARD_SECONDS,

    targetId:
      ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS
        .HAZARD_ZONE,
  },

  {
    id:
      "v2-d4-south-central-exit-block",

    type:
      "EXIT_BLOCK",

    activationTimeSeconds:
      ARCHITECTURE_V2_RESEARCH_TIMING
        .EXIT_BLOCK_SECONDS,

    targetId:
      ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS
        .EXIT,
  },
]);

export const ARCHITECTURE_V2_RESEARCH_DISRUPTION_CONDITIONS:
  readonly ArchitectureV2ResearchDisruptionCondition[] =
Object.freeze([
  Object.freeze({
    id:
      "D0_BASELINE",

    label:
      "No disruption",

    events:
      NO_EVENTS,
  }),

  Object.freeze({
    id:
      "D1_HAZARD",

    label:
      "Main-spine hazard at 12 s",

    events:
      D1_HAZARD_EVENTS,
  }),

  Object.freeze({
    id:
      "D2_EXIT_BLOCK",

    label:
      "South-central exit block at 18 s",

    events:
      D2_EXIT_BLOCK_EVENTS,
  }),

  Object.freeze({
    id:
      "D3_CORRIDOR_BLOCK",

    label:
      "Main-central corridor block at 12 s",

    events:
      D3_CORRIDOR_BLOCK_EVENTS,
  }),

  Object.freeze({
    id:
      "D4_COMBINED",

    label:
      "Main-spine hazard at 12 s plus south-central exit block at 18 s",

    events:
      D4_COMBINED_EVENTS,
  }),
]);

export function getArchitectureV2ResearchDisruptionCondition(
  id:
    ArchitectureV2ResearchDisruptionConditionId,
): ArchitectureV2ResearchDisruptionCondition {
  const condition =
    ARCHITECTURE_V2_RESEARCH_DISRUPTION_CONDITIONS
      .find(
        (
          candidate,
        ) =>
          candidate.id ===
          id,
      );

  if (!condition) {
    throw new Error(
      `Unknown Architecture V2 research disruption condition: ${id}`,
    );
  }

  return condition;
}