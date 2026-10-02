import { describe, expect, it } from "vitest";
import { add } from "../../src/core/math";

describe("development test harness", () => {
  it("executes TypeScript tests correctly", () => {
    expect(add(2, 3)).toBe(5);
  });
});