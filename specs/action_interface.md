# SPEC: ACTION_INTERFACE
Version: v0
Status: draft

---

## 1. Purpose

Defines how actions are processed by the engine, including:
- action dispatch
- requirement resolution
- parameter injection
- deterministic execution

---

## 2. Core Principle

Action execution MUST be deterministic.

- No randomness inside action execution
- All randomness MUST be resolved before execution
- Resolved values MUST be injected into the action parameters

---

## 3. Entities

### Action

Represents an intent issued by a player.

    Action:
    - type (enum)
    - params (object)

### ActionDefinition

Defines how a specific action behaves.

    ActionDefinition:
    - requires (array of Requirement)
    - execute(state, params) => Result

### Requirement

Represents an external value that must be resolved before execution.

Examples:
- D6
- D6_PAIR
- MODIFIER

### ResolvedContext

Container for values resolved by the engine before action execution.

    ResolvedContext:
    - key-value map

Example:

    {
      roll: 4
    }

---

## 4. Process

## 4.1 processAction(actionType, params)

The engine MUST process an action using the following steps.

### Step 1 — Retrieve ActionDefinition

- Read `action.type`
- Lookup the corresponding `ActionDefinition`

### Step 2 — Read Requirements

- Read `definition.requires`
- This list declares which values must be resolved before execution

Example:

    requires: [D6]

### Step 3 — Resolve Requirements

- For each requirement, the engine MUST call the corresponding resolver
- The resolved values MUST be stored in a temporary resolved context

Example:

    D6 -> { roll: 4 }

### Step 4 — Inject Resolved Values

- The engine MUST merge:
  - action.params
  - resolved values

Example:

    finalParams = {
      ...action.params,
      ...resolvedContext
    }

### Step 5 — Execute Action

- The engine MUST call:

    definition.execute(state, finalParams)

- The action execution MUST use only the provided inputs
- The action execution MUST NOT generate randomness

---

## 5. Requirement Resolution

### Rule

- Each requirement type MUST have an engine-owned resolver
- Action definitions MUST declare requirements explicitly
- The engine MUST NOT infer requirements from function signatures

### Examples

    D6      -> { roll: 4 }
    D6_PAIR -> { rollA: 2, rollB: 5 }

---

## 6. Determinism Rules

The following are forbidden inside `execute`:

- dice rolling
- `Math.random()`
- any other non-deterministic behavior

---

## 7. Examples

### MoveAction

    requires: []

    execute(state, params)

Behavior:
- deterministic
- uses only input params

### AttackAction

    requires: [D6]

    execute(state, params)

Behavior:
- `params.roll` is guaranteed to exist
- combat resolution uses injected roll value

---

## 8. Outputs

    Result:
    - success (bool)
    - state (updated state)
    - events (optional)

---

## 9. Failure Cases

- Unknown action type -> REJECT
- Missing ActionDefinition -> ERROR
- Missing resolver for declared requirement -> ERROR
- Missing injected parameter required by action logic -> ERROR

---

## 10. Invariants

- `processAction` MUST orchestrate execution only
- `processAction` MUST NOT contain concrete game rules
- `ActionDefinition` MUST declare its requirements explicitly
- All randomness MUST be resolved before `execute`
- `execute` MUST be deterministic

---

## 11. Reference Shape

    processAction(actionType, params):
      definition = getDefinition(action.type)
      resolvedContext = resolveRequirements(definition.requires)
      finalParams = merge(action.params, resolvedContext)
      return definition.execute(state, finalParams)

---

# CHANGELOG

## v0
- Initial definition of action processing pipeline
- Introduced explicit requirement declaration
- Introduced engine-side resolution and parameter injection
- Enforced deterministic action execution