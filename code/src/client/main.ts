import { getReachableTiles } from '../engine/rules/movement/move';
import { Action } from '../engine/types';
import { GRID_ROWS, GRID_COLUMNS } from '../engine/constants';
import type { GameState, ProtocolResponse, Position } from '../engine/types';

document.documentElement.style.setProperty('--grid-columns', String(GRID_COLUMNS));
document.documentElement.style.setProperty('--grid-rows', String(GRID_ROWS));

const grid = document.getElementById('grid')!;
const errors = document.getElementById('errors')!;
const currentPlayer = document.getElementById('current-player')!;
const scoreEl = document.getElementById('score')!;

let selectedUnit: string | null = null;
let currentState: GameState | null = null;

// build grid
for (let y = 0; y < GRID_ROWS; y++) {
  for (let x = 0; x < GRID_COLUMNS; x++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.x = String(x);
    cell.dataset.y = String(y);
    grid.appendChild(cell);
  }
}

// click handler
grid.addEventListener('click', (e) => {
  const cell = (e.target as HTMLElement).closest('.cell') as HTMLElement | null;
  if (!cell) return;

  const x = Number(cell.dataset.x);
  const y = Number(cell.dataset.y);
  const unitDiv = cell.querySelector('.unit');
  const unitOnTile = unitDiv?.textContent ?? null;

  if (unitOnTile) {
    const clickedOwner = currentState ? Object.values(currentState.units).find(u => u.id === unitOnTile)?.owner : null;
    const isOpposing = currentState && clickedOwner !== currentState.turn.player;
    if (selectedUnit && isOpposing) {
      attack(selectedUnit, unitOnTile);
    } else {
      selectedUnit = unitOnTile;
      document.querySelectorAll('.cell').forEach(c => {
        c.querySelector('.unit')?.classList.remove('selected');
        c.classList.remove('reachable');
      });
      unitDiv!.classList.add('selected');
      if (currentState) {
        getReachableTiles(currentState, selectedUnit).forEach(({ x, y }) => {
          const tile = document.querySelector<HTMLElement>(`.cell[data-x="${x}"][data-y="${y}"]`);
          if (tile) tile.classList.add('reachable');
        });
      }
    }
  } else if (selectedUnit) {
    move(selectedUnit, { x, y });
  }
});

function refresh(result: ProtocolResponse) {
  currentState = result.state;
  currentPlayer.textContent = `Current player: ${result.state.turn.player}`;
  scoreEl.textContent = Object.entries(result.state.score)
    .map(([player, score]) => `${player}: ${score}`)
    .join(' | ');
  // clear all cells
  document.querySelectorAll('.cell').forEach(cell => {
    cell.querySelector('.unit')?.remove();
    cell.classList.remove('reachable');
  });
  // render units
  Object.values(result.state.units).forEach(unit => {
    const selector = `.cell[data-x="${unit.pos.x}"][data-y="${unit.pos.y}"]`;
    const cell = document.querySelector(selector);
    if (!cell) return;
    const unitDiv = document.createElement('div');
    unitDiv.className = 'unit';
    unitDiv.classList.add(unit.owner.toLowerCase());
    unitDiv.textContent = unit.id;
    unitDiv.classList.toggle('selected', selectedUnit === unit.id);
    cell.appendChild(unitDiv);
  });
  if (result.errors) {
    errors.textContent = String(result.errors);
  } else {
    errors.textContent = ""
  }
}

async function fetchAndRender(url: string, args?: RequestInit) {
  try {
    const res = await fetch(url, args);
    const result = await res.json();
    refresh(result);
  } catch (err) {
    console.error('Failed to load state', err);
  }
}

const loadState = () => fetchAndRender('/state');

const move = (unitId: string, pos: Position) => {
  if (!currentState) return;
  return fetchAndRender('/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      playerId: currentState.turn.player,
      action: Action.Move,
      arguments: { unitId, pos },
    }),
  });
};

const attack = (attackerId: string, defenderId: string) => {
  if (!currentState) return;
  return fetchAndRender('/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      playerId: currentState.turn.player,
      action: Action.Attack,
      arguments: { attackerId, defenderId },
    }),
  });
};

// run on load
loadState();
