import { describe, it, expect } from "vitest";
import { processAction } from "../engine/processAction";
import { Action, AttackError, TurnError } from "../engine/types";
import { unit, state, attack } from "../fixtures";

// --- A. Valid cases ---

describe("attack: valid cases", () => {
  it("spec example: attacker (1,1) ends at (3,3), defender (3,3) pushed to (4,4)", () => {
    const u1 = unit("u1", "P1", { x: 1, y: 1 }, { ma: 3 });
    const u2 = unit("u2", "P2", { x: 3, y: 3 });
    const s = state([u1, u2], "P1");
    const { action, args } = attack("u1", "u2");

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toHaveLength(0);
    expect(result.state.units["u1"].pos).toEqual({ x: 3, y: 3 });
    expect(result.state.units["u2"].pos).toEqual({ x: 4, y: 4 });
  });

  it("attacker already adjacent: stays as push origin, defender pushed away", () => {
    const u1 = unit("u1", "P1", { x: 2, y: 2 }, { ma: 1 });
    const u2 = unit("u2", "P2", { x: 3, y: 3 });
    const s = state([u1, u2], "P1");
    const { action, args } = attack("u1", "u2");

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toHaveLength(0);
    expect(result.state.units["u1"].pos).toEqual({ x: 3, y: 3 });
    expect(result.state.units["u2"].pos).toEqual({ x: 4, y: 4 });
  });

  it("tie-break: prefers most direct path (fewest direction changes) when equidistant", () => {
    // attacker at (0,5), defender at (3,5)
    // adjacent tiles at Chebyshev dist 2: (2,4), (2,5), (2,6)
    // (2,5) is pure orthogonal (0 direction changes); others need a bend
    // → adjacent = (2,5), push dir = (+1,0), defender → (4,5), attacker → (3,5)
    const u1 = unit("u1", "P1", { x: 0, y: 5 }, { ma: 3 });
    const u2 = unit("u2", "P2", { x: 3, y: 5 });
    const s = state([u1, u2], "P1");
    const { action, args } = attack("u1", "u2");

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toHaveLength(0);
    expect(result.state.units["u1"].pos).toEqual({ x: 3, y: 5 });
    expect(result.state.units["u2"].pos).toEqual({ x: 4, y: 5 });
  });

  it("orthogonal push: defender pushed straight back", () => {
    const u1 = unit("u1", "P1", { x: 0, y: 0 }, { ma: 3 });
    const u2 = unit("u2", "P2", { x: 0, y: 2 });
    const s = state([u1, u2], "P1");
    const { action, args } = attack("u1", "u2");

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toHaveLength(0);
    expect(result.state.units["u1"].pos).toEqual({ x: 0, y: 2 });
    expect(result.state.units["u2"].pos).toEqual({ x: 0, y: 3 });
  });

  it("advances turn after successful attack", () => {
    const u1 = unit("u1", "P1", { x: 1, y: 1 }, { ma: 3 });
    const u2 = unit("u2", "P2", { x: 3, y: 3 });
    const s = state([u1, u2], "P1");
    const { action, args } = attack("u1", "u2");

    const result = processAction(s, "P1", action, args);

    expect(result.end_turn).toBe(true);
    expect(result.state.turn.player).toBe("P2");
  });

  it("triggers scoring when attacker lands on opponent end zone", () => {
    // u1 attacks u2 at (5,9); closest adjacent is (4,9), push is sideways to (6,9);
    // attacker ends at (5,9) which is P2's end zone → P1 scores
    const u1 = unit("u1", "P1", { x: 3, y: 8 }, { ma: 2, initialPos: { x: 3, y: 0 } });
    const u2 = unit("u2", "P2", { x: 5, y: 9 }, { initialPos: { x: 5, y: 9 } });
    const s = state([u1, u2], "P1");
    const { action, args } = attack("u1", "u2");

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toHaveLength(0);
    expect(result.state.score["P1"]).toBe(1);
  });
});

// --- B. Invalid cases (one per precondition / failure case) ---

