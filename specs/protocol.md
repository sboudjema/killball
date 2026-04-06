# SPEC: PROTOCOL

Version: v0
Status: draft

---

## 1. Purpose

Defines how the server and the client communicate

---

## 2. Entities

Request:
* player id
* action (enum)
* arguments

Response:
* game state
* events
* errors
* end_turn: bool

---

## 3. Inputs

* request

---

## 4. Preconditions (Validation Rules)

* request.playerId MUST be a player id present in state.players
* request.action MUST be a valid action (as defined by Action enum)
* request.action MUST be associated to a "processAction" kind of method

---

## 5. Process

1. Validate request
2. Process action
3. Return response

---

## 6. Outputs

* response

---

## 7. Failure Cases

IF request IS NOT valid:
RETURN response with error "INVALID_REQUEST" (does not end turn)

IF processAction RAISES an error:
RETURN response with error "INVALID_ARGUMENTS" (does not end turn)

---

## 8. Side Effects

None

---

## 9. Invariants

None

---

## 10. Example

Request:

* "P1"
* "MOVE"
* (3, 2)

Response:

* state: new state
* errors: []
* end_turn: true
