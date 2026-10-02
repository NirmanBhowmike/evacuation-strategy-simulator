import { describe, expect, it } from "vitest";
import { validateBuildingEnvironment } from "../../src/core/validateBuildingEnvironment";
import type { BuildingEnvironment } from "../../src/types/environment";

function createEnvironment(): BuildingEnvironment {
  return {
    layoutId: "layout-a",
    widthMeters: 40,
    heightMeters: 30,
    zones: [
      {
        id: "corridor-main",
        type: "CORRIDOR",
        polygon: {
          vertices: [
            { x: 5, y: 12 },
            { x: 35, y: 12 },
            { x: 35, y: 16 },
            { x: 5, y: 16 },
          ],
        },
      },
      {
        id: "room-101",
        type: "ROOM",
        polygon: {
          vertices: [
            { x: 5, y: 5 },
            { x: 12, y: 5 },
            { x: 12, y: 12 },
            { x: 5, y: 12 },
          ],
        },
      },
    ],
  };
}

describe("BuildingEnvironment validation", () => {
  it("accepts a valid building environment", () => {
    expect(() =>
      validateBuildingEnvironment(createEnvironment()),
    ).not.toThrow();
  });

  it("rejects duplicate zone ids", () => {
    const environment = createEnvironment();

    const invalid: BuildingEnvironment = {
      ...environment,
      zones: [
        ...environment.zones,
        environment.zones[0]!,
      ],
    };

    expect(() =>
      validateBuildingEnvironment(invalid),
    ).toThrow(/Duplicate building zone id/);
  });

  it("rejects polygons with fewer than three vertices", () => {
    const environment = createEnvironment();

    const invalid: BuildingEnvironment = {
      ...environment,
      zones: [
        {
          id: "invalid-zone",
          type: "ROOM",
          polygon: {
            vertices: [
              { x: 1, y: 1 },
              { x: 2, y: 2 },
            ],
          },
        },
      ],
    };

    expect(() =>
      validateBuildingEnvironment(invalid),
    ).toThrow(/at least three/);
  });

  it("rejects vertices outside the building bounds", () => {
    const environment = createEnvironment();

    const invalid: BuildingEnvironment = {
      ...environment,
      zones: [
        {
          id: "invalid-zone",
          type: "ROOM",
          polygon: {
            vertices: [
              { x: 1, y: 1 },
              { x: 50, y: 1 },
              { x: 1, y: 5 },
            ],
          },
        },
      ],
    };

    expect(() =>
      validateBuildingEnvironment(invalid),
    ).toThrow(/outside the building bounds/);
  });

  it("rejects zero-area polygons", () => {
    const environment = createEnvironment();

    const invalid: BuildingEnvironment = {
      ...environment,
      zones: [
        {
          id: "invalid-zone",
          type: "ROOM",
          polygon: {
            vertices: [
              { x: 1, y: 1 },
              { x: 2, y: 2 },
              { x: 3, y: 3 },
            ],
          },
        },
      ],
    };

    expect(() =>
      validateBuildingEnvironment(invalid),
    ).toThrow(/positive polygon area/);
  });

  it("rejects non-positive building dimensions", () => {
    const environment = createEnvironment();

    expect(() =>
      validateBuildingEnvironment({
        ...environment,
        widthMeters: 0,
      }),
    ).toThrow(/width/);

    expect(() =>
      validateBuildingEnvironment({
        ...environment,
        heightMeters: -1,
      }),
    ).toThrow(/height/);
  });
});