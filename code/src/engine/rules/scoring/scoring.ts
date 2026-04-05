import { GameState } from "../../types";
import { GRID_ROWS } from "../../constants";

export function processScoring(state: GameState): GameState {
  const endZoneRows: Record<string, number> = {
    [state.players[0]]: 0,
    [state.players[1]]: GRID_ROWS - 1,
  };

  const updatedUnits = { ...state.units };
  const updatedScore = { ...state.score };

  for (const unit of Object.values(updatedUnits)) {
    const ownerIndex = state.players.indexOf(unit.owner);
    const opposingPlayer = state.players[(ownerIndex + 1) % state.players.length];
    const opposingEndZoneRow = endZoneRows[opposingPlayer];

    if (unit.pos.y === opposingEndZoneRow) {
      updatedScore[unit.owner] = (updatedScore[unit.owner] ?? 0) + 1;

      for (const u of Object.values(updatedUnits)) {
        updatedUnits[u.id] = { ...u, pos: { ...u.initialPos } };
      }
      break;
    }
  }

  return { ...state, units: updatedUnits, score: updatedScore };
}
