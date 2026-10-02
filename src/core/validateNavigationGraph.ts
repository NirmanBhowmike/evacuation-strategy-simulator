import type { BuildingEnvironment } from "../types/environment";
import type { NavigationGraph } from "../types/navigation";

export function validateNavigationGraph(
  graph: NavigationGraph,
  environment: BuildingEnvironment,
): void {
  if (!graph.layoutId.trim()) {
    throw new Error("Navigation graph layout id is required.");
  }

  if (graph.layoutId !== environment.layoutId) {
    throw new Error(
      "Navigation graph layout id must match the building environment.",
    );
  }

  const validZoneIds = new Set(
    environment.zones.map((zone) => zone.id),
  );

  const nodeIds = new Set<string>();

  for (const node of graph.nodes) {
    if (!node.id.trim()) {
      throw new Error("Every navigation node requires an id.");
    }

    if (nodeIds.has(node.id)) {
      throw new Error(`Duplicate navigation node id: ${node.id}`);
    }

    nodeIds.add(node.id);

    if (
      !Number.isFinite(node.position.x) ||
      !Number.isFinite(node.position.y)
    ) {
      throw new Error(
        `Navigation node ${node.id} has a non-finite position.`,
      );
    }

    if (
      node.position.x < 0 ||
      node.position.y < 0 ||
      node.position.x > environment.widthMeters ||
      node.position.y > environment.heightMeters
    ) {
      throw new Error(
        `Navigation node ${node.id} lies outside the building bounds.`,
      );
    }

    if (!validZoneIds.has(node.zoneId)) {
      throw new Error(
        `Navigation node ${node.id} references an unknown zone.`,
      );
    }
  }

  const edgeIds = new Set<string>();

  for (const edge of graph.edges) {
    if (!edge.id.trim()) {
      throw new Error("Every navigation edge requires an id.");
    }

    if (edgeIds.has(edge.id)) {
      throw new Error(`Duplicate navigation edge id: ${edge.id}`);
    }

    edgeIds.add(edge.id);

    if (!nodeIds.has(edge.from)) {
      throw new Error(
        `Navigation edge ${edge.id} references missing node ${edge.from}.`,
      );
    }

    if (!nodeIds.has(edge.to)) {
      throw new Error(
        `Navigation edge ${edge.id} references missing node ${edge.to}.`,
      );
    }

    if (edge.from === edge.to) {
      throw new Error(
        `Navigation edge ${edge.id} cannot connect a node to itself.`,
      );
    }

    if (
      !Number.isFinite(edge.lengthMeters) ||
      edge.lengthMeters <= 0
    ) {
      throw new Error(
        `Navigation edge ${edge.id} must have a positive finite length.`,
      );
    }

    if (
      !Number.isFinite(edge.widthMeters) ||
      edge.widthMeters <= 0
    ) {
      throw new Error(
        `Navigation edge ${edge.id} must have a positive finite width.`,
      );
    }

    if (!validZoneIds.has(edge.zoneId)) {
      throw new Error(
        `Navigation edge ${edge.id} references an unknown zone.`,
      );
    }
  }
}