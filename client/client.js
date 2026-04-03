const grid = document.getElementById('grid');

const COLUMNS = 5;
const ROWS = 10;

// build grid
for (let y = 0; y <  ROWS; y++) {
    for (let x = 0; x <  COLUMNS; x++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.x = x;
        cell.dataset.y = y;
        grid.appendChild(cell);
    }
}

// click handler
grid.addEventListener('click', (e) => {
    const cell = e.target;

    if (!cell.classList.contains('cell')) return;

    const x = Number(cell.dataset.x);
    const y = Number(cell.dataset.y);

    console.log('Clicked:', x, y);

    move()
});

function refresh(state) {
  // clear all cells
  document.querySelectorAll('.cell').forEach(cell => {
    cell.textContent = '';
  });
  // render units
  Object.values(state.state.units).forEach(unit => {
    const selector = `.cell[data-x="${unit.x}"][data-y="${unit.y}"]`;
    const cell = document.querySelector(selector);
    if (!cell) return;
    cell.textContent = unit.id; // simplest possible display
  });
}

async function fetchAndRender(url, args) {
  try {
    const res = await fetch(url, args);
    const resp = await res.json();
    refresh(resp);
  } catch (err) {
    console.error('Failed to load state', err);
  }
}

loadState = () => fetchAndRender('/state');

move = () => fetchAndRender('/move', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({unitId: 1, x: 3, y: 4})
});

// run on load
loadState();