describe("attack: invalid cases", () => {
  it("fails with ATTACKER_NOT_FOUND when attacker does not exist", () => {
    const u2 = unit("u2", "P2", { x: 3, y: 3 });
    const s = state([u2], "P1");
    const { action, args } = attack("ghost", "u2");

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toContain(AttackError.AttackerNotFound);
    expect(result.state).toEqual(s);
  });

  it("fails with NOT_YOUR_UNIT when attacker belongs to opponent", () => {
    const u1 = unit("u1", "P2", { x: 1, y: 1 });
    const u2 = unit("u2", "P2", { x: 3, y: 3 });
    const s = state([u1, u2], "P1");
    const { action, args } = attack("u1", "u2");

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toContain(AttackError.NotYourUnit);
  });

  it("fails with DEFENDER_NOT_FOUND when defender does not exist", () => {
    const u1 = unit("u1", "P1", { x: 1, y: 1 });
    const s = state([u1], "P1");
    const { action, args } = attack("u1", "ghost");

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toContain(AttackError.DefenderNotFound);
  });

  it("fails with FRIENDLY_FIRE when defender belongs to attacker's player", () => {
    const u1 = unit("u1", "P1", { x: 1, y: 1 });
    const u2 = unit("u2", "P1", { x: 2, y: 2 });
    const s = state([u1, u2], "P1");
    const { action, args } = attack("u1", "u2");

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toContain(AttackError.FriendlyFire);
  });

  it("fails with OUT_OF_RANGE when defender is beyond attacker's MA", () => {
    const u1 = unit("u1", "P1", { x: 0, y: 0 }, { ma: 1 });
    const u2 = unit("u2", "P2", { x: 5, y: 5 });
    const s = state([u1, u2], "P1");
    const { action, args } = attack("u1", "u2");

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toContain(AttackError.OutOfRange);
  });

  it("fails with PUSH_BLOCKED when push-back tile is out of bounds", () => {
    // Defender at bottom-right corner — push would go off-grid
    const u1 = unit("u1", "P1", { x: 4, y: 8 }, { ma: 3 });
    const u2 = unit("u2", "P2", { x: 6, y: 9 });
    const s = state([u1, u2], "P1");
    const { action, args } = attack("u1", "u2");

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toContain(AttackError.PushBlocked);
    expect(result.state.units["u2"].pos).toEqual({ x: 6, y: 9 }); // defender unmoved
  });

  it("fails with PUSH_BLOCKED when push-back tile is occupied by another unit", () => {
    const u1 = unit("u1", "P1", { x: 1, y: 1 }, { ma: 3 });
    const u2 = unit("u2", "P2", { x: 3, y: 3 });
    const blocker = unit("u3", "P2", { x: 4, y: 4 }); // occupies push-back tile
    const s = state([u1, u2, blocker], "P1");
    const { action, args } = attack("u1", "u2");

    const result = processAction(s, "P1", action, args);

    expect(result.errors).toContain(AttackError.PushBlocked);
  });

  it("fails with NOT_YOUR_TURN when wrong player submits attack", () => {
    const u1 = unit("u1", "P1", { x: 1, y: 1 });
    const u2 = unit("u2", "P2", { x: 3, y: 3 });
    const s = state([u1, u2], "P1"); // P1's turn
    const { action, args } = attack("u2", "u1");

    const result = processAction(s, "P2", action, args); // P2 acts out of turn

    expect(result.errors).toContain(TurnError.NotYourTurn);
    expect(result.state).toEqual(s);
  });
});

// --- C. Edge cases ---

describe("attack: edge cases", () => {
  it("state is not mutated on failure", () => {
    const u1 = unit("u1", "P1", { x: 0, y: 0 }, { ma: 1 });
    const u2 = unit("u2", "P2", { x: 5, y: 5 }); // out of range
    const s = state([u1, u2], "P1");
    const originalU1Pos = { ...u1.pos };
    const originalU2Pos = { ...u2.pos };

    processAction(s, "P1", Action.Attack, { attackerId: "u1", defenderId: "u2" });

    expect(s.units["u1"].pos).toEqual(originalU1Pos);
    expect(s.units["u2"].pos).toEqual(originalU2Pos);
  });

  it("no position collisions after a successful attack", () => {
    const u1 = unit("u1", "P1", { x: 1, y: 1 }, { ma: 3 });
    const u2 = unit("u2", "P2", { x: 3, y: 3 });
    const s = state([u1, u2], "P1");
    const { action, args } = attack("u1", "u2");

    const result = processAction(s, "P1", action, args);

    const positions = Object.values(result.state.units).map(u => `${u.pos.x},${u.pos.y}`);
    expect(new Set(positions).size).toBe(positions.length);
  });
});
