import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  CSSProperties,
} from "react";

import type {
  SimulationReplayFrame,
} from "../types/simulationReplay";

import {
  ResearchScene,
} from "../visualization/ResearchScene";

import {
  createArchitectureV2DemoReplay,
} from "./createArchitectureV2DemoReplay";

interface MetricCardProps {
  readonly label:
    string;

  readonly value:
    string;

  readonly unit?:
    string;
}

function MetricCard({
  label,
  value,
  unit,
}: MetricCardProps) {
  return (
    <div className="metric-card">
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

interface ScenarioFieldProps {
  readonly label:
    string;

  readonly value:
    string;

  readonly secondary:
    string;
}

function ScenarioField({
  label,
  value,
  secondary,
}: ScenarioFieldProps) {
  return (
    <div className="scenario-field">
      <span className="scenario-label">
        {label}
      </span>

      <strong className="scenario-value">
        {value}
      </strong>

      <span className="scenario-secondary">
        {secondary}
      </span>
    </div>
  );
}

interface ReplayLocation {
  readonly currentFrame:
    SimulationReplayFrame;

  readonly nextFrame:
    SimulationReplayFrame;

  readonly interpolationAlpha:
    number;
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
    ]!.snapshot
      .simulationTimeSeconds <=
      timeSeconds +
        1e-9
  ) {
    index +=
      1;
  }

  const currentFrame =
    frames[
      index
    ]!;

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

const playbackButtonStyle:
  CSSProperties = {
    border:
      "1px solid rgba(164, 198, 219, 0.22)",

    borderRadius:
      "6px",

    padding:
      "4px 8px",

    color:
      "#c8e5ea",

    background:
      "rgba(17, 38, 49, 0.92)",

    fontSize:
      "9px",

    fontWeight:
      650,

    cursor:
      "pointer",
  };

const playbackButtonActiveStyle:
  CSSProperties = {
    ...playbackButtonStyle,

    color:
      "#071018",

    background:
      "#62dce5",

    borderColor:
      "#62dce5",
  };

const playbackControlRowStyle:
  CSSProperties = {
    display:
      "flex",

    alignItems:
      "center",

    gap:
      "5px",

    marginBottom:
      "6px",
  };

const timelineColumnStyle:
  CSSProperties = {
    minWidth:
      0,
  };

export function App() {
  const replay =
    useMemo(
      () =>
        createArchitectureV2DemoReplay(),
      [],
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

  useEffect(
    () => {
      if (!isPlaying) {
        previousAnimationTimeRef
          .current =
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
            previousAnimationTimeRef
              .current;

          previousAnimationTimeRef
            .current =
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

        previousAnimationTimeRef
          .current =
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

  const replayLocation =
    locateReplay(
      frames,
      playbackTimeSeconds,
    );

  const currentFrame =
    replayLocation
      .currentFrame;

  const progress =
    durationSeconds <=
    0
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            playbackTimeSeconds /
              durationSeconds,
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

  const finalTotalEvacuationTime =
    playbackTimeSeconds >=
      durationSeconds -
        1e-9
      ? replay
          .result
          .metrics
          .totalEvacuationTimeSeconds
      : null;

  const stateLabel =
    playbackTimeSeconds >=
      durationSeconds -
        1e-9
      ? "COMPLETE"
      : isPlaying
        ? "RUNNING"
        : playbackTimeSeconds >
            0
          ? "PAUSED"
          : "READY";

  const togglePlayback =
    () => {
      if (
        playbackTimeSeconds >=
        durationSeconds -
          1e-9
      ) {
        setPlaybackTimeSeconds(
          0,
        );

        setIsPlaying(
          true,
        );

        return;
      }

      setIsPlaying(
        (
          current,
        ) =>
          !current,
      );
    };

  const resetPlayback =
    () => {
      setIsPlaying(
        false,
      );

      setPlaybackTimeSeconds(
        0,
      );
    };

  return (
    <div className="application-shell">

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
              Experimental evaluation of adaptive routing
              under dynamic building conditions
            </div>
          </div>
        </div>

        <div className="top-status">
          <div className="status-indicator" />

          <div>
            <div className="status-title">
              Architecture V2
            </div>

            <div className="status-caption">
              Authoritative Replay
            </div>
          </div>
        </div>
      </header>

      <div className="workspace">

        <aside className="control-panel">
          <div className="panel-heading">
            <span className="eyebrow">
              Experiment
            </span>

            <h2>
              Scenario Setup
            </h2>

            <p>
              Architecture V2 replay driven
              directly by the research engine.
            </p>
          </div>

          <div className="scenario-fields">
            <ScenarioField
              label="Layout"
              value="Architecture V2"
              secondary="Approved building geometry"
            />

            <ScenarioField
              label="Strategy"
              value="Adaptive Hybrid"
              secondary="Research strategy"
            />

            <ScenarioField
              label="Occupancy"
              value="Medium · 42"
              secondary="Provisional V2 level"
            />

            <ScenarioField
              label="Condition"
              value="D0 · Baseline"
              secondary="No disruption"
            />
          </div>

          <div className="panel-divider" />

          <div className="visual-layer-section">
            <span className="eyebrow">
              System Layers
            </span>

            <div className="layer-row">
              <span>
                Building
              </span>

              <span className="layer-state">
                Live
              </span>
            </div>

            <div className="layer-row">
              <span>
                Occupants
              </span>

              <span className="layer-state">
                Authoritative
              </span>
            </div>

            <div className="layer-row">
              <span>
                Navigation
              </span>

              <span className="layer-state">
                Active
              </span>
            </div>

            <div className="layer-row">
              <span>
                Hazards
              </span>

              <span className="layer-state">
                Next
              </span>
            </div>
          </div>

          <div className="foundation-note">
            <div className="foundation-note-title">
              Architecture V2
            </div>

            <p>
              The same 42 simulated occupants
              generate both the 3D motion and
              the research metrics. Limb animation
              remains renderer-only.
            </p>
          </div>
        </aside>

        <main className="scene-panel">

          <div className="scene-overlay scene-overlay-left">
            <div className="scene-label">
              3D RESEARCH VIEW
            </div>

            <div className="scene-title">
              Architecture V2
            </div>

            <div className="scene-description">
              42-agent authoritative room-to-exit replay
            </div>
          </div>

          <div className="scene-overlay scene-overlay-right">
            <div className="camera-help-title">
              Camera
            </div>

            <div className="camera-help-line">
              Drag · rotate
            </div>

            <div className="camera-help-line">
              Wheel · zoom
            </div>

            <div className="camera-help-line">
              Right drag · pan
            </div>
          </div>

          <ResearchScene
            currentFrame={
              replayLocation
                .currentFrame
            }
            nextFrame={
              replayLocation
                .nextFrame
            }
            interpolationAlpha={
              replayLocation
                .interpolationAlpha
            }
          />

          <div className="scene-status-bar">
            <div className="simulation-clock">
              <span className="clock-label">
                SIMULATION
              </span>

              <strong>
                {formatSimulationTime(
                  playbackTimeSeconds,
                )}
              </strong>
            </div>

            <div style={timelineColumnStyle}>
              <div style={playbackControlRowStyle}>
                <button
                  type="button"
                  style={
                    playbackButtonStyle
                  }
                  onClick={
                    resetPlayback
                  }
                >
                  RESET
                </button>

                <button
                  type="button"
                  style={
                    isPlaying
                      ? playbackButtonActiveStyle
                      : playbackButtonStyle
                  }
                  onClick={
                    togglePlayback
                  }
                >
                  {isPlaying
                    ? "PAUSE"
                    : playbackTimeSeconds >=
                        durationSeconds -
                          1e-9
                      ? "REPLAY"
                      : "PLAY"}
                </button>

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
                      style={
                        playbackRate ===
                        rate
                          ? playbackButtonActiveStyle
                          : playbackButtonStyle
                      }
                      onClick={
                        () => {
                          setPlaybackRate(
                            rate,
                          );
                        }
                      }
                    >
                      {rate}×
                    </button>
                  ),
                )}
              </div>

              <div className="timeline-track">
                <div
                  className="timeline-progress"
                  style={{
                    width:
                      `${progress * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="timeline-state">
              {stateLabel}
            </div>
          </div>
        </main>
      </div>

      <section className="metrics-panel">

        <div className="metrics-heading">
          <span className="eyebrow">
            Live Research Metrics
          </span>

          <span className="preview-badge">
            V2 Replay
          </span>
        </div>

        <div className="metrics-grid">
          <MetricCard
            label="Evacuated"
            value={
              `${evacuatedAgents} / ${totalAgents}`
            }
          />

          <MetricCard
            label="Total Evacuation Time"
            value={
              finalTotalEvacuationTime ===
              null
                ? "—"
                : finalTotalEvacuationTime
                    .toFixed(
                      2,
                    )
            }
            unit="s"
          />

          <MetricCard
            label="Hazard Exposure"
            value={
              currentFrame
                .metrics
                .populationHazardExposurePersonSeconds
                .toFixed(
                  2,
                )
            }
            unit="person-s"
          />

          <MetricCard
            label="Queue Exposure"
            value={
              currentFrame
                .metrics
                .populationQueueWaitPersonSeconds
                .toFixed(
                  2,
                )
            }
            unit="person-s"
          />

          <MetricCard
            label="Reroutes"
            value={
              String(
                currentFrame
                  .metrics
                  .totalReroutes,
              )
            }
          />
        </div>

      </section>

    </div>
  );
}