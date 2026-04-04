type PlayerId = string;
type UnitId = string;


export type Unit = {
  id: UnitId;
  owner: PlayerId;
  x: number;
  y: number;
  ma: number; //movement allowance
};

export type GameState = {
  currentPlayer: PlayerId;
  units: Record<UnitId, Unit>;
};

export enum MoveError {
  UnitNotFound = "UNIT_NOT_FOUND",
  OutOfBounds  = "OUT_OF_BOUNDS",
  TileOccupied = "TILE_OCCUPIED",
  OutOfRange   = "OUT_OF_RANGE",
}

export type ActionResult = {
  state: GameState
  events: []
  errors: MoveError[]
}