import { GameState, ProtocolResponse, TurnState, TurnError, Position, Action, Requirement, ResolvedContext, ActionDefinition } from "./types";
import { processMove } from "./rules/movement/move";
import { processAttack } from "./rules/combat/attack";
import { processScoring } from "./rules/scoring/scoring";

// --- Requirement resolvers ---

const resolvers: Record<Requirement, () => ResolvedContext> = {
  [Requirement.D6]: () => ({ roll: Math.floor(Math.random() * 6) + 1 }),
};

function resolveRequirements(requires: Requirement[]): ResolvedContext {
  return requires.reduce((ctx, req) => {
    const resolver = resolvers[req];
    if (!resolver) throw new Error(`Missing resolver for requirement: ${req}`);
    return { ...ctx, ...resolver() };
  }, {} as ResolvedContext);
}

// --- Action definitions ---

const moveDefinition: ActionDefinition<{ unitId: string; pos: Position }> = {
  requires: [],
  execute: (state, { unitId, pos }) => processMove(state, unitId, pos),
};

const attackDefinition: ActionDefinition<{ attackerId: string; defenderId: string; roll: number }> = {
  requires: [Requirement.D6],
  execute: (state, { attackerId, defenderId, roll }) => processAttack(state, attackerId, defenderId, roll),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const definitions: Record<Action, ActionDefinition<any>> = {
  [Action.Move]: moveDefinition,
  [Action.Attack]: attackDefinition,
};

// --- Entry point ---

export function processAction(state: GameState, playerId: string, action: Action, args: unknown): ProtocolResponse {
  const definition = definitions[action];
  if (!definition) throw new Error(`Unknown action: ${action}`);

  return submitAction(state, playerId, (s) => {
    const resolvedContext = resolveRequirements(definition.requires);
    const finalParams = { ...(args as object), ...resolvedContext };
    return definition.execute(s, finalParams as never);
  });
}

function submitAction(state: GameState, playerId: string, process: (s: GameState) => ProtocolResponse): ProtocolResponse {
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
  const result = process(resolvingState);

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
