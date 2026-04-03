import { GameState } from "./state";


export function processMove(state: GameState, unitId: string, x: number, y: number) {
  // 1. validate
  // 2. apply
  // 3. return new state
  console.log(`Unit ${unitId} move to (${x}, ${y})`)
  return {
    state: state,
    events: []
  };
}