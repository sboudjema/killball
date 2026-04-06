---
name: test-spec
description: Write engine tests for a spec following the project test model
---

# HOW-TO: TEST_SPEC

You are validating a deterministic rules engine.

Follow the spec EXACTLY.

Preliminary tasks:

* Run /review-spec on the target spec before writing tests

Constraints:

* Do NOT add features not present in the spec
* Do NOT assume unspecified behavior
* If something is unclear, list questions instead of guessing
* Tests MUST target the pure engine (no HTTP, no UI, no side effects)
* Prefer minimal, readable test cases

Test Model:

All tests MUST follow:

processAction(state, action) -> newState

---

Requirements:

1. Write STATE → ACTION → EXPECTED_STATE tests

Each test MUST:
* define an explicit initial state
* define a single action
* assert the full resulting state OR the relevant subset

---

2. Cover three categories:

A. Valid cases
* expected successful transitions

B. Invalid cases
* each violated precondition MUST produce a test
* assert explicit failure (error / rejection)

C. Edge cases
* boundary conditions (e.g. limits, adjacency, empty states)

---

3. Add invariant checks

For each test, assert key invariants such as:
* no two units share the same position
* values remain within allowed ranges (e.g. HP ≥ 0, score ≥ 0)
* ownership consistency

---

4. Use a minimal test DSL

Prefer helpers like:

state({...})
unit(id, player, position)
move(unitId, target)

Avoid large raw JSON blobs.

---

5. Keep tests atomic

* One behavior per test
* Avoid multi-step sequences unless explicitly required

---

6. Add at least one sequence test

Define a short sequence of actions and assert final state:

runSequence([action1, action2, ...])

Use this to validate interaction between rules.

---

7. Output format

* Test cases only
* No implementation code
* No explanations unless something is ambiguous

---

After writing tests:

* List any ambiguities or missing rules in the spec
* List invariants that could NOT be verified due to missing information

$ARGUMENTS
