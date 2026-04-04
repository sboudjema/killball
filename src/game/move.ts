import { GameState, ActionResult, MoveError } from "./types";

const GRID_COLUMNS = 5;
const GRID_ROWS = 10;

export function validateMove(state: GameState, unitId: string, x: number, y: number): MoveError[] {
  const errors: MoveError[] = [];

  const unit = state.units[unitId];
  if (!unit) {
    errors.push(MoveError.UnitNotFound);
    return errors;
  }

  if (x < 0 || x >= GRID_COLUMNS || y < 0 || y >= GRID_ROWS) {
    errors.push(MoveError.OutOfBounds);
  }

  const occupied = Object.values(state.units).some(u => u.id !== unitId && u.x === x && u.y === y);
  if (occupied) {
    errors.push(MoveError.TileOccupied);
  }

  if (!canReach(state, unitId, x, y)) {
    errors.push(MoveError.OutOfRange);
  }

  return errors;
}

function canReach(state: GameState, unitId: string, targetX: number, targetY: number): boolean {
  const unit = state.units[unitId];
  const blocked = new Set(
    Object.values(state.units).filter(u => u.id !== unitId).map(u => `${u.x},${u.y}`)
  );

  type Node = { x: number; y: number; steps: number };
  const queue: Node[] = [{ x: unit.x, y: unit.y, steps: 0 }];
  const visited = new Set<string>([`${unit.x},${unit.y}`]);

  while (queue.length > 0) {
    const { x, y, steps } = queue.shift()!;
    if (x === targetX && y === targetY) return true;
    if (steps >= unit.ma) continue;

    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nx = x + dx, ny = y + dy;
      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;
      if (nx < 0 || nx >= GRID_COLUMNS || ny < 0 || ny >= GRID_ROWS) continue;
      if (blocked.has(key) && !(nx === targetX && ny === targetY)) continue;
      visited.add(key);
      queue.push({ x: nx, y: ny, steps: steps + 1 });
    }
  }
  return false;
}

export function getReachableTiles(state: GameState, unitId: string): { x: number; y: number }[] {
  const unit = state.units[unitId];
  if (!unit) return [];

  const blocked = new Set(
    Object.values(state.units).filter(u => u.id !== unitId).map(u => `${u.x},${u.y}`)
  );

  type Node = { x: number; y: number; steps: number };
  const queue: Node[] = [{ x: unit.x, y: unit.y, steps: 0 }];
  const visited = new Set<string>([`${unit.x},${unit.y}`]);
  const reachable: { x: number; y: number }[] = [];

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

export function applyMove(state: GameState, unitId: string, x: number, y: number): ActionResult {
  const newState: GameState = {
    ...state,
    units: {
      ...state.units,
      [unitId]: { ...state.units[unitId], x, y },
    },
  };
  return { state: newState, events: [], errors: [] };
}

export function processMove(state: GameState, unitId: string, x: number, y: number): ActionResult {
  console.log(`move ${unitId} to (${x}, ${y})`)
  const errors = validateMove(state, unitId, x, y);
  if (errors.length > 0) {
    return { state, events: [], errors };
  }
  return applyMove(state, unitId, x, y);
}
