type PlayerId = string;
type UnitId = string;

export type Unit = {
  id: UnitId;
  owner: PlayerId;
  x: number;
  y: number;
};

export type GameState = {
  currentPlayer: PlayerId;
  units: Record<UnitId, Unit>;
};