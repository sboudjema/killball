import { getReachableTiles } from '../game/move';
import type { GameState, ActionResult } from '../game/types';

const grid = document.getElementById('grid')!;
const errors = document.getElementById('errors')!;

const COLUMNS = 5;
const ROWS = 10;

let selectedUnit: string | null = null;
let currentState: GameState | null = null;

// build grid
for (let y = 0; y < ROWS; y++) {
  for (let x = 0; x < COLUMNS; x++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.x = String(x);
    cell.dataset.y = String(y);
    grid.appendChild(cell);
  }
}

// click handler
grid.addEventListener('click', (e) => {
  const cell = e.target as HTMLElement;
  if (!cell.classList.contains('cell')) return;

  const x = Number(cell.dataset.x);
  const y = Number(cell.dataset.y);
  const unitOnTile = cell.textContent;

  if (unitOnTile) {
    selectedUnit = unitOnTile;
    document.querySelectorAll('.cell').forEach(c => {
      c.classList.remove('selected');
      c.classList.remove('reachable');
    });
    cell.classList.add('selected');
    if (currentState) {
      getReachableTiles(currentState, selectedUnit).forEach(({ x, y }) => {
        const tile = document.querySelector<HTMLElement>(`.cell[data-x="${x}"][data-y="${y}"]`);
        if (tile) tile.classList.add('reachable');
      });
    }
  } else if (selectedUnit) {
    move(selectedUnit, x, y);
  }
});

function refresh(result: ActionResult) {
  currentState = result.state;
  // clear all cells
  document.querySelectorAll('.cell').forEach(cell => {
    cell.textContent = '';
    cell.classList.remove('selected');
    cell.classList.remove('reachable');
  });
  // render units
  Object.values(result.state.units).forEach(unit => {
    const selector = `.cell[data-x="${unit.x}"][data-y="${unit.y}"]`;
    const cell = document.querySelector(selector);
    if (!cell) return;
    cell.textContent = unit.id;
    cell.classList.toggle('selected', selectedUnit === unit.id);
  });
  errors.textContent = String(result.errors);
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

const move = (unitId: string, x: number, y: number) => fetchAndRender('/move', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ unitId, x, y }),
});

// run on load
loadState();
