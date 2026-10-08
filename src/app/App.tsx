import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  ChangeEvent,
  ReactNode,
} from "react";

import {
  ARCHITECTURE_V2_FORMAL_STRATEGY_IDS,
} from "../experiment/architectureV2FormalExperimentDesign";

import {
  layoutAArchitectureV2NavigationGraph,
} from "../environment/layoutAArchitectureV2NavigationGraph";

import type {
  ArchitectureV2FormalPopulationLevel,
} from "../population/architectureV2FormalPopulation";

import {
  ARCHITECTURE_V2_RESEARCH_DISRUPTION_CONDITIONS,
  ARCHITECTURE_V2_RESEARCH_OCCUPANCY,
  ARCHITECTURE_V2_RESEARCH_TIMING,
} from "../scenario/architectureV2ResearchParameterSet";

import type {
  ArchitectureV2ResearchDisruptionConditionId,
} from "../scenario/architectureV2ResearchParameterSet";

import type {
  AppliedDisruptionRecord,
} from "../types/headlessSimulation";

import type {
  RoutingStrategyId,
} from "../types/routingStrategy";

import type {
  SimulationReplayFrame,
} from "../types/simulationReplay";

import type {
  SimulationAgentSnapshot,
} from "../types/simulationSnapshot";

import type {
  AgentSelectionMode,
} from "../visualization/ArchitectureV2OccupantLayer";

import {
  ResearchScene,
} from "../visualization/ResearchScene";

import type {
  ResearchCameraPreset,
  ResearchVisualTheme,
} from "../visualization/ResearchScene";

import {
  createArchitectureV2DemoReplay,
  DEFAULT_ARCHITECTURE_V2_DEMO_REQUEST,
} from "./createArchitectureV2DemoReplay";

import type {
  ArchitectureV2DemoReplayRequest,
} from "./createArchitectureV2DemoReplay";

import {
  createInteractiveDemoReplay,
} from "./createInteractiveDemoReplay";

import {
  DEFAULT_SIMULATION_APPLICATION_MODE,
} from "./interactiveDemoMode";

import type {
  InteractiveDemoManualEvent,
  SimulationApplicationMode,
} from "./interactiveDemoMode";

import {
  InteractiveDemoControls,
} from "./InteractiveDemoControls";

interface MetricCardProps {
  readonly label:
    string;

  readonly value:
    string;

  readonly unit?:
    string;

  readonly primary?:
    boolean;
}

interface ReplayLocation {
  readonly currentFrame:
    SimulationReplayFrame;

  readonly nextFrame:
    SimulationReplayFrame;

  readonly interpolationAlpha:
    number;
}

interface ScenarioSelectProps {
  readonly label:
    string;

  readonly value:
    string;

  readonly onChange:
    (
      event:
        ChangeEvent<HTMLSelectElement>,
    ) => void;

  readonly children:
    ReactNode;
}

const DEFAULT_REPLAY_SEED =
  DEFAULT_ARCHITECTURE_V2_DEMO_REQUEST.replicationSeed ??
  100001;

const EVENT_NOTIFICATION_TOTAL_SECONDS =
  6;

const EVENT_NOTIFICATION_FADE_START_SECONDS =
  4.6;

const THEME_STORAGE_KEY =
  "evacuation-simulator-theme";

const PREPARATION_PAINT_DELAY_MS =
  80;

const STRATEGY_LABELS:
  Readonly<
    Record<
      RoutingStrategyId,
      string
    >
  > =
Object.freeze({
  NEAREST_EXIT:
    "Nearest Exit",

  STATIC_SHORTEST_PATH:
    "Static Shortest Path",

  CONGESTION_AWARE:
    "Congestion-Aware",

  HAZARD_AWARE:
    "Hazard-Aware",

  ADAPTIVE_HYBRID:
    "Adaptive Hybrid",
});

const POPULATION_LEVELS:
  readonly ArchitectureV2FormalPopulationLevel[] =
Object.freeze([
  "LOW",
  "MEDIUM",
  "HIGH",
]);

const CAMERA_PRESETS:
  readonly ResearchCameraPreset[] =
Object.freeze([
  "HOME",
  "ANGLE",
  "TOP",
  "WEST",
  "EAST",
]);

