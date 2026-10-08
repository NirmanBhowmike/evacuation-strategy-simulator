import type {
  DisruptionEvent,
} from "../types/scenario";

/**
 * Frozen Architecture V2 research configuration.
 *
 * Research v1.2 extends the validated v1.1 condition set
 * with independently calibrated D5 and D6 conditions.
 *
 * D0-D4 remain unchanged.
 *
 * Do not change these values without creating a new
 * parameter-set version and repeating the required
 * calibration / validation work.
 */
export const ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION =
  "architecture-v2-research-v1.2-frozen";

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
 * 84 occupants remains a separate overload / stress-test
 * condition and is not part of the primary factorial design.
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
 * Calibrated disruption timings.
 *
 * The alternate exit block uses the same 18 s timing as D2.
 * The alternate corridor block uses the same 12 s timing as D3.
 *
 * This keeps disruption timing controlled when comparing
 * different spatial disruption locations.
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
 * Frozen Architecture V2 disruption targets.
 *
 * D0-D4 targets are unchanged from research v1.1.
 *
 * D5:
 *   west exit
 *
 * D6:
 *   main-east to main-southeast corridor edge
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

    D5_EXIT:
      "exit-west",

    D6_CORRIDOR_ZONE:
      "corridor-main-east-southeast-blockable",

    D6_CORRIDOR_EDGE:
      "edge-main-east-main-southeast",
  });

export type ArchitectureV2ResearchDisruptionConditionId =
  | "D0_BASELINE"
  | "D1_HAZARD"
  | "D2_EXIT_BLOCK"
  | "D3_CORRIDOR_BLOCK"
  | "D4_COMBINED"
  | "D5_EXIT_BLOCK_WEST"
  | "D6_CORRIDOR_BLOCK_EAST_SOUTHEAST";

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
 * D4 deliberately combines only D1 and D2.
 *
 * D3 remains an independent corridor-block mechanism.
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

/**
 * D5 provides a spatially distinct exit-failure condition.
 *
 * Calibration:
 *
 * target = west exit
 * activation = 18 s
 *
 * The timing matches D2 so the formal experiment can compare
 * disruption location while holding exit-block timing fixed.
 */
const D5_EXIT_BLOCK_WEST_EVENTS:
  readonly DisruptionEvent[] =
Object.freeze([
  {
    id:
      "v2-d5-west-exit-block",

    type:
      "EXIT_BLOCK",

    activationTimeSeconds:
      ARCHITECTURE_V2_RESEARCH_TIMING
        .EXIT_BLOCK_SECONDS,

    targetId:
      ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS
        .D5_EXIT,
  },
]);

/**
 * D6 provides a second spatially distinct corridor failure.
 *
 * Calibration:
 *
 * target edge =
 *   edge-main-east-main-southeast
 *
 * activation = 12 s
 *
 * The edge receives its dedicated blockable zone in the
 * Architecture V2 research-model adapter.
 */
const D6_CORRIDOR_BLOCK_EAST_SOUTHEAST_EVENTS:
  readonly DisruptionEvent[] =
Object.freeze([
  {
    id:
      "v2-d6-main-east-southeast-corridor-block",

    type:
      "CORRIDOR_BLOCK",

    activationTimeSeconds:
      ARCHITECTURE_V2_RESEARCH_TIMING
        .CORRIDOR_BLOCK_SECONDS,

    targetId:
      ARCHITECTURE_V2_RESEARCH_DISRUPTION_TARGETS
        .D6_CORRIDOR_ZONE,
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

  Object.freeze({
    id:
      "D5_EXIT_BLOCK_WEST",

    label:
      "West exit block at 18 s",

    events:
      D5_EXIT_BLOCK_WEST_EVENTS,
  }),

  Object.freeze({
    id:
      "D6_CORRIDOR_BLOCK_EAST_SOUTHEAST",

    label:
      "East-main to southeast corridor block at 12 s",

    events:
      D6_CORRIDOR_BLOCK_EAST_SOUTHEAST_EVENTS,
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