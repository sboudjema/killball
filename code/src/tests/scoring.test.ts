import { describe, it, expect } from "vitest";
import { processAction } from "../engine/processAction";
import { Action } from "../engine/types";
import { unit, state, move, runSequence } from "../fixtures";

// --- Invariant helpers ---

function assertScoresNonNegative(result: ReturnType<typeof processAction>) {
  for (const score of Object.values(result.state.score)) {
    expect(score).toBeGreaterThanOrEqual(0);
  }
}

// --- A. Valid cases ---

describe("scoring: valid cases", () => {
  it("P1 unit entering P2 end zone (y=9) increments P1 score by 1", () => {
    const u = unit("u1", "P1", { x: 2, y: 8 }, { ma: 1 });
    const s = state([u], "P1");
    const { action, args } = move("u1", { x: 2, y: 9 });

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toHaveLength(0);
    expect(result.state.score["P1"]).toBe(1);
    expect(result.state.score["P2"]).toBe(0);
    assertScoresNonNegative(result);
  });

  it("P2 unit entering P1 end zone (y=0) increments P2 score by 1", () => {
    const u = unit("u2", "P2", { x: 2, y: 1 }, { ma: 1 });
    const s = state([u], "P2");
    const { action, args } = move("u2", { x: 2, y: 0 });

    const result = processAction(s, "P2", action, args);

    expect(result.errors).toHaveLength(0);
    expect(result.state.score["P2"]).toBe(1);
    expect(result.state.score["P1"]).toBe(0);
    assertScoresNonNegative(result);
  });

  it("non-scoring move does not change any score", () => {
    const u = unit("u1", "P1", { x: 2, y: 4 }, { ma: 1 });
    const s = state([u], "P1");
    const { action, args } = move("u1", { x: 2, y: 5 });

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toHaveLength(0);
    expect(result.state.score["P1"]).toBe(0);
    expect(result.state.score["P2"]).toBe(0);
  });

  it("score accumulates: P1 scores a second time", () => {
    const u = unit("u1", "P1", { x: 2, y: 8 }, { ma: 1, initialPos: { x: 2, y: 1 } });
    const s = state([u], "P1", { score: { P1: 1, P2: 0 } });
    const { action, args } = move("u1", { x: 2, y: 9 });

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toHaveLength(0);
    expect(result.state.score["P1"]).toBe(2);
    assertScoresNonNegative(result);
  });
});

// --- C. Edge cases ---

describe("scoring: edge cases", () => {
  it("P1 unit in its OWN end zone (y=0) does not score", () => {
    const u = unit("u1", "P1", { x: 2, y: 1 }, { ma: 1 });
    const s = state([u], "P1");
    const { action, args } = move("u1", { x: 2, y: 0 });

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toHaveLength(0);
    expect(result.state.score["P1"]).toBe(0);
    assertScoresNonNegative(result);
  });

  it("P2 unit in its OWN end zone (y=9) does not score", () => {
    const u = unit("u2", "P2", { x: 2, y: 8 }, { ma: 1 });
    const s = state([u], "P2");
    const { action, args } = move("u2", { x: 2, y: 9 });

    const result = processAction(s, "P2", action, args);

    expect(result.errors).toHaveLength(0);
    expect(result.state.score["P2"]).toBe(0);
    assertScoresNonNegative(result);
  });

  it("failed move does not change score", () => {
    const u = unit("u1", "P1", { x: 2, y: 8 }, { ma: 1 });
    const s = state([u], "P1");
    const { action, args } = move("u1", { x: 2, y: 99 }); // out of bounds

    const result = processAction(s, "P1", action, args);

    expect(result.errors).not.toHaveLength(0);
    expect(result.state.score["P1"]).toBe(0);
    expect(result.state.score["P2"]).toBe(0);
  });

  it("P1 unit scores from left corner of P2 end zone (x=0, y=9)", () => {
    const u = unit("u1", "P1", { x: 0, y: 8 }, { ma: 1 });
    const s = state([u], "P1");
    const { action, args } = move("u1", { x: 0, y: 9 });

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toHaveLength(0);
    expect(result.state.score["P1"]).toBe(1);
    assertScoresNonNegative(result);
  });

  it("P1 unit scores from right corner of P2 end zone (x=4, y=9)", () => {
    const u = unit("u1", "P1", { x: 4, y: 8 }, { ma: 1 });
    const s = state([u], "P1");
    const { action, args } = move("u1", { x: 4, y: 9 });

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toHaveLength(0);
    expect(result.state.score["P1"]).toBe(1);
    assertScoresNonNegative(result);
  });
});

// --- Sequence test ---

describe("scoring: sequence", () => {
  it("P1 scores then P2 scores, both scores reach 1", () => {
    const u1 = unit("u1", "P1", { x: 2, y: 8 }, { ma: 1, initialPos: { x: 2, y: 1 } });
    const u2 = unit("u2", "P2", { x: 2, y: 1 }, { ma: 1, initialPos: { x: 2, y: 8 } });
    const s = state([u1, u2], "P1");

    const finalState = runSequence(s, [
      { playerId: "P1", action: Action.Move, args: { unitId: "u1", pos: { x: 2, y: 9 } } },
      { playerId: "P2", action: Action.Move, args: { unitId: "u2", pos: { x: 2, y: 0 } } },
    ]);

    expect(finalState.score["P1"]).toBe(1);
    expect(finalState.score["P2"]).toBe(1);
  });
});

/*
 * AMBIGUITIES / SPEC GAPS:
 *
 * 1. "First row" and "last row" are not defined numerically in the spec.
 *    Assumed y=0 (P1 end zone) and y=9 (P2 end zone) based on the engine implementation.
 *
 * 2. The spec does not mention unit reset to initialPos after scoring.
 *    The engine resets the unit, but this behavior is not tested here as it is unspecified.
 *
 * 3. The spec does not clarify whether scoring applies only to the moved unit
 *    or all units in state. The engine checks all units.
 *
 * INVARIANTS THAT COULD NOT BE VERIFIED:
 *
 * - "Scores CANNOT decrease" — no action currently causes a score decrement,
 *   so this invariant cannot be structurally tested without a dedicated decrement action.
 */
