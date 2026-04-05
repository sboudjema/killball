import { GameState, ProtocolResponse, MoveError, Position } from "../../types";
import { GRID_ROWS, GRID_COLUMNS } from "../../constants";

function validateMove(state: GameState, unitId: string, pos: Position): MoveError[] {
  const errors: MoveError[] = [];

  const unit = state.units[unitId];
  if (!unit) {
    errors.push(MoveError.UnitNotFound);
    return errors;
  }

  if (unit.owner !== state.turn.player) {
    errors.push(MoveError.NotYourUnit);
    return errors;
  }

  if (pos.x < 0 || pos.x >= GRID_COLUMNS || pos.y < 0 || pos.y >= GRID_ROWS) {
    errors.push(MoveError.OutOfBounds);
  }

  const occupied = Object.values(state.units).some(u => u.id !== unitId && u.pos.x === pos.x && u.pos.y === pos.y);
  if (occupied) {
    errors.push(MoveError.TileOccupied);
  }

  if (!canReach(state, unitId, pos)) {
    errors.push(MoveError.OutOfRange);
  }

  return errors;
}

function canReach(state: GameState, unitId: string, target: Position): boolean {
  const unit = state.units[unitId];
  const blocked = new Set(
    Object.values(state.units).filter(u => u.id !== unitId).map(u => `${u.pos.x},${u.pos.y}`)
  );

  type Node = { x: number; y: number; steps: number };
  const queue: Node[] = [{ x: unit.pos.x, y: unit.pos.y, steps: 0 }];
  const visited = new Set<string>([`${unit.pos.x},${unit.pos.y}`]);

  while (queue.length > 0) {
    const { x, y, steps } = queue.shift()!;
    if (x === target.x && y === target.y) return true;
    if (steps >= unit.ma) continue;

    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nx = x + dx, ny = y + dy;
      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;
      if (nx < 0 || nx >= GRID_COLUMNS || ny < 0 || ny >= GRID_ROWS) continue;
      if (blocked.has(key) && !(nx === target.x && ny === target.y)) continue;
      visited.add(key);
      queue.push({ x: nx, y: ny, steps: steps + 1 });
    }
  }
  return false;
}

export function getReachableTiles(state: GameState, unitId: string): Position[] {
  const unit = state.units[unitId];
  if (!unit) return [];

  const blocked = new Set(
    Object.values(state.units).filter(u => u.id !== unitId).map(u => `${u.pos.x},${u.pos.y}`)
  );

  type Node = { x: number; y: number; steps: number };
  const queue: Node[] = [{ x: unit.pos.x, y: unit.pos.y, steps: 0 }];
  const visited = new Set<string>([`${unit.pos.x},${unit.pos.y}`]);
  const reachable: Position[] = [];

  while (queue.length > 0) {
    const { x, y, steps } = queue.shift()!;
    if (steps > 0) reachable.push({ x, y });
    if (steps >= unit.ma) continue;

    for (const [dx, dy] of [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]) {
      const nx = x + dx, ny = y + dy;
      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;
      if (nx < 0 || nx >= GRID_COLUMNS || ny < 0 || ny >= GRID_ROWS) continue;
      if (blocked.has(key)) continue;
      visited.add(key);
      queue.push({ x: nx, y: ny, steps: steps + 1 });
    }
  }
  return reachable;
}

function applyMove(state: GameState, unitId: string, pos: Position): ProtocolResponse {
  const newState: GameState = {
    ...state,
    units: {
      ...state.units,
      [unitId]: { ...state.units[unitId], pos },
    },
  };
  return { state: newState, events: [], errors: [], end_turn: false };
}

export function processMove(state: GameState, unitId: string, pos: Position): ProtocolResponse {
  console.log(`move ${unitId} to (${pos.x}, ${pos.y})`)
  const errors = validateMove(state, unitId, pos);
  if (errors.length > 0) {
    return { state, events: [], errors, end_turn: false };
  }
  return applyMove(state, unitId, pos);
}
