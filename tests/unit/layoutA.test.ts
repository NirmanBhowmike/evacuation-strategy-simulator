import { describe, expect, it } from "vitest";
import { layoutA } from "../../src/environment/layoutA";
import { validateBuildingEnvironment } from "../../src/core/validateBuildingEnvironment";

describe("Layout A", () => {
  it("passes building-environment validation", () => {
    expect(() =>
      validateBuildingEnvironment(layoutA),
    ).not.toThrow();
  });

  it("uses the intended irregular development-layout dimensions", () => {
    expect(layoutA.widthMeters).toBe(82);
    expect(layoutA.heightMeters).toBe(50);
  });

  it("contains a substantial room set for experimental occupancy", () => {
    const rooms = layoutA.zones.filter(
      (zone) => zone.type === "ROOM",
    );

    expect(rooms.length).toBeGreaterThanOrEqual(18);
  });

  it("contains the reference-inspired circulation features", () => {
    const zoneIds = new Set(
      layoutA.zones.map((zone) => zone.id),
    );

    expect(zoneIds.has("corridor-main-spine")).toBe(true);
    expect(zoneIds.has("corridor-northwest-link")).toBe(true);
    expect(zoneIds.has("open-west-atrium")).toBe(true);
    expect(zoneIds.has("open-central")).toBe(true);
    expect(zoneIds.has("room-east-large-01")).toBe(true);
    expect(zoneIds.has("corridor-southeast")).toBe(true);
  });

  it("contains a deliberately narrow experimental connector", () => {
    const bottleneck = layoutA.zones.find(
      (zone) => zone.id === "corridor-east-bottleneck",
    );

    expect(bottleneck).toBeDefined();
    expect(bottleneck?.type).toBe("CORRIDOR");
  });
});