function MetricCard({
  label,
  value,
  unit,
  primary =
    false,
}: MetricCardProps) {
  return (
    <div
      className={
        `metric-card${
          primary
            ? " primary-metric"
            : ""
        }`
      }
    >
      <div className="metric-label">
        {label}
      </div>

      <div className="metric-value-row">
        <span className="metric-value">
          {value}
        </span>

        {unit ? (
          <span className="metric-unit">
            {unit}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ScenarioSelect({
  label,
  value,
  onChange,
  children,
}: ScenarioSelectProps) {
  return (
    <label className="field-group">
      <span className="field-label">
        {label}
      </span>

      <select
        className="scenario-select"
        value={
          value
        }
        onChange={
          onChange
        }
      >
        {children}
      </select>
    </label>
  );
}

function getInitialVisualTheme():
  ResearchVisualTheme {
  try {
    const storedTheme =
      window.localStorage.getItem(
        THEME_STORAGE_KEY,
      );

    if (
      storedTheme ===
        "dark" ||
      storedTheme ===
        "light"
    ) {
      return storedTheme;
    }
  } catch {
    return "dark";
  }

  return "dark";
}

function locateReplay(
  frames:
    readonly SimulationReplayFrame[],
  timeSeconds:
    number,
): ReplayLocation {
  if (
    frames.length ===
    0
  ) {
    throw new Error(
      "Replay requires at least one frame.",
    );
  }

  let index =
    0;

  while (
    index <
      frames.length -
        1 &&
    frames[
      index +
        1
    ]!
      .snapshot
      .simulationTimeSeconds <=
      timeSeconds +
        1e-9
  ) {
    index +=
      1;
  }

  const currentFrame =
    frames[index]!;

  const nextFrame =
    frames[
      Math.min(
        index +
          1,
        frames.length -
          1,
      )
    ]!;

  const currentTime =
    currentFrame
      .snapshot
      .simulationTimeSeconds;

  const nextTime =
    nextFrame
      .snapshot
      .simulationTimeSeconds;

  const span =
    nextTime -
    currentTime;

  const interpolationAlpha =
    span <=
    1e-9
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            (
              timeSeconds -
              currentTime
            ) /
              span,
          ),
        );

  return {
    currentFrame,
    nextFrame,
    interpolationAlpha,
  };
}

function formatSimulationTime(
  timeSeconds:
    number,
): string {
  const minutes =
    Math.floor(
      timeSeconds /
        60,
    );

  const seconds =
    timeSeconds -
    minutes *
      60;

  return (
    `${String(
      minutes,
    ).padStart(
      2,
      "0",
    )}:` +
    `${seconds
      .toFixed(
        1,
      )
      .padStart(
        4,
        "0",
      )}`
  );
}

function formatOptionalNumber(
  value:
    number |
    null |
    undefined,
  digits:
    number =
      2,
): string {
  if (
    value ===
      null ||
    value ===
      undefined
  ) {
    return "—";
  }

  return value.toFixed(
    digits,
  );
}

function populationLabel(
  level:
    ArchitectureV2FormalPopulationLevel,
): string {
  return (
    `${level.charAt(0)}${level
      .slice(
        1,
      )
      .toLowerCase()} · ` +
    `${ARCHITECTURE_V2_RESEARCH_OCCUPANCY[level]}`
  );
}

function conditionShortLabel(
  conditionId:
    ArchitectureV2ResearchDisruptionConditionId,
): string {
  const condition =
    ARCHITECTURE_V2_RESEARCH_DISRUPTION_CONDITIONS
      .find(
        (
          candidate,
        ) =>
          candidate.id ===
          conditionId,
      );

  if (
    !condition
  ) {
    return conditionId;
  }

  const conditionNumber =
    conditionId.split(
      "_",
    )[0];

  return (
    `${conditionNumber} · ${condition.label}`
  );
}

function conditionDetail(
  conditionId:
    ArchitectureV2ResearchDisruptionConditionId,
): string {
  switch (
    conditionId
  ) {
    case "D0_BASELINE":
      return (
        "No disruption is introduced during the run."
      );

    case "D1_HAZARD":
      return (
        "A hazardous but traversable zone activates at " +
        `${ARCHITECTURE_V2_RESEARCH_TIMING.HAZARD_SECONDS} s.`
      );

    case "D2_EXIT_BLOCK":
      return (
        "The predefined research exit becomes unavailable at " +
        `${ARCHITECTURE_V2_RESEARCH_TIMING.EXIT_BLOCK_SECONDS} s.`
      );

    case "D3_CORRIDOR_BLOCK":
      return (
        "The predefined corridor becomes physically unavailable at " +
        `${ARCHITECTURE_V2_RESEARCH_TIMING.CORRIDOR_BLOCK_SECONDS} s.`
      );

    case "D4_COMBINED":
      return (
        "The traversable hazard activates at " +
        `${ARCHITECTURE_V2_RESEARCH_TIMING.HAZARD_SECONDS} s and the ` +
        "south-central exit becomes unavailable at " +
        `${ARCHITECTURE_V2_RESEARCH_TIMING.EXIT_BLOCK_SECONDS} s.`
      );

    case "D5_EXIT_BLOCK_WEST":
      return (
        "The west exit becomes unavailable at " +
        `${ARCHITECTURE_V2_RESEARCH_TIMING.EXIT_BLOCK_SECONDS} s.`
      );

    case "D6_CORRIDOR_BLOCK_EAST_SOUTHEAST":
      return (
        "The east-main to southeast corridor becomes physically unavailable at " +
        `${ARCHITECTURE_V2_RESEARCH_TIMING.CORRIDOR_BLOCK_SECONDS} s.`
      );

    default:
      return conditionId;
  }
}

function createRandomReplaySeed():
  number {
  return (
    100000 +
    Math.floor(
      Math.random() *
        900000,
    )
  );
}

function disruptionTypeLabel(
  event:
    AppliedDisruptionRecord,
): string {
  switch (
    event.type
  ) {
    case "HAZARD_ACTIVATE":
    case "HAZARD_EXPAND":
      return "Hazard";

    case "EXIT_BLOCK":
      return "Exit block";

    case "CORRIDOR_BLOCK":
      return "Corridor block";
  }
}

function disruptionActionLabel(
  event:
    AppliedDisruptionRecord,
): string {
  switch (
    event.type
  ) {
    case "HAZARD_ACTIVATE":
      return "Hazard activated";

    case "HAZARD_EXPAND":
      return "Hazard expanded";

    case "EXIT_BLOCK":
      return "Exit blocked";

    case "CORRIDOR_BLOCK":
      return "Corridor blocked";
  }
}

function disruptionTargetLabel(
  targetId:
    string,
): string {
  switch (
    targetId
  ) {
    case "corridor-main-spine":
      return "Main spine";

    case "corridor-main-central-east-blockable":
      return "Main-central corridor";

    case "corridor-main-east-southeast-blockable":
      return "East-main to southeast corridor";

    case "exit-west":
      return "West exit";

    case "exit-south-central":
      return "South-central exit";

    case "exit-east":
      return "East exit";

    case "exit-southeast":
      return "Southeast exit";

    default:
      return targetId;
  }
}

function disruptionVisualClass(
  event:
    AppliedDisruptionRecord,
): string {
  switch (
    event.type
  ) {
    case "HAZARD_ACTIVATE":
    case "HAZARD_EXPAND":
      return "hazard";

    case "EXIT_BLOCK":
      return "exit-block";

    case "CORRIDOR_BLOCK":
      return "corridor-block";
  }
}

function disruptionFullLabel(
  event:
    AppliedDisruptionRecord,
): string {
  return (
    `${event.activationTimeSeconds.toFixed(
      1,
    )} s · ` +
    `${disruptionActionLabel(
      event,
    )} · ` +
    `${disruptionTargetLabel(
      event.targetId,
    )}`
  );
}

function agentDisplayName(
  agentId:
    string,
): string {
  return (
    `Agent ${agentId.replace(
      "agent-",
      "",
    )}`
  );
}

function statusDisplayName(
  agent:
    SimulationAgentSnapshot,
): string {
  switch (
    agent.status
  ) {
    case "ACTIVE":
      return "Moving";

    case "EVACUATED":
      return "Evacuated";

    case "UNREACHABLE":
      return "Unreachable";

    case "TIMEOUT":
      return "Timeout";
  }
}

function zoneDisplayName(
  zoneId:
    string,
): string {
  const replacements:
    Readonly<
      Record<
        string,
        string
      >
    > = {
    "corridor-main-spine":
      "Main Spine",

    "corridor-main-central-east-blockable":
      "Main-Central Corridor",

    "corridor-main-east-southeast-blockable":
      "East-Main to Southeast Corridor",

    "corridor-west":
      "West Corridor",

    "corridor-east-egress":
      "East Egress",

    "corridor-south-central-egress":
      "South-Central Egress",

    "corridor-southeast-egress":
      "Southeast Egress",
  };

  return (
    replacements[
      zoneId
    ] ??
    zoneId
      .replace(
        /^corridor-/,
        "",
      )
      .replace(
        /^room-/,
        "",
      )
      .split(
        "-",
      )
      .map(
        (
          word,
        ) =>
          word
            .charAt(
              0,
            )
            .toUpperCase() +
          word.slice(
            1,
          ),
      )
      .join(
        " ",
      )
  );
}

function currentAreaForAgent(
  agent:
    SimulationAgentSnapshot,
): string {
  if (
    agent.currentEdgeId
  ) {
    const edge =
      layoutAArchitectureV2NavigationGraph
        .edges
        .find(
          (
            candidate,
          ) =>
            candidate.id ===
            agent.currentEdgeId,
        );

    if (
      edge
    ) {
      return zoneDisplayName(
        edge.zoneId,
      );
    }
  }

  if (
    agent.currentNodeId
  ) {
    const node =
      layoutAArchitectureV2NavigationGraph
        .nodes
        .find(
          (
            candidate,
          ) =>
            candidate.id ===
            agent.currentNodeId,
        );

    if (
      node
    ) {
      return zoneDisplayName(
        node.zoneId,
      );
    }
  }

  return "Starting area";
}

function exitDisplayName(
  exitId:
    string | null,
): string {
  if (
    !exitId
  ) {
    return "Not assigned";
  }

  return disruptionTargetLabel(
    exitId,
  );
}

export function App() {
  const applicationRef =
    useRef<
      HTMLDivElement | null
    >(
      null,
    );

  const preparationTimerRef =
    useRef<
      number | null
    >(
      null,
    );

  const [
    visualTheme,
    setVisualTheme,
  ] =
    useState<
      ResearchVisualTheme
    >(
      getInitialVisualTheme,
    );

  const [
    configuration,
    setConfiguration,
  ] =
    useState<
      ArchitectureV2DemoReplayRequest
    >(
      DEFAULT_ARCHITECTURE_V2_DEMO_REQUEST,
    );

  const [
    applicationMode,
    setApplicationMode,
  ] =
    useState<
      SimulationApplicationMode
    >(
      DEFAULT_SIMULATION_APPLICATION_MODE,
    );

  const [
    interactiveDemoEvents,
    setInteractiveDemoEvents,
  ] =
    useState<
      readonly InteractiveDemoManualEvent[]
    >(
      [],
    );

  const [
    draftPopulation,
    setDraftPopulation,
  ] =
    useState<
      ArchitectureV2FormalPopulationLevel
    >(
      configuration.populationLevel,
    );

  const [
    draftCondition,
    setDraftCondition,
  ] =
    useState<
      ArchitectureV2ResearchDisruptionConditionId
    >(
      configuration.conditionId,
    );

  const [
    draftStrategy,
    setDraftStrategy,
  ] =
    useState<
      RoutingStrategyId
    >(
      configuration.strategyId,
    );

  const [
    draftSeed,
    setDraftSeed,
  ] =
    useState(
      String(
        configuration.replicationSeed ??
        DEFAULT_REPLAY_SEED,
      ),
    );

  const [
    scenarioDrawerOpen,
    setScenarioDrawerOpen,
  ] =
    useState(
      false,
    );

  const [
    isFullscreen,
    setIsFullscreen,
  ] =
    useState(
      false,
    );

  const [
    researchDetailsOpen,
    setResearchDetailsOpen,
  ] =
    useState(
      false,
    );

  const [
    isPreparingSimulation,
    setIsPreparingSimulation,
  ] =
    useState(
      false,
    );

  const [
    keepAgentTrackingOnReplay,
    setKeepAgentTrackingOnReplay,
  ] =
    useState(
      true,
    );

  const [
    cameraPreset,
    setCameraPreset,
  ] =
    useState<
      ResearchCameraPreset
    >(
      "HOME",
    );

  const [
    cameraRequestId,
    setCameraRequestId,
  ] =
    useState(
      0,
    );

  const [
    cameraResetRequestId,
    setCameraResetRequestId,
  ] =
    useState(
      0,
    );

  const [
    selectedAgentIds,
    setSelectedAgentIds,
  ] =
    useState<
      ReadonlySet<string>
    >(
      new Set<string>(),
    );

  const [
    primarySelectedAgentId,
    setPrimarySelectedAgentId,
  ] =
    useState<
      string | null
    >(
      null,
    );

  useEffect(
    () => {
      try {
        window.localStorage
          .setItem(
            THEME_STORAGE_KEY,
            visualTheme,
          );
      } catch {
        // Browser storage is optional.
      }

      document
        .documentElement
        .style
        .colorScheme =
        visualTheme;
    },
    [
      visualTheme,
    ],
  );

  const replay =
    useMemo(
      () =>
        applicationMode ===
        "RESEARCH"
          ? createArchitectureV2DemoReplay(
              configuration,
            )
          : createInteractiveDemoReplay({
              populationLevel:
                configuration.populationLevel,

              strategyId:
                configuration.strategyId,

              replicationSeed:
                configuration.replicationSeed ??
                DEFAULT_REPLAY_SEED,

              events:
                interactiveDemoEvents,
            }),
      [
        applicationMode,
        configuration.populationLevel,
        configuration.conditionId,
        configuration.strategyId,
        configuration.replicationSeed,
        interactiveDemoEvents,
      ],
    );

  const frames =
    replay.frames;

  const durationSeconds =
    replay.result
      .simulatedTimeSeconds;

  const [
    playbackTimeSeconds,
    setPlaybackTimeSeconds,
  ] =
    useState(
      0,
    );

  const [
    isPlaying,
    setIsPlaying,
  ] =
    useState(
      false,
    );

  const [
    playbackRate,
    setPlaybackRate,
  ] =
    useState(
      1,
    );

  const previousAnimationTimeRef =
    useRef<
      number | null
    >(
      null,
    );

  const isScrubbingRef =
    useRef(
      false,
    );

  const resumeAfterScrubRef =
    useRef(
      false,
    );

  const scrubTimeRef =
    useRef(
      0,
    );

  const pendingInteractiveResumeRef =
    useRef<{
      readonly timeSeconds:
        number;

      readonly shouldPlay:
        boolean;
    } | null>(
      null,
    );

  const clearAgentSelection =
    () => {
      setSelectedAgentIds(
        new Set<string>(),
      );

      setPrimarySelectedAgentId(
        null,
      );
    };

  const changeApplicationMode =
    (
      nextMode:
        SimulationApplicationMode,
    ) => {
      if (
        nextMode ===
          applicationMode ||
        isPreparingSimulation
      ) {
        return;
      }

      setIsPlaying(
        false,
      );

      setPlaybackTimeSeconds(
        0,
      );

      previousAnimationTimeRef.current =
        null;

      isScrubbingRef.current =
        false;

      resumeAfterScrubRef.current =
        false;

      scrubTimeRef.current =
        0;

      clearAgentSelection();

      setScenarioDrawerOpen(
        false,
      );

      pendingInteractiveResumeRef.current =
        null;

      setApplicationMode(
        nextMode,
      );
    };

  const triggerInteractiveDemoEvent =
    (
      event:
        InteractiveDemoManualEvent,
    ) => {
      if (
        applicationMode !==
          "INTERACTIVE_DEMO" ||
        isPreparingSimulation
      ) {
        return;
      }

      pendingInteractiveResumeRef.current = {
        timeSeconds:
          Math.min(
          playbackTimeSeconds +
            0.10,
          durationSeconds,
        ),

        shouldPlay:
          isPlaying,
      };

      setInteractiveDemoEvents(
        (
          current,
        ) => [
          ...current,
          event,
        ],
      );
    };

  const clearInteractiveDemoEvents =
    () => {
      if (
        applicationMode !==
          "INTERACTIVE_DEMO" ||
        isPreparingSimulation
      ) {
        return;
      }

      pendingInteractiveResumeRef.current = {
        timeSeconds:
          0,

        shouldPlay:
          false,
      };

      setInteractiveDemoEvents(
        [],
      );
    };

  useEffect(
    () => {
      const pendingResume =
        pendingInteractiveResumeRef.current;

      if (
        applicationMode ===
          "INTERACTIVE_DEMO" &&
        pendingResume
      ) {
        pendingInteractiveResumeRef.current =
          null;

        const nextTime =
          Math.min(
            pendingResume.timeSeconds,
            durationSeconds,
          );

        previousAnimationTimeRef.current =
          null;

        isScrubbingRef.current =
          false;

        resumeAfterScrubRef.current =
          false;

        scrubTimeRef.current =
          nextTime;

        setPlaybackTimeSeconds(
          nextTime,
        );

        setIsPlaying(
          pendingResume.shouldPlay &&
          nextTime <
            durationSeconds -
              1e-9,
        );

        setIsPreparingSimulation(
          false,
        );

        return;
      }

      setIsPlaying(
        false,
      );

      setPlaybackTimeSeconds(
        0,
      );

      previousAnimationTimeRef.current =
        null;

      isScrubbingRef.current =
        false;

      resumeAfterScrubRef.current =
        false;

      scrubTimeRef.current =
        0;

      setSelectedAgentIds(
        new Set<string>(),
      );

      setPrimarySelectedAgentId(
        null,
      );

      setIsPreparingSimulation(
        false,
      );
    },
    [
      applicationMode,
      durationSeconds,
      replay,
    ],
  );

  useEffect(
    () => {
      return () => {
        if (
          preparationTimerRef.current !==
          null
        ) {
          window.clearTimeout(
            preparationTimerRef.current,
          );
        }
      };
    },
    [],
  );

  useEffect(
    () => {
      if (
        !isPlaying
      ) {
        previousAnimationTimeRef.current =
          null;

        return;
      }

      let animationFrameId =
        0;

      const animate =
        (
          timestamp:
            number,
        ) => {
          const previousTimestamp =
            previousAnimationTimeRef.current;

          previousAnimationTimeRef.current =
            timestamp;

          if (
            previousTimestamp !==
            null
          ) {
            const wallDeltaSeconds =
              (
                timestamp -
                previousTimestamp
              ) /
              1000;

            setPlaybackTimeSeconds(
              (
                current,
              ) =>
                Math.min(
                  durationSeconds,
                  current +
                    wallDeltaSeconds *
                      playbackRate,
                ),
            );
          }

          animationFrameId =
            requestAnimationFrame(
              animate,
            );
        };

      animationFrameId =
        requestAnimationFrame(
          animate,
        );

      return () => {
        cancelAnimationFrame(
          animationFrameId,
        );

        previousAnimationTimeRef.current =
          null;
      };
    },
    [
      durationSeconds,
      isPlaying,
      playbackRate,
    ],
  );

  useEffect(
    () => {
      if (
        isPlaying &&
        playbackTimeSeconds >=
          durationSeconds -
            1e-9
      ) {
        setIsPlaying(
          false,
        );
      }
    },
    [
      durationSeconds,
      isPlaying,
      playbackTimeSeconds,
    ],
  );

  useEffect(
    () => {
      const handleFullscreenChange =
        () => {
          setIsFullscreen(
            document.fullscreenElement ===
              applicationRef.current,
          );
        };

      document.addEventListener(
        "fullscreenchange",
        handleFullscreenChange,
      );

      return () => {
        document.removeEventListener(
          "fullscreenchange",
          handleFullscreenChange,
        );
      };
    },
    [],
  );

  useEffect(
    () => {
      const finishTimelineScrub =
        () => {
          if (
            !isScrubbingRef.current
          ) {
            return;
          }

          isScrubbingRef.current =
            false;

          const shouldResume =
            resumeAfterScrubRef.current &&
            scrubTimeRef.current <
              durationSeconds -
                1e-9;

          resumeAfterScrubRef.current =
            false;

          if (
            shouldResume
          ) {
            setIsPlaying(
              true,
            );
          }
        };

      window.addEventListener(
        "pointerup",
        finishTimelineScrub,
        true,
      );

      window.addEventListener(
        "pointercancel",
        finishTimelineScrub,
        true,
      );

      return () => {
        window.removeEventListener(
          "pointerup",
          finishTimelineScrub,
          true,
        );

        window.removeEventListener(
          "pointercancel",
          finishTimelineScrub,
          true,
        );
      };
    },
    [
      durationSeconds,
    ],
  );

  const replayLocation =
    locateReplay(
      frames,
      playbackTimeSeconds,
    );

  const currentFrame =
    replayLocation.currentFrame;

  const activeDisruptions =
    currentFrame
      .appliedDisruptions;

  const activeDisruptionLabels =
    Array.from(
      new Set(
        activeDisruptions.map(
          (
            event,
          ) =>
            disruptionTypeLabel(
              event,
            ),
        ),
      ),
    );

  const activeDisruptionSummary =
    activeDisruptions.length ===
    0
      ? "No active disruptions"
      : (
          `${activeDisruptions.length} ACTIVE · ` +
          activeDisruptionLabels.join(
            " · ",
          )
        );

  const latestBannerEvent =
    activeDisruptions
      .filter(
        (
          event,
        ) => {
          const elapsedSeconds =
            playbackTimeSeconds -
            event.activationTimeSeconds;

          return (
            elapsedSeconds >=
              -0.05 &&
            elapsedSeconds <=
              EVENT_NOTIFICATION_TOTAL_SECONDS
          );
        },
      )
      .sort(
        (
          left,
          right,
        ) =>
          right.activationTimeSeconds -
          left.activationTimeSeconds,
      )[0] ??
    null;

  const latestBannerAgeSeconds =
    latestBannerEvent
      ? Math.max(
          0,
          playbackTimeSeconds -
            latestBannerEvent.activationTimeSeconds,
        )
      : 0;

  const bannerOpacity =
    !latestBannerEvent
      ? 0
      : latestBannerAgeSeconds <=
          EVENT_NOTIFICATION_FADE_START_SECONDS
        ? 1
        : Math.max(
            0,
            1 -
              (
                latestBannerAgeSeconds -
                EVENT_NOTIFICATION_FADE_START_SECONDS
              ) /
                (
                  EVENT_NOTIFICATION_TOTAL_SECONDS -
                  EVENT_NOTIFICATION_FADE_START_SECONDS
                ),
          );

  const evacuatedAgents =
    currentFrame
      .metrics
      .evacuatedAgents;

  const totalAgents =
    currentFrame
      .metrics
      .totalAgents;

  const completionPercent =
    totalAgents ===
    0
      ? 0
      : (
          evacuatedAgents /
          totalAgents
        ) *
        100;

  const isComplete =
    playbackTimeSeconds >=
    durationSeconds -
      1e-9;

  const isAtStart =
    playbackTimeSeconds <=
    1e-9;

  const finalTotalEvacuationTime =
    isComplete
      ? replay
          .result
          .metrics
          .totalEvacuationTimeSeconds
      : null;

  const finalP95EvacuationTime =
    isComplete
      ? replay
          .result
          .metrics
          .p95EvacuationTimeSeconds
      : null;

  const finalMaximumLocalDensity =
    isComplete
      ? replay
          .result
          .metrics
          .maximumLocalDensityPersonsPerSquareMeter
      : null;

  const stateLabel =
    isPreparingSimulation
      ? "PREPARING"
      : isComplete
        ? "COMPLETE"
        : isPlaying
          ? "RUNNING"
          : isAtStart
            ? "READY"
            : "PAUSED";

  const selectedAgents =
    useMemo(
      () => {
        const result:
          SimulationAgentSnapshot[] =
          [];

        for (
          const agent of
          currentFrame.snapshot.agents
        ) {
          if (
            selectedAgentIds.has(
              agent.id,
            )
          ) {
            result.push(
              agent,
            );
          }
        }

        return result;
      },
      [
        currentFrame,
        selectedAgentIds,
      ],
    );

  const primarySelectedAgent =
    primarySelectedAgentId
      ? currentFrame
          .snapshot
          .agents
          .find(
            (
              agent,
            ) =>
              agent.id ===
              primarySelectedAgentId,
          ) ??
        null
      : null;

  const primaryRoute =
    primarySelectedAgentId
      ? currentFrame
          .routes
          .find(
            (
              route,
            ) =>
              route.agentId ===
              primarySelectedAgentId,
          ) ??
        null
      : null;

  const selectedActiveCount =
    selectedAgents.filter(
      (
        agent,
      ) =>
        agent.status ===
        "ACTIVE",
    ).length;

  const selectedEvacuatedCount =
    selectedAgents.filter(
      (
        agent,
      ) =>
        agent.status ===
        "EVACUATED",
    ).length;

  const selectedHazardExposure =
    selectedAgents.reduce(
      (
        total,
        agent,
      ) =>
        total +
        agent.hazardExposureSeconds,
      0,
    );

  const selectedReroutes =
    selectedAgents.reduce(
      (
        total,
        agent,
      ) =>
        total +
        agent.rerouteCount,
      0,
    );

  const remainingRouteNodeCount =
    primaryRoute
      ? Math.max(
          0,
          primaryRoute.nodeIds.length -
            primaryRoute.routeCursorIndex -
            1,
        )
      : 0;

  const handleAgentSelect =
    (
      agentId:
        string,
      mode:
        AgentSelectionMode,
    ) => {
      if (
        mode ===
        "replace"
      ) {
        setSelectedAgentIds(
          new Set<string>([
            agentId,
          ]),
        );

        setPrimarySelectedAgentId(
          agentId,
        );

        return;
      }

      setSelectedAgentIds(
        (
          current,
        ) => {
          const next =
            new Set<string>(
              current,
            );

          if (
            next.has(
              agentId,
            )
          ) {
            next.delete(
              agentId,
            );

            setPrimarySelectedAgentId(
              (
                currentPrimary,
              ) => {
                if (
                  currentPrimary !==
                  agentId
                ) {
                  return currentPrimary;
                }

                const remaining =
                  Array.from(
                    next,
                  );

                return (
                  remaining[
                    remaining.length -
                      1
                  ] ??
                  null
                );
              },
            );
          } else {
            next.add(
              agentId,
            );

            setPrimarySelectedAgentId(
              agentId,
            );
          }

          return next;
        },
      );
    };

  const makeAgentPrimary =
    (
      agentId:
        string,
    ) => {
      if (
        selectedAgentIds.has(
          agentId,
        )
      ) {
        setPrimarySelectedAgentId(
          agentId,
        );
      }
    };

  useEffect(
    () => {
      const handleEscape =
        (
          event:
            KeyboardEvent,
        ) => {
          if (
            event.key !==
            "Escape"
          ) {
            return;
          }

          clearAgentSelection();
        };

      window.addEventListener(
        "keydown",
        handleEscape,
      );

      return () => {
        window.removeEventListener(
          "keydown",
          handleEscape,
        );
      };
    },
    [],
  );

  const playPlayback =
    () => {
      if (
        isComplete ||
        isPreparingSimulation
      ) {
        return;
      }

      isScrubbingRef.current =
        false;

      resumeAfterScrubRef.current =
        false;

      setIsPlaying(
        true,
      );
    };

  const pausePlayback =
    () => {
      resumeAfterScrubRef.current =
        false;

      setIsPlaying(
        false,
      );
    };

  const resumePlayback =
    () => {
      if (
        isComplete ||
        isPreparingSimulation
      ) {
        return;
      }

      isScrubbingRef.current =
        false;

      resumeAfterScrubRef.current =
        false;

      setIsPlaying(
        true,
      );
    };

  const replayPlayback =
    () => {
      if (
        isPreparingSimulation
      ) {
        return;
      }

      isScrubbingRef.current =
        false;

      resumeAfterScrubRef.current =
        false;

      scrubTimeRef.current =
        0;

      setPlaybackTimeSeconds(
        0,
      );

      if (
        !keepAgentTrackingOnReplay
      ) {
        clearAgentSelection();
      }

      setIsPlaying(
        true,
      );
    };

  const resetPlayback =
    () => {
      if (
        isPreparingSimulation
      ) {
        return;
      }

      isScrubbingRef.current =
        false;

      resumeAfterScrubRef.current =
        false;

      scrubTimeRef.current =
        0;

      previousAnimationTimeRef.current =
        null;

      setIsPlaying(
        false,
      );

      setPlaybackTimeSeconds(
        0,
      );

      clearAgentSelection();
    };

  useEffect(
    () => {
      const handleSpacebar =
        (
          event:
            KeyboardEvent,
        ) => {
          if (
            event.code !==
              "Space" ||
            event.repeat ||
            isPreparingSimulation
          ) {
            return;
          }

          const target =
            event.target;

          if (
            target instanceof
              HTMLTextAreaElement ||
            target instanceof
              HTMLSelectElement ||
            target instanceof
              HTMLButtonElement
          ) {
            return;
          }

          if (
            target instanceof
              HTMLInputElement &&
            target.type !==
              "range"
          ) {
            return;
          }

          if (
            target instanceof
              HTMLElement &&
            target.isContentEditable
          ) {
            return;
          }

          event.preventDefault();

          if (
            isPlaying
          ) {
            resumeAfterScrubRef.current =
              false;

            setIsPlaying(
              false,
            );

            return;
          }

          if (
            isComplete
          ) {
            isScrubbingRef.current =
              false;

            resumeAfterScrubRef.current =
              false;

            scrubTimeRef.current =
              0;

            setPlaybackTimeSeconds(
              0,
            );

            if (
              !keepAgentTrackingOnReplay
            ) {
              clearAgentSelection();
            }

            setIsPlaying(
              true,
            );

            return;
          }

          isScrubbingRef.current =
            false;

          resumeAfterScrubRef.current =
            false;

          setIsPlaying(
            true,
          );
        };

      window.addEventListener(
        "keydown",
        handleSpacebar,
      );

      return () => {
        window.removeEventListener(
          "keydown",
          handleSpacebar,
        );
      };
    },
    [
      isComplete,
      isPlaying,
      isPreparingSimulation,
      keepAgentTrackingOnReplay,
    ],
  );

  const beginTimelineScrub =
    () => {
      if (
        isPreparingSimulation
      ) {
        return;
      }

      isScrubbingRef.current =
        true;

      resumeAfterScrubRef.current =
        isPlaying;

      scrubTimeRef.current =
        playbackTimeSeconds;

      if (
        isPlaying
      ) {
        setIsPlaying(
          false,
        );
      }
    };

  const handleTimelineChange =
    (
      event:
        ChangeEvent<HTMLInputElement>,
    ) => {
      if (
        isPreparingSimulation
      ) {
        return;
      }

      const nextTime =
        Number(
          event.target.value,
        );

      scrubTimeRef.current =
        nextTime;

      setPlaybackTimeSeconds(
        nextTime,
      );
    };

  const seekToDisruption =
    (
      disruption:
        AppliedDisruptionRecord,
    ) => {
      if (
        isPreparingSimulation
      ) {
        return;
      }

      isScrubbingRef.current =
        false;

      resumeAfterScrubRef.current =
        false;

      const nextTime =
        Math.min(
          durationSeconds,
          disruption.activationTimeSeconds,
        );

      scrubTimeRef.current =
        nextTime;

      setIsPlaying(
        false,
      );

      setPlaybackTimeSeconds(
        nextTime,
      );
    };

  const openScenarioDrawer =
    () => {
      if (
        isPreparingSimulation
      ) {
        return;
      }

      setDraftPopulation(
        configuration.populationLevel,
      );

      setDraftCondition(
        configuration.conditionId,
      );

      setDraftStrategy(
        configuration.strategyId,
      );

      setDraftSeed(
        String(
          configuration.replicationSeed ??
          DEFAULT_REPLAY_SEED,
        ),
      );

      setScenarioDrawerOpen(
        true,
      );
    };

  const parsedDraftSeed =
    Number(
      draftSeed,
    );

  const draftSeedIsValid =
    Number.isSafeInteger(
      parsedDraftSeed,
    ) &&
    parsedDraftSeed >
      0;

  const activeSeed =
    configuration.replicationSeed ??
    DEFAULT_REPLAY_SEED;

  const hasPendingScenarioChanges =
    draftPopulation !==
      configuration.populationLevel ||
    (
      applicationMode ===
        "RESEARCH" &&
      draftCondition !==
        configuration.conditionId
    ) ||
    draftStrategy !==
      configuration.strategyId ||
    parsedDraftSeed !==
      activeSeed;

  const applyScenario =
    () => {
      if (
        !draftSeedIsValid ||
        isPreparingSimulation
      ) {
        return;
      }

      if (
        !hasPendingScenarioChanges
      ) {
        setScenarioDrawerOpen(
          false,
        );

        return;
      }

      const nextConfiguration:
        ArchitectureV2DemoReplayRequest = {
        populationLevel:
          draftPopulation,

        conditionId:
          draftCondition,

        strategyId:
          draftStrategy,

        replicationSeed:
          parsedDraftSeed,
      };

      setScenarioDrawerOpen(
        false,
      );

      setIsPlaying(
        false,
      );

      setPlaybackTimeSeconds(
        0,
      );

      previousAnimationTimeRef.current =
        null;

      isScrubbingRef.current =
        false;

      resumeAfterScrubRef.current =
        false;

      scrubTimeRef.current =
        0;

      clearAgentSelection();

      setIsPreparingSimulation(
        true,
      );

      if (
        preparationTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          preparationTimerRef.current,
        );
      }

      preparationTimerRef.current =
        window.setTimeout(
          () => {
            preparationTimerRef.current =
              null;

            setConfiguration(
              nextConfiguration,
            );
          },
          PREPARATION_PAINT_DELAY_MS,
        );
    };

  const randomizeSeed =
    () => {
      setDraftSeed(
        String(
          createRandomReplaySeed(),
        ),
      );
    };

  const resetSeed =
    () => {
      setDraftSeed(
        String(
          DEFAULT_REPLAY_SEED,
        ),
      );
    };

  const requestCameraPreset =
    (
      preset:
        ResearchCameraPreset,
    ) => {
      setCameraPreset(
        preset,
      );

      setCameraRequestId(
        (
          current,
        ) =>
          current +
          1,
      );
    };

  const resetCameraPresets =
    () => {
      setCameraPreset(
        "HOME",
      );

      setCameraResetRequestId(
        (
          current,
        ) =>
          current +
          1,
      );

      setCameraRequestId(
        (
          current,
        ) =>
          current +
          1,
      );
    };

  const toggleVisualTheme =
    () => {
      setVisualTheme(
        (
          current,
        ) =>
          current ===
          "dark"
            ? "light"
            : "dark",
      );
    };

  const toggleFullscreen =
    async () => {
      const node =
        applicationRef.current;

      if (
        !node
      ) {
        return;
      }

      if (
        document.fullscreenElement
      ) {
        await document.exitFullscreen();

        return;
      }

      await node.requestFullscreen();
    };

  const condition =
    ARCHITECTURE_V2_RESEARCH_DISRUPTION_CONDITIONS
      .find(
        (
          candidate,
        ) =>
          candidate.id ===
          configuration.conditionId,
      );

  const scenarioSummary =
    applicationMode ===
    "RESEARCH"
      ? (
          `${populationLabel(
            configuration.populationLevel,
          )} · ` +
          `${conditionShortLabel(
            configuration.conditionId,
          )} · ` +
          `${STRATEGY_LABELS[
            configuration.strategyId
          ]}`
        )
      : (
          `${populationLabel(
            configuration.populationLevel,
          )} · Interactive Demo · ` +
          `${STRATEGY_LABELS[
            configuration.strategyId
          ]}`
        );

  const inspectorOpen =
    selectedAgents.length >
    0;

  return (
    <div
      ref={
        applicationRef
      }
      className={
        `application-shell theme-${visualTheme} ${
          applicationMode ===
          "RESEARCH"
            ? "research-application"
            : "interactive-demo-application"
        }${
          isFullscreen
            ? " presentation-mode"
            : ""
        }`
      }
    >
      <header className="top-bar">
        <div className="brand-block">
          <div className="brand-mark">
            ES
          </div>

          <div>
            <div className="application-name">
              Emergency Evacuation Strategy Simulator
            </div>

            <div className="application-subtitle">
              Experimental evaluation of adaptive routing under dynamic building conditions
            </div>
          </div>
        </div>

        <div className="top-status">
          <span className="status-indicator" />

          <div>
            <div className="status-title">
              {applicationMode ===
              "RESEARCH"
                ? "RESEARCH MODE"
                : "INTERACTIVE DEMO"}
            </div>

            <div className="status-caption">
              {applicationMode ===
              "RESEARCH"
                ? "Architecture V2.1 · Frozen research model"
                : "Manual disruption environment · Not a formal research condition"}
            </div>
          </div>
        </div>
      </header>

      <div className="workspace">
        <nav
          className="tool-rail"
          aria-label="Simulator tools"
        >
          <button
            type="button"
            className={
              `tool-button${
                applicationMode ===
                "RESEARCH"
                  ? " active"
                  : ""
              }`
            }
            onClick={
              () =>
                changeApplicationMode(
                  "RESEARCH",
                )
            }
            disabled={
              isPreparingSimulation
            }
            title="Research Mode"
          >
            <span className="tool-icon">
              R
            </span>

            <span className="tool-label">
              Research
            </span>
          </button>

          <button
            type="button"
            className={
              `tool-button${
                applicationMode ===
                "INTERACTIVE_DEMO"
                  ? " active"
                  : ""
              }`
            }
            onClick={
              () =>
                changeApplicationMode(
                  "INTERACTIVE_DEMO",
                )
            }
            disabled={
              isPreparingSimulation
            }
            title="Interactive Demo Mode"
          >
            <span className="tool-icon">
              D
            </span>

            <span className="tool-label">
              Demo
            </span>
          </button>

          <button
            type="button"
            className={
              `tool-button${
                scenarioDrawerOpen
                  ? " active"
                  : ""
              }`
            }
            onClick={
              openScenarioDrawer
            }
            disabled={
              isPreparingSimulation
            }
            title="Scenario setup"
          >
            <span className="tool-icon">
              S
            </span>

            <span className="tool-label">
              Scenario
            </span>
          </button>

          <button
            type="button"
            className="tool-button"
            onClick={
              () =>
                requestCameraPreset(
                  "HOME",
                )
            }
            title="Home view"
          >
            <span className="tool-icon">
              H
            </span>

            <span className="tool-label">
              Home
            </span>
          </button>
        </nav>

        {scenarioDrawerOpen ? (
          <button
            type="button"
            className="drawer-scrim"
            aria-label="Close scenario drawer"
            onClick={
              () =>
                setScenarioDrawerOpen(
                  false,
                )
            }
          />
        ) : null}

        <aside
          className={
            `scenario-drawer${
              scenarioDrawerOpen
                ? " open"
                : ""
            }`
          }
          aria-hidden={
            !scenarioDrawerOpen
          }
        >
          <div className="drawer-scroll-area">
            <div className="drawer-header">
              <div>
                <span className="eyebrow">
                  Experiment
                </span>

                <h2>
                  Scenario Setup
                </h2>

                <p>
                  Configure one reproducible research simulation.
                </p>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={
                  () =>
                    setScenarioDrawerOpen(
                      false,
                    )
                }
                aria-label="Close scenario drawer"
              >
                ×
              </button>
            </div>

            <div
              className={
                `drawer-change-status${
                  hasPendingScenarioChanges
                    ? " pending"
                    : ""
                }`
              }
            >
              {hasPendingScenarioChanges
                ? "Pending changes"
                : "Current scenario values"}
            </div>

            <div className="drawer-section">
              <ScenarioSelect
                label="Strategy"
                value={
                  draftStrategy
                }
                onChange={
                  (
                    event,
                  ) =>
                    setDraftStrategy(
                      event.target.value as
                      RoutingStrategyId,
                    )
                }
              >
                {ARCHITECTURE_V2_FORMAL_STRATEGY_IDS.map(
                  (
                    strategyId,
                  ) => (
                    <option
                      key={
                        strategyId
                      }
                      value={
                        strategyId
                      }
                    >
                      {
                        STRATEGY_LABELS[
                          strategyId
                        ]
                      }
                    </option>
                  ),
                )}
              </ScenarioSelect>

              <ScenarioSelect
                label="Occupancy"
                value={
                  draftPopulation
                }
                onChange={
                  (
                    event,
                  ) =>
                    setDraftPopulation(
                      event.target.value as
                      ArchitectureV2FormalPopulationLevel,
                    )
                }
              >
                {POPULATION_LEVELS.map(
                  (
                    level,
                  ) => (
                    <option
                      key={
                        level
                      }
                      value={
                        level
                      }
                    >
                      {
                        populationLabel(
                          level,
                        )
                      }
                    </option>
                  ),
                )}
              </ScenarioSelect>

              {applicationMode ===
              "RESEARCH" ? (
                <>
                  <ScenarioSelect
                    label="Dynamic condition"
                    value={
                      draftCondition
                    }
                    onChange={
                      (
                        event,
                      ) =>
                        setDraftCondition(
                          event.target.value as
                          ArchitectureV2ResearchDisruptionConditionId,
                        )
                    }
                  >
                    {ARCHITECTURE_V2_RESEARCH_DISRUPTION_CONDITIONS.map(
                      (
                        candidate,
                      ) => (
                        <option
                          key={
                            candidate.id
                          }
                          value={
                            candidate.id
                          }
                        >
                          {
                            conditionShortLabel(
                              candidate.id,
                            )
                          }
                        </option>
                      ),
                    )}
                  </ScenarioSelect>

                  <div className="condition-note">
                    <span className="field-label">
                      Research event schedule
                    </span>

                    <p>
                      {
                        conditionDetail(
                          draftCondition,
                        )
                      }
                    </p>

                    <small>
                      Hazard zones remain traversable. Blocked exits and blocked corridors are unavailable for movement.
                    </small>
                  </div>
                </>
              ) : (
                <InteractiveDemoControls
                  events={
                    interactiveDemoEvents
                  }
                  playbackTimeSeconds={
                    playbackTimeSeconds
                  }
                  disabled={
                    isPreparingSimulation
                  }
                  onTrigger={
                    triggerInteractiveDemoEvent
                  }
                  onReset={
                    clearInteractiveDemoEvents
                  }
                />
              )}

              <div className="seed-field">
                <span className="field-label">
                  Replay seed
                </span>

                <input
                  className={
                    `seed-input${
                      draftSeedIsValid
                        ? ""
                        : " invalid"
                    }`
                  }
                  type="number"
                  min={1}
                  step={1}
                  value={
                    draftSeed
                  }
                  onChange={
                    (
                      event,
                    ) =>
                      setDraftSeed(
                        event.target.value,
                      )
                  }
                />

                {!draftSeedIsValid ? (
                  <small className="seed-error">
                    Enter a positive whole-number seed.
                  </small>
                ) : (
                  <div className="seed-explanation">
                    <strong>
                      Think of the seed as a repeatable shuffle.
                    </strong>

                    <span>
                      Same scenario + same seed = the same random run.
                    </span>

                    <span>
                      Change the seed = a different random run.
                    </span>
                  </div>
                )}

                <div className="seed-action-row">
                  <button
                    type="button"
                    className="inline-button"
                    onClick={
                      randomizeSeed
                    }
                  >
                    Randomize
                  </button>

                  <button
                    type="button"
                    className="inline-button"
                    onClick={
                      resetSeed
                    }
                  >
                    Default Seed
                  </button>
                </div>
              </div>
            </div>

            <div className="drawer-research-note">
              <strong>
                {applicationMode ===
                "RESEARCH"
                  ? "One simulation run"
                  : "Interactive demonstration"}
              </strong>

              <p>
                {applicationMode ===
                "RESEARCH"
                  ? "The screen shows one repeatable run. Formal comparisons use 40 paired replications so conclusions do not depend on one unusually good or bad run."
                  : "Manual events are demonstration inputs only. They can be reproduced using the same seed and event log but are not part of the formal research factorial design."}
              </p>
            </div>
          </div>

          <div className="drawer-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={
                () =>
                  setScenarioDrawerOpen(
                    false,
                  )
              }
            >
              Cancel
            </button>

            <button
              type="button"
              className="primary-button"
              disabled={
                !draftSeedIsValid ||
                isPreparingSimulation
              }
              onClick={
                applyScenario
              }
            >
              Apply Changes
            </button>
          </div>
        </aside>

        <main
          className={
            `scene-panel${
              inspectorOpen
                ? " inspector-open"
                : ""
            }`
          }
        >
          <div className="scene-canvas-region">
            <ResearchScene
              currentFrame={
                replayLocation.currentFrame
              }
              nextFrame={
                replayLocation.nextFrame
              }
              interpolationAlpha={
                replayLocation.interpolationAlpha
              }
              cameraPreset={
                cameraPreset
              }
              cameraRequestId={
                cameraRequestId
              }
              cameraResetRequestId={
                cameraResetRequestId
              }
              visualTheme={
                visualTheme
              }
              selectedAgentIds={
                selectedAgentIds
              }
              primarySelectedAgentId={
                primarySelectedAgentId
              }
              inspectorOpen={
                inspectorOpen
              }
              onAgentSelect={
                handleAgentSelect
              }
              onClearAgentSelection={
                clearAgentSelection
              }
            />
          </div>

          {isPreparingSimulation ? (
            <div
              className="simulation-preparing-overlay"
              role="status"
              aria-live="polite"
            >
              <div className="simulation-preparing-card">
                <span className="preparing-spinner" />

                <div>
                  <strong>
                    Preparing simulation…
                  </strong>

                  <span>
                    Generating the new reproducible replay.
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          <div className="scene-toolbar">
            <div className="scene-toolbar-group">
              <span className="toolbar-label">
                View
              </span>

              {CAMERA_PRESETS.map(
                (
                  preset,
                ) => (
                  <button
                    key={
                      preset
                    }
                    type="button"
                    className={
                      `toolbar-button${
                        cameraPreset ===
                        preset
                          ? " active"
                          : ""
                      }`
                    }
                    onClick={
                      () =>
                        requestCameraPreset(
                          preset,
                        )
                    }
                  >
                    {preset.charAt(0) +
                      preset
                        .slice(
                          1,
                        )
                        .toLowerCase()}
                  </button>
                ),
              )}

              <button
                type="button"
                className="toolbar-button reset-view-button"
                onClick={
                  resetCameraPresets
                }
              >
                Reset Views
              </button>

              <button
                type="button"
                className="toolbar-button theme-toggle-button"
                onClick={
                  toggleVisualTheme
                }
              >
                <span className="theme-toggle-indicator">
                  {visualTheme ===
                  "dark"
                    ? "☀"
                    : "●"}
                </span>

                {visualTheme ===
                "dark"
                  ? "Light"
                  : "Dark"}
              </button>
            </div>

            <button
              type="button"
              className="toolbar-button present-button"
              onClick={
                toggleFullscreen
              }
            >
              {isFullscreen
                ? "Exit Fullscreen"
                : "Present"}
            </button>
          </div>

          <div className="scene-scenario-chip">
            <span className="chip-dot" />

            <span>
              {
                scenarioSummary
              }
            </span>

            <span className="chip-seed">
              Seed {
                replay.metadata.replicationSeed
              }
            </span>
          </div>

          <div
            className={
              `active-disruptions-chip${
                activeDisruptions.length >
                0
                  ? " active"
                  : ""
              }`
            }
          >
            <span className="active-disruptions-dot" />

            <span>
              {
                activeDisruptionSummary
              }
            </span>
          </div>

          {latestBannerEvent ? (
            <div
              className={
                `event-notification-banner ${disruptionVisualClass(
                  latestBannerEvent,
                )}`
              }
              style={{
                opacity:
                  bannerOpacity,
              }}
            >
              <span className="event-notification-icon">
                !
              </span>

              <div className="event-notification-content">
                <span className="event-notification-kicker">
                  Dynamic condition
                </span>

                <strong>
                  {
                    disruptionActionLabel(
                      latestBannerEvent,
                    )
                  }
                </strong>

                <span className="event-notification-detail">
                  {
                    latestBannerEvent.activationTimeSeconds.toFixed(
                      1,
                    )
                  } s · {
                    disruptionTargetLabel(
                      latestBannerEvent.targetId,
                    )
                  }
                </span>
              </div>
            </div>
          ) : null}

          {inspectorOpen ? (
            <aside className="agent-inspector">
              <div className="agent-inspector-header">
                <div>
                  <span className="eyebrow">
                    Agent Inspector
                  </span>

                  <strong>
                    {selectedAgents.length ===
                    1
                      ? agentDisplayName(
                          selectedAgents[0]!.id,
                        )
                      : `${selectedAgents.length} agents selected`}
                  </strong>
                </div>

                <button
                  type="button"
                  className="agent-inspector-close"
                  onClick={
                    clearAgentSelection
                  }
                  aria-label="Close agent inspector"
                >
                  ×
                </button>
              </div>

              {selectedAgents.length >
              1 ? (
                <div className="agent-group-summary">
                  <div>
                    <span>
                      Moving
                    </span>

                    <strong>
                      {
                        selectedActiveCount
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Evacuated
                    </span>

                    <strong>
                      {
                        selectedEvacuatedCount
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Exposure
                    </span>

                    <strong>
                      {selectedHazardExposure.toFixed(
                        1,
                      )} s
                    </strong>
                  </div>

                  <div>
                    <span>
                      Reroutes
                    </span>

                    <strong>
                      {
                        selectedReroutes
                      }
                    </strong>
                  </div>
                </div>
              ) : null}

              {primarySelectedAgent ? (
                <div className="primary-agent-panel">
                  {selectedAgents.length >
                  1 ? (
                    <div className="primary-agent-heading">
                      Primary route · {
                        agentDisplayName(
                          primarySelectedAgent.id,
                        )
                      }
                    </div>
                  ) : null}

                  <div className="agent-property-grid">
                    <span>
                      Status
                    </span>

                    <strong>
                      {
                        statusDisplayName(
                          primarySelectedAgent,
                        )
                      }
                    </strong>

                    <span>
                      Current area
                    </span>

                    <strong>
                      {
                        currentAreaForAgent(
                          primarySelectedAgent,
                        )
                      }
                    </strong>

                    <span>
                      Assigned exit
                    </span>

                    <strong>
                      {
                        exitDisplayName(
                          primarySelectedAgent.targetExitId,
                        )
                      }
                    </strong>

                    <span>
                      Hazard exposure
                    </span>

                    <strong>
                      {primarySelectedAgent.hazardExposureSeconds.toFixed(
                        2,
                      )} s
                    </strong>

                    <span>
                      Distance traveled
                    </span>

                    <strong>
                      {primarySelectedAgent.distanceTraveledMeters.toFixed(
                        1,
                      )} m
                    </strong>

                    <span>
                      Reroutes
                    </span>

                    <strong>
                      {
                        primarySelectedAgent.rerouteCount
                      }
                    </strong>

                    <span>
                      Route remaining
                    </span>

                    <strong>
                      {
                        primarySelectedAgent.status ===
                        "ACTIVE"
                          ? `${remainingRouteNodeCount} nodes`
                          : "—"
                      }
                    </strong>

                    <span>
                      Evacuation time
                    </span>

                    <strong>
                      {
                        primarySelectedAgent.evacuationTimeSeconds ===
                        null
                          ? "—"
                          : `${primarySelectedAgent.evacuationTimeSeconds.toFixed(
                              2,
                            )} s`
                      }
                    </strong>
                  </div>

                  <div className="route-legend">
                    <div>
                      <span className="route-swatch route-swatch-normal" />

                      Current usable route
                    </div>

                    <div>
                      <span className="route-swatch route-swatch-hazard" />

                      Route segment through active hazard
                    </div>
                  </div>
                </div>
              ) : null}

              {selectedAgents.length >
              1 ? (
                <div className="selected-agent-list">
                  <span className="field-label">
                    Selected agents
                  </span>

                  {selectedAgents.map(
                    (
                      agent,
                    ) => (
                      <button
                        key={
                          agent.id
                        }
                        type="button"
                        className={
                          `selected-agent-row${
                            agent.id ===
                            primarySelectedAgentId
                              ? " primary"
                              : ""
                          }`
                        }
                        onClick={
                          () =>
                            makeAgentPrimary(
                              agent.id,
                            )
                        }
                      >
                        <span>
                          {
                            agentDisplayName(
                              agent.id,
                            )
                          }
                        </span>

                        <span>
                          {
                            statusDisplayName(
                              agent,
                            )
                          }
                        </span>
                      </button>
                    ),
                  )}
                </div>
              ) : null}

              <label className="replay-tracking-option">
                <input
                  type="checkbox"
                  checked={
                    keepAgentTrackingOnReplay
                  }
                  onChange={
                    (
                      event,
                    ) =>
                      setKeepAgentTrackingOnReplay(
                        event.target.checked,
                      )
                  }
                />

                <span className="replay-tracking-control" />

                <span className="replay-tracking-copy">
                  <strong>
                    Keep agent tracking on Replay
                  </strong>

                  <small>
                    Preserve the selected agent and route trace when replaying this same simulation run.
                  </small>
                </span>
              </label>

              <div className="agent-selection-hint">
                Click an agent to select it. Shift/Ctrl-click to add or remove agents. The cyan route belongs to the primary selected agent. Press Esc or click empty space to clear selection.
              </div>
            </aside>
          ) : null}

          <div className="presentation-metrics">
            <div>
              <span>
                Evacuated
              </span>

              <strong>
                {evacuatedAgents}/{totalAgents}
              </strong>
            </div>

            <div>
              <span>
                Completion
              </span>

              <strong>
                {completionPercent.toFixed(
                  1,
                )}%
              </strong>
            </div>

            <div>
              <span>
                Reroutes
              </span>

              <strong>
                {
                  currentFrame.metrics.totalReroutes
                }
              </strong>
            </div>
          </div>

          <div className="scene-status-bar">
            <div className="simulation-clock">
              <span className="clock-label">
                Simulation
              </span>

              <strong>
                {formatSimulationTime(
                  playbackTimeSeconds,
                )}
              </strong>
            </div>

            <div className="playback-cluster">
              <div className="playback-buttons">
                <button
                  type="button"
                  className="playback-button"
                  onClick={
                    resetPlayback
                  }
                  disabled={
                    isPreparingSimulation
                  }
                >
                  Reset
                </button>

                <button
                  type="button"
                  className="playback-button primary"
                  disabled={
                    isPlaying ||
                    isComplete ||
                    isPreparingSimulation
                  }
                  onClick={
                    playPlayback
                  }
                >
                  Play
                </button>

                <button
                  type="button"
                  className="playback-button"
                  disabled={
                    !isPlaying ||
                    isPreparingSimulation
                  }
                  onClick={
                    pausePlayback
                  }
                >
                  Pause
                </button>

                <button
                  type="button"
                  className="playback-button"
                  disabled={
                    isPlaying ||
                    isAtStart ||
                    isComplete ||
                    isPreparingSimulation
                  }
                  onClick={
                    resumePlayback
                  }
                >
                  Resume
                </button>

                <button
                  type="button"
                  className="playback-button"
                  onClick={
                    replayPlayback
                  }
                  disabled={
                    isPreparingSimulation
                  }
                >
                  Replay
                </button>

                <span className="playback-divider" />

                {[
                  0.5,
                  1,
                  2,
                  4,
                ].map(
                  (
                    rate,
                  ) => (
                    <button
                      key={
                        rate
                      }
                      type="button"
                      className={
                        `rate-button${
                          playbackRate ===
                          rate
                            ? " active"
                            : ""
                        }`
                      }
                      onClick={
                        () =>
                          setPlaybackRate(
                            rate,
                          )
                      }
                      disabled={
                        isPreparingSimulation
                      }
                    >
                      {rate}×
                    </button>
                  ),
                )}
              </div>

              <div className="timeline-track-shell">
                <input
                  className="timeline-scrubber"
                  type="range"
                  min={0}
                  max={
                    durationSeconds
                  }
                  step={0.1}
                  value={
                    playbackTimeSeconds
                  }
                  disabled={
                    isPreparingSimulation
                  }
                  onPointerDown={
                    beginTimelineScrub
                  }
                  onChange={
                    handleTimelineChange
                  }
                  aria-label="Simulation timeline"
                  style={{
                    background:
                      `linear-gradient(to right, var(--accent) 0%, var(--accent) ${
                        durationSeconds >
                        0
                          ? (
                              playbackTimeSeconds /
                              durationSeconds
                            ) *
                            100
                          : 0
                      }%, var(--timeline-track) ${
                        durationSeconds >
                        0
                          ? (
                              playbackTimeSeconds /
                              durationSeconds
                            ) *
                            100
                          : 0
                      }%, var(--timeline-track) 100%)`,
                  }}
                />

                <div className="timeline-event-marker-layer">
                  {replay.result.appliedDisruptions.map(
                    (
                      disruption,
                    ) => {
                      const markerPercent =
                        durationSeconds <=
                        0
                          ? 0
                          : Math.max(
                              0,
                              Math.min(
                                100,
                                (
                                  disruption.activationTimeSeconds /
                                  durationSeconds
                                ) *
                                  100,
                              ),
                            );

                      return (
                        <button
                          key={
                            disruption.id
                          }
                          type="button"
                          className={
                            `timeline-event-marker ${disruptionVisualClass(
                              disruption,
                            )}`
                          }
                          style={{
                            left:
                              `${markerPercent}%`,
                          }}
                          title={
                            disruptionFullLabel(
                              disruption,
                            )
                          }
                          onClick={
                            () =>
                              seekToDisruption(
                                disruption,
                              )
                          }
                          disabled={
                            isPreparingSimulation
                          }
                        />
                      );
                    },
                  )}
                </div>
              </div>
            </div>

            <div className="timeline-state">
              {
                stateLabel
              }
            </div>
          </div>
        </main>
      </div>

      <section
        className={
          `research-output-panel ${
            applicationMode ===
            "RESEARCH"
              ? "research-mode-panel"
              : "interactive-demo-panel"
          }${

            researchDetailsOpen
              ? " details-open"
              : ""
          }`
        }
      >
        <div className="research-output-heading">
          <div>
            <span className="eyebrow">
              {applicationMode ===
              "RESEARCH"
                ? "Research Outputs"
                : "Demo Outputs"}
            </span>

            <strong className="research-output-title">
              {applicationMode ===
              "RESEARCH"
                ? "Current Simulation Run"
                : "Interactive Demonstration"}
            </strong>

            <span
              className="single-run-badge"
              title="This is one stochastic simulation run. Formal research results use 40 paired replications."
            >
              One simulation run
            </span>
          </div>

          <div className="research-output-actions">
            <span className="research-output-context">
              {applicationMode ===
              "RESEARCH"
                ? condition?.label ??
                  configuration.conditionId
                : `Interactive Demo · ${interactiveDemoEvents.length} event${
                    interactiveDemoEvents.length === 1
                      ? ""
                      : "s"
                  }`} · Seed {
                replay.metadata.replicationSeed
              }
            </span>

            <button
              type="button"
              className="details-toggle-button"
              onClick={
                () =>
                  setResearchDetailsOpen(
                    (
                      current,
                    ) =>
                      !current,
                  )
              }
            >
              {researchDetailsOpen
                ? "Hide Details"
                : "More Details"}
            </button>
          </div>
        </div>

        <div className="research-primary-metrics">
          <MetricCard
            primary
            label="Evacuated"
            value={
              `${evacuatedAgents} / ${totalAgents}`
            }
          />

          <MetricCard
            primary
            label="Completion"
            value={
              completionPercent.toFixed(
                1,
              )
            }
            unit="%"
          />

          <MetricCard
            primary
            label="Total Evacuation Time"
            value={
              formatOptionalNumber(
                finalTotalEvacuationTime,
              )
            }
            unit="s"
          />

          <MetricCard
            primary
            label="Reroutes"
            value={
              String(
                currentFrame.metrics.totalReroutes,
              )
            }
          />
        </div>

        {researchDetailsOpen ? (
          <div className="research-secondary-metrics">
            <MetricCard
              label="P95 Evacuation Time"
              value={
                formatOptionalNumber(
                  finalP95EvacuationTime,
                )
              }
              unit="s"
            />

            <MetricCard
              label="Peak Local Density"
              value={
                formatOptionalNumber(
                  finalMaximumLocalDensity,
                )
              }
              unit="persons/m²"
            />

            <MetricCard
              label="Hazard Exposure"
              value={
                currentFrame.metrics.populationHazardExposurePersonSeconds.toFixed(
                  2,
                )
              }
              unit="person-s"
            />

            <MetricCard
              label="Queue Exposure"
              value={
                currentFrame.metrics.populationQueueWaitPersonSeconds.toFixed(
                  2,
                )
              }
              unit="person-s"
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}