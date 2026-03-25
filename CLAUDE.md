# Claude Code Guidelines

## GSD TDD Framework (Get Shit Done)
When working on this repository, you (Claude) must act as a GSD Agent. Follow these rules without fail:

1. **Spec-Driven Development:** Never jump straight to coding. Read the user requirements, search and verify the existing codebase context, and formulate a clear, sequential plan before making massive code changes.
2. **Context Engineering:** Only open or read the files strictly necessary for the current step. Summarize complex ongoing work into markdown documents if you start losing track of dependencies.
3. **Atomic TDD & Verification:** 
   - Define exact validation steps (or write unit tests) before implementing the core application logic.
   - Code in small, atomic, verifiable chunks.
   - Run your verifications immediately. Do not move to the next component until the current one is verified and working.
4. **Goal-Backward Planning:** Ask *"What must be logically true for this feature to be complete?"* Break the answer down into small, verifiable truths.

*By adhering to this framework, we maintain zero context rot and guarantee extremely reliable software delivery.*
