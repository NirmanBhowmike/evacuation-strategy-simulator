import {
  useMemo,
  useState,
} from "react";

import {
  createInteractiveDemoManualEvent,
  hasInteractiveDemoEventType,
  hasInteractiveDemoTarget,
  INTERACTIVE_DEMO_CORRIDOR_TARGETS,
  INTERACTIVE_DEMO_EXIT_TARGETS,
  INTERACTIVE_DEMO_NOTICE,
  sortInteractiveDemoEvents,
} from "./interactiveDemoMode";

import type {
  InteractiveDemoCorridorTargetId,
  InteractiveDemoExitTargetId,
  InteractiveDemoManualEvent,
} from "./interactiveDemoMode";

interface InteractiveDemoControlsProps {
  readonly events:
    readonly InteractiveDemoManualEvent[];

  readonly playbackTimeSeconds:
    number;

  readonly disabled?:
    boolean;

  readonly onTrigger:
    (
      event:
        InteractiveDemoManualEvent,
    ) => void;

  readonly onReset:
    () => void;
}

type DemoPreset =
  | "CUSTOM"
  | "HAZARD_ONLY"
  | "EAST_EXIT"
  | "MULTI_EXIT"
  | "ALL_EXITS"
  | "CORRIDOR"
  | "COMBINED";

const EXIT_LABELS:
  Readonly<
    Record<
      InteractiveDemoExitTargetId,
      string
    >
  > =
Object.freeze({
  "exit-west":
    "West exit",

  "exit-south-central":
    "South-central exit",

  "exit-east":
    "East exit",

  "exit-southeast":
    "Southeast exit",
});

const CORRIDOR_LABELS:
  Readonly<
    Record<
      InteractiveDemoCorridorTargetId,
      string
    >
  > =
Object.freeze({
  "corridor-main-central-east-blockable":
    "Main-central corridor",

  "corridor-main-east-southeast-blockable":
    "East-main to southeast corridor",
});

function eventTargetLabel(
  event:
    InteractiveDemoManualEvent,
): string {
  switch (
    event.type
  ) {
    case "HAZARD_ACTIVATE":
      return "Main spine";

    case "EXIT_BLOCK":
      return EXIT_LABELS[
        event.targetId as
          InteractiveDemoExitTargetId
      ];

    case "CORRIDOR_BLOCK":
      return CORRIDOR_LABELS[
        event.targetId as
          InteractiveDemoCorridorTargetId
      ];
  }
}

function eventTypeLabel(
  event:
    InteractiveDemoManualEvent,
): string {
  switch (
    event.type
  ) {
    case "HAZARD_ACTIVATE":
      return "Hazard activated";

    case "EXIT_BLOCK":
      return "Exit blocked";

    case "CORRIDOR_BLOCK":
      return "Corridor blocked";
  }
}

