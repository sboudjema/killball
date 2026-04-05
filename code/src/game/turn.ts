import { GameState, ProtocolResponse, TurnState, TurnError, Position } from "./types";
import { processMove } from "./move";

type MoveAction = { type: 'move'; unitId: string; pos: Position };
export type Action = MoveAction;

export function submitAction(state: GameState, playerId: string, action: Action): ProtocolResponse {
  // WAITING_FOR_ACTION: reject if wrong player
  if (playerId !== state.turn.player) {
    return { state, events: [], errors: [TurnError.NotYourTurn], end_turn: false };
  }

  // Transition to RESOLVING
  const resolvingState: GameState = {
    ...state,
    turn: { ...state.turn, state: TurnState.Resolving },
  };

  // Process action
  const result = processMove(resolvingState, action.unitId, action.pos);

  // RESOLUTION_COMPLETE
  const end_turn = result.errors.length === 0;
  const idx = state.players.indexOf(state.turn.player);
  const nextPlayer = end_turn
    ? state.players[(idx + 1) % state.players.length]
    : state.turn.player;

  const finalState: GameState = {
    ...result.state,
    turn: { player: nextPlayer, state: TurnState.WaitingForAction },
  };

  return { ...result, state: finalState, end_turn };
}
