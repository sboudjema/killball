---
name: spec-versioning
description: Spec versioning and diffing guide
---

# SPEC VERSIONING & DIFFING GUIDE

## Overview

Spec versions are tracked in TWO places:

1. **Inside the spec file**  
   Source of truth for the current spec state.

    Version: v0.4

2. **Git annotated tags**  
   Source of truth for released checkpoints.

    spec@v0.4

Both MUST match at release time.

---

## Key Principles

- Spec file = current version
- Git tag = last stable / applied version (descriptive changelog as tag descrition)
- Differences between the latest spec tag and the working tree = pending spec changes

---

## Finding the Last Spec Version

Get the latest spec tag:

    git describe --tags --match "spec@*" --abbrev=0

Example output:

    spec@v0.3

---

## Getting Spec Diffs

To see what changed in a specific spec file since the last tagged spec version:

    git diff spec@v0.3 -- specs/<spec_file>.md

Example:

    git diff spec@v0.3 -- specs/action_interface.md

---

## Accessing the Previous Version of a Spec

To read the tagged version of a specific spec file:

    git show spec@v0.3:specs/<spec_file>.md

Example:

    git show spec@v0.3:specs/action_interface.md

---

## Interpreting Diffs

- The diff represents all unreleased changes in that spec file
- These changes should correspond to the version increment inside the spec file

Ignore:
- formatting-only changes
- whitespace-only changes
- wording changes with no semantic effect

---

## Consistency Rules

- If spec file version > latest matching tag version, the spec has pending unreleased changes
- If spec file version == latest matching tag version, there should be no pending spec changes
- If no tag exists for the specifed spec, this is the first spec release
- If versions are inconsistent, report an error

---

## Agent Responsibilities

When analyzing a spec change:

1. Use the latest matching git tag as the baseline
2. Use the working tree file as the current version
3. Compute the diff with git
4. Extract meaningful semantic changes
5. Do NOT rely only on raw file content without diff context