export function InteractiveDemoControls({
  events,
  playbackTimeSeconds,
  disabled = false,
  onTrigger,
  onReset,
}: InteractiveDemoControlsProps) {
  const [
    preset,
    setPreset,
  ] =
    useState<
      DemoPreset
    >(
      "CUSTOM",
    );

  const [
    hazardSelected,
    setHazardSelected,
  ] =
    useState(
      false,
    );

  const [
    selectedExitTargets,
    setSelectedExitTargets,
  ] =
    useState<
      ReadonlySet<
        InteractiveDemoExitTargetId
      >
    >(
      new Set<
        InteractiveDemoExitTargetId
      >(),
    );

  const [
    corridorSelected,
    setCorridorSelected,
  ] =
    useState(
      false,
    );

  const [
    corridorTarget,
    setCorridorTarget,
  ] =
    useState<
      InteractiveDemoCorridorTargetId
    >(
      "corridor-main-east-southeast-blockable",
    );

  const sortedEvents =
    useMemo(
      () =>
        sortInteractiveDemoEvents(
          events,
        ),
      [
        events,
      ],
    );

  const hazardAlreadyTriggered =
    hasInteractiveDemoEventType(
      events,
      "HAZARD_ACTIVATE",
    );

  const corridorAlreadyTriggered =
    hasInteractiveDemoEventType(
      events,
      "CORRIDOR_BLOCK",
    );

  const availableExitTargets =
    INTERACTIVE_DEMO_EXIT_TARGETS.filter(
      (
        targetId,
      ) =>
        !hasInteractiveDemoTarget(
          events,
          "EXIT_BLOCK",
          targetId,
        ),
    );

  const selectedAvailableExitTargets =
    INTERACTIVE_DEMO_EXIT_TARGETS.filter(
      (
        targetId,
      ) =>
        selectedExitTargets.has(
          targetId,
        ) &&
        !hasInteractiveDemoTarget(
          events,
          "EXIT_BLOCK",
          targetId,
        ),
    );

  const allExitsBlocked =
    availableExitTargets.length ===
    0;

  const selectedDisruptionCount =
    (
      hazardSelected &&
      !hazardAlreadyTriggered
        ? 1
        : 0
    ) +
    selectedAvailableExitTargets.length +
    (
      corridorSelected &&
      !corridorAlreadyTriggered
        ? 1
        : 0
    );

  const canApply =
    !disabled &&
    selectedDisruptionCount >
      0;

  const selectPreset =
    (
      nextPreset:
        DemoPreset,
    ) => {
      setPreset(
        nextPreset,
      );

      if (
        nextPreset ===
        "CUSTOM"
      ) {
        return;
      }

      setHazardSelected(
        false,
      );

      setSelectedExitTargets(
        new Set<
          InteractiveDemoExitTargetId
        >(),
      );

      setCorridorSelected(
        false,
      );

      switch (
        nextPreset
      ) {
        case "HAZARD_ONLY":
          setHazardSelected(
            !hazardAlreadyTriggered,
          );
          return;

        case "EAST_EXIT":
          if (
            !hasInteractiveDemoTarget(
              events,
              "EXIT_BLOCK",
              "exit-east",
            )
          ) {
            setSelectedExitTargets(
              new Set([
                "exit-east",
              ]),
            );
          }
          return;

        case "MULTI_EXIT": {
          const targets =
            [
              "exit-east",
              "exit-southeast",
            ] satisfies
              InteractiveDemoExitTargetId[];

          setSelectedExitTargets(
            new Set(
              targets.filter(
                (
                  targetId,
                ) =>
                  !hasInteractiveDemoTarget(
                    events,
                    "EXIT_BLOCK",
                    targetId,
                  ),
              ),
            ),
          );

          return;
        }

        case "ALL_EXITS":
          setSelectedExitTargets(
            new Set(
              availableExitTargets,
            ),
          );
          return;

        case "CORRIDOR":
          setCorridorTarget(
            "corridor-main-east-southeast-blockable",
          );

          setCorridorSelected(
            !corridorAlreadyTriggered,
          );
          return;

        case "COMBINED": {
          setHazardSelected(
            !hazardAlreadyTriggered,
          );

          const targets =
            [
              "exit-east",
              "exit-southeast",
            ] satisfies
              InteractiveDemoExitTargetId[];

          setSelectedExitTargets(
            new Set(
              targets.filter(
                (
                  targetId,
                ) =>
                  !hasInteractiveDemoTarget(
                    events,
                    "EXIT_BLOCK",
                    targetId,
                  ),
              ),
            ),
          );

          setCorridorTarget(
            "corridor-main-east-southeast-blockable",
          );

          setCorridorSelected(
            !corridorAlreadyTriggered,
          );

          return;
        }
      }
    };

  const markCustom =
    () => {
      setPreset(
        "CUSTOM",
      );
    };

  const toggleExitTarget =
    (
      targetId:
        InteractiveDemoExitTargetId,
    ) => {
      if (
        disabled ||
        hasInteractiveDemoTarget(
          events,
          "EXIT_BLOCK",
          targetId,
        )
      ) {
        return;
      }

      markCustom();

      setSelectedExitTargets(
        (
          current,
        ) => {
          const next =
            new Set(
              current,
            );

          if (
            next.has(
              targetId,
            )
          ) {
            next.delete(
              targetId,
            );
          } else {
            next.add(
              targetId,
            );
          }

          return next;
        },
      );
    };

  const selectAllAvailableExits =
    () => {
      if (
        disabled ||
        allExitsBlocked
      ) {
        return;
      }

      markCustom();

      setSelectedExitTargets(
        new Set(
          availableExitTargets,
        ),
      );
    };

  const clearExitSelection =
    () => {
      if (
        disabled
      ) {
        return;
      }

      markCustom();

      setSelectedExitTargets(
        new Set<
          InteractiveDemoExitTargetId
        >(),
      );
    };

  const applySelectedDisruptions =
    () => {
      if (
        !canApply
      ) {
        return;
      }

      /*
       * Every event created in this action receives exactly
       * the same simulation timestamp.
       */
      const activationTimeSeconds =
        playbackTimeSeconds;

      if (
        hazardSelected &&
        !hazardAlreadyTriggered
      ) {
        onTrigger(
          createInteractiveDemoManualEvent(
            "HAZARD_ACTIVATE",
            "corridor-main-spine",
            activationTimeSeconds,
          ),
        );
      }

      for (
        const targetId of
          selectedAvailableExitTargets
      ) {
        onTrigger(
          createInteractiveDemoManualEvent(
            "EXIT_BLOCK",
            targetId,
            activationTimeSeconds,
          ),
        );
      }

      if (
        corridorSelected &&
        !corridorAlreadyTriggered
      ) {
        onTrigger(
          createInteractiveDemoManualEvent(
            "CORRIDOR_BLOCK",
            corridorTarget,
            activationTimeSeconds,
          ),
        );
      }

      setPreset(
        "CUSTOM",
      );

      setHazardSelected(
        false,
      );

      setSelectedExitTargets(
        new Set<
          InteractiveDemoExitTargetId
        >(),
      );

      setCorridorSelected(
        false,
      );
    };

  const applyButtonLabel =
    selectedDisruptionCount ===
    0
      ? "Select Disruptions"
      : selectedDisruptionCount ===
        1
        ? "Apply 1 Disruption"
        : `Apply ${selectedDisruptionCount} Disruptions`;

  return (
    <div className="interactive-demo-config">
      <div className="demo-mode-identification">
        <div className="demo-mode-identification-heading">
          <span className="demo-mode-kicker">
            Interactive Demo
          </span>

          <span className="demo-mode-status">
            Demonstration Mode
          </span>
        </div>

        <p>
          {
            INTERACTIVE_DEMO_NOTICE
          }
        </p>

        <small>
          Build a custom disruption scenario or use a demonstration preset. All selected events are reproducible from the same seed and event log.
        </small>
      </div>

      <div className="demo-config-field">
        <label
          className="field-label"
          htmlFor="demo-preset"
        >
          Demo setup
        </label>

        <select
          id="demo-preset"
          className="scenario-select"
          value={
            preset
          }
          disabled={
            disabled
          }
          onChange={
            (
              event,
            ) =>
              selectPreset(
                event.target.value as
                  DemoPreset,
              )
          }
        >
          <option value="CUSTOM">
            Custom scenario
          </option>

          <option value="HAZARD_ONLY">
            Preset · Main-spine hazard
          </option>

          <option value="EAST_EXIT">
            Preset · East exit closure
          </option>

          <option value="MULTI_EXIT">
            Preset · East + Southeast exits
          </option>

          <option value="ALL_EXITS">
            Preset · All available exits
          </option>

          <option value="CORRIDOR">
            Preset · East-southeast corridor closure
          </option>

          <option value="COMBINED">
            Preset · Combined demonstration
          </option>
        </select>
      </div>

      <div className="demo-disruption-builder">
        <div className="demo-disruption-section">
          <div className="demo-section-heading">
            <div>
              <span className="field-label">
                Hazard
              </span>

              <small>
                Main-spine hazard · traversable
              </small>
            </div>

            <label
              className={
                `demo-selection-toggle${
                  hazardSelected
                    ? " selected"
                    : ""
                }${
                  hazardAlreadyTriggered
                    ? " applied"
                    : ""
                }`
              }
            >
              <input
                type="checkbox"
                checked={
                  hazardSelected
                }
                disabled={
                  disabled ||
                  hazardAlreadyTriggered
                }
                onChange={
                  (
                    event,
                  ) => {
                    markCustom();

                    setHazardSelected(
                      event.target.checked,
                    );
                  }
                }
              />

              <span>
                {hazardAlreadyTriggered
                  ? "Applied"
                  : hazardSelected
                    ? "Selected"
                    : "Add"}
              </span>
            </label>
          </div>
        </div>

        <div className="demo-disruption-section">
          <div className="demo-section-heading">
            <div>
              <span className="field-label">
                Exit blocks
              </span>

              <small>
                Select one or multiple exits
              </small>
            </div>

            <div className="demo-exit-selector-actions">
              <button
                type="button"
                className="demo-text-button"
                disabled={
                  disabled ||
                  allExitsBlocked
                }
                onClick={
                  selectAllAvailableExits
                }
              >
                Select available
              </button>

              <button
                type="button"
                className="demo-text-button"
                disabled={
                  disabled ||
                  selectedExitTargets.size ===
                    0
                }
                onClick={
                  clearExitSelection
                }
              >
                Clear
              </button>
            </div>
          </div>

          <div className="demo-exit-grid">
            {INTERACTIVE_DEMO_EXIT_TARGETS.map(
              (
                targetId,
              ) => {
                const alreadyBlocked =
                  hasInteractiveDemoTarget(
                    events,
                    "EXIT_BLOCK",
                    targetId,
                  );

                const selected =
                  selectedExitTargets.has(
                    targetId,
                  );

                return (
                  <label
                    key={
                      targetId
                    }
                    className={
                      `demo-exit-option${
                        selected
                          ? " selected"
                          : ""
                      }${
                        alreadyBlocked
                          ? " applied"
                          : ""
                      }`
                    }
                  >
                    <input
                      type="checkbox"
                      checked={
                        selected
                      }
                      disabled={
                        disabled ||
                        alreadyBlocked
                      }
                      onChange={
                        () =>
                          toggleExitTarget(
                            targetId,
                          )
                      }
                    />

                    <span className="demo-exit-option-copy">
                      <strong>
                        {
                          EXIT_LABELS[
                            targetId
                          ]
                        }
                      </strong>

                      <small>
                        {alreadyBlocked
                          ? "Already blocked"
                          : selected
                            ? "Selected"
                            : "Available"}
                      </small>
                    </span>

                    <span className="demo-exit-check">
                      {alreadyBlocked
                        ? "×"
                        : selected
                          ? "✓"
                          : ""}
                    </span>
                  </label>
                );
              },
            )}
          </div>
        </div>

        <div className="demo-disruption-section">
          <div className="demo-section-heading">
            <div>
              <span className="field-label">
                Corridor block
              </span>

              <small>
                Maximum one corridor block per demo run
              </small>
            </div>

            <label
              className={
                `demo-selection-toggle${
                  corridorSelected
                    ? " selected"
                    : ""
                }${
                  corridorAlreadyTriggered
                    ? " applied"
                    : ""
                }`
              }
            >
              <input
                type="checkbox"
                checked={
                  corridorSelected
                }
                disabled={
                  disabled ||
                  corridorAlreadyTriggered
                }
                onChange={
                  (
                    event,
                  ) => {
                    markCustom();

                    setCorridorSelected(
                      event.target.checked,
                    );
                  }
                }
              />

              <span>
                {corridorAlreadyTriggered
                  ? "Applied"
                  : corridorSelected
                    ? "Selected"
                    : "Add"}
              </span>
            </label>
          </div>

          <select
            className="scenario-select"
            value={
              corridorTarget
            }
            disabled={
              disabled ||
              corridorAlreadyTriggered ||
              !corridorSelected
            }
            onChange={
              (
                event,
              ) => {
                markCustom();

                setCorridorTarget(
                  event.target.value as
                    InteractiveDemoCorridorTargetId,
                );
              }
            }
          >
            {INTERACTIVE_DEMO_CORRIDOR_TARGETS.map(
              (
                targetId,
              ) => (
                <option
                  key={
                    targetId
                  }
                  value={
                    targetId
                  }
                >
                  {
                    CORRIDOR_LABELS[
                      targetId
                    ]
                  }
                </option>
              ),
            )}
          </select>

          <small className="demo-field-help">
            The selected corridor closes to new entry when the event is applied.
          </small>
        </div>
      </div>

      <div className="demo-activation-summary">
        <div>
          <span>
            Activation time
          </span>

          <strong>
            {playbackTimeSeconds.toFixed(
              1,
            )}{" "}
            s
          </strong>
        </div>

        <div>
          <span>
            Selected disruptions
          </span>

          <strong>
            {
              selectedDisruptionCount
            }
          </strong>
        </div>
      </div>

      <button
        type="button"
        className="primary-button demo-trigger-button"
        disabled={
          !canApply
        }
        onClick={
          applySelectedDisruptions
        }
      >
        {
          applyButtonLabel
        }
      </button>

      <div className="demo-event-log">
        <div className="demo-event-log-header">
          <div>
            <span className="field-label">
              Demo event log
            </span>

            <small>
              Reproducible manual events
            </small>
          </div>

          <span className="demo-event-count">
            {sortedEvents.length}
          </span>
        </div>

        {sortedEvents.length ===
        0 ? (
          <div className="demo-event-empty">
            No disruptions have been applied.
          </div>
        ) : (
          <div className="demo-event-list">
            {sortedEvents.map(
              (
                event,
                index,
              ) => (
                <div
                  key={
                    event.eventId
                  }
                  className="demo-event-row"
                >
                  <span className="demo-event-index">
                    {String(
                      index +
                        1,
                    ).padStart(
                      2,
                      "0",
                    )}
                  </span>

                  <div className="demo-event-copy">
                    <strong>
                      {
                        eventTypeLabel(
                          event,
                        )
                      }
                    </strong>

                    <span>
                      {
                        eventTargetLabel(
                          event,
                        )
                      }
                    </span>
                  </div>

                  <time className="demo-event-time">
                    {event.activationTimeSeconds.toFixed(
                      1,
                    )}{" "}
                    s
                  </time>
                </div>
              ),
            )}
          </div>
        )}

        <button
          type="button"
          className="secondary-button demo-clear-events-button"
          disabled={
            disabled ||
            events.length ===
              0
          }
          onClick={
            onReset
          }
        >
          Clear Demo Events
        </button>
      </div>
    </div>
  );
}