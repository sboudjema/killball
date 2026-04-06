import { GameState, ProtocolResponse, AttackError, Position } from "../../types";
import { GRID_ROWS, GRID_COLUMNS } from "../../constants";
import { canReach } from "../movement/move";

function chebyshev(a: Position, b: Position): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

function directionChanges(from: Position, to: Position): number {
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  return (dx === 0 || dy === 0 || dx === dy) ? 0 : 1;
}

function isInBounds(pos: Position): boolean {
  return pos.x >= 0 && pos.x < GRID_COLUMNS && pos.y >= 0 && pos.y < GRID_ROWS;
}

function validateAttack(state: GameState, attackerId: string, defenderId: string): AttackError[] {
  const attacker = state.units[attackerId];
  if (!attacker) return [AttackError.AttackerNotFound];

  if (attacker.owner !== state.turn.player) return [AttackError.NotYourUnit];

  const defender = state.units[defenderId];
  if (!defender) return [AttackError.DefenderNotFound];

  if (defender.owner === attacker.owner) return [AttackError.FriendlyFire];

  if (!canReach(state, attackerId, defender.pos)) return [AttackError.OutOfRange];

  return [];
}

function applyAttack(state: GameState, attackerId: string, defenderId: string): ProtocolResponse {
  const attacker = state.units[attackerId];
  const defender = state.units[defenderId];

  // Step 1: find the adjacent tile to defender closest to attacker
  let adjacentTile: Position;
  if (chebyshev(attacker.pos, defender.pos) === 1) {
    adjacentTile = attacker.pos;
  } else {
    const neighbors: Position[] = [];
    for (const [dx, dy] of [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]) {
      const pos: Position = { x: defender.pos.x + dx, y: defender.pos.y + dy };
      if (!isInBounds(pos)) continue;
      const occupied = Object.values(state.units).some(
        u => u.id !== attackerId && u.pos.x === pos.x && u.pos.y === pos.y
      );
      if (!occupied) neighbors.push(pos);
    }
    adjacentTile = neighbors.reduce((best, pos) => {
      const distPos  = chebyshev(pos,  attacker.pos);
      const distBest = chebyshev(best, attacker.pos);
      if (distPos !== distBest) return distPos < distBest ? pos : best;
      return directionChanges(attacker.pos, pos) < directionChanges(attacker.pos, best) ? pos : best;
    });
  }

  // Step 2: compute push direction and push-back position
  const dx = Math.sign(defender.pos.x - adjacentTile.x);
  const dy = Math.sign(defender.pos.y - adjacentTile.y);
  const pushBackPos: Position = { x: defender.pos.x + dx, y: defender.pos.y + dy };

  // Step 3: validate push-back tile
  if (!isInBounds(pushBackPos)) {
    return { state, events: [], errors: [AttackError.PushBlocked], end_turn: false };
  }
  const pushOccupied = Object.values(state.units).some(
    u => u.id !== attackerId && u.id !== defenderId && u.pos.x === pushBackPos.x && u.pos.y === pushBackPos.y
  );
  if (pushOccupied) {
    return { state, events: [], errors: [AttackError.PushBlocked], end_turn: false };
  }

  // Step 4: apply — attacker moves to defender's original pos, defender pushed back
  const defenderOriginalPos = { ...defender.pos };
  const newState: GameState = {
    ...state,
    units: {
      ...state.units,
      [attackerId]: { ...attacker, pos: defenderOriginalPos },
      [defenderId]: { ...defender, pos: pushBackPos },
    },
  };

  return { state: newState, events: [], errors: [], end_turn: false };
}

export function processAttack(state: GameState, attackerId: string, defenderId: string, roll: number): ProtocolResponse {
  const errors = validateAttack(state, attackerId, defenderId);
  if (errors.length > 0) {
    return { state, events: [], errors, end_turn: false };
  }
  return applyAttack(state, attackerId, defenderId);
}
