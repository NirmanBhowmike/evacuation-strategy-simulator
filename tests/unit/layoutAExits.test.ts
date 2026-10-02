import { describe, expect, it } from "vitest";
import { layoutA } from "../../src/environment/layoutA";
import { layoutAExits } from "../../src/environment/layoutAExits";
import { validateExitSet } from "../../src/core/validateExitSet";
import type { ExitSet } from "../../src/types/exit";

describe("Layout A exits", () => {
  it("passes exit-set validation", () => {
    expect(() =>
      validateExitSet(layoutAExits, layoutA),
    ).not.toThrow();
  });

  it("contains exactly four primary exits", () => {
    expect(layoutAExits.exits).toHaveLength(4);
  });

  it("contains the intended exit identifiers", () => {
    const ids = new Set(
      layoutAExits.exits.map((exit) => exit.id),
    );

    expect(ids.has("exit-west")).toBe(true);
    expect(ids.has("exit-south-central")).toBe(true);
    expect(ids.has("exit-east")).toBe(true);
    expect(ids.has("exit-southeast")).toBe(true);
  });

  it("uses equal nominal widths in the baseline layout", () => {
    const widths = new Set(
      layoutAExits.exits.map((exit) => exit.widthMeters),
    );

    expect(widths.size).toBe(1);
    expect(widths.has(1.8)).toBe(true);
  });

  it("rejects duplicate exit ids", () => {
    const invalid: ExitSet = {
      ...layoutAExits,
      exits: [
        ...layoutAExits.exits,
        layoutAExits.exits[0]!,
      ],
    };

    expect(() =>
      validateExitSet(invalid, layoutA),
    ).toThrow(/Duplicate exit id/);
  });

  it("rejects exits connected to nonexistent zones", () => {
    const firstExit = layoutAExits.exits[0]!;

    const invalid: ExitSet = {
      ...layoutAExits,
      exits: [
        {
          ...firstExit,
          connectedZoneId: "missing-zone",
        },
      ],
    };

    expect(() =>
      validateExitSet(invalid, layoutA),
    ).toThrow(/unknown connected zone/);
  });
});