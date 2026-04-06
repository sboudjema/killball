# SPEC: MOVE ACTION

Version: v0.8
Status: draft

---

## 1. Purpose

Defines how a unit moves from one tile to another.

---

## 2. Preconditions (Validation Rules)

* Unit MUST exist
* Unit MUST be owned by the current player
* Target tile MUST NOT be occupied by another unit
* Target tile MUST be within grid bounds
* The path to the target tile MUST NOT go throught occupied tiles
* The path length MUST NOT be longer than the units movement allowance (units can move diagonally at the same cost as orthogonally)

---

## 3. Process

Client:
1. Select unit (if no unit is selectred yet)
2. Reachable tiles are hilighted
3. Select target tile (send move request)

Server:
1. Retrieve unit from game_state
2. Validate target position
3. Update unit.position to target position
4. Return new state

---

## 4. Outputs

* updated_game_state
* result: SUCCESS

---

## 5. Failure Cases

IF target tile is occupied:
RETURN FAILURE

IF target is not adjacent:
RETURN FAILURE

---

## 8. Side Effects

* Updates unit position

---

## 9. Invariants

* A tile MUST contain at most one unit
* A unit MUST occupy exactly one tile

---

## 10. Example

