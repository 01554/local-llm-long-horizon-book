---
description: Write and implement milestone integration tests
---

<meta>
description: Write integration tests and fix implementations for a milestone checkpoint
argument-hint: <feature-name:$1> [milestone-number:$2]
arguments: {{args}}
</meta>

# Milestone Integration Test

<instructions>
## Core Task
Write and run **integration tests** for milestone **$2** of feature **$1**.
These tests verify that multiple components work together correctly using **real objects** (no mocks).

## Execution Steps

### Step 1: Load Context
Read:
- `.kiro/specs/$1/requirements.md`, `design.md`, `tasks.md`
- All existing source files in `src/`
- The component assembly code in design.md Section 3 C10

### Step 2: Write Integration Tests
Create `test_milestone_$2.py` in the project root.

Rules:
- **Use REAL implementations only.** Do NOT create mock/stub/fake classes. Import directly from `src/`.
- Follow the assembly code in design.md Section 3 C10 to construct objects with correct arguments.
- Test **cross-component behavior**, not individual methods. For example:
  - "Player moves left, position changes, Player cannot move past wall" (Field + Player)
  - "Bullet fires, moves, hits enemy, splits, score increases" (BulletManager + EnemyManager + ScoreManager)
- Each test should print PASS or FAIL with a description.
- Use Python built-in `assert` statements.

### Step 3: Run Tests and Fix
- Run `python3 test_milestone_$2.py`
- If tests FAIL due to implementation bugs, fix the implementation files in `src/`.
- You may modify ANY `src/*.py` file to fix integration issues.
- Do NOT modify test files from other tasks (test_task*.py).
- After fixing, re-run to confirm all tests pass.

### Step 4: Verify No Regressions
- Run all existing task tests: for each `test_task*.py` file that exists, run it and confirm it still passes.
- If a fix broke an existing test, adjust the fix to be compatible.

### Step 5: Do NOT update tasks.md
- The automation script handles milestone completion tracking. Do NOT modify tasks.md checkboxes.

## Constraints
- **No mocks.** Every object must be a real instance from `src/`.
- **No external dependencies.** Python standard library only.
- **Import paths**: Use standard Python imports (e.g., `from src.field import Field`).
- **Run with**: `python3 test_milestone_$2.py`
- **Assembly code**: Follow design.md Section 3 C10 exactly for object construction.
- **Renderer/InputHandler**: Do NOT pass `stdscr` in tests. These components depend on curses and cannot be tested. Only test game logic components.
</instructions>

## Output
Brief summary: what integration tests were written, what issues were found and fixed, test results.

arguments: {{args}}
