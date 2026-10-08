import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createArchitectureV2DemoReplay,
} from "../../src/app/createArchitectureV2DemoReplay";

import {
  createInteractiveDemoReplay,
} from "../../src/app/createInteractiveDemoReplay";

import {
  createInteractiveDemoManualEvent,
  INTERACTIVE_DEMO_NOTICE,
} from "../../src/app/interactiveDemoMode";

describe(
  "Interactive Demo replay isolation and reproducibility",
  () => {
    it(
      "matches the formal D0 replay when no manual disruptions are supplied",
      () => {
        const research =
          createArchitectureV2DemoReplay({
            populationLevel:
              "MEDIUM",

            conditionId:
              "D0_BASELINE",

            strategyId:
              "ADAPTIVE_HYBRID",

            replicationSeed:
              100001,
          });

        const interactive =
          createInteractiveDemoReplay({
            populationLevel:
              "MEDIUM",

            strategyId:
              "ADAPTIVE_HYBRID",

            replicationSeed:
              100001,

            events:
              [],
          });

        expect(
          interactive.metadata.mode,
        ).toBe(
          "INTERACTIVE_DEMO",
        );

        expect(
          interactive.metadata.notice,
        ).toBe(
          INTERACTIVE_DEMO_NOTICE,
        );

        expect(
          interactive.metadata.eventCount,
        ).toBe(
          0,
        );

        expect(
          interactive.result.appliedDisruptions,
        ).toHaveLength(
          0,
        );

        expect(
          interactive.result.metrics,
        ).toEqual(
          research.result.metrics,
        );

        expect(
          interactive.result.queueMetrics,
        ).toEqual(
          research.result.queueMetrics,
        );

        expect(
          interactive.result.routeStability,
        ).toEqual(
          research.result.routeStability,
        );

        expect(
          interactive.result.finalAgents,
        ).toEqual(
          research.result.finalAgents,
        );
      },
      15000,
    );

    it(
      "supports multiple unique exit blocks and reproduces the complete event log deterministically",
      () => {
        const events =
          [
            createInteractiveDemoManualEvent(
              "EXIT_BLOCK",
              "exit-west",
              2,
            ),

            createInteractiveDemoManualEvent(
              "CORRIDOR_BLOCK",
              "corridor-main-central-east-blockable",
              4,
            ),

            createInteractiveDemoManualEvent(
              "HAZARD_ACTIVATE",
              "corridor-main-spine",
              1,
            ),

            createInteractiveDemoManualEvent(
              "EXIT_BLOCK",
              "exit-east",
              3,
            ),
          ];

        const request = {
          populationLevel:
            "MEDIUM" as const,

          strategyId:
            "ADAPTIVE_HYBRID" as const,

          replicationSeed:
            100001,

          events,
        };

        const first =
          createInteractiveDemoReplay(
            request,
          );

        const second =
          createInteractiveDemoReplay(
            request,
          );

        expect(
          first.metadata.events.map(
            (
              event,
            ) =>
              event.activationTimeSeconds,
          ),
        ).toEqual([
          1,
          2,
          3,
          4,
        ]);

        expect(
          first.metadata.events.map(
            (
              event,
            ) =>
              event.type,
          ),
        ).toEqual([
          "HAZARD_ACTIVATE",
          "EXIT_BLOCK",
          "EXIT_BLOCK",
          "CORRIDOR_BLOCK",
        ]);

        expect(
          first.result.appliedDisruptions.map(
            (
              event,
            ) => ({
              type:
                event.type,

              targetId:
                event.targetId,

              activationTimeSeconds:
                event.activationTimeSeconds,
            }),
          ),
        ).toEqual([
          {
            type:
              "HAZARD_ACTIVATE",

            targetId:
              "corridor-main-spine",

            activationTimeSeconds:
              1,
          },

          {
            type:
              "EXIT_BLOCK",

            targetId:
              "exit-west",

            activationTimeSeconds:
              2,
          },

          {
            type:
              "EXIT_BLOCK",

            targetId:
              "exit-east",

            activationTimeSeconds:
              3,
          },

          {
            type:
              "CORRIDOR_BLOCK",

            targetId:
              "corridor-main-central-east-blockable",

            activationTimeSeconds:
              4,
          },
        ]);

        expect(
          first.metadata.eventCount,
        ).toBe(
          4,
        );

        expect(
          second.metadata,
        ).toEqual(
          first.metadata,
        );

        expect(
          second.result.metrics,
        ).toEqual(
          first.result.metrics,
        );

        expect(
          second.result.queueMetrics,
        ).toEqual(
          first.result.queueMetrics,
        );

        expect(
          second.result.routeStability,
        ).toEqual(
          first.result.routeStability,
        );

        expect(
          second.result.finalAgents,
        ).toEqual(
          first.result.finalAgents,
        );

        expect(
          second.frames,
        ).toEqual(
          first.frames,
        );
      },
      15000,
    );

    it(
      "rejects duplicate blocking of the same exit target",
      () => {
        const events =
          [
            createInteractiveDemoManualEvent(
              "EXIT_BLOCK",
              "exit-west",
              5,
            ),

            createInteractiveDemoManualEvent(
              "EXIT_BLOCK",
              "exit-west",
              10,
            ),
          ];

        expect(
          () =>
            createInteractiveDemoReplay({
              populationLevel:
                "MEDIUM",

              strategyId:
                "ADAPTIVE_HYBRID",

              replicationSeed:
                100001,

              events,
            }),
        ).toThrow(
          /Invalid or duplicate Interactive Demo event/,
        );
      },
    );
  },
);