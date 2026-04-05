import { GameState, ProtocolResponse, TurnState, TurnError, Position, Action } from "./types";
import { processMove } from "./rules/movement/move";
import { processScoring } from "./rules/scoring/scoring";

type MoveAction = { type: 'move'; unitId: string; pos: Position };

export function processAction(state: GameState, playerId: string, action: Action, args: unknown): ProtocolResponse {
  if (action === Action.Move) {
    const { unitId, pos } = args as { unitId: string; pos: Position };
    return submitAction(state, playerId, { type: 'move', unitId, pos });
  }
  throw new Error(`Unknown action: ${action}`);
}

function submitAction(state: GameState, playerId: string, action: MoveAction): ProtocolResponse {
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

  const scoredState = end_turn ? processScoring(result.state) : result.state;

  const finalState: GameState = {
    ...scoredState,
    turn: { player: nextPlayer, state: TurnState.WaitingForAction },
  };

  return { ...result, state: finalState, end_turn };
}
