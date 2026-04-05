# SPEC: Turn Structure

Version: v0
Status: draft

---

## 1. Purpose

Defines the flow of a player turn as a finite state machine.

---

## 2. Entities

Player:
* id: unique player identifier

Turn (a property of the game state):
* player: player id (the player who's turn it currently is)
* state: the state of the turn
---

## 3. FSM

States:
* WAITING_FOR_ACTION
* RESOLVING

Transitions:

* WAITING_FOR_ACTION:
  * ON: SUBMIT_ACTION
    IF: player is not currentPlayer
    DO: reject("NOT_YOUR_TURN")
    NEXT: WAITING_FOR_ACTION

* WAITING_FOR_ACTION:
  * ON: SUBMIT_ACTION
    IF: player is currentPlayer
    DO: process action / get result
    NEXT: RESOLVING 

* RESOLVING:
  * ON: RESOLUTION_COMPLETE
    IF: result.end_turn
    DO: switch current player
    NEXT: WAITING_FOR_ACTION
---

## 4. Preconditions (Validation Rules)

* Players MUST alternate turns
* The game MUST track a current player
* An action MUST be rejected if it is not submitted by the current player

---

## 5. Process

Step-by-step execution. No gaps, no implicit steps.

1. Process user input
2. Resolve next turn state based on process output
3. Return game state with updated turn state

---

## 6. Outputs

* new_game_state

---

## 7. Failure Cases

IF submitted action IS NOT valid
RETURN FAILURE

---

## 8. Side Effects

* Updates game state turn property

---

## 9. Invariants

* current player MUST always be defined

