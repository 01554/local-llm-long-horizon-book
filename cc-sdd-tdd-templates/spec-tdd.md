---
description: Write tests for a spec task (TDD red phase)
---

<meta>
description: Write tests for a spec task before implementation
argument-hint: <feature-name:$1> [task-number:$2]
arguments: {{args}}
</meta>

# Test Writer (TDD Red Phase)

<instructions>
## Core Task
Write tests ONLY for task **$2** of feature **$1**. Do NOT write implementation code.

## Execution Steps

### Step 1: Load Context
Read the following files to understand what to test:
- `.kiro/specs/$1/spec.json`, `requirements.md`, `design.md`, `tasks.md`
- Any existing `src/*.ts` files (to understand available interfaces and types)

### Step 2: Write Tests
Based on the task description, requirements, and design:
- Create or append to a test file that verifies the expected behavior of task $2
- Use only Node.js built-in `assert` module (import from 'node:assert') for assertions
- Each test should print a clear PASS or FAIL message
- Tests should be runnable from the command line
- Tests should import/reference the modules described in the design

## Constraints
- Write ONLY test code. Do NOT create or modify implementation files.
- Keep tests focused on task $2's scope
- Tests should reflect the interfaces and contracts defined in design.md
- **Test file naming**: Create the test as `test_task$2.ts` in the project root directory. Do NOT create subdirectories for tests.
- **No external dependencies**: Do NOT use jest, mocha, vitest, or any npm package. Use only Node.js built-in `assert` module (`import assert from 'node:assert'`) and manual print PASS/FAIL.
- **No config files**: Do NOT create package.json, tsconfig.json, or any configuration files.
- **Run with**: `node --experimental-strip-types test_task$2.ts`
- **Randomness**: If the task involves random/probabilistic behavior, use statistical tests. Run the operation N times (e.g., 100) and assert the result falls within an acceptable range. Do NOT use `assert(true)` as a fallback for probabilistic outcomes.
- **Import paths**: Use ESM imports with `.js` extension (e.g., `import { Field } from './src/field.js'`). This is required for Node.js ESM with --experimental-strip-types. The actual files are `.ts` but imports must use `.js`.
- **Public API only**: Tests MUST only access public methods and properties. Do NOT access private members (names starting with `_`). Use public getters instead.
- **Constructor signatures**: Follow the exact constructor signatures defined in design.md. Do NOT add extra parameters not specified in the design.
</instructions>

## Output
Brief summary of what tests were written and what behavior they verify.

arguments: {{args}}
