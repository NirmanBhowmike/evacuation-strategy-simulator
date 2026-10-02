import type {
  DisruptionEvent,
} from "../types/scenario";

export const RESEARCH_PARAMETER_SET_VERSION =
  "research-model-v1.0-frozen";

export const RESEARCH_TIMESTEP_SECONDS =
  0.05;

export const RESEARCH_DENSITY_CELL_LENGTH_METERS =
  1.0;

export const RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND =
  1.3;

export const RESEARCH_ADAPTIVE_REROUTE_THRESHOLD =
  0.10;

export const RESEARCH_OCCUPANCY = Object.freeze({
  LOW:
    12,

  MEDIUM:
    36,

  HIGH:
    48,
});

export const RESEARCH_TIMING = Object.freeze({
  EARLY:
    6.65,

  MID:
    13.25,

  LATE:
    19.90,
});

export const RESEARCH_DISRUPTION_TARGETS =
  Object.freeze({
    HAZARD_ZONE:
      "corridor-main-spine",

    EXIT:
      "exit-south-central",

    CORRIDOR_ZONE:
      "corridor-main-east-blockable",
  });

export type ResearchDisruptionConditionId =
  | "D0_BASELINE"
  | "D1_HAZARD"
  | "D2_EXIT_BLOCK"
  | "D3_CORRIDOR_BLOCK"
  | "D4_COMBINED";

export interface ResearchDisruptionCondition {
  readonly id:
    ResearchDisruptionConditionId;

  readonly label:
    string;

  readonly events:
    readonly DisruptionEvent[];
}

const NO_EVENTS:
  readonly DisruptionEvent[] =
Object.freeze([]);

const HAZARD_EVENTS:
  readonly DisruptionEvent[] =
Object.freeze([
  {
    id:
      "d1-hazard-main-spine",

    type:
      "HAZARD_ACTIVATE",

    activationTimeSeconds:
      RESEARCH_TIMING.EARLY,

    targetId:
      RESEARCH_DISRUPTION_TARGETS
        .HAZARD_ZONE,
  },
]);

const EXIT_BLOCK_EVENTS:
  readonly DisruptionEvent[] =
Object.freeze([
  {
    id:
      "d2-exit-south-central",

    type:
      "EXIT_BLOCK",

    activationTimeSeconds:
      RESEARCH_TIMING.MID,

    targetId:
      RESEARCH_DISRUPTION_TARGETS
        .EXIT,
  },
]);

const CORRIDOR_BLOCK_EVENTS:
  readonly DisruptionEvent[] =
Object.freeze([
  {
    id:
      "d3-corridor-main-east",

    type:
      "CORRIDOR_BLOCK",

    activationTimeSeconds:
      RESEARCH_TIMING.EARLY,

    targetId:
      RESEARCH_DISRUPTION_TARGETS
        .CORRIDOR_ZONE,
  },
]);

const COMBINED_EVENTS:
  readonly DisruptionEvent[] =
Object.freeze([
  {
    id:
      "d4-hazard-main-spine",

    type:
      "HAZARD_ACTIVATE",

    activationTimeSeconds:
      RESEARCH_TIMING.EARLY,

    targetId:
      RESEARCH_DISRUPTION_TARGETS
        .HAZARD_ZONE,
  },

  {
    id:
      "d4-exit-south-central",

    type:
      "EXIT_BLOCK",

    activationTimeSeconds:
      RESEARCH_TIMING.MID,

    targetId:
      RESEARCH_DISRUPTION_TARGETS
        .EXIT,
  },
]);

export const RESEARCH_DISRUPTION_CONDITIONS:
  readonly ResearchDisruptionCondition[] =
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
      "Early main-spine hazard",

    events:
      HAZARD_EVENTS,
  }),

  Object.freeze({
    id:
      "D2_EXIT_BLOCK",

    label:
      "Mid south-central exit block",

    events:
      EXIT_BLOCK_EVENTS,
  }),

  Object.freeze({
    id:
      "D3_CORRIDOR_BLOCK",

    label:
      "Early main-east corridor block",

    events:
      CORRIDOR_BLOCK_EVENTS,
  }),

  Object.freeze({
    id:
      "D4_COMBINED",

    label:
      "Early hazard plus mid exit block",

    events:
      COMBINED_EVENTS,
  }),
]);

export function getResearchDisruptionCondition(
  id:
    ResearchDisruptionConditionId,
): ResearchDisruptionCondition {
  const condition =
    RESEARCH_DISRUPTION_CONDITIONS
      .find(
        (
          candidate,
        ) =>
          candidate.id ===
          id,
      );

  if (!condition) {
    throw new Error(
      `Unknown research disruption condition: ${id}`,
    );
  }

  return condition;
}