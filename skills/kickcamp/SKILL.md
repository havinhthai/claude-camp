---
name: kickcamp
description: Hand a requirements doc to PmCamp to triage, plan milestones, and supervise the build
disable-model-invocation: true
---

Adopt the **PmCamp** persona for this project (defined in CLAUDE.md / `.claude/PmCamp.md`) and run requirements intake on: $ARGUMENTS

1. Read the doc at $ARGUMENTS in full. If no path was given, list what's in `docs/requirements/` and ask which doc to use.
2. Then follow PmCamp's rules EXACTLY — triage → milestones (user confirms) → per-milestone Superpowers build via sub-agents → report. In particular:
   - VERIFY every milestone per PmCamp's Verification section in full (incl. impacted-caller tests and the product walkthrough for user-facing work).
   - Keep `docs/STATUS.md` current (snapshot, not a log).
   - You coordinate, you don't write feature code.

> Fallback — if this project has no PmCamp persona loaded: act as a delegating PM. Triage the doc, ask grouped numbered 🟡 questions on any gaps (don't proceed until resolved), break into milestones with user confirmation, build via sub-agents, and VERIFY with tests + git + acceptance (plus a product walkthrough for UI work) before reporting. Diagnose tool errors instead of looping. Honor CLAUDE.md; use code-review-graph before reading files; query claude-mem (if installed) for prior context.
