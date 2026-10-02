import {
  describe,
  expect,
  it,
} from "vitest";

import {
  BottleneckFlowController,
  DEFAULT_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,
} from "../../src/core/bottleneckFlow";

import type { NavigationEdge } from "../../src/types/navigation";

function createEdge(
  id = "edge-test",
  widthMeters = 2,
): NavigationEdge {
  return {
    id,

    from: "node-a",
    to: "node-b",

    lengthMeters: 10,
    widthMeters,

    zoneId: "corridor-test",

    bidirectional: true,
  };
}

describe("Bottleneck flow behavior", () => {
  it("calculates nominal capacity from specific flow and edge width", () => {
    const controller =
      new BottleneckFlowController();

    const edge =
      createEdge(
        "edge-test",
        2,
      );

    expect(
      controller
        .calculateCapacityPersonsPerSecond(
          edge,
        ),
    ).toBeCloseTo(
      DEFAULT_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND *
        2,
    );

    expect(
      controller
        .calculateCapacityPersonsPerSecond(
          edge,
        ),
    ).toBeCloseTo(2.6);
  });

  it("limits admissions according to bottleneck capacity", () => {
    const controller =
      new BottleneckFlowController();

    const result =
      controller.admitAgents(
        createEdge(
          "edge-test",
          2,
        ),
        [
          "agent-001",
          "agent-002",
          "agent-003",
          "agent-004",
        ],
        1,
      );

    /**
     * Capacity:
     *
     * 1.3 * 2.0 * 1 second
     * = 2.6 persons
     *
     * Therefore two whole-person admissions occur.
     */
    expect(
      result.admittedAgentIds,
    ).toEqual([
      "agent-001",
      "agent-002",
    ]);

    expect(
      result.queuedAgentIds,
    ).toEqual([
      "agent-003",
      "agent-004",
    ]);

    expect(
      result.carryPersons,
    ).toBeCloseTo(0.6);
  });

  it("carries fractional capacity across timesteps while a queue remains", () => {
    const controller =
      new BottleneckFlowController();

    const edge =
      createEdge(
        "edge-test",
        2,
      );

    const first =
      controller.admitAgents(
        edge,
        [
          "agent-001",
          "agent-002",
        ],
        0.2,
      );

    /**
     * 2.6 persons/s * 0.2 s
     * = 0.52 person capacity.
     */
    expect(
      first.admittedAgentIds,
    ).toHaveLength(0);

    expect(
      first.queuedAgentIds,
    ).toHaveLength(2);

    expect(
      first.carryPersons,
    ).toBeCloseTo(0.52);

    const second =
      controller.admitAgents(
        edge,
        [
          "agent-001",
          "agent-002",
        ],
        0.2,
      );

    /**
     * Previous 0.52
     * + another 0.52
     * = 1.04
     *
     * One agent can now pass.
     */
    expect(
      second.admittedAgentIds,
    ).toEqual([
      "agent-001",
    ]);

    expect(
      second.queuedAgentIds,
    ).toEqual([
      "agent-002",
    ]);

    expect(
      second.carryPersons,
    ).toBeCloseTo(0.04);
  });

  it("preserves deterministic queue ordering", () => {
    const controller =
      new BottleneckFlowController();

    const result =
      controller.admitAgents(
        createEdge(),
        [
          "agent-004",
          "agent-002",
          "agent-003",
          "agent-001",
        ],
        1,
      );

    expect(
      result.admittedAgentIds,
    ).toEqual([
      "agent-004",
      "agent-002",
    ]);

    expect(
      result.queuedAgentIds,
    ).toEqual([
      "agent-003",
      "agent-001",
    ]);
  });

  it("gives wider edges greater nominal flow capacity", () => {
    const controller =
      new BottleneckFlowController();

    const narrow =
      controller
        .calculateCapacityPersonsPerSecond(
          createEdge(
            "narrow",
            2,
          ),
        );

    const wide =
      controller
        .calculateCapacityPersonsPerSecond(
          createEdge(
            "wide",
            3.5,
          ),
        );

    expect(
      wide,
    ).toBeGreaterThan(
      narrow,
    );

    expect(
      narrow,
    ).toBeCloseTo(2.6);

    expect(
      wide,
    ).toBeCloseTo(4.55);
  });

  it("does not bank unused capacity after the queue clears", () => {
    const controller =
      new BottleneckFlowController();

    const edge =
      createEdge(
        "edge-test",
        2,
      );

    /**
     * Ten seconds would create 26 theoretical person permits,
     * but only one person is waiting.
     */
    const first =
      controller.admitAgents(
        edge,
        [
          "agent-001",
        ],
        10,
      );

    expect(
      first.admittedAgentIds,
    ).toEqual([
      "agent-001",
    ]);

    expect(
      first.queuedAgentIds,
    ).toHaveLength(0);

    expect(
      first.carryPersons,
    ).toBe(0);

    expect(
      controller.getCarryPersons(
        edge.id,
      ),
    ).toBe(0);

    /**
     * A new arrival receives only the capacity generated during
     * this new timestep.
     */
    const second =
      controller.admitAgents(
        edge,
        [
          "agent-002",
        ],
        0.1,
      );

    expect(
      second.admittedAgentIds,
    ).toHaveLength(0);

    expect(
      second.queuedAgentIds,
    ).toEqual([
      "agent-002",
    ]);

    expect(
      second.carryPersons,
    ).toBeCloseTo(0.26);
  });

  it("tracks fractional capacity independently for different edges", () => {
    const controller =
      new BottleneckFlowController();

    const firstEdge =
      createEdge(
        "edge-one",
        2,
      );

    const secondEdge =
      createEdge(
        "edge-two",
        3,
      );

    controller.admitAgents(
      firstEdge,
      [
        "agent-001",
      ],
      0.1,
    );

    controller.admitAgents(
      secondEdge,
      [
        "agent-002",
      ],
      0.1,
    );

    expect(
      controller.getCarryPersons(
        "edge-one",
      ),
    ).toBeCloseTo(0.26);

    expect(
      controller.getCarryPersons(
        "edge-two",
      ),
    ).toBeCloseTo(0.39);
  });

  it("supports alternative specific-flow values for sensitivity analysis", () => {
    const controller =
      new BottleneckFlowController(
        1.9,
      );

    const edge =
      createEdge(
        "edge-test",
        2,
      );

    expect(
      controller
        .calculateCapacityPersonsPerSecond(
          edge,
        ),
    ).toBeCloseTo(3.8);

    const result =
      controller.admitAgents(
        edge,
        [
          "agent-001",
          "agent-002",
          "agent-003",
          "agent-004",
        ],
        1,
      );

    expect(
      result.admittedAgentIds,
    ).toEqual([
      "agent-001",
      "agent-002",
      "agent-003",
    ]);
  });

  it("rejects invalid bottleneck parameters and duplicate candidate ids", () => {
    expect(() =>
      new BottleneckFlowController(
        0,
      ),
    ).toThrow(
      /Specific flow must be positive/,
    );

    expect(() =>
      new BottleneckFlowController(
        -1,
      ),
    ).toThrow(
      /Specific flow must be positive/,
    );

    const controller =
      new BottleneckFlowController();

    expect(() =>
      controller.admitAgents(
        createEdge(),
        [
          "agent-001",
        ],
        0,
      ),
    ).toThrow(
      /timestep must be positive/,
    );

    expect(() =>
      controller.admitAgents(
        createEdge(),
        [
          "agent-001",
          "agent-001",
        ],
        1,
      ),
    ).toThrow(
      /Duplicate bottleneck candidate agent id/,
    );

    expect(() =>
      controller
        .calculateCapacityPersonsPerSecond({
          ...createEdge(),
          widthMeters: 0,
        }),
    ).toThrow(
      /positive finite width/,
    );
  });
});