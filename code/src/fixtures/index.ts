import { GameState, Unit, Position, TurnState, Action } from "../engine/types";
import { processAction } from "../engine/processAction";

export function unit(
  id: string,
  owner: string,
  pos: Position,
  opts: { ma?: number; initialPos?: Position } = {}
): Unit {
  return {
    id,
    owner,
    pos,
    initialPos: opts.initialPos ?? pos,
    ma: opts.ma ?? 3,
  };
}

export function state(
  units: Unit[],
  currentPlayer: string,
  opts: { players?: string[]; score?: Record<string, number> } = {}
): GameState {
  const players = opts.players ?? ["P1", "P2"];
  const score = opts.score ?? Object.fromEntries(players.map(p => [p, 0]));
  return {
    players,
    turn: { player: currentPlayer, state: TurnState.WaitingForAction },
    units: Object.fromEntries(units.map(u => [u.id, u])),
    score,
  };
}

export function move(unitId: string, pos: Position) {
  return { action: Action.Move, args: { unitId, pos } };
}

export function runSequence(
  initialState: GameState,
  actions: Array<{ playerId: string; action: Action; args: unknown }>
) {
  return actions.reduce(
    (s, { playerId, action, args }) => processAction(s, playerId, action, args).state,
    initialState
  );
}
