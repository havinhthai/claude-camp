<div align="center">
  <img src="assets/logo.png" alt="claude-camp" width="140" />

# 🏕️ claude-camp

**A PM-orchestrated development workflow for Claude Code.**

Brief one project manager — it plans, delegates to sub-agents, verifies, and ships. You stop micromanaging the agent.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#license)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Plugin-d97757.svg)](https://code.claude.com)
[![Version](https://img.shields.io/badge/version-1.2.8-3fb950.svg)](#)

> **v1.2.8** — Cuts what every spawn loads from outside camp's own files: the Artifact tool off, a `general-purpose` override without the Skill tool (no skill listing in sub-agents), one memory system instead of two, ponytail scoped to general-purpose sub-agents, and an opt-in cleanup of superseded camp lines in older `CLAUDE.md` files. Measured per first request: socialcamp sub-agent 50.3–54.2k → 14.2k tokens, main 62.3–65.0k → 31.9k; a fresh FastAPI project's sub-agent 43.3–44.6k → 12.2k.

> **v1.2.7** — PmCamp lives in the main session only: a plugin `SessionStart` hook injects `.claude/PmCamp.persona.md`, so sub-agents stop loading (and impersonating) the PM, and `.claude/PmCamp.md` becomes a 288-char stub. Stack-agnostic rules move to `.claude/rules/core.md`, which reaches every sub-agent. Measured project memory per sub-agent spawn drops 55–70% (e.g. FastAPI 6,315 → 2,456 tokens).

> **v1.2.5** — An on-demand `docs/ARCHITECTURE.md` module map (read before cross-module work) + an always-loaded **Known pitfalls** list (two-strikes, capped at 10) against "fix A, break B"; PmCamp's own ceremony scales with Superpowers' Bounded classification — tests, impact analysis, and verification are never skipped.

> **v1.2.4** — All code is English (identifiers, comments, commits; Vietnamese stays for PmCamp ↔ user only); sub-agents must run **pre-change impact analysis** via code-review-graph before editing shared code, and verify the impacted callers' tests — TDD alone doesn't catch cross-feature regressions.

</div>

---

`claude-camp` turns Claude Code into a small, disciplined engineering team. Instead of steering an agent step by step, you brief a **PM persona — PmCamp**. It triages your requirements, breaks them into milestones, delegates the build to sub-agents, and **never reports work as "done" without verifying it** against tests, git history, and your acceptance criteria.

Two commands run the whole loop:

- **`/basecamp`** — one-time project setup (a new project *or* an existing codebase)
- **`/kickcamp`** — hand it a requirements doc; it delivers the feature

## Table of contents

- [Highlights](#highlights)
- [Installation](#installation)
- [Commands](#commands)
- [How it works](#how-it-works)
- [What `/basecamp` sets up](#what-basecamp-sets-up)
- [The PmCamp persona](#the-pmcamp-persona)
- [Optional tools](#optional-tools)
- [Roadmap](#roadmap)
- [Repository structure](#repository-structure)
- [License](#license)

## Highlights

- 🧭 **One point of contact.** You talk to PmCamp; it orchestrates everything and pulls you in only for gaps, plan sign-off, real decisions, and verified completion.
- 🔍 **Verification-first.** No milestone is "done" on a sub-agent's word — PmCamp checks tests, real commits, and acceptance criteria, and reports with evidence. For user-facing milestones it also **runs the product** and walks the primary user flows — passing tests alone doesn't close a milestone.
- 🌱 **Greenfield *or* brownfield.** `/basecamp` scaffolds new projects and safely **adopts** existing ones (detect stack, map the code, never overwrite).
- 🧱 **Python *and* Node backends.** FastAPI/Django (Python) or NestJS ★/Fastify/Express (Node), with PostgreSQL/MySQL/SQLite **or MongoDB** (Django: SQL via its own ORM). Scaffolds run the official generator, then overlay a module-based structure shipped as bundled rules (Django keeps its own app layout).
- 🎚️ **Model tiers.** Pick a tier once (Flagship / Premium ★ / Balanced / Economy) — `/basecamp` writes it to `.claude/settings.json`: the PM model plus the default subagent model (`CLAUDE_CODE_SUBAGENT_MODEL`) for every spawn that names none. Measured on Claude Code 2.1.289, a dispatch's own `model` wins — Superpowers picks per role (Haiku mechanical, Sonnet build, Opus final review), which fits Premium and Flagship; on Balanced or Economy an Opus final review exceeds the tier. Built-in Explore and Plan inherit the PM's model unless the dispatch names one, so PmCamp passes one (Explore → Haiku, Plan → Sonnet). Want a hard ceiling instead? Add `"CLAUDE_CODE_SUBAGENT_MODEL_FORCE": "1"` to the settings `env` (opt-in).
- 🪙 **Token-efficient by design.** Graph-before-grep, scoped reads, sub-agent isolation, session hygiene rules, a snapshot `STATUS.md`, and optional command/output compression.
- 🧩 **Composes, doesn't compete.** Builds on Superpowers (workflow), Karpathy's principles, claude-mem, and code-review-graph instead of re-implementing them.

## Installation

In Claude Code:

```text
/plugin marketplace add havinhthai/claude-camp
/plugin install camp@claude-camp
```

That's it — `/basecamp` and `/kickcamp` are now available in every project. The persona hook needs `node` on your PATH. No cloning, symlinking, or file-permission setup.

Update later with:

```text
/plugin marketplace update
```

## Commands

| Command | Purpose |
| --- | --- |
| `/basecamp` | Bootstrap a project. Audits and installs the global toolkit, scaffolds to the chosen stack, and writes `CLAUDE.md` + the PmCamp persona. Runs in **greenfield** mode (new) or **adopt** mode (existing codebase). |
| `/basecamp adopt` | Force adopt mode for an existing codebase — detect the stack, build the code graph, scaffold only what's missing, never overwrite. |
| `/basecamp refresh` | Sync project-local copies (`PmCamp.md`, `PmCamp.persona.md`, `rules/`, the opt-in `agents/general-purpose.md`) with the installed plugin version, migrating pre-1.2.7 projects to the hook-injected persona; user-modified files are never overwritten without confirmation. Then three opt-in steps, each shown as a diff first: spawn-cost settings, memory consolidation, and a `CLAUDE.md` cleanup of superseded camp lines. |
| `/kickcamp <doc>` | Hand a requirements doc to PmCamp: triage → milestones (you confirm) → build via sub-agents → **verify** (tests + git + acceptance, plus a product walkthrough for UI work) → report. |

## How it works

**Setup once** — run `/basecamp` in a project. It prepares the foundation (toolkit, `CLAUDE.md`, PmCamp, `docs/`) and stops before any feature code.

**Then, per feature** — drop a spec in `docs/requirements/` and run `/kickcamp <doc>`:

```text
you → /kickcamp doc
        │
        ▼
   PmCamp: triage ──(gaps?)──► ask you 🟡
        │
        ▼
   milestones ──► you confirm
        │
        ▼
   per milestone: Superpowers workflow via sub-agents
        │
        ▼
   PmCamp VERIFY: tests + git log + acceptance
                  (+ UI walkthrough if user-facing)
        │
        ▼
   report with evidence ──► you approve ──► next milestone ↺
```

You only step in at four moments: a requirement gap, milestone sign-off, a real decision or blocker, and a verified-done report.

## What `/basecamp` sets up

On first run, `/basecamp` audits and installs (only what's missing) a curated global toolkit — you don't install these by hand:

- **[Superpowers](https://github.com/obra/superpowers-marketplace)** — the brainstorm → plan → TDD → review workflow
- **[andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills)** — engineering principles (Simplicity First, Surgical Changes, …)
- **[ponytail](https://github.com/DietrichGebert/ponytail)** — writes the minimum code that works (YAGNI ladder: reuse > stdlib > native > dep > one line > minimum), safety-preserving (never trims validation/security/accessibility) — trims LOC, tokens, and cost
- **[claude-mem](https://github.com/thedotmack/claude-mem)** — cross-session memory (opt-in: `/basecamp` asks first, and skips it if you already use another memory tool)
- **[code-review-graph](https://github.com/tirth8205/code-review-graph)** — an AST map of your code (query it instead of reading the whole repo)
- **[caveman](https://github.com/JuliusBrussee/caveman)** — compresses Claude's own output (installed **on-demand only** via `/caveman` — never the always-on hook, so it won't garble the PM's messages)
- **[Matt Pocock skills](https://github.com/mattpocock/skills)** — `improve-codebase-architecture`, `git-guardrails-claude-code`, `setup-pre-commit`
- **Optional, token-saving:** [`rtk`](https://github.com/rtk-ai/rtk) (compresses command output) and [`agent-browser`](https://github.com/vercel-labs/agent-browser) (cheap browser for dynamic/auth pages)

If an install is blocked by a permission or classifier prompt, `/basecamp` prints the manual command and continues instead of stalling. Re-runs are idempotent — anything already present is skipped.

### What each spawn costs

Every session and every sub-agent starts by loading tool definitions, the skill listing, memory files and hook output. Most of that comes from outside camp, so `/basecamp` asks about these — the ponytail matcher is set by default — and `/basecamp refresh` offers them to existing projects as a diff first; existing keys are never changed:

| Setting | Saves per spawn (measured) | You lose |
| --- | --- | --- |
| `enableArtifact: false` (`.claude/settings.json`) | ≈11–20k tokens, main + every sub-agent — the tool's definition varies 55–89k chars between sessions | publishing a report as a shareable page; teammates can't re-enable it locally |
| `.claude/agents/general-purpose.md` — the built-in role text, minus the Skill tool | ≈11.8k tokens per sub-agent (the skill listing) | skills inside sub-agents — none of Superpowers' sub-agent prompts use one; the PM hands a sub-agent a skill's `SKILL.md` path instead. Superpowers' opt-in "orchestrator sub-agent" mode needs the file removed |
| `autoMemoryEnabled: false`, after a one-time migration | the `MEMORY.md` index: 7.3k tokens per spawn on socialcamp | auto-memory; standing preferences move to `## Working agreements` in `CLAUDE.md`, history stays in claude-mem — memory files are never deleted |
| `syncClaudeAiSkills: false` (`.claude/settings.local.json`) | ≈3.4k tokens | your claude.ai-synced skills, in this project only |
| mattpocock-skills disabled here + standalone `improve-codebase-architecture` | ≈1k tokens | its other 11 skills (several overlap Superpowers) |
| `env.PONYTAIL_SUBAGENT_MATCHER: "^general-purpose$"` | ≈1.9k tokens per Explore / Plan / other non-general-purpose spawn | nothing: implementers and reviewers are general-purpose and keep ponytail's ladder |

ponytail can be kept out of every sub-agent with a matcher that matches no agent type, e.g. `"^off$"` — implementers then lose the ladder, and only the "Write the least code that works" line in `CLAUDE.md` and `/ponytail-review` at milestone close remain. Never turn off bundled skills or `workflow-authoring` to save tokens: the skill listing refills to its budget cap, and the main session's Workflow tool grows from 9k to 43k chars.

## The PmCamp persona

`PmCamp.persona.md` in this repository is the **single source of truth** for the PM's behaviour. `/basecamp` copies it into the project's `.claude/PmCamp.persona.md`, version-stamped so drift is detectable, and the plugin's `SessionStart` hook injects it into the **main session only** — at startup, resume, `/clear` and after `/compact`, even when the session starts in a subdirectory. Sub-agents never receive it; they see `.claude/PmCamp.md`, a short stub that root `CLAUDE.md` imports. If hooks are off, the stub tells the main session to Read the persona itself. A persona over 9,500 characters isn't injected — past 10,000 Claude Code would hand the model only a 2k-character preview — so the PM is told to Read the file and to warn you instead.

If the plugin directory can't be resolved, `/basecamp` finds the camp install in `~/.claude/plugins/installed_plugins.json` and copies from there; it prints a manual copy command only when nothing resolves.

To change how the PM behaves — verification, communication style, state handling — edit `PmCamp.persona.md` here, commit, and push. Every later `/basecamp` picks up the new version; existing projects sync their copies with `/basecamp refresh` (untouched copies update automatically, user-edited ones only with confirmation). On projects set up before v1.2.7, refresh moves the persona out of `.claude/PmCamp.md` into `PmCamp.persona.md` and writes the stub — if you had edited it, it asks first and keeps your edits byte for byte.

When you correct a standing preference — report format, workflow, a do or don't — PmCamp writes it to `## Working agreements` in the root `CLAUDE.md` the first time (capped at 10 lines) and tells you; agent mistakes go to `## Known pitfalls` instead, on the second occurrence.

For user-facing milestones, verification goes beyond tests: PmCamp builds and runs the product, walks the primary user flows end-to-end, and checks UI states (empty/loading/error/validation) against `DESIGN.md` before calling anything done.

## Optional tools

Personal usage/cost observability (not part of this plugin):

- [`Gronsten/claude-usage-monitor`](https://github.com/Gronsten/claude-usage-monitor) — real-time token usage within the 5-hour window
- [`phuryn/claude-usage`](https://github.com/phuryn/claude-usage) — historical spend by session, day, and week

## Roadmap

Tracked upgrades (PM notifications + remote control, an alternative memory backend, Agent Teams, …) live in [`UPGRADES.md`](./UPGRADES.md).

## Repository structure

```text
claude-camp/
├── .claude-plugin/
│   ├── plugin.json          # plugin manifest ("camp")
│   └── marketplace.json     # marketplace catalog ("claude-camp")
├── skills/
│   ├── basecamp/
│   │   └── SKILL.md         # /basecamp
│   └── kickcamp/
│       └── SKILL.md         # /kickcamp
├── hooks/
│   ├── hooks.json           # SessionStart → inject the persona (main session only)
│   └── pmcamp-persona.js
├── rules/                   # bundled convention rules (copied into .claude/rules/)
│   ├── core.md              # every project: English-only, graph before Grep, impact analysis
│   ├── node.md              # Node backend (NestJS/Fastify/Express)
│   ├── python.md            # Python backend (FastAPI)
│   └── mongodb.md           # MongoDB data modeling (Mongoose/Beanie)
├── project-agents/
│   └── general-purpose.md   # opt-in override, copied into .claude/agents/ (not a plugin agent)
├── scripts/
│   ├── claude-md-cleanup.js # /basecamp refresh: superseded camp lines in CLAUDE.md
│   └── claude-md-cleanup.test.js
├── PmCamp.persona.md        # PM persona (canonical)
├── PmCamp.md                # stub imported by project CLAUDE.md
├── UPGRADES.md              # roadmap / backlog
├── LICENSE                  # MIT
└── README.md
```

## License

[MIT](./LICENSE) © thaiha
