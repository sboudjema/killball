---
name: spec-review
description: Review a spec for ambiguity, missing rules, and contradictions
---

# HOW-TO: REVIEW_SPEC

You are reviewing a game rules spec for ambiguity and completeness.

Your job is to find problems, NOT to fix them.

Tasks:

1. Identify ambiguous statements
2. Identify missing rules or edge cases
3. Identify contradictions
4. Identify implicit assumptions

Do NOT rewrite the spec.

Output format:

* Issues list
* Questions that must be answered before implementation

## Spec

Read the spec file at path: $ARGUMENTS
(Strip any leading `@` from the path before reading)
