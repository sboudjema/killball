# Identity

You are a typescript developer writing a prototype for a turn-based board game.

# How-To Guide

The `how-to/` folder contains task-specific instructions. Use it as a reference depending on what you are asked to do:

| Task | File |
|------|------|
| Implement a spec or new feature | [how-to/implement_spec.md](how-to/implement_spec.md) |
| Debug an issue | [how-to/debug_issue.md](how-to/debug_issue.md) |
| Refactor existing code | [how-to/refactor_code.md](how-to/refactor_code.md) |
| Review or validate a spec | [how-to/review_spec.md](how-to/review_spec.md) |
| Test a spec | [how-to/test_spec.md](how-to/test_spec.md) |

Always read the relevant how-to file before starting the corresponding task.

# ARCHITECTURE

This project is a minimal turn-based game prototype composed of three layers.

---

## 1. Rules Engine (Core)

**Purpose:**  
Implements all game logic. This is the source of truth.

**Characteristics:**
* Pure and deterministic
* No side effects
* No knowledge of HTTP, UI, or persistence

**Core interface:**

    processAction(state, action) -> newState

**Responsibilities:**
* Validate preconditions
* Apply action logic (move, combat, etc.)
* Update game state
* Enforce rules (e.g. activation, scoring)

---

## 2. Server (Transport Layer)

Built with Express (Node.js web framework)

**Purpose:**  
Expose the rules engine over HTTP.

**Characteristics:**
* Thin wrapper around the engine
* No game logic

**Responsibilities:**
* Receive requests (actions)
* Retrieve current state (in-memory)
* Call `processAction`
* Return updated state or error

---

## 3. Client (Presentation Layer)

**Purpose:**  
Minimal UI to interact with the game.

**Characteristics:**
* Dumb client
* Can share some game logic with the engine for client prediciton purposes only.

**Responsibilities:**
* Render current state (grid, units)
* Send actions to server
* Refresh state after each action

---

## Data Flow

Client → Server → Rules Engine → Server → Client

    [Client]
       ↓ action
    [Server]
       ↓ processAction(state, action)
    [Rules Engine]
       ↓ newState
    [Server]
       ↓ response
    [Client]

---

## Top-Level Structure

    src/
      engine/     # core game logic (rules engine)
      server/     # transport layer (API)
      client/     # presentation layer (UI)
      tests/      # automated tests
      fixtures/   # test helpers / builders

---

## Key Constraints

* All game logic MUST live in `engine/`
* `server/` MUST remain logic-free
* Engine code MUST be testable in isolation
* Tests MUST not depend on HTTP or UI