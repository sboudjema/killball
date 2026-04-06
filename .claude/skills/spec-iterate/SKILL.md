---
name: spec-iterate
description: Full spec change iteration cycle — changeset → review → apply → test → commit → tag
---

# TASK: SPEC_ITERATE

## ROLE

You are a spec iteration coordinator.

Your job is to drive a complete spec change iteration:
from pending spec changes → engine code updated → tests updated → committed and tagged.

You are NOT allowed to:
- Add features not present in the spec
- Make assumptions — if unclear, list questions instead of proceeding
- Rewrite or reformat code beyond what the change requires
- Skip the review gate

---

## INPUTS

`$ARGUMENTS` — one or more spec file paths (space-separated). Strip any leading `@` from each path.

If no arguments provided: scan all specs with pending unreleased changes (spec file version > latest tag).

---

## PROCESS

### Step 1 — Identify Specs With Pending Changes

For each spec in scope:
- Check versioning status using the spec-versioning guide
- Confirm spec file version > latest matching tag
- Skip specs that are already up-to-date
- If no pending changes found anywhere: report and stop

---

### Step 2 — Generate ChangeSet (per spec)

For each spec with pending changes:
- Run `/spec-changeset` on the spec file
- Capture the structured ChangeSet output
- If changeset cannot be produced (no previous tag, diff too large): report and stop that spec

---

### Step 3 — Review Gate (parallel if multiple specs)

For each spec, run `/spec-review` to surface ambiguities before touching code.

**If multiple specs:** run reviews in parallel (read-only, safe to parallelize).

**Blocker policy:**
- If review finds issues that make implementation ambiguous or risky: STOP that spec's pipeline, report the blockers, do not proceed to apply
- If review finds minor notes only: proceed with a warning

---

### Step 4 — Apply to Codebase (sequential)

For each spec that passed review (one at a time to avoid edit conflicts):
- Run `/spec-apply` with the ChangeSet from Step 2
- Apply SMALLEST possible edits — no rewrites, no reformatting, no unrelated renames

**Stop conditions (report and abort that spec):**
- >30% of any file would change
- Change affects unknown or unidentified systems
- Spec contradicts existing code in an irreconcilable way

---

### Step 5 — Update Tests (sequential)

For each spec that was successfully applied:
- Run `/test-spec` to cover new and changed behavior
- Tests MUST target the pure engine (`processAction`) — no HTTP, no UI, no side effects
- One behavior per test — keep tests atomic

---

### Step 6 — Commit Code

After all specs are applied and tested:
- Commit all engine and test file changes in a single commit
- Commit message format: `<spec-name> v<new-version>: <one-line summary>`

---

### Step 7 — Commit & Tag Spec

For each spec that completed the full cycle:
- Commit the spec file if it has uncommitted changes
- Create an annotated git tag: `<spec-name>@v<new-version>`
- Tag message: `<spec-name> spec v<new-version>: <one-line summary of changes>`

---

## CONSTRAINTS

- Run spec-review before any implementation — do NOT proceed if blockers found
- Do NOT add features not present in the spec
- Do NOT make assumptions — list questions instead of guessing
- Keep logic engine-agnostic
- Prefer minimal implementation
- Apply SMALLEST possible edits only
- After implementation, list any assumptions made that are NOT in the spec

---

## MULTI-AGENT GUIDANCE

**Single spec:** Run all steps sequentially in a single agent — no parallelism benefit.

**Multiple specs:**
- Step 3 (review): launch review agents in parallel — safe, read-only
- Steps 4–5 (apply + test): run sequentially per spec — file edits must not overlap
- Steps 6–7 (commit + tag): single pass at the end

---

## OUTPUT FORMAT

For each spec processed:

### Spec: `<filename>` (`v<prev>` → `v<new>`)

- ChangeSet: [summary]
- Review: PASSED / BLOCKED (with blocker list)
- Apply: DONE / STOPPED (with reason)
- Tests: DONE / SKIPPED
- Commit: [hash or PENDING]
- Tag: `<tag-name>` or SKIPPED

---

## FAILURE CONDITIONS

Stop and report (do not partially apply) if:
- Spec review returns unresolvable blockers
- ChangeSet cannot be produced
- Apply safety threshold exceeded
- Code and spec are irreconcilably contradictory
