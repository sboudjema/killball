import { describe, it, expect } from "vitest";
import { processAction } from "../engine/processAction";
import { Action, MoveError, TurnError } from "../engine/types";
import { unit, state, move, runSequence } from "../fixtures";

// --- Invariant helpers ---

function assertNoPositionCollisions(result: ReturnType<typeof processAction>) {
  const positions = Object.values(result.state.units).map(u => `${u.pos.x},${u.pos.y}`);
  expect(new Set(positions).size).toBe(positions.length);
}

function assertScoresNonNegative(result: ReturnType<typeof processAction>) {
  for (const score of Object.values(result.state.score)) {
    expect(score).toBeGreaterThanOrEqual(0);
  }
}

// --- A. Valid cases ---

describe("move: valid cases", () => {
  it("moves 1 step orthogonally", () => {
    const u = unit("u1", "P1", { x: 2, y: 2 });
    const s = state([u], "P1");
    const { action, args } = move("u1", { x: 2, y: 3 });

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toHaveLength(0);
    expect(result.state.units["u1"].pos).toEqual({ x: 2, y: 3 });
    assertNoPositionCollisions(result);
    assertScoresNonNegative(result);
  });

  it("moves 1 step diagonally (same cost as orthogonal)", () => {
    const u = unit("u1", "P1", { x: 2, y: 2 }, { ma: 1 });
    const s = state([u], "P1");
    const { action, args } = move("u1", { x: 3, y: 3 });

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toHaveLength(0);
    expect(result.state.units["u1"].pos).toEqual({ x: 3, y: 3 });
  });

  it("moves multiple steps within MA", () => {
    const u = unit("u1", "P1", { x: 0, y: 0 }, { ma: 3 });
    const s = state([u], "P1");
    const { action, args } = move("u1", { x: 0, y: 3 });

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toHaveLength(0);
    expect(result.state.units["u1"].pos).toEqual({ x: 0, y: 3 });
  });

  it("move to P1 end zone (y=9) increments P1 score and resets unit to initialPos", () => {
    const initialPos = { x: 2, y: 7 };
    const u = unit("u1", "P1", { x: 2, y: 8 }, { ma: 2, initialPos });
    const s = state([u], "P1");
    const { action, args } = move("u1", { x: 2, y: 9 });

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toHaveLength(0);
    expect(result.state.score["P1"]).toBe(1);
    expect(result.state.units["u1"].pos).toEqual(initialPos);
    assertNoPositionCollisions(result);
    assertScoresNonNegative(result);
  });
});

// --- B. Invalid cases (one per precondition) ---

describe("move: invalid cases", () => {
  it("fails with UNIT_NOT_FOUND when unit does not exist", () => {
    const s = state([], "P1");
    const { action, args } = move("ghost", { x: 1, y: 1 });

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toContain(MoveError.UnitNotFound);
    expect(result.state).toEqual(s); // state unchanged
  });

  it("fails with NOT_YOUR_UNIT when unit belongs to opponent", () => {
    const u = unit("u2", "P2", { x: 2, y: 5 });
    const s = state([u], "P1");
    const { action, args } = move("u2", { x: 2, y: 6 });

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toContain(MoveError.NotYourUnit);
  });

  it("fails with OUT_OF_BOUNDS when target x < 0", () => {
    const u = unit("u1", "P1", { x: 0, y: 2 });
    const s = state([u], "P1");
    const { action, args } = move("u1", { x: -1, y: 2 });

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toContain(MoveError.OutOfBounds);
  });

  it("fails with OUT_OF_BOUNDS when target y >= 10", () => {
    const u = unit("u1", "P1", { x: 2, y: 9 });
    const s = state([u], "P1");
    const { action, args } = move("u1", { x: 2, y: 10 });

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toContain(MoveError.OutOfBounds);
  });

  it("fails with TILE_OCCUPIED when target tile has another unit", () => {
    const u1 = unit("u1", "P1", { x: 2, y: 2 });
    const u2 = unit("u2", "P2", { x: 2, y: 3 });
    const s = state([u1, u2], "P1");
    const { action, args } = move("u1", { x: 2, y: 3 });

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toContain(MoveError.TileOccupied);
  });

  it("fails with OUT_OF_RANGE when path is blocked by an intermediate unit", () => {
    // u1 at (2,0), blocker at (2,1), target (2,2) — only path requires going through blocker
    // MA=2 so diagonal routes around may still work... use a full-wall scenario
    // Place blockers across entire column to force no path
    const u1 = unit("u1", "P1", { x: 0, y: 0 }, { ma: 2 });
    const b1 = unit("b1", "P2", { x: 0, y: 1 });
    const b2 = unit("b2", "P2", { x: 1, y: 1 });
    const s = state([u1, b1, b2], "P1");
    // target (0,2) — to reach it from (0,0) with MA=2, must pass through (0,1) or (1,1), both blocked
    const { action, args } = move("u1", { x: 0, y: 2 });

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toContain(MoveError.OutOfRange);
  });

  it("fails with OUT_OF_RANGE when target exceeds movement allowance", () => {
    const u = unit("u1", "P1", { x: 0, y: 0 }, { ma: 2 });
    const s = state([u], "P1");
    const { action, args } = move("u1", { x: 0, y: 3 }); // 3 steps, MA=2

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toContain(MoveError.OutOfRange);
  });

  it("fails with NOT_YOUR_TURN when wrong player submits action", () => {
    const u = unit("u2", "P2", { x: 2, y: 5 });
    const s = state([u], "P1"); // P1's turn
    const { action, args } = move("u2", { x: 2, y: 6 });

    const result = processAction(s, "P2", action, args); // P2 acts out of turn

    expect(result.errors).toContain(TurnError.NotYourTurn);
    expect(result.state).toEqual(s);
  });
});

