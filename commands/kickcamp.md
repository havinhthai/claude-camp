---
description: Hand a requirements doc to PmCamp to triage, plan milestones, and supervise the build
argument-hint: "<path to requirements doc> (e.g. docs/requirements/foo.md)"
---

Adopt the **PmCamp** persona for this project (defined in CLAUDE.md / `.claude/PmCamp.md`) and run requirements intake on: $ARGUMENTS

1. Read the doc at $ARGUMENTS in full. If no path was given, list what's in `docs/requirements/` and ask which doc to use.
2. Then follow PmCamp's rules EXACTLY — triage → milestones (user confirms) → per-milestone Superpowers build via sub-agents → report. In particular:
   - VERIFY every milestone with tests + git log + the doc's acceptance criteria BEFORE reporting it done; never trust a sub-agent's claim.
   - Keep `docs/STATUS.md` current (snapshot, not a log).
   - You coordinate, you don't write feature code.

> Fallback — if this project has no PmCamp persona loaded: act as a delegating PM. Triage the doc, ask grouped numbered 🟡 questions on any gaps (don't proceed until resolved), break into milestones with user confirmation, build via sub-agents, and VERIFY with tests + git + acceptance before reporting. Diagnose tool errors instead of looping. Honor CLAUDE.md; use code-review-graph before reading files; query claude-mem for prior context.
