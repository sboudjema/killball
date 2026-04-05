type PlayerId = string;
type UnitId = string;

export type Position = { x: number; y: number };

export type Unit = {
  id: UnitId;
  owner: PlayerId;
  pos: Position;
  initialPos: Position;
  ma: number; //movement allowance
};

export type GameState = {
  players: PlayerId[];
  turn: {
    player: PlayerId,
    state: TurnState,
  };
  units: Record<UnitId, Unit>;
  score: Record<PlayerId, number>;
};

export enum MoveError {
  UnitNotFound = "UNIT_NOT_FOUND",
  NotYourUnit  = "NOT_YOUR_UNIT",
  OutOfBounds  = "OUT_OF_BOUNDS",
  TileOccupied = "TILE_OCCUPIED",
  OutOfRange   = "OUT_OF_RANGE",
}

export enum TurnState {
  WaitingForAction = "WAITING_FOR_ACTION",
  Resolving = "RESOLVING",
}

export enum Action {
  Move = "MOVE",
}

export enum TurnError {
  NotYourTurn = "NOT_YOUR_TURN",
}

export enum ProtocolError {
  InvalidRequest   = "INVALID_REQUEST",
  InvalidArguments = "INVALID_ARGUMENTS",
}

export type ProtocolRequest = {
  playerId: string;
  action: Action;
  arguments: unknown;
};

export type ProtocolResponse = {
  state: GameState;
  events: [];
  errors: (MoveError | TurnError | ProtocolError)[];
  end_turn: boolean;
};