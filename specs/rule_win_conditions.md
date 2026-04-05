# SPEC: SCORING

Version: v0
Status: draft

---

## 1. Purpose

Defines how points are scored.

---

## 2. Entities


* End zone (property of the implicit grid)
  * player 1: the first row of the grid
  * player 2: the last row of the grid

* Score (property of game state)
  * player 1: number
  * player 2: number

---

## 3. Inputs

gameState

---

## 4. Preconditions (Validation Rules)

---

## 5. Process

Given game state:

  * if a unit is the opposing end zone:
    * increment score of owning player by 1

---

## 6. Outputs

gameState with udpated scores

---

## 7. Failure Cases


---

## 8. Side Effects

None

---

## 9. Invariants

Scores MUST be positive or zero
Scores MUST be incremented by 1 at a time
Scores CANNOT decrease

---

## 10. Example

Input:

* P1 submits action
* Action processed, new state returned
* unit "a1" belonging to player "P1" is in the "P2" end zone

Result:

* Score of P1 is incremented by one
