---
name: Get Shit Done (GSD) TDD Framework
description: Skill for strict Spec-Driven Development, Context Engineering, and Atomic TDD cycles. Prevents context rot and ensures atomic, verified features.
---

# Get Shit Done (GSD) TDD Framework

When implementing complex features using this skill, you must **strictly** follow this methodology to avoid context degradation ("context rot") and ensure reliable code delivery.

## 1. Spec-Driven Development (Planning Phase)
- **DO NOT write application code first.**
- Thoroughly research the codebase first using your tools (`grep_search`, `list_dir`, etc).
- Write a highly detailed specification inside the agent's task file (`task.md`) or a `docs/` markdown file.
- Validate the technical design and plan with the user *before* proceeding.

## 2. Context Engineering
- Maintain a clean context window. Only read the files strictly necessary.
- If the implementation is very complex, summarize the ongoing state into a new artifact (e.g., `PROJECT_CONTEXT.md` or a walkthrough) to organize your thoughts.
- Use surgical file reads. Never load giant files if you only need a specific chunk.

## 3. Atomic TDD Execution Phase (The "GSD" Engine)
- **Goal-Backward Planning:** Always ask yourself *"What must be TRUE for this goal to be achieved?"* and break it down into verifiable micro-truths.
- **Verification First:** Plan how you will verify each micro-truth (e.g., automated tests, strict manual browser checks, or logging) BEFORE writing the complex feature.
- **Atomic Commits/Changes:** Make single, focused changes. Do not rewrite large chunks of files at once unless absolutely necessary.
- **Aggressive Verification:** Run tests or validation code *immediately* after every atomic change. If it breaks, fix it before moving on. **Never accumulate unverified code.**

## 4. Final Review
- At the end of the feature, create or update a walkthrough artifact to document the final state and confirm all micro-truths were verified.
