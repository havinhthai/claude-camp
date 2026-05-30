<div align="center">
  <img src="assets/logo.png" alt="claude-camp" width="140" />

# 🏕️ claude-camp

**A PM-orchestrated development workflow for Claude Code.**

Brief one project manager — it plans, delegates to sub-agents, verifies, and ships. You stop micromanaging the agent.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#license)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Plugin-d97757.svg)](https://code.claude.com)
[![Version](https://img.shields.io/badge/version-1.1.1-3fb950.svg)](#)

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
- 🔍 **Verification-first.** No milestone is "done" on a sub-agent's word — PmCamp checks tests, real commits, and acceptance criteria, and reports with evidence.
- 🌱 **Greenfield *or* brownfield.** `/basecamp` scaffolds new projects and safely **adopts** existing ones (detect stack, map the code, never overwrite).
- 🧱 **Python *and* Node backends.** FastAPI/Django (Python) or NestJS ★/Fastify/Express (Node), with PostgreSQL/MySQL/SQLite **or MongoDB**. Scaffolds run the official generator, then overlay a module-based structure shipped as bundled rules.
- 🪙 **Token-efficient by design.** Graph-before-grep, scoped reads, sub-agent isolation, a snapshot `STATUS.md`, and optional command/output compression.
- 🧩 **Composes, doesn't compete.** Builds on Superpowers (workflow), Karpathy's principles, claude-mem, and code-review-graph instead of re-implementing them.

## Installation

In Claude Code:

```text
/plugin marketplace add havinhthai/claude-camp
/plugin install camp@claude-camp
```

That's it — `/basecamp` and `/kickcamp` are now available in every project. No cloning, symlinking, or file-permission setup.

Update later with:

```text
/plugin marketplace update
```

## Commands

| Command | Purpose |
| --- | --- |
| `/basecamp` | Bootstrap a project. Audits and installs the global toolkit, scaffolds to the chosen stack, and writes `CLAUDE.md` + the PmCamp persona. Runs in **greenfield** mode (new) or **adopt** mode (existing codebase). |
| `/basecamp adopt` | Force adopt mode for an existing codebase — detect the stack, build the code graph, scaffold only what's missing, never overwrite. |
| `/kickcamp <doc>` | Hand a requirements doc to PmCamp: triage → milestones (you confirm) → build via sub-agents → **verify** (tests + git + acceptance) → report. |

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
        │
        ▼
   report with evidence ──► you approve ──► next milestone ↺
```

You only step in at four moments: a requirement gap, milestone sign-off, a real decision or blocker, and a verified-done report.

## What `/basecamp` sets up

On first run, `/basecamp` audits and installs (only what's missing) a curated global toolkit — you don't install these by hand:

- **[Superpowers](https://github.com/obra/superpowers-marketplace)** — the brainstorm → plan → TDD → review workflow
- **[andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills)** — engineering principles (Simplicity First, Surgical Changes, …)
- **[claude-mem](https://github.com/thedotmack/claude-mem)** — cross-session memory
- **[code-review-graph](https://github.com/tirth8205/code-review-graph)** — an AST map of your code (query it instead of reading the whole repo)
- **[caveman](https://github.com/JuliusBrussee/caveman)** — compresses Claude's own output (installed **on-demand only** via `/caveman` — never the always-on hook, so it won't garble the PM's messages)
- **[Matt Pocock skills](https://github.com/mattpocock/skills)** — `improve-codebase-architecture`, `git-guardrails`, `setup-pre-commit`
- **Optional, token-saving:** [`rtk`](https://github.com/rtk-ai/rtk) (compresses command output) and [`agent-browser`](https://github.com/vercel-labs/agent-browser) (cheap browser for dynamic/auth pages)

If an install is blocked by a permission or classifier prompt, `/basecamp` prints the manual command and continues instead of stalling. Re-runs are idempotent — anything already present is skipped.

## The PmCamp persona

`PmCamp.md` in this repository is the **single source of truth** for the PM's behaviour. During scaffolding, `/basecamp` copies it from the plugin directory (`${CLAUDE_PLUGIN_ROOT}/PmCamp.md`) into the project's `.claude/PmCamp.md` — no embedded duplicate, so the persona can't drift. (A fallback template is retained for runs outside the plugin.)

To change how the PM behaves — verification, communication style, state handling — edit `PmCamp.md` here, commit, and push. Every later `/basecamp` picks up the new version.

## Optional tools

Personal usage/cost observability (not part of this plugin):

- [`Gronsten/claude-usage-monitor`](https://github.com/Gronsten/claude-usage-monitor) — real-time token usage within the 5-hour window
- [`phuryn/claude-usage`](https://github.com/phuryn/claude-usage) — historical spend by session, day, and week

## Roadmap

Tracked upgrades (Telegram notifications, an alternative memory backend, Agent Teams, …) live in [`UPGRADES.md`](./UPGRADES.md).

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
├── rules/                   # bundled convention rules (copied into .claude/rules/)
│   ├── node.md              # Node backend (NestJS/Fastify/Express)
│   ├── python.md            # Python backend (FastAPI)
│   └── mongodb.md           # MongoDB data modeling (Mongoose/Beanie)
├── PmCamp.md                # PM persona (canonical)
├── UPGRADES.md              # roadmap / backlog
├── LICENSE                  # MIT
└── README.md
```

## License

[MIT](#license) © thaiha
