import type { AgentState } from "../types/agent";
import type { BuildingEnvironment } from "../types/environment";
import type {
  HazardFieldSnapshot,
  HazardState,
} from "../types/hazard";
import type {
  NavigationEdge,
  NavigationGraph,
} from "../types/navigation";

export class HazardField {
  private readonly stateByZone =
    new Map<string, HazardState>();

  public readonly layoutId: string;

  public constructor(
    private readonly environment: BuildingEnvironment,
  ) {
    this.layoutId =
      environment.layoutId;

    for (
      const zone of
      environment.zones
    ) {
      this.stateByZone.set(
        zone.id,
        "CLEAR",
      );
    }
  }

  private assertZoneExists(
    zoneId: string,
  ): void {
    if (
      !this.stateByZone.has(
        zoneId,
      )
    ) {
      throw new Error(
        `Unknown hazard zone: ${zoneId}`,
      );
    }
  }

  /**
   * Returns the current hazard state of a building zone.
   */
  public getZoneState(
    zoneId: string,
  ): HazardState {
    this.assertZoneExists(
      zoneId,
    );

    return (
      this.stateByZone.get(
        zoneId,
      )!
    );
  }

  /**
   * Changes the hazard state of a building zone.
   */
  public setZoneState(
    zoneId: string,
    state: HazardState,
  ): void {
    this.assertZoneExists(
      zoneId,
    );

    this.stateByZone.set(
      zoneId,
      state,
    );
  }

  /**
   * CLEAR and RISK zones remain traversable.
   * BLOCKED zones are unavailable.
   */
  public isZoneTraversable(
    zoneId: string,
  ): boolean {
    return (
      this.getZoneState(
        zoneId,
      ) !== "BLOCKED"
    );
  }

  /**
   * Determines whether a navigation edge is traversable.
   */
  public isEdgeTraversable(
    edge: NavigationEdge,
  ): boolean {
    return this.isZoneTraversable(
      edge.zoneId,
    );
  }

  /**
   * Determines whether traversal of an edge contributes
   * to hazard exposure.
   */
  public isEdgeRisky(
    edge: NavigationEdge,
  ): boolean {
    return (
      this.getZoneState(
        edge.zoneId,
      ) === "RISK"
    );
  }

  /**
   * Returns a deterministic snapshot for logging
   * and experiment output.
   */
  public createSnapshot(): HazardFieldSnapshot {
    return {
      layoutId:
        this.layoutId,

      zones:
        this.environment.zones.map(
          (zone) => ({
            zoneId: zone.id,

            state:
              this.getZoneState(
                zone.id,
              ),
          }),
        ),
    };
  }

  /**
   * Resets one building zone to CLEAR.
   */
  public resetZone(
    zoneId: string,
  ): void {
    this.assertZoneExists(
      zoneId,
    );

    this.stateByZone.set(
      zoneId,
      "CLEAR",
    );
  }

  /**
   * Resets the complete hazard field.
   */
  public resetAll(): void {
    for (
      const zone of
      this.environment.zones
    ) {
      this.stateByZone.set(
        zone.id,
        "CLEAR",
      );
    }
  }

  /**
   * Adds hazard exposure for one ACTIVE agent.
   *
   * Exposure accumulates only while the agent traverses
   * an edge whose zone is currently RISK.
   */
  public accumulateAgentExposure(
    agent: AgentState,
    graph: NavigationGraph,
    deltaSeconds: number,
  ): number {
    if (
      !Number.isFinite(
        deltaSeconds,
      ) ||
      deltaSeconds <= 0
    ) {
      throw new Error(
        "Hazard exposure timestep must be positive and finite.",
      );
    }

    if (
      graph.layoutId !==
      this.layoutId
    ) {
      throw new Error(
        "Navigation graph layout must match the hazard field.",
      );
    }

    if (
      agent.status !==
      "ACTIVE"
    ) {
      return 0;
    }

    if (
      agent.currentEdgeId ===
      null
    ) {
      return 0;
    }

    const edge =
      graph.edges.find(
        (candidate) =>
          candidate.id ===
          agent.currentEdgeId,
      );

    if (!edge) {
      throw new Error(
        `Navigation edge not found: ${agent.currentEdgeId}`,
      );
    }

    if (
      !this.isEdgeRisky(
        edge,
      )
    ) {
      return 0;
    }

    agent.hazardExposureSeconds +=
      deltaSeconds;

    return deltaSeconds;
  }
}