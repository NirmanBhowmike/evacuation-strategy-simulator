import {
  describe,
  expect,
  it,
} from "vitest";

import {
  layoutAArchitectureV2NavigationGraph,
} from "../../src/environment/layoutAArchitectureV2NavigationGraph";

function connected(
  first: string,
  second: string,
): boolean {
  return (
    layoutAArchitectureV2NavigationGraph
      .edges
      .some(
        (edge) =>
          (
            edge.from ===
              first &&
            edge.to ===
              second
          ) ||
          (
            edge.bidirectional &&
            edge.from ===
              second &&
            edge.to ===
              first
          ),
      )
  );
}

describe(
  "Layout A Architecture V2 natural room access",
  () => {
    it(
      "connects every room door to its intended nearest circulation access point",
      () => {
        const expected:
          ReadonlyArray<
            readonly [
              string,
              string,
            ]
          > =
        [
          [
            "door-nw-01",
            "nw-hall-west",
          ],

          [
            "door-nw-02",
            "nw-hall-center",
          ],

          [
            "door-nw-03",
            "nw-hall-east",
          ],

          [
            "door-west-upper",
            "nw-connector-middle",
          ],

          [
            "door-west-lower",
            "west-corridor-west",
          ],

          [
            "door-west-central-01",
            "west-central-01-access",
          ],

          [
            "door-west-central-02",
            "west-central-02-access",
          ],

          [
            "door-west-central-03",
            "west-central-03-access",
          ],

          [
            "door-west-central-04",
            "main-open",
          ],

          [
            "door-central-01",
            "central-01-access",
          ],

          [
            "door-central-02",
            "central-02-access",
          ],

          [
            "door-central-03",
            "central-03-access",
          ],

          [
            "door-central-upper-01",
            "upper-west",
          ],

          [
            "door-central-upper-02",
            "upper-mid",
          ],

          [
            "door-east-large",
            "east-large-access",
          ],

          [
            "door-east-01",
            "east-vertical-mid",
          ],

          [
            "door-east-02",
            "east-02-access",
          ],

          [
            "door-far-east",
            "east-egress-center",
          ],

          [
            "door-southeast-01",
            "southeast-room-junction",
          ],

          [
            "door-southeast-02",
            "southeast-room-junction",
          ],
        ];

        for (
          const [
            doorId,
            accessNodeId,
          ] of
            expected
        ) {
          expect(
            connected(
              doorId,
              accessNodeId,
            ),
            `${doorId} is not connected directly to ${accessNodeId}`,
          ).toBe(
            true,
          );
        }
      },
    );

    it(
      "uses a deliberate northwest hall access pattern without the unnecessary left diagonal",
      () => {
        /**
         * Left polygon:
         *
         * door -> west hall node -> center hall node
         * -> connector
         */
        expect(
          connected(
            "nw-hall-west",
            "nw-hall-center",
          ),
        ).toBe(
          true,
        );

        expect(
          connected(
            "nw-hall-west",
            "nw-connector-north",
          ),
        ).toBe(
          false,
        );

        /**
         * Center polygon has a natural direct approach.
         */
        expect(
          connected(
            "nw-hall-center",
            "nw-connector-north",
          ),
        ).toBe(
          true,
        );

        /**
         * Right polygon also has a natural direct approach.
         */
        expect(
          connected(
            "nw-hall-east",
            "nw-connector-north",
          ),
        ).toBe(
          true,
        );
      },
    );
  },
);