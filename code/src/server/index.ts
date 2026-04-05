import express,  { Request, Response } from "express";
import { processAction } from "../engine/processAction";
import { GameState, TurnState, Action, ProtocolRequest, ProtocolResponse, ProtocolError } from "../engine/types"
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
    a1: { id: 'a1', owner: 'P1', pos: { x: 2, y: 0 }, initialPos: { x: 2, y: 0 }, ma: 3 },
    a2: { id: 'a2', owner: 'P1', pos: { x: 3, y: 0 }, initialPos: { x: 3, y: 0 }, ma: 3 },
    a3: { id: 'a3', owner: 'P1', pos: { x: 4, y: 0 }, initialPos: { x: 4, y: 0 }, ma: 3 },
    b1: { id: 'b1', owner: 'P2', pos: { x: 2, y: 9 }, initialPos: { x: 2, y: 9 }, ma: 3 },
    b2: { id: 'b2', owner: 'P2', pos: { x: 3, y: 9 }, initialPos: { x: 3, y: 9 }, ma: 3 },
    b3: { id: 'b3', owner: 'P2', pos: { x: 4, y: 9 }, initialPos: { x: 4, y: 9 }, ma: 3 },
  },
  score: { P1: 0, P2: 0 },
};

function validateRequest(body: unknown, players: string[]): ProtocolRequest | null {
  if (typeof body !== 'object' || body === null) return null;
  const b = body as Record<string, unknown>;
  if (typeof b.playerId !== 'string' || !players.includes(b.playerId)) return null;
  if (!Object.values(Action).includes(b.action as Action)) return null;
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
    result = processAction(gameState, request.playerId, request.action, request.arguments);
  } catch {
    result = { state: gameState, events: [], errors: [ProtocolError.InvalidArguments], end_turn: false };
  }

  gameState = result.state;
  res.json(result);
});

app.listen(PORT, () => {
  console.log("Server running on port 3000");
});