import express,  { Request, Response } from "express";
import { processMove } from "./game/move";
import { GameState } from "./game/types"
const app = express();
const PORT = 3000

app.use(express.json());
app.use(express.static("client"));

let gameState: GameState = {
  currentPlayer: 'P1',
  units: {
    u1: { id: 'u1', owner: 'P1', x: 0, y: 0, ma: 3 },
    u2: { id: 'u2', owner: 'P2', x: 3, y: 3, ma: 3 },
  }
};

app.get("/state", (req: Request, res: Response) => {
    res.json({
      state: gameState,
      events: [],
    });
});

app.post("/move", (req: Request, res: Response) => {
  try {
    const { unitId, x, y } = req.body;
    const resp = processMove(gameState, unitId, x, y);
    gameState = resp.state
    res.json(resp);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port 3000");
});