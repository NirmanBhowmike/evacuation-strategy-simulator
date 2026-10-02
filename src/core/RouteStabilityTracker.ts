import type {
  AgentRouteStabilitySummary,
  RouteChangeStabilityEvent,
  RouteStabilitySummary,
} from "../types/routeStability";
import type {
  NavigationNodeId,
} from "../types/navigation";
import type {
  RoutingPath,
} from "../types/routing";

interface MutableAgentSummary {
  acceptedReroutes: number;
  exitTargetChanges: number;
  routeReversalEvents: number;
}

function validateAgentId(
  agentId: string,
): void {
  if (!agentId.trim()) {
    throw new Error(
      "Route stability agent id is required.",
    );
  }
}

function validateSimulationTime(
  simulationTimeSeconds: number,
): void {
  if (
    !Number.isFinite(
      simulationTimeSeconds,
    ) ||
    simulationTimeSeconds < 0
  ) {
    throw new Error(
      "Route stability time must be non-negative and finite.",
    );
  }
}

function validatePath(
  path: RoutingPath,
  expectedStartNodeId:
    NavigationNodeId,
  label: string,
): void {
  if (
    path.nodeIds.length === 0
  ) {
    throw new Error(
      `${label} route must contain at least one node.`,
    );
  }

  if (
    path.edgeIds.length !==
    path.nodeIds.length - 1
  ) {
    throw new Error(
      `${label} route must contain exactly one fewer edge than nodes.`,
    );
  }

  if (
    path.nodeIds[0] !==
    expectedStartNodeId
  ) {
    throw new Error(
      `${label} route must begin at the current navigation node.`,
    );
  }

  if (
    path.targetNodeId !==
    path.nodeIds[
      path.nodeIds.length - 1
    ]
  ) {
    throw new Error(
      `${label} route target must match its final node.`,
    );
  }
}

