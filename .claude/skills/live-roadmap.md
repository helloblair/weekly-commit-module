---
name: live-roadmap
description: Generate a live, auto-updating project roadmap system. Creates an interactive HTML dashboard (roadmap.html), a progress data store (progress.json), a Python tracker API (progress_tracker.py), an automated codebase scanner (sync_roadmap.py), and optionally a GitHub Actions CI workflow. Use when the user wants to set up milestone tracking, a visual roadmap, or a live progress dashboard for any project. Trigger on "roadmap", "milestone tracker", "progress dashboard", or "live roadmap".
---

# Live Roadmap Skill

## Purpose

Generate a complete, self-updating project roadmap system tailored to the current project. The system tracks milestones across project phases, renders an interactive HTML dashboard, and auto-syncs progress by scanning the codebase for evidence of completion.

## How It Works

When invoked, follow these steps **in order**:

### Step 1 — Analyze the project

Read the project's structure, README, package files, config files, and any existing documentation to understand:

- **Project name** — from package.json, pyproject.toml, Cargo.toml, go.mod, README, or the directory name
- **Project description** — a one-line summary of what the project does
- **Tech stack** — languages, frameworks, databases, deployment targets
- **Existing structure** — what directories and key files already exist
- **Project goals** — what the project is trying to accomplish (from README, docs, or ask the user)

### Step 2 — Design phases and milestones

Based on the analysis, create **4-8 phases** with **5-15 milestones each**. Phases should follow the natural progression of the project. Common phase patterns (adapt to the project):

- **Foundation** — repo, scaffolding, deployment, database setup
- **Core Logic / Pipeline / Engine** — the main business logic or processing pipeline
- **API / Backend** — endpoints, validation, error handling
- **Scale / Performance** — batch processing, optimization, load handling
- **Frontend / UI** — pages, components, navigation, theming
- **Integration** — connecting services, external APIs, auth
- **Testing / Quality** — unit tests, integration tests, CI
- **Documentation / Delivery** — README, docs, demo, release

Each milestone needs:
- A **step_id** — snake_case identifier (e.g., `api_health_endpoint`)
- A **display name** — human-readable description (e.g., "GET /health — service status endpoint")
- A **detection rule** — how to automatically detect completion (file exists, file contains pattern, directory has N files)

Present the proposed phases and milestones to the user for approval before generating files. Ask if they want to add, remove, or modify anything.

### Step 3 — Generate the files

Create the following files. Place them relative to the project root:

#### 3a. `docs/progress.json`

The progress data store. Initialize with any milestones that are already complete based on the current state of the codebase.

```json
{
  "completed": {
    "step_id": "ISO-8601 timestamp",
    "another_step": "ISO-8601 timestamp"
  },
  "last_updated": "ISO-8601 timestamp"
}
```

Run the detection rules against the current codebase to pre-populate completed steps.

#### 3b. `docs/roadmap.html`

A single-file interactive HTML dashboard. Key requirements:

- **No external dependencies** except Google Fonts (JetBrains Mono)
- **Dark theme** with neon accent colors (one color per phase)
- **Color palette**: use CSS variables for theming:
  ```css
  --green: #00FF94; --orange: #FF6B35; --purple: #A855F7;
  --cyan: #06B6D4; --amber: #F59E0B; --pink: #EC4899;
  --red: #EF4444; --bg: #0A0A0A; --surface: #111111;
  --border: #1F1F1F; --text: #E5E5E5; --muted: #555555;
  ```
- **Header section** with:
  - Pulsing green "LIVE" indicator dot
  - Project name as h1 with gradient text
  - Project subtitle/description
  - "Last updated" timestamp
  - Overall progress bar (green-to-cyan gradient)
  - Collapsible "How this works" info panel
