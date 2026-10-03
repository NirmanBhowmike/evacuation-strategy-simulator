import {
  ResearchScene,
} from "../visualization/ResearchScene";

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

export function App() {
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
              Research Model v1.0
            </div>

            <div className="status-caption">
              Visualization foundation
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
              Preview configuration for the
              visualization foundation.
            </p>
          </div>

          <div className="scenario-fields">
            <ScenarioField
              label="Layout"
              value="Layout A"
              secondary="Development environment"
            />

            <ScenarioField
              label="Strategy"
              value="Adaptive Hybrid"
              secondary="Research strategy"
            />

            <ScenarioField
              label="Occupancy"
              value="Medium · 36"
              secondary="Frozen research level"
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
              Visual Layers
            </span>

            <div className="layer-row">
              <span>
                Building
              </span>

              <span className="layer-state">
                Planned
              </span>
            </div>

            <div className="layer-row">
              <span>
                Occupants
              </span>

              <span className="layer-state">
                Planned
              </span>
            </div>

            <div className="layer-row">
              <span>
                Routes
              </span>

              <span className="layer-state">
                Planned
              </span>
            </div>

            <div className="layer-row">
              <span>
                Hazards
              </span>

              <span className="layer-state">
                Planned
              </span>
            </div>
          </div>

          <div className="foundation-note">
            <div className="foundation-note-title">
              Phase 6A
            </div>

            <p>
              Research engine remains frozen.
              This layer will consume validated
              visualization state only.
            </p>
          </div>
        </aside>

        <main className="scene-panel">

          <div className="scene-overlay scene-overlay-left">
            <div className="scene-label">
              3D RESEARCH VIEW
            </div>

            <div className="scene-title">
              Layout A
            </div>

            <div className="scene-description">
              Foundation scene
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

          <ResearchScene />

          <div className="scene-status-bar">
            <div className="simulation-clock">
              <span className="clock-label">
                SIMULATION
              </span>

              <strong>
                00:00.0
              </strong>
            </div>

            <div className="timeline-track">
              <div className="timeline-progress" />
            </div>

            <div className="timeline-state">
              READY
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
            Preview
          </span>
        </div>

        <div className="metrics-grid">
          <MetricCard
            label="Evacuated"
            value="0 / 36"
          />

          <MetricCard
            label="Total Evacuation Time"
            value="—"
            unit="s"
          />

          <MetricCard
            label="Hazard Exposure"
            value="0.00"
            unit="person-s"
          />

          <MetricCard
            label="Queue Exposure"
            value="0.00"
            unit="person-s"
          />

          <MetricCard
            label="Reroutes"
            value="0"
          />
        </div>

      </section>

    </div>
  );
}