---
name: doc-logging
description: Automatically maintain living documentation with every code change. Use this skill after completing ANY task that modifies code, configuration, or project structure. This includes new features, bug fixes, refactors, dependency changes, config updates, deployment changes, and infrastructure modifications. Trigger this skill whenever files are created, edited, or deleted — even small changes. The only exceptions are typo-only fixes, changes to the log files themselves, and .env/secret changes. This skill should fire on every meaningful commit.
---

# Documentation Logging Skill

## Purpose

Maintain a living record of every engineering decision, code change, and system state so the developer always has a clear picture of what changed, why, and what the codebase looks like right now. These logs serve as private developer reference, interview prep material, and debugging history.

## Rules — Apply After EVERY Set of Changes

After completing any task that modifies code, configuration, or project structure, APPEND to both files below. These are append-only logs — never overwrite or delete existing content.

These files are LOCAL-ONLY and gitignored. Do not `git add` them or include them in commits. They exist solely for the developer's private reference.

## File 1: docs/CHANGELOG_SPRINT.md

Append an entry in this exact format:

```markdown
---

### [SHORT_TITLE_OF_CHANGE]
**Timestamp:** [YYYY-MM-DD HH:MM UTC]
**Commit:** `[commit message using conventional format]`
**Files Changed:** [list of files added/modified/deleted]

**What Changed:**
[2-3 sentences on what was built, fixed, or modified]

**Engineering Rationale:**
[Why this approach was chosen. What tradeoffs were considered. What was rejected and why. Be specific — this is interview prep material.]

**Impact:**
[What this unlocks, fixes, or unblocks]
```

## File 2: docs/CODEBASE_AUDIT.md

Append a new section or update an existing one. Organized by component:

```markdown
## [COMPONENT_NAME] (updated [YYYY-MM-DD])

**Location:** [file paths]
**Purpose:** [what it does in plain language]
**Dependencies:** [what it imports/requires/calls]
**Exposes:** [what other components use from it]
**Status:** [working | in-progress | stubbed | broken]
**Notes:** [gotchas, known issues, TODOs, edge cases discovered]
```

If a component already has a section, UPDATE it in place. Do not create duplicate sections.

## Commit Messages

Use conventional commits: `type(scope): description`

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `build`, `deploy`

Scopes should match your project's architecture (e.g., `api`, `frontend`, `auth`, `db`, `deploy`, `docs`).

## When NOT to Log

- Typo or formatting-only fixes
- Changes to the log files themselves
- `.env` or secret-related changes
- Running scripts without modifying code

## Setup

On first use, create both files if they don't exist:

```bash
mkdir -p docs
touch docs/CHANGELOG_SPRINT.md docs/CODEBASE_AUDIT.md
```

Add to `.gitignore`:

```
docs/CHANGELOG_SPRINT.md
docs/CODEBASE_AUDIT.md
```
