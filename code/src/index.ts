import express,  { Request, Response } from "express";
import { submitAction } from "./game/turn";
import { GameState, TurnState, Action, ProtocolRequest, ProtocolResponse, ProtocolError } from "./game/types"
const app = express();
const PORT = 3000

app.use(express.json());
app.use(express.static("client"));

let gameState: GameState = {
  players: ["P1", "P2"],
  turn: {
    player: "P1",
    state: TurnState.WaitingForAction,
  },
  units: {
    u1: { id: 'u1', owner: 'P1', pos: { x: 2, y: 0 }, ma: 3 },
    u2: { id: 'u2', owner: 'P2', pos: { x: 2, y: 9 }, ma: 3 },
  }
};

const actionProcessors: Record<Action, (state: GameState, playerId: string, args: unknown) => ProtocolResponse> = {
  [Action.Move]: (state, playerId, args) => {
    const { unitId, pos } = args as { unitId: string; pos: { x: number; y: number } };
    return submitAction(state, playerId, { type: 'move', unitId, pos });
  },
};

function validateRequest(body: unknown, players: string[]): ProtocolRequest | null {
  if (typeof body !== 'object' || body === null) return null;
  const b = body as Record<string, unknown>;
  if (typeof b.playerId !== 'string' || !players.includes(b.playerId)) return null;
  if (!Object.values(Action).includes(b.action as Action)) return null;
  if (!(b.action as Action in actionProcessors)) return null;
  return { playerId: b.playerId, action: b.action as Action, arguments: b.arguments };
}

app.get("/state", (req: Request, res: Response) => {
    res.json({
      state: gameState,
      events: [],
    });
});

app.post("/action", (req: Request, res: Response) => {
  const request = validateRequest(req.body, gameState.players);
  if (request === null) {
    const response: ProtocolResponse = {
      state: gameState, events: [], errors: [ProtocolError.InvalidRequest], end_turn: false,
    };
    res.json(response);
    return;
  }

  let result: ProtocolResponse;
  try {
    result = actionProcessors[request.action](gameState, request.playerId, request.arguments);
  } catch {
    result = { state: gameState, events: [], errors: [ProtocolError.InvalidArguments], end_turn: false };
  }

  gameState = result.state;
  res.json(result);
});

app.listen(PORT, () => {
  console.log("Server running on port 3000");
});