- **Tab navigation** with these views:
  1. **Phases** — 3-column grid of phase cards, each with:
     - Phase number + name + color accent
     - Status badge (upcoming / current / complete)
     - Progress bar with count (e.g., "8/11")
     - Click to expand step checklist
     - Completed steps: strikethrough + colored checkmark
     - Pending steps: grey circle
     - Flash animation when a step newly completes
  2. **Data Flow** — visual pipeline diagram showing how data moves through the system (customize nodes/connections to the project's actual architecture)
  3. **Stack** — technology breakdown with deployment targets and cost estimates
- **Auto-refresh**: polls `progress.json` every 5 seconds with cache-busting query param
- **Flash animation** on newly completed steps (green glow that fades)
- **Auto-expand** phase cards when steps complete during polling

Use the project name in the HTML `<title>` and header badge.

Adapt the tab content to what makes sense for the project:
- If the project has a multi-step pipeline/workflow, include a **Data Flow** tab
- If the project has scope versions or milestones, include a **Scope Map** tab
- If the project has known gaps/blockers, include a **Gap List** tab
- Always include **Phases** and **Stack** tabs

The HTML must define a `PHASES` JavaScript array matching the phases designed in Step 2, and use it to dynamically render phase cards and track progress.

#### 3c. `scripts/progress_tracker.py`

A Python module for programmatic milestone tracking:

```python
"""
progress_tracker.py — call mark_complete("step_id") from anywhere in your code.
"""
import json
from datetime import datetime
from pathlib import Path

PROGRESS_FILE = Path(__file__).parent.parent / "docs" / "progress.json"

STEPS = {
    # Phase 1 — Phase Name
    "step_id": {"phase": 1, "name": "Display name"},
    # ... all milestones
}

def _load() -> dict: ...
def _save(state: dict): ...
def mark_complete(step_id: str): ...
def get_progress() -> dict: ...
```

Requirements:
- `STEPS` dict maps every step_id to its phase number and display name
- `mark_complete(step_id)` — marks a step done with timestamp, prints confirmation
- `get_progress()` — returns summary with total, completed, percent, by_phase breakdown
- `_load()` creates the file with any bootstrap steps if it doesn't exist
- `_save()` auto-updates `last_updated` timestamp
- Include a `__main__` block that prints a progress bar summary
- **BOOTSTRAP_COMPLETE** list — any steps that are already done at project start

#### 3d. `scripts/sync_roadmap.py`

An automated codebase scanner:

```python
"""
sync_roadmap.py — scans codebase for evidence of completed milestones.
    python scripts/sync_roadmap.py          # dry-run
    python scripts/sync_roadmap.py --apply  # writes progress.json
"""
```

Requirements:
- `RULES` dict mapping step_id to a lambda/callable that returns True when detectable
- Three helper functions:
  - `_file_exists(*parts)` — checks if a file exists relative to project root
  - `_file_contains(path, pattern)` — regex search in file contents
  - `_dir_has_files(path, glob, min_count)` — checks directory for matching files
- `sync(apply=False)` — runs all rules, returns newly completed vs already complete
- Dry-run mode by default, `--apply` flag to write changes
- Print a summary: rules checked, already complete, newly detected

Detection rules should be specific and meaningful. Examples:
- File existence: `lambda: _file_exists("backend", "main.py")`
- Pattern in file: `lambda: _file_contains("backend/main.py", r'@app\.get\("/health"')`
- Directory contents: `lambda: _dir_has_files("tests", "test_*.py", min_count=3)`

#### 3e. `.github/workflows/sync-roadmap.yml` (optional — ask user)

GitHub Actions workflow that auto-syncs on push to main:

```yaml
name: Sync Roadmap
on:
  push:
    branches: [main]
permissions:
  contents: write
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - name: Sync roadmap progress
        run: python scripts/sync_roadmap.py --apply
      - name: Commit if changed
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git diff --quiet docs/progress.json && exit 0
          git add docs/progress.json
          git commit -m "chore: auto-sync roadmap progress [skip ci]"
          git push
```

### Step 4 — Initial sync

Run `python scripts/sync_roadmap.py --apply` to detect and record any milestones that are already complete in the current codebase.

### Step 5 — Confirm and instruct

Tell the user:

1. What files were created
2. How many milestones were pre-detected as complete
3. How to view the roadmap locally:
   ```
   python3 -m http.server 8888
   # Open http://localhost:8888/docs/roadmap.html
   ```
4. How to mark milestones programmatically:
   ```python
   from scripts.progress_tracker import mark_complete
   mark_complete("step_id")
   ```
5. How to run the auto-sync manually:
   ```
   python scripts/sync_roadmap.py --apply
   ```

## Rules

- **Always analyze the project first.** Never generate a generic roadmap — every phase, milestone, and detection rule must be specific to the actual project.
- **Get approval on the phase plan.** Present the proposed phases and milestones before generating files. The user knows their project better than you do.
- **Pre-populate progress.** Run detection rules against the current codebase so the roadmap starts with an accurate snapshot.
- **One HTML file, zero build tools.** The roadmap must be a single self-contained HTML file with inline CSS and JS. No npm, no bundler, no framework.
- **Meaningful detection rules.** Every rule should check for something specific — a file that only exists when the feature is built, a pattern that only appears when the feature is wired up. Avoid rules that are trivially true.
- **Adapt the dashboard tabs** to what makes sense for the project. Not every project needs a Data Flow diagram or Scope Map.
- **Do not overwrite existing files.** If `docs/roadmap.html` or `docs/progress.json` already exists, ask before replacing.