// --- C. Edge cases ---

describe("move: edge cases", () => {
  it("succeeds when moving exactly MA steps", () => {
    const u = unit("u1", "P1", { x: 0, y: 0 }, { ma: 3 });
    const s = state([u], "P1");
    const { action, args } = move("u1", { x: 3, y: 0 });

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toHaveLength(0);
    expect(result.state.units["u1"].pos).toEqual({ x: 3, y: 0 });
  });

  it("fails when moving MA+1 steps", () => {
    const u = unit("u1", "P1", { x: 0, y: 0 }, { ma: 3 });
    const s = state([u], "P1");
    const { action, args } = move("u1", { x: 4, y: 0 }); // 4 steps, MA=3

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toContain(MoveError.OutOfRange);
  });

  it("succeeds moving to top-left corner {0,0}", () => {
    const u = unit("u1", "P1", { x: 1, y: 1 }, { ma: 2 });
    const s = state([u], "P1");
    const { action, args } = move("u1", { x: 0, y: 0 });

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toHaveLength(0);
    expect(result.state.units["u1"].pos).toEqual({ x: 0, y: 0 });
  });

  it("succeeds moving to bottom-right corner {4,9} (P2 unit, no scoring)", () => {
    const u = unit("u2", "P2", { x: 3, y: 8 }, { ma: 2 });
    const s = state([u], "P2");
    const { action, args } = move("u2", { x: 4, y: 9 });

    const result = processAction(s, "P2", action, args);

    expect(result.errors).toHaveLength(0);
    expect(result.state.units["u2"].pos).toEqual({ x: 4, y: 9 });
  });

  it("state is not mutated on failure", () => {
    const u = unit("u1", "P1", { x: 2, y: 2 });
    const s = state([u], "P1");
    const originalPos = { ...u.pos };
    const { action, args } = move("u1", { x: 2, y: 99 }); // out of bounds

    processAction(s, "P1", action, args);

    expect(s.units["u1"].pos).toEqual(originalPos);
  });
});

// --- Sequence test ---

describe("move: sequence", () => {
  it("P1 moves then P2 moves, turns alternate correctly", () => {
    const u1 = unit("u1", "P1", { x: 0, y: 1 }, { ma: 3 });
    const u2 = unit("u2", "P2", { x: 4, y: 8 }, { ma: 3 });
    const s = state([u1, u2], "P1");

    const finalState = runSequence(s, [
      { playerId: "P1", action: Action.Move, args: { unitId: "u1", pos: { x: 0, y: 2 } } },
      { playerId: "P2", action: Action.Move, args: { unitId: "u2", pos: { x: 4, y: 7 } } },
    ]);

    expect(finalState.units["u1"].pos).toEqual({ x: 0, y: 2 });
    expect(finalState.units["u2"].pos).toEqual({ x: 4, y: 7 });
    expect(finalState.turn.player).toBe("P1"); // back to P1 after 2 moves
  });
});