function pathsAreIdentical(
  first: RoutingPath,
  second: RoutingPath,
): boolean {
  if (
    first.targetNodeId !==
    second.targetNodeId
  ) {
    return false;
  }

  if (
    first.nodeIds.length !==
      second.nodeIds.length ||
    first.edgeIds.length !==
      second.edgeIds.length
  ) {
    return false;
  }

  for (
    let index = 0;
    index <
      first.nodeIds.length;
    index += 1
  ) {
    if (
      first.nodeIds[index] !==
      second.nodeIds[index]
    ) {
      return false;
    }
  }

  for (
    let index = 0;
    index <
      first.edgeIds.length;
    index += 1
  ) {
    if (
      first.edgeIds[index] !==
      second.edgeIds[index]
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Records stability diagnostics only for ACCEPTED route changes.
 *
 * This class does not decide whether rerouting should happen.
 * That remains the responsibility of reroutingDecision.ts.
 *
 * Route reversal definition:
 *
 * At a decision node, an accepted new route is classified as a
 * reversal when its next node is the same node from which the
 * agent just arrived.
 */
export class RouteStabilityTracker {
  private readonly events:
    RouteChangeStabilityEvent[] = [];

  private readonly summaryByAgent =
    new Map<
      string,
      MutableAgentSummary
    >();

  private nextSequence = 1;

  private createEventId(
    sequence: number,
  ): string {
    return `stability-${String(
      sequence,
    ).padStart(
      6,
      "0",
    )}`;
  }

  public recordAcceptedReroute(
    agentId: string,
    simulationTimeSeconds: number,
    currentNodeId:
      NavigationNodeId,
    arrivalFromNodeId:
      NavigationNodeId | null,
    previousPath:
      RoutingPath,
    selectedPath:
      RoutingPath,
  ): RouteChangeStabilityEvent {
    validateAgentId(
      agentId,
    );

    validateSimulationTime(
      simulationTimeSeconds,
    );

    validatePath(
      previousPath,
      currentNodeId,
      "Previous",
    );

    validatePath(
      selectedPath,
      currentNodeId,
      "Selected",
    );

    if (
      pathsAreIdentical(
        previousPath,
        selectedPath,
      )
    ) {
      throw new Error(
        "Accepted reroute must change the route.",
      );
    }

    if (
      arrivalFromNodeId ===
      currentNodeId
    ) {
      throw new Error(
        "Arrival-from node cannot equal the current node.",
      );
    }

    const exitTargetChanged =
      previousPath.targetNodeId !==
      selectedPath.targetNodeId;

    const nextSelectedNode =
      selectedPath.nodeIds[1] ??
      null;

    const routeReversal =
      arrivalFromNodeId !==
        null &&
      nextSelectedNode ===
        arrivalFromNodeId;

    const sequence =
      this.nextSequence;

    this.nextSequence += 1;

    const event:
      RouteChangeStabilityEvent =
      Object.freeze({
        sequence,

        eventId:
          this.createEventId(
            sequence,
          ),

        agentId,

        simulationTimeSeconds,

        currentNodeId,

        arrivalFromNodeId,

        previousTargetExitId:
          previousPath
            .targetNodeId,

        selectedTargetExitId:
          selectedPath
            .targetNodeId,

        exitTargetChanged,

        routeReversal,
      });

    this.events.push(
      event,
    );

    const existing =
      this.summaryByAgent.get(
        agentId,
      ) ?? {
        acceptedReroutes: 0,
        exitTargetChanges: 0,
        routeReversalEvents: 0,
      };

    existing.acceptedReroutes +=
      1;

    if (
      exitTargetChanged
    ) {
      existing.exitTargetChanges +=
        1;
    }

    if (
      routeReversal
    ) {
      existing.routeReversalEvents +=
        1;
    }

    this.summaryByAgent.set(
      agentId,
      existing,
    );

    return event;
  }

  public getEvents():
    readonly RouteChangeStabilityEvent[] {
    return Object.freeze([
      ...this.events,
    ]);
  }

  public getEventsForAgent(
    agentId: string,
  ): readonly RouteChangeStabilityEvent[] {
    validateAgentId(
      agentId,
    );

    return Object.freeze(
      this.events.filter(
        (event) =>
          event.agentId ===
          agentId,
      ),
    );
  }

  public getSummary():
    RouteStabilitySummary {
    const byAgent:
      AgentRouteStabilitySummary[] =
      Array.from(
        this.summaryByAgent
          .entries(),
      )
        .sort(
          (
            [firstAgentId],
            [secondAgentId],
          ) =>
            firstAgentId.localeCompare(
              secondAgentId,
            ),
        )
        .map(
          (
            [
              agentId,
              summary,
            ],
          ) => ({
            agentId,

            acceptedReroutes:
              summary
                .acceptedReroutes,

            exitTargetChanges:
              summary
                .exitTargetChanges,

            routeReversalEvents:
              summary
                .routeReversalEvents,
          }),
        );

    const totalAcceptedReroutes =
      byAgent.reduce(
        (
          total,
          summary,
        ) =>
          total +
          summary.acceptedReroutes,
        0,
      );

    const totalExitTargetChanges =
      byAgent.reduce(
        (
          total,
          summary,
        ) =>
          total +
          summary.exitTargetChanges,
        0,
      );

    const totalRouteReversalEvents =
      byAgent.reduce(
        (
          total,
          summary,
        ) =>
          total +
          summary.routeReversalEvents,
        0,
      );

    return Object.freeze({
      totalAcceptedReroutes,

      totalExitTargetChanges,

      totalRouteReversalEvents,

      agentsWithAcceptedReroutes:
        byAgent.length,

      byAgent:
        Object.freeze(
          byAgent,
        ),
    });
  }

  public get size(): number {
    return this.events.length;
  }

  public clear(): void {
    this.events.length = 0;

    this.summaryByAgent.clear();

    this.nextSequence = 1;
  }
}