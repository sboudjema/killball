# SPEC: <Name>

Version: v0
Status: draft

---

## 1. Purpose

One sentence describing what this system does.

Example:
Defines how a unit moves from one tile to another.

---

## 2. Entities

Define only what is strictly necessary.

Example:

Unit:

* id
* position (x, y)
* team

Grid:

* width
* height
* tiles

Tile:

* position (x, y)
* occupied_by (unit_id | null)

---

## 3. Inputs

List all required inputs.

Example:

* unit_id
* target_position (x, y)
* game_state

---

## 4. Preconditions (Validation Rules)

All conditions that MUST be true before execution.

Example:

* Unit MUST exist
* Target tile MUST be within grid bounds
* Target tile MUST be empty
* Target tile MUST be adjacent (Manhattan distance = 1)

---

## 5. Process

Step-by-step execution. No gaps, no implicit steps.

Example:

1. Retrieve unit from game_state
2. Remove unit from current tile
3. Assign unit to target tile
4. Update unit.position to target_position

---

## 6. Outputs

What the system returns.

Example:

* updated_game_state
* result: SUCCESS

---

## 7. Failure Cases

Explicit failure conditions.

Example:
IF target tile is occupied:
RETURN FAILURE

IF target is not adjacent:
RETURN FAILURE

---

## 8. Side Effects

List all state changes.

Example:

* Updates grid occupancy
* Updates unit position

---

## 9. Invariants

Conditions that MUST always remain true.

Example:

* A tile MUST contain at most one unit
* A unit MUST occupy exactly one tile

---

## 10. Example

Concrete example of input → output.

Example:
Input:

* unit at (2,2)
* target (3,2)

Result:

* unit moves to (3,2)
* tile (2,2) becomes empty
