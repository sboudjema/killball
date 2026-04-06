# SPEC: COMBAT

Version: v0.1
Status: draft

---

## 1. Purpose

Defines how two units can fight each other.

---

## 2. Entities

Units (attacker and defender)

---

## 3. Inputs

attacker: Unit
defender: Unit
roll: d6

---

## 4. Preconditions (Validation Rules)

Defender's position MUST be within attacker's range of movement
Defender MUST NOT be owner by the attacker's owner

---

## 5. Process

Client:
1. Select unit
2. Click opposing unit
3. If opposing unit in range: send attack(attacker, defender)

Server:
1. resolve roll(d6)
2. attacker moves to closest and most direct tile adjacent to defender (if not already adjacent)
3a. If roll >= 2:
  4. defender gets pushed back one tile opposit to the attacker
  5. attacker moves to defender's original position
3b. If roll == 1:
  4. nothing happens

---

## 6. Outputs

updated game state

---

## 7. Failure Cases

IF defender is not in range:
RETURN FAILURE

---

## 8. Side Effects


---

## 9. Invariants


---

## 10. Example

Concrete example of input → output.

Input:

* attacker u1 (at position (1,1))
* defender u2 (at position (3,3))

Result:

* u2 moves to (4,4)
* u1 moves to (3,3)

# CHANGELOG

## v0.1

* Attack result is now rpobabilistic (d6 roll)