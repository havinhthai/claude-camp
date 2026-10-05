---
name: basecamp
description: Bootstrap a project's standard dev stack — greenfield (new) or adopt (existing codebase)
disable-model-invocation: true
---

You are a project bootstrap engineer. Set up a codebase with the user's standard dev stack by working through the 5 phases below IN ORDER. Argument (if given): $ARGUMENTS

<mode>
Two modes — decide in Phase 1:
- **GREENFIELD** (default): new/empty project. Interview the stack, scaffold from scratch.
- **ADOPT** (existing codebase): triggered if $ARGUMENTS contains "adopt", OR Phase 1 finds an existing non-trivial codebase (real source + a package manifest + git history). In ADOPT you DETECT the stack instead of interviewing, and you are STRICTLY ADDITIVE — never scaffold over or overwrite existing code/config. If you detect an existing codebase but the user didn't say "adopt", CONFIRM switching to ADOPT before doing anything.
Each phase notes its ADOPT difference; everything else is shared.

**REFRESH shortcut:** if $ARGUMENTS contains "refresh" → run ONLY the "Project-local plugin copies", Memory and "Spawn cost" audits (Phase 1) + the **Plugin-copy refresh** block (Phase 4), then Phase 4's opt-in **Spawn-cost settings**, **Memory consolidation** and **CLAUDE.md cleanup** steps — no interview, no installs, no scaffolding — then report per file what was updated / kept / still missing, and per opt-in step what was applied / skipped.
</mode>

<hard_rules>
These override everything else:
- This command is IDEMPOTENT. ALWAYS check before installing. If something exists and is correct, SKIP it and say so — never reinstall or clobber.
- After EACH phase, output: `✅ [phase name] — [one-line result]`
- STOP and ASK before any destructive action: overwriting an existing CLAUDE.md or config, deleting files, force git operations, or changing global `~/.claude` config that already exists. Show a diff first.
- Set up ONLY what is listed here + confirmed in Phase 2. Do NOT add extra tools, deps, frameworks, or scaffolding.
- Do NOT write application/feature code. This command only prepares the foundation.
</hard_rules>

<phase_1_audit>
Global tooling — report `✅ present` / `❌ missing` for each:
- Superpowers — list WHICH skills exist (brainstorming, writing-plans, TDD, code-review, requesting-code-review). Flag if PARTIAL. Also check its VERSION at user AND project scope: `claude plugin list --json` (fallback: `~/.claude/plugins/installed_plugins.json`) → every `superpowers@*` entry whose `scope` is user or whose `projectPath` is this repo. Any entry <6.3.0 (project pins included) → ⚠️ warn — older versions lack the Spike/Bounded/Architectural classification PmCamp's lanes key off — and print the upgrade: `claude plugin marketplace update <marketplace> && claude plugin update superpowers@<marketplace> --scope <scope>` (project scope: run inside this repo; restart after). NEVER auto-change a project pin. Version unreadable → report `❔ unknown` and continue.
- Memory: try `claude-mem status` first. ALSO check for any other memory system already in use — agentmemory MCP server, mem0, custom memory tools (look in `~/.claude/settings.json`, `~/.claude.json` (`mcpServers` and `projects["<repo path>"].mcpServers`), `~/.claude/mcp_servers.json`, env vars, project `.mcp.json`). If a non-claude-mem memory tool is present, report `✅ present ({tool})` and do NOT push claude-mem later. ALSO Claude Code's own auto-memory — on unless `autoMemoryEnabled: false` (any settings file) or `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`; its `MEMORY.md` index loads into the main session AND every sub-agent. Size it — Claude Code keys the file on the repo's main checkout (shared by its worktrees and subdirectories); an `autoMemoryDirectory` in user/local settings moves it:
  ```bash
  node -e 'const p=require("path");let r=process.cwd();try{const g=require("child_process").execSync("git rev-parse --path-format=absolute --git-common-dir",{stdio:["ignore","pipe","ignore"]}).toString().trim();if(p.basename(g)===".git")r=p.dirname(g)}catch{}const f=p.join(require("os").homedir(),".claude/projects",r.replace(/[^a-zA-Z0-9]/g,"-"),"memory/MEMORY.md");try{const n=require("fs").readFileSync(f,"utf8").length;console.log(f,n,"chars ≈",Math.round(n/2),"tokens per spawn")}catch{console.log("no MEMORY.md at",f)}'
  ```
  (÷2 is rough: measured 12.3k chars of mixed Vietnamese = 7.3k tokens per sub-agent.) 2+ systems active — auto-memory with a non-empty MEMORY.md, claude-mem, agentmemory / mem0 — → ⚠️ flag: they record overlapping facts and the always-loaded ones cost every spawn; Phase 4's **Memory consolidation** offers one.
- caveman (compresses Claude's output) — audit what is ACTIVE, not just installed: hooks Claude Code registers for it (`hooks/hooks.json` or the manifest's `hooks` field under its `installPath`, plus caveman entries in `~/.claude/settings.json` `hooks`) and whether each hook's script exists; the `statusLine` command's target; caveman rules in `~/.claude/CLAUDE.md` (and files it `@`-imports); a `caveman-shrink` MCP server. A live SessionStart / UserPromptSubmit hook, a user-memory rule, or the shrink MCP = always-on → ⚠️ warn (it compresses PmCamp's user-facing messages) and print one fix per signal found: plugin hooks → `/plugin uninstall caveman@<marketplace>`; rule lines in `~/.claude/CLAUDE.md` → show them for the user to remove; `caveman-shrink` → `claude mcp remove caveman-shrink`. Then the `--minimal` install (Phase 3). A hook script or statusLine target that doesn't exist → ⚠️ report it as a broken reference (don't edit global config).
- rtk (Rust Token Killer — compresses command output; try `rtk gain`. A `~/.claude/RTK.md` is its install signature — likely already present)
- agent-browser (token-efficient browser; try `agent-browser --version`). Also detect Playwright MCP (a `playwright` plugin or MCP server). Both present → ℹ️ report the overlap: agent-browser is PmCamp's walkthrough default (no idle context cost; Playwright's tool names load into every session and sub-agent), Playwright the fallback — removing either is the user's call.
- Matt Pocock skills: improve-codebase-architecture, git-guardrails-claude-code, setup-pre-commit
- andrej-karpathy-skills (provides engineering principles)
- ponytail (Claude Code plugin — enforces YAGNI-ladder minimalism at code-generation time)
- node (`node --version`) — camp's persona hook runs on it (ponytail's hooks too). Missing → ⚠️ every session start shows a hook error and the PM only gets its persona by Reading it via the stub; tell the user to install Node.js.

This project — check: git repo + commit history, existing `CLAUDE.md`, `.claude/` dir, code-review-graph (and whether its auto-update hooks are registered). ALSO detect whether this is an EXISTING codebase: real source files, a package manifest (package.json / pyproject.toml / requirements.txt / go.mod …), lockfiles, established dirs.

Spawn cost — what loads into the main session and every sub-agent (Phase 4's **Spawn-cost settings** act on it). Report each:
- `.claude/settings.json` `enableArtifact` — absent = on: the Artifact tool's definition is 55–89k chars (≈11–20k tokens) per spawn.
- `.claude/settings.json` `env.PONYTAIL_SUBAGENT_MATCHER` — absent = ponytail injects its 5.2k-char ruleset into every sub-agent type.
- claude.ai-synced skills — laid out as `~/.claude/skills/synced/<account>/<skill>/`; report the skill-folder count of the largest account folder, unless `syncClaudeAiSkills: false` sits in `~/.claude/settings.json` or `.claude/settings.local.json`.
- mattpocock-skills — the full plugin enabled (a `mattpocock-skills@*` key true in merged `enabledPlugins`) = 12 skills; camp uses only improve-codebase-architecture.
- `disableBundledSkills: true`, or `skillOverrides` setting `workflow-authoring` to `off` / `user-invocable-only`, in any settings file → ⚠️ warn and show the line to remove: the skill listing refills to its budget cap anyway, and the main session's Workflow tool grows 9k → 43k chars (+6.3k tokens).

Project-local plugin copies — `.claude/PmCamp.md` (stub), `.claude/PmCamp.persona.md` (persona), each `.claude/rules/<name>.md` whose `<name>.md` exists in the plugin's `rules/`, and each `.claude/camp/workflows/<name>.md` whose `<name>.md` exists in the plugin's `workflows/` (PmCamp's gate procedures, Read on demand — never auto-loaded) are COPIES of plugin files (plugin-loaded skills update themselves; copies go stale). Any other `.claude/rules/*.md` or `.claude/camp/workflows/*.md` is project-owned — never audit, flag, or refresh it. Compare each copy against the same-named file in the plugin root (`${CLAUDE_PLUGIN_ROOT}`, else resolved per Phase 4; plugin version from its `.claude-plugin/plugin.json`). Copies carry a first-line stamp `<!-- claude-camp: <file> v<X> · sha256:<12-hex> -->`; check the body with `tail -n +2 <copy> | shasum -a 256 | cut -c1-12` against the stamp's hash. Report one row per file in the audit table: `✅ current` (stamp version == plugin version) · `⬆️ outdated` (stamp version < plugin version AND body hash matches the stamp — untouched copy) · `✏️ user-modified` (hash mismatch, or no stamp — pre-v1.2.3 copies) · `❌ missing` (`core.md`, the stub, the persona and every plugin workflow always; a stack rule file only if stack-relevant per Phase 4 — never one that CLAUDE.md records as declined via ADOPT's "Follow existing"). Pre-v1.2.7 layout — `.claude/PmCamp.persona.md` missing, and `.claude/PmCamp.md` stamped older than v1.2.7 or unstamped and its body isn't the plugin stub (it still holds the full persona) → tag BOTH rows `→ migrate` (Phase 4), never `❌ missing`: the persona is written only by the migration. Persona size — run the hook itself: `CLAUDE_PROJECT_DIR=. node "<plugin root>/hooks/pmcamp-persona.js"`; output saying `NOT injected` = over its 9,500-char limit → ⚠️ the PM falls back to Reading the file — trim it. `.claude/agents/general-purpose.md` (opt-in, Phase 4 **Spawn-cost settings**; source `project-agents/general-purpose.md`) is a copy too ONCE IT EXISTS — never `❌ missing`. Its stamp is line 2, a YAML comment (`# claude-camp: general-purpose.md v<X> · sha256:<12-hex>` — line 1 must stay the frontmatter's `---`), so its body check is `sed 2d <copy> | shasum -a 256 | cut -c1-12`; a file without that stamp is the user's own — report it, never refresh it. Also report its role-text version (`grep -o 'Claude Code [0-9][0-9.]*[0-9]' <copy> | head -1`) against `claude --version` (not on PATH → skip): different → ℹ️ "role text copied from <A>, running <B> — the built-in general-purpose prompt may have drifted; camp re-copies it per release".

Decide the MODE (see <mode>): existing codebase → ADOPT (confirm with the user if they didn't ask for it); otherwise GREENFIELD. State the chosen mode.

Output a short audit table. Install nothing yet.
</phase_1_audit>

<phase_2_interview>
Phase 2 picks the stack. Drive it with Claude Code's **AskUserQuestion** tool (clickable options) — NOT typed letter menus. Verified limits: ≤4 questions per call (batch only INDEPENDENT ones), 2–4 options per question, optional per-option `description` hint, `header` ≤12 chars, single- or multi-select, plus an auto-added "Other" that captures free text. The chain below is SEQUENTIAL (each step's options depend on prior answers) → make ONE call per step; only the Customize-tooling overrides may batch.

FALLBACK: if AskUserQuestion is unavailable, run the SAME structure as a typed conversational flow — open with the recommended default stack, accept letter codes or free-text answers, ask the same conditional questions in prose. State which mode you used.

Resolution rules (apply in EVERY mode — unchanged; only the UX changed):
- Defaults (★): Frontend = React+Vite · Backend = FastAPI (overall default) / NestJS (the Node default) · Database = PostgreSQL · JS pkg = pnpm · Python tool = uv · CI = on · Design system = None · Model tier = Premium (opus PM · sonnet subagents).
- GUARD: Frontend = None AND Backend = None is invalid — re-ask gracefully until ≥1 stack is chosen.
- GUARD: Django + MongoDB is never picked (claude-camp scaffolds Django on SQL with the Django ORM; `mongodb.md` is Beanie-specific) — the Database step doesn't offer MongoDB for Django; if arguments, a description, or a typed "Other" produce the pair, say so and re-ask the Database step. ADOPT keeps the pair when the codebase uses it (Phase 4).
- Auto-resolved, NEVER asked: Layout (both stacks → monorepo `backend/`+`frontend/`; single stack → root or `src/`, no empty sibling). ORM/ODM (MongoDB → Mongoose (Node) / Beanie (FastAPI); SQL → Prisma ★ / Drizzle (Node), SQLModel ★ / SQLAlchemy (FastAPI), Django ORM (Django — never SQLModel/SQLAlchemy; connection via Django's `DATABASES` setting + `DATABASE_URL` in `.env.example`, no separate connection module)). Quality per language present: Python BE → Ruff + mypy(strict) + pytest; Node BE → Biome + tsc + Vitest, EXCEPT NestJS which keeps its shipped ESLint + Prettier (Biome `useImportType` breaks NestJS DI; see Phase 4); FE → eslint + prettier + vitest; Husky + lint-staged for whichever stacks exist.

**ADOPT mode:** do NOT run the picker. DETECT the stack from the code — manifests, deps, dirs (frontend/backend), lockfiles, test runner, linter (Django = `manage.py` or a `django` dependency — it then gets the same Django handling as a picked Django backend). Model tier: read existing `.claude/settings.json` — if its `model` + `env.CLAUDE_CODE_SUBAGENT_MODEL` already map to a tier, report that tier; else default Premium. Then ONE AskUserQuestion (header "Detected"): "Detected: <stack summary + model tier>. Use as-is?" → "Use as-is" (★) · "Change". "Change" → the CHANGE picker below (re-ask only ambiguous fields; "Tooling / Model tier" covers the tier). Never ask what the code already answers. Then skip to Phase 3. The rest of this phase is GREENFIELD only.

**ARGUMENT bypass (greenfield):** if $ARGUMENTS already names a stack — framework words (`vite nestjs mongo`, `next fastapi postgres`) OR legacy letter codes (`1A 2C 3D`) — PARSE it, skip ALL pickers, jump straight to CONFIRMATION. Legacy letter map (keep parsing for backward-compat): 1 Frontend A=React+Vite B=Next.js C=None · 2 Backend A=FastAPI B=Django C=NestJS D=Fastify E=Express F=None · 3 DB A=PostgreSQL B=MySQL C=SQLite D=MongoDB E=Other · 4 JSpkg A=pnpm B=npm C=yarn · 5 Pytool A=uv B=poetry C=pip · 6 Quality A=Default+CI B=Default,noCI C=Custom · 7 Design A=None B=Apple C=Coinbase D=Notion E=Claude F=Clay. Free-typed natural-language answers are also accepted. Model tier in arguments: accept the natural-language tier words `flagship` / `premium` / `balanced` / `economy` anywhere in $ARGUMENTS; if none given, tier defaults to Premium.

**GREENFIELD interview (no stack in $ARGUMENTS):** mark the ★ default option first in each question; never assume — wait for the click; echo the locked stack before scaffolding.

ENTRY — one AskUserQuestion (header "Stack") whose text states the recommended default ("React + Vite · FastAPI (Python) · PostgreSQL · pnpm + uv · GitHub Actions CI · no design system. Plus Premium model tier: opus PM · sonnet subagents."):
- "Use this default" → straight to CONFIRMATION (locks Premium tier).
- "Customize step-by-step" → the CONDITIONAL CHAIN below.
- "Describe my project" → free-text; recommend a fitting stack (SEO/public → Next.js; SPA/internal/extension or separate backend → Vite; relational → Postgres; document/flexible → MongoDB) AND a model tier — Premium unless the user signals cost sensitivity (then Balanced or Economy) — STATE your assumptions, then CONFIRMATION.

CONDITIONAL CHAIN (Customize) — one AskUserQuestion per step (clickable, never prose); never show an irrelevant question:
1. Frontend (header "Frontend") — "React + Vite ★" (SPA / internal, no SEO) · "Next.js" (public / SEO / SSR) · "None".
2. Backend (header "Backend") — "Python ★" (FastAPI / Django) · "Node" (NestJS / Fastify / Express) · "None". Then ONE framework follow-up:
   - Node → "NestJS ★" · "Fastify" · "Express".
   - Python → "FastAPI ★" · "Django".
   GUARD CHECK here: if Frontend = None AND Backend = None, re-ask gracefully (re-open Frontend or Backend) until ≥1 stack chosen.
3. Database (header "Database") — ONLY if Backend ≠ None: "PostgreSQL ★" · "MongoDB" · "SQLite" · "Other"; Django → "PostgreSQL ★" · "SQLite" · "Other" (no MongoDB — see GUARD). The auto "Other" lets the user TYPE any DB (e.g. MySQL) — that typed value IS the free-text follow-up; no extra question.
4. Tooling (header "Tooling") — "Defaults: pnpm + GitHub Actions CI{ + uv if Python}. Keep?" → "Keep ★" · "Customize". On Customize, batch the overrides in ONE AskUserQuestion call (independent): JS pkg ("pnpm ★" · "npm" · "yarn"), CI ("On ★" · "Off"), and — ONLY if Backend is Python — Python tool ("uv ★" · "poetry" · "pip").
5. Model tier (header "Model tier") — sets the PM model + the default subagent model, written to `.claude/settings.json` in Phase 4. Exactly 4 options (fits the cap):
   - "Premium ★" — opus PM · sonnet subagents (the default).
   - "Flagship" — fable PM · sonnet subagents (description hint: max quality, burns the weekly fast quota).
   - "Balanced" — sonnet PM · sonnet subagents.
   - "Economy" — sonnet PM · haiku subagents (description hint: haiku is weak for real implementation work).
6. Design system — ONLY if Frontend ≠ None. Two steps (6 choices exceed the 4-option cap): first (header "Design") "Use a design system?" → "None ★" · "Choose one". If "Choose one": follow-up (header "Design sys") "Apple" · "Coinbase" · "Notion" · "More…"; "More…" → "Claude" · "Clay". Every step ≤4 options; all five systems reachable.

CONFIRMATION — one AskUserQuestion (header "Confirm"): "Build <full stack summary>?" → "Yes, build ★" · "Change something". The summary names the RESOLVED tooling cleanly — show the actual linter for the chosen backend (NestJS → "ESLint + Prettier"; Fastify/Express → "Biome"; Python → "Ruff"), never an arrow like "Biome→ESLint" — and END with the model tier, e.g. "· Premium tier (opus PM · sonnet subagents)".
- "Change something" → AskUserQuestion (header "Change", multiSelect, ≤4 options to respect the cap) — "Stack (FE/BE/DB)" · "Tooling / Model tier" · "Design" · "Start over" — then re-ask only the picked group(s) via the chain above ("Stack" → steps 1–3 as relevant; "Tooling / Model tier" → steps 4–5; "Design" → step 6; or restart) and RE-CONFIRM.

Lock answers, echo the final stack, then proceed.
</phase_2_interview>

<phase_3_install>
Install ONLY what Phase 1 found missing. Ask before each global change. `/plugin …` commands must run inside an active Claude Code session at the `/` prompt — if you're running shell, print them for the user to paste.

- **Superpowers** (Claude Code plugin) — `writing-plans` and `requesting-code-review` are REQUIRED; without them `brainstorming` dead-ends. If FULL, skip. If missing or PARTIAL:
  ```
  /plugin marketplace add obra/superpowers-marketplace
  /plugin install superpowers@superpowers-marketplace
  ```
  Skills bundle inside the plugin — no separate per-skill install.

- **andrej-karpathy-skills** (Claude Code plugin) — supplies engineering principles globally; do NOT hand-write them into any CLAUDE.md:
  ```
  /plugin marketplace add forrestchang/andrej-karpathy-skills
  /plugin install andrej-karpathy-skills@karpathy-skills
  ```

- **ponytail** (Claude Code plugin) — enforces the YAGNI ladder (reuse > stdlib > native > dep > one line > minimum) at code-generation time; safety-preserving ("lazy, not negligent" — never trims validation, security, or accessibility). Default-install like Superpowers — NOT opt-in:
  ```
  /plugin marketplace add DietrichGebert/ponytail
  /plugin install ponytail@ponytail
  ```
  Ships two tiny Node.js lifecycle hooks (requires `node` on PATH; degrades gracefully if absent) and writes an optional `statusLine` entry to `~/.claude/settings.json` (bundled cleanup script removes it on uninstall). Default mode is `full` — do NOT force a mode. Restart Claude Code after install so the hooks + `/ponytail*` commands surface.

- **Matt Pocock skills** (npx `skills` CLI — NOT a Claude Code plugin) — install missing ones from: `improve-codebase-architecture`, `git-guardrails-claude-code` (real name; older docs say "git-guardrails"), `setup-pre-commit`. Per-skill (deterministic, no TUI):
  ```
  npx skills@latest add mattpocock/skills/improve-codebase-architecture
  npx skills@latest add mattpocock/skills/git-guardrails-claude-code
  npx skills@latest add mattpocock/skills/setup-pre-commit
  ```
  Or the interactive picker: `npx skills@latest add mattpocock/skills`.

- **claude-mem** (Claude Code plugin; cross-session memory) — OPT-IN. SKIP entirely if Phase 1 detected another memory tool (agentmemory / mem0 / custom). Otherwise ASK first: "Install claude-mem for cross-session memory? (Recommended — skip if you already use another memory tool such as agentmemory or mem0.)" On yes:
  ```
  /plugin marketplace add thedotmack/claude-mem
  /plugin install claude-mem
  ```
  Then restart Claude Code and verify with `claude-mem status`.

- **code-review-graph** (Python; pipx; requires Python 3.10+):
  ```
  pipx install code-review-graph
  code-review-graph install --platform claude-code --no-instructions
  code-review-graph build
  ```
  `install --platform claude-code` registers BOTH the MCP server AND auto-update hooks — confirm with `code-review-graph status`. Do NOT enable watch mode — hooks are event-driven and cost nothing when idle. Optional: install `uv` so the generated MCP config uses `uvx`. `--no-instructions` skips only the ~40-line tool guide it would append to CLAUDE.md (and its default-yes [Y/n] prompt) — `.claude/rules/core.md` names the key tools instead; MCP server, hooks, and its on-demand graph skills still install. Existing installs are unaffected: a CLAUDE.md that already has the appended section keeps it until `/basecamp refresh`'s **CLAUDE.md cleanup** (Phase 4) swaps it for a marker-only stub — offered only once `.claude/rules/core.md` is present. The flag needs code-review-graph ≥2.3.0 (`code-review-graph --version`) — upgrade an older install first (`pipx upgrade code-review-graph`, or `uv tool upgrade code-review-graph`).

- **rtk** (optional, command-output compression) — if `rtk gain` failed in Phase 1 AND user wants it (skip if RTK.md already in `~/.claude`). Install (idempotent — brew/curl no-op if present):
  ```
  brew install rtk-ai/tap/rtk
  rtk init -g
  ```
  rtk is NOT in homebrew-core; the `rtk-ai/tap/` prefix is required (taps + installs in one step). If brew fails (formula checksum, no brew): `curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/master/install.sh | sh`. If cargo is the only option: `cargo install --git https://github.com/rtk-ai/rtk` — NEVER bare `cargo install rtk` (collides with unrelated "Rust Type Kit" crate). Restart Claude Code, then verify with `rtk gain` (must show token savings, not "command not found"). If `rtk gain` fails after install you got the wrong package — reinstall from git.

- **agent-browser** (optional, token-efficient browser) — if missing AND user wants it:
  ```
  npm i -g agent-browser
  agent-browser install
  ```
  `agent-browser install` downloads Chrome for Testing (first run only). Linux: use `agent-browser install --with-deps`. Optional Claude Code skill stub: `npx skills add vercel-labs/agent-browser`. Skippable — not required for the base.

- **caveman** (optional, on-demand output compression) — if Phase 1 found it missing AND user wants it. Install **skill/command ONLY — never the always-on hook.** caveman's default install wires a SessionStart hook + `caveman-shrink` MCP middleware that compress ALL output from message one, which would garble PmCamp's user-facing messages and fight its clear-communication persona. Use `--minimal` (skips hooks, init rules, AND MCP-shrink) so `/caveman` is available on demand but nothing auto-compresses:
  ```
  curl -fsSL https://raw.githubusercontent.com/JuliusBrussee/caveman/main/install.sh | bash -s -- --minimal --only claude
  ```
  (`--minimal` verified to set `withHooks=false`, `withInit=false`, `withMcpShrink=false`.) After install, mention in the project CLAUDE.md that caveman is **on-demand only** (`/caveman [lite|full|ultra]`) — NOT always-on. If the user explicitly wants always-on anyway, that's their call: drop `--minimal` — but warn it will compress the PM's messages too.

If any global install is blocked (approval/classifier/permissions) or fails, do NOT stall — print the exact manual command, mark it ⏸️ pending, and continue. A blocked optional tool never blocks scaffolding.

Report `✅ installed` / `⏭️ skipped (present)` / `⏸️ pending (manual)` per item. Recommend a Claude Code restart after any plugin install so new skills/hooks surface.
</phase_3_install>

<phase_4_scaffold>
**Plugin-copy refresh (`.claude/PmCamp.md`, `.claude/PmCamp.persona.md`, the plugin-named `.claude/rules/*.md` + `.claude/camp/workflows/*.md` — see Phase 1) — BOTH modes, every run (and the core of `/basecamp refresh`).** Each copy's source is the same-named file in the plugin root (`PmCamp.md` = the stub, `PmCamp.persona.md`, `rules/<name>.md`, `workflows/<name>.md` → `.claude/camp/workflows/<name>.md` (`mkdir -p .claude/camp/workflows` first); `.claude/agents/general-purpose.md` ← `project-agents/general-purpose.md`, only once the user opted in). Copy WITH a one-line provenance stamp prepended — an HTML comment, invisible to markdown rendering and stripped from both the `@.claude/PmCamp.md` import and the hook's persona injection:
```bash
{ printf '<!-- claude-camp: %s v%s · sha256:%s -->\n' "<file>" "<plugin version>" "$(shasum -a 256 "<plugin source>" | cut -c1-12)"; cat "<plugin source>"; } > "<copy>"
```
The agent file is the one exception — its frontmatter must start on line 1, so the stamp goes on line 2 as a YAML comment (`mkdir -p .claude/agents` first):
```bash
{ head -1 "<plugin source>"; printf '# claude-camp: %s v%s · sha256:%s\n' "general-purpose.md" "<plugin version>" "$(shasum -a 256 "<plugin source>" | cut -c1-12)"; tail -n +2 "<plugin source>"; } > .claude/agents/general-purpose.md
```
Plugin root = `${CLAUDE_PLUGIN_ROOT}`. If it is empty or unexpanded, resolve it yourself — read `~/.claude/plugins/installed_plugins.json` (don't call `claude plugin list`: VS Code-only users may not have `claude` on PATH): an enabled `camp@*` entry (`enabledPlugins` merged user → project → local settings), this repo's project- or local-scope entry first, then user scope, whose `installPath` exists. Run at the repo root; prints the path or nothing:
```bash
node -e 'const fs=require("fs"),p=require("path"),h=require("os").homedir(),r=process.cwd(),j=f=>{try{return JSON.parse(fs.readFileSync(f,"utf8"))}catch{return{}}},on=Object.assign({},...[p.join(h,".claude/settings.json"),p.join(r,".claude/settings.json"),p.join(r,".claude/settings.local.json")].map(f=>j(f).enabledPlugins)),e=Object.entries(j(p.join(h,".claude/plugins/installed_plugins.json")).plugins||{}).filter(([k])=>k.startsWith("camp@")&&on[k]===true).flatMap(([,v])=>v).filter(x=>x.scope==="user"||x.projectPath===r).sort((a,b)=>(a.scope==="user")-(b.scope==="user")).find(x=>fs.existsSync(x.installPath));if(e)console.log(e.installPath)'
```
A resolved path is the plugin root — copy + stamp as usual. Version from `<plugin root>/.claude-plugin/plugin.json`; the hash covers the plugin source bytes, so the copy's body (everything after the stamp) hashes back to it while untouched. Then act on each file's Phase 1 state:
- `✅ current` → skip silently (idempotent — unchanged behavior).
- `⬆️ outdated` AND untouched (body hash matches its stamp) → refresh (re-copy + new stamp) and say so: "Updated .claude/PmCamp.md → v<new>".
- `✏️ user-modified` — or unprovable (no/garbled stamp) → NEVER overwrite without explicit confirmation. AskUserQuestion (header "PmCamp" for the persona, "Rules" for rule files, "Workflows" for workflow files; batch files sharing a state into ONE question, ≤4 options): "Update <file(s)> to v<new>?" → "Keep mine ★" · "Show diff" · "Overwrite (back up to <file>.bak)". "Show diff" prints the copy-vs-plugin diff, then re-asks. On Overwrite, write `<file>.bak` FIRST, then re-copy + stamp.
- `❌ missing` → copy fresh + stamp (existing behavior; in ADOPT, stack rule files only after the Conventions check below — `core.md` is never gated by it).
- `→ migrate` (pre-v1.2.7 layout, see Phase 1). Persona file first, then the stub, so the persona is never lost mid-way:
  - PmCamp.md `⬆️` untouched → copy the plugin's `PmCamp.persona.md` to `.claude/PmCamp.persona.md` (stamped), then overwrite `.claude/PmCamp.md` with the stamped stub. Say "Migrated PmCamp → .claude/PmCamp.persona.md (main session only); .claude/PmCamp.md is now a stub".
  - PmCamp.md `✏️ user-modified` → AskUserQuestion (header "PmCamp"): "Your .claude/PmCamp.md has local edits. v<new> moves the persona to .claude/PmCamp.persona.md — injected into the main session only, so sub-agents stop loading it — and makes PmCamp.md a stub." → "Migrate (keep your edits) ★" · "Keep mine" · "Show diff". Migrate → `mv .claude/PmCamp.md .claude/PmCamp.persona.md` (bytes unchanged: your edits and the old stamp stay; it audits as ✏️ from then on), then write the stamped stub. Keep mine → change nothing (the full persona keeps loading through the import, sub-agents included; the hook stays silent without a persona file). Show diff → diff it against the plugin's `PmCamp.persona.md`, then re-ask. After either migration, re-run the Phase 1 persona size check.
Nothing resolves → warn, skip every copy, and print the stamped copy command above per `❌ missing` / `⬆️ outdated` / `→ migrate`-untouched file (persona before stub; never a `✏️ user-modified` one; rule files prefixed with `mkdir -p .claude/rules && `, workflow files with `mkdir -p .claude/camp/workflows && `) with `<plugin source>` = `<camp installPath>/<source path>` (`PmCamp.md`, `rules/core.md`, `workflows/readiness.md`, …) and `<plugin version>` = that entry's `version` — both in the `camp@<marketplace>` entry of `~/.claude/plugins/installed_plugins.json`. Never hand-write them.

**Spawn-cost settings — BOTH modes; in REFRESH an opt-in step.** What loads into the main session and every sub-agent beyond camp's own files. Measured on Claude Code 2.1.289 (first request, MCP off, all of these plus Memory consolidation and CLAUDE.md cleanup): socialcamp sub-agent 50.3–54.2k → 14.2k tokens, main 62.3–65.0k → 31.9k; a fresh FastAPI project's sub-agent 43.3–44.6k → 12.2k, main 55.4k → 29.9k. Every key follows the settings MERGE rules (see `.claude/settings.json` below): add missing keys only; a key that already exists — any value — is the user's decision: report it, never change it.
1. `.claude/settings.json` `enableArtifact` — absent → ask once, AskUserQuestion (header "Artifact"): "Turn off Claude Code's Artifact tool here? Its definition costs ~11–20k tokens in the main session and in every sub-agent, and camp never uses it. Off only loses publishing a report as a shareable page; teammates can't turn it back on locally." → "Off ★" (`false`) · "Keep" (`true` — a no-op that records the answer: project settings can only turn it off).
2. `.claude/settings.json` `env.PONYTAIL_SUBAGENT_MATCHER: "^general-purpose$"` — default, not asked; harmless without ponytail. ponytail then injects its ruleset (≈1.9k tokens) only into general-purpose sub-agents — Superpowers' implementers and reviewers both are — and skips Explore, Plan and every other type.
3. `.claude/agents/general-purpose.md` — opt-in, default yes; skip if the file or the decline note (below) exists. AskUserQuestion (header "Sub-agents"): "Drop the Skill tool from general-purpose sub-agents? Saves ~11.8k tokens per spawn (the skill listing); Superpowers' sub-agent prompts use no skills. A skill you delegate (e.g. /ponytail-review) then goes to the sub-agent as a file to Read." → "Yes ★" · "No". Yes → the stamped copy of `project-agents/general-purpose.md` (line-2 stamp, see above): Claude Code's built-in general-purpose role text, verbatim, plus `disallowedTools: Skill` — ToolSearch and MCP stay, and model choice is unchanged (a dispatch's own `model`, else the env default). It shadows the built-in agent for EVERY general-purpose spawn in this project; Superpowers' opt-in "orchestrator sub-agent" mode loads its skills through Skill — delete the file to use it. An existing file without camp's stamp is the user's: never overwrite it. No → append `<!-- claude-camp: general-purpose override declined -->` (0 tokens) to root CLAUDE.md so re-runs and refresh don't ask again (delete that line to be asked).
4. claude.ai skills — only if Phase 1 counted synced skills. AskUserQuestion (header "claude.ai"): "Hide your N claude.ai-synced skills in this project? (≈3.4k tokens per spawn measured; they stay available everywhere else.)" → "Hide here ★" · "Keep". Hide → `.claude/settings.local.json` `syncClaudeAiSkills: false` — honored only there or in user settings, NOT in `.claude/settings.json`; nothing is deleted. Keep → `true` there (records it; only `false` is honored). The user-level switch hides them in every project and moves them to `~/.claude/skills/.trash` — never set it unprompted: mention it only if the user asks for a global switch, and change `~/.claude/settings.json` only with their go-ahead.
5. mattpocock-skills — only if Phase 1 found the full plugin enabled. AskUserQuestion (header "mattpocock"): "Disable the full mattpocock-skills plugin in this project? Camp uses only improve-codebase-architecture; its tdd / diagnose / handoff / write-a-skill overlap Superpowers." → "Disable here + standalone skill ★" · "Keep". Disable → `.claude/settings.local.json` `enabledPlugins: {"mattpocock-skills@<marketplace>": false}` + the standalone skill: Phase 3's `npx skills@latest add mattpocock/skills/improve-codebase-architecture` (GREENFIELD/ADOPT run it, printing it if blocked; REFRESH never installs — it lists the command in its diff and prints it as ⏸️ pending). Keep → write nothing (a `true` there would re-enable the plugin here if the user later disables it globally).
Batch the questions that apply — plus Memory consolidation's "Auto-memory" one — into AskUserQuestion calls of ≤4. NEVER set `disableBundledSkills` or turn the `workflow-authoring` skill off to save tokens (see the Phase 1 warning). Before writing `.claude/settings.local.json`, check `git check-ignore -q .claude/settings.local.json`; not ignored → add `.claude/settings.local.json` to `.gitignore` in the same diff (personal values must not reach teammates).
REFRESH: collect only the undecided items — absent keys, the agent file if neither `.claude/agents/general-purpose.md` nor the decline note exists — plus `autoMemoryEnabled` when Memory consolidation applies and MEMORY.md is empty or absent (a non-empty one goes through its own migration step, never this one). None → skip silently. Else print ONE diff (settings.json and settings.local.json keys, the new agent file, any `.gitignore` line, the pending `npx` command), then AskUserQuestion (header "Settings"): "Apply these spawn-cost settings?" → "Apply ★" (Artifact off, matcher, override yes, auto-memory off) · "Choose per item" (the questions above) · "Skip" (nothing written; offered again next refresh). The personal items — claude.ai skills, mattpocock — are always asked on their own, never folded into "Apply".
Settings are read, and agent files loaded, at session start — new values apply from the next session (restart Claude Code).

**Memory consolidation — BOTH modes; in REFRESH an opt-in step.** One memory system: recommend claude-mem (searchable history, nothing loaded per spawn) + `.claude/settings.json` `autoMemoryEnabled: false`. Root CLAUDE.md's `## Working agreements` takes over auto-memory's best feature — standing user preferences, always loaded. GREENFIELD/ADOPT: run it at the end of Phase 4, once root CLAUDE.md is written.
- Applies when claude-mem (or another memory tool from Phase 1) is installed or chosen in Phase 3 and no settings file — user, project or local — sets `autoMemoryEnabled`; no memory tool → keep auto-memory on (it's the only memory) and skip this step.
- No MEMORY.md, or an empty one → ask with the Spawn-cost questions (header "Auto-memory"): "Turn off Claude Code's auto-memory? claude-mem holds history; Working agreements hold your preferences." → "Off ★" (`false` in `.claude/settings.json`) · "Keep" (`true` in `.claude/settings.local.json` — records it for this user only; in the committed file it would override teammates who turned auto-memory off).
- MEMORY.md non-empty → one-time migration first. Read MEMORY.md and the files it links, then propose ONE diff — write nothing before the user approves; English, per `core.md`:
  - user feedback / standing preferences → lines under `## Working agreements` in root CLAUDE.md (create it right after `## Project invariants`; cap 10 — merge, or ask which to keep);
  - backlog / open items → `docs/STATUS.md` (create it if missing — ADOPT's Phase 5 ORIENT keeps them; keep its ~40-line cap: group, link out);
  - case-law / incident notes → linked docs (`docs/notes/<topic>.md`, linked from where they apply) or, if decision-shaped, ADRs in `docs/adr/` — the user picks per group;
  - anything CLAUDE.md, STATUS, the ADRs or git already hold → skip it and say so.
  AskUserQuestion (header "Memory"): "Apply the migration and turn auto-memory off?" → "Apply ★" · "Show full diff" (then re-ask) · "Keep auto-memory" (`autoMemoryEnabled: true` in `.claude/settings.local.json`). Apply → write the diff + `autoMemoryEnabled: false`. NEVER delete or edit MEMORY.md or the files it links — they stay on disk, just no longer loaded (`true` brings them back).

**CLAUDE.md cleanup — REFRESH only, opt-in.** Older CLAUDE.md files still carry camp lines that now live in `.claude/rules/core.md`, the persona, or an HTML comment, a stale "the env catches every subagent" claim, and code-review-graph's appended tool guide. At the repo root run `node "<plugin root>/scripts/claude-md-cleanup.js" CLAUDE.md` (no `node` or no plugin root → skip this step and say so). It prints `SKIP` until `core.md` and the persona file exist (so run it after the Plugin-copy refresh), `CLEAN` when nothing matches, else a diff with each line's new home. It matches only camp's exact wording — a curated list, whitespace and backticks ignored; camp lines someone edited are listed, never changed; every other line is project text and is left alone. The graph guide becomes a marker-only HTML comment (0 tokens) so `code-review-graph install` reports the block as edited instead of re-appending it. Show the output, then AskUserQuestion (header "CLAUDE.md"): "Apply this cleanup?" → "Apply ★" · "Skip". Apply → re-run with `--apply` (it backs up to `.claude/CLAUDE.md.bak` first; undo: `mv .claude/CLAUDE.md.bak CLAUDE.md`), then once more without — it must print `CLEAN`. Measured: socialcamp −1,759 loaded chars, scrumcamp −1,957.

**ADOPT mode — STRICTLY ADDITIVE (never overwrite existing code/config):**
- Generate the root `CLAUDE.md` FROM the detected stack (describe what's actually there — do NOT fabricate). If a `CLAUDE.md` already exists, MERGE: add the `@.claude/PmCamp.md` import + any missing sections, show a diff, never clobber their content.
- Add `.claude/PmCamp.md` (stub) + `.claude/PmCamp.persona.md` + `.claude/rules/core.md` + `.claude/camp/workflows/` (via the **Plugin-copy refresh** block above — stamped, drift-aware) + the import line.
- Create `docs/`, `docs/requirements/`, `docs/adr/` + the ADR template ONLY if missing.
- Architecture doc — detect an existing one first: `find . -maxdepth 3 -iname 'architecture*' | grep -v -e '/node_modules/' -e '/\.git/'` (empty output = none; a command error is not), plus a `## Architecture` heading in CLAUDE.md (case-insensitive). Found → if its first line is `Verified at …` it's PmCamp's own (leave it); otherwise aim the CLAUDE.md `docs/ARCHITECTURE.md` pointer line at it, replacing its "(created once …)" note with "(user-owned)" — Phase 5 ORIENT offers additions to it as a diff, NEVER overwrites. None → Phase 5 ORIENT drafts `docs/ARCHITECTURE.md` (≥2 domain modules only).
- Reflect the project's EXISTING quality tooling (detected linter/test runner) in CLAUDE.md — do NOT impose a new one. If there is NO quality setup at all, OFFER to add it; don't force.
- Do NOT create stack folders, configs, `.env.example`, or `.gitignore` that already exist. For `.gitignore`, APPEND missing entries (graph DB, claude-mem store, `.claude/**/*.bak`, `.claude/settings.local.json`) — don't rewrite. Prettier detected (a `.prettierrc*` / `prettier.config.*`, a `prettier` dependency or key in package.json, or a lint-staged rule calling prettier) → create `.prettierignore` or APPEND `.claude/` to it (see the GREENFIELD Quality bullet for why).
- Write/merge `.claude/settings.json` with the chosen model tier + the **Spawn-cost settings** above — SAME merge + conflict rules as the greenfield bullet below (preserve all other keys; differing `model` / `env.CLAUDE_CODE_SUBAGENT_MODEL` → AskUserQuestion "Keep existing" · "Apply <tier>"; matching values stay silent).
- Stack rule files (which ones: the GREENFIELD `.claude/rules/` bullet; Django gets none — skip this bullet) — first compare the detected layout with our module-based structure. Matches → seed/refresh them via the **Plugin-copy refresh** block above. Differs → ONE AskUserQuestion (header "Conventions"): "Existing layout: <detected>. Conventions for NEW code?" → "Follow existing ★" · "Adopt claude-camp structure". "Follow existing" → skip the stack rule files (`core.md` still carries English-only + impact analysis) and record the detected conventions briefly in CLAUDE.md (one `- Conventions: …` line under Stack, noting the stack rules were declined). "Adopt claude-camp structure" → as on a match. Never re-ask a made choice: a `Conventions:` line in CLAUDE.md = Follow existing; stack-rule copies already in `.claude/rules/` before this run = Adopt. Never restructure existing code either way.
- Django + MongoDB detected → don't copy `mongodb.md` (Beanie-specific); note that on CLAUDE.md's Backend line (`— mongodb.md doesn't apply (Beanie-specific)`).
- Skip every greenfield step below that would re-create something the repo already has.
Then go to Phase 5. The steps below are the GREENFIELD scaffold.

**GREENFIELD mode:** Create the per-project basecode from the Phase 2 answers. If a file already exists, show a diff and ASK before overwriting.

Files to create — ADAPT to the stacks chosen in Phase 2. Do NOT scaffold a folder, config, or CLAUDE.md level for a stack that is None.

- CLAUDE.md:
  - Full-stack (BE + FE) → root `CLAUDE.md` (lean, template below) + `backend/CLAUDE.md` + `frontend/CLAUDE.md` (sub-files load on demand; keep lean, no duplication of root).
  - Single-stack → ONE root `CLAUDE.md` only (no split — nothing to scope).
- `.claude/PmCamp.persona.md` — the PmCamp persona, and `.claude/PmCamp.md` — the stub root CLAUDE.md imports via `@.claude/PmCamp.md` (both via the **Plugin-copy refresh** block — stamped, drift-aware). The camp plugin's SessionStart hook injects the persona into the main session only; sub-agents see just the stub.
- `.claude/camp/workflows/` — `readiness.md` and `milestone-close.md`, the gate procedures PmCamp Reads at intake and at milestone close (via the **Plugin-copy refresh** block). Nothing auto-loads them: zero tokens until a trigger fires.
- `.claude/rules/` — rule files WITHOUT `paths:` frontmatter auto-load at launch (global), so they are reliably present when CREATING and editing files — first module / greenfield included. This is the only create-reliable mechanism: `paths:` auto-scope injects on Read not Write (#23478), and subdirectory `CLAUDE.md` (e.g. `backend/CLAUDE.md`) loads only on demand, is unreliable in practice (#24987, #2571), and does NOT survive compaction (only root survives) — so do NOT route conventions through it. COPY the relevant bundled rule file(s) from `${CLAUDE_PLUGIN_ROOT}/rules/` into the PROJECT-ROOT `.claude/rules/` (NOT `backend/.claude/rules/`) — via the **Plugin-copy refresh** block (stamped, drift-aware), same pattern as PmCamp.md — `core.md` for EVERY project (FE-only included), plus by the locked stack: `node.md` if the backend is Node, `python.md` if the backend is FastAPI (Django: no structure rule file — it keeps Django's app layout), `mongodb.md` if DB = MongoDB (never for Django — Beanie-specific). If no plugin root resolves (see the refresh block), warn and skip (don't hand-write them).
- `.claude/settings.json` — per-project, COMMITTED. Sets the locked model tier (ALIAS-based model names, not full IDs) + the **Spawn-cost settings** above:
  - Flagship → `{"model": "fable", "env": {"CLAUDE_CODE_SUBAGENT_MODEL": "sonnet"}}`
  - Premium → `{"model": "opus", "env": {"CLAUDE_CODE_SUBAGENT_MODEL": "sonnet"}}`
  - Balanced → `{"model": "sonnet"}`
  - Economy → `{"model": "sonnet", "env": {"CLAUDE_CODE_SUBAGENT_MODEL": "haiku"}}`
  WHY the env var: a subagent dispatched WITHOUT a `model` inherits the session model, so an Opus/Fable PM would leak into it; `CLAUDE_CODE_SUBAGENT_MODEL` is the default for those spawns. Measured on Claude Code 2.1.289, a dispatch's own `model` wins over the env — and Superpowers names one per role (cheap tier for mechanical tasks, standard for builds, the most capable for the final review), which fits Premium and Flagship, so camp keeps it; on Balanced or Economy those picks can exceed the tier (an Opus final review). Its reviewers without a `model` (spec, plan, standalone code review) take the env. Exception: Claude Code's built-in Explore and Plan agents declare `model: inherit` and run on the PM's model (Explore capped at Opus) — the env doesn't reach them, so the persona tells PmCamp to pass `model` on every dispatch (Explore → `haiku`, Plan → `sonnet`). Strict cost ceiling — opt-in only, never a default or a picker option: add `"CLAUDE_CODE_SUBAGENT_MODEL_FORCE": "1"` to `env`; the env then wins over every dispatch, Superpowers' picks included (Claude Code ≤2.1.220 ignores it).
  MERGE, never clobber: if `.claude/settings.json` exists, preserve every other key (permissions, hooks, other env vars). If `model` or `env.CLAUDE_CODE_SUBAGENT_MODEL` already exists with a DIFFERENT value, ask via AskUserQuestion (header "Settings"): "Keep existing" · "Apply <tier>". Values that already match are silent — idempotent re-runs change nothing. Spawn-cost keys: absent → add per the block above; present → leave as is.
- `.claude/agents/general-purpose.md` (if opted in) and `.claude/settings.local.json` keys (if asked) — per the **Spawn-cost settings** block above.
- Folders: `docs/`, `docs/requirements/` (drop requirement docs here), `docs/adr/`. Add `backend/` only if BE ≠ None, `frontend/` only if FE ≠ None. Single-stack → code at root or `src/`. Backend internals are scaffolded module-based — see **Backend scaffold** below.
- `docs/adr/0000-template.md` — ADR template: Context / Decision / Consequences.
- Quality config for the stacks that exist (per Phase 2 choice): Python BE → Ruff + mypy(strict) + pytest; Node BE → Biome + tsc + Vitest, **except NestJS** which keeps its shipped ESLint + Prettier (Biome's `useImportType` rewrites DI value-imports to `import type` and breaks NestJS metadata at runtime — state this decision in the diff summary); FE → eslint + prettier + vitest. Husky + lint-staged via the setup-pre-commit skill, scoped to the file types present. Whenever Prettier is in the scaffold (FE, NestJS, or setup-pre-commit's `"*": "prettier --ignore-unknown --write"` rule), create `.prettierignore` or append `.claude/` to it BEFORE any commit runs the hook (setup-pre-commit's last step commits the staged files): Prettier reformatting the stamped copies breaks their hash, and every refresh then reports a false `✏️ user-modified`.
- `.env.example` — documented placeholder keys (no real secrets). MongoDB → include `MONGODB_URI` + DB name; SQL → the chosen DB's connection URL.
- `.gitignore` — claude-mem store, code-review-graph DB, `node_modules/`, `__pycache__/`, `.env`, build output, `.claude/settings.local.json` (personal overrides stay out of git; the shared `.claude/settings.json` IS committed), `.claude/**/*.bak` (refresh backups).
- DB local dev (only if Backend ≠ None): `docker-compose.yml` with the chosen DB service (MongoDB for Mongo, else the SQL engine) for local dev. See **DB connection** below.
- If CI = Yes: `.github/workflows/ci.yml` with one job per EXISTING stack only:
  - Node BE → `pnpm install` → `biome check` (NestJS: `eslint`) → `tsc --noEmit` → `vitest run` → `build`.
  - Python BE → `uv sync` → `ruff check` → `mypy` → `pytest`.
  - FE → its eslint + vitest + build.
- Design system (only if Frontend ≠ None AND choice ≠ None): fetch `https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/<site>/DESIGN.md` (site = apple | coinbase | notion | claude | clay) and save it as `DESIGN.md` at the FE root — `frontend/DESIGN.md` for full-stack, project-root `DESIGN.md` for FE-only. Then add one line to the FE CLAUDE.md (frontend/CLAUDE.md, or root for FE-only): "When building UI, follow DESIGN.md." If the fetch fails (network/path), warn the user and fall back to None — do NOT block scaffolding.
- `git init` if not already a repo.

**Backend scaffold (generator → overlay). Do NOT hand-write framework boilerplate — run the official generator, then OVERLAY our module structure + rules + tooling + CLAUDE.md.** Idempotent + graceful-degrade: if a generator is blocked (approval/network/classifier), print the exact manual command, mark ⏸️ pending, and continue. Run only the generator for the LOCKED backend choice.

Generators (verified):
- **NestJS** (default Node): `npx @nestjs/cli new backend --package-manager pnpm --skip-git --strict` (suppresses the PM prompt; `--skip-git` since the repo already has git). Generates `src/main.ts`, `src/app.module.ts`, `app.controller.ts`, `app.service.ts` + Nest's ESLint/Prettier.
- **Fastify**: `npm i -g fastify-cli && fastify generate backend --lang=ts` (TypeScript template; bare `npm create fastify` is JS-first).
- **Express**: no standard generator → scaffold manually per the structure below.
- **FastAPI**: no official generator → scaffold manually per the structure below.
- **Django**: `django-admin startproject` (then keep Django's own app layout — do NOT force the module structure below; Django apps are its idiom).
- Frontend (reference): Vite `pnpm create vite frontend --template react-ts`; Next `npx create-next-app@latest frontend --ts --app --use-pnpm --yes`.

After the generator, reorganize/overlay to module-based structure (`<domain>.` prefix on Node files; NO prefix on Python). Full directory specs live in the bundled rules — `rules/node.md`, `rules/python.md`, `rules/mongodb.md` (copied into `.claude/rules/` above). Summary:
- **NestJS**: `src/{main.ts, app.module.ts}`, `src/modules/<domain>/{<domain>.module.ts, .controller.ts, .service.ts, .repository.ts, dto/}`, `src/{common,config,db}/`. MongoDB: shared `src/schemas/<domain>.schema.ts` (`@Schema`), registered per module via `MongooseModule.forFeature([{ name, schema }])`; root `MongooseModule.forRootAsync` in `app.module.ts`.
- **Fastify/Express**: `src/{index.ts, app.ts}`, `src/modules/<domain>/{<domain>.routes.ts, .controller.ts, .service.ts, .repository.ts, .validation.ts (zod/JSON schema), .middleware.ts?}`, `src/{middlewares,config,lib,db}/`. MongoDB: shared `src/schemas/<domain>.schema.ts` (Mongoose schema+model).
- **FastAPI**: `src/{main.py, db.py}`, `src/modules/<domain>/{router.py, service.py, repository.py, dto.py, dependencies.py, exceptions.py?}`, `src/{core,common}/`, `tests/` (mirror src), `pyproject.toml`. MongoDB: shared `src/schemas/<domain>.py` (Beanie `Document`).

**Schema location is DB-AWARE** (important): the centralized `src/schemas/` convention applies to **MongoDB ONLY**. For SQL ORMs follow the ORM's own convention — Prisma `prisma/schema.prisma`, Drizzle `src/db/schema.ts`, SQLModel/SQLAlchemy the models module. Do NOT force `src/schemas/` for SQL.

**Node tooling overlay**: TypeScript strict, pnpm, Vitest, Pino logging; scripts `dev`/`build`/`typecheck`/`test`/`lint`; validate env at startup; centralized error handling; no hardcoded secrets. Linter: **Biome** for Fastify/Express (`npm i -D @biomejs/biome && npx @biomejs/biome init`); **NestJS keeps its shipped ESLint + Prettier** (Biome's `useImportType` breaks DI — see Quality note).
**Python tooling overlay**: uv + Ruff + mypy(strict) + pytest, single `pyproject.toml`, type hints, async.

**Sample `health` module** (always — so the app runs immediately and demonstrates the structure): one `health` module exposing `GET /health` following the chosen framework's conventions (NestJS controller, Fastify/Express route, FastAPI router; Django: a view at `GET /health` routed in the project `urls.py` — no `modules/`). `modules/` otherwise starts EMPTY — feature modules arrive via `/kickcamp`.

**DB connection + env (Backend ≠ None):**
- MongoDB: connection/init module wired into startup — Mongoose `connect` (or `MongooseModule.forRootAsync`) in `db/`; Beanie `init_beanie(database, document_models=[...])` in `db.py` (await in FastAPI lifespan). `.env.example` with `MONGODB_URI` + DB name. `docker-compose.yml` with a local `mongo` service.
- SQL: analogous connection setup for the chosen ORM/DB + the DB's connection URL in `.env.example` + that engine in `docker-compose.yml`. Django: no separate connection module — `DATABASES` in `settings.py` reads `DATABASE_URL`.

**`backend/CLAUDE.md`** (full-stack split, or part of root CLAUDE.md if backend-only) — concise: state the backend stack + tooling, point to its structure, and reference the rules (Django: app layout, no rules section):
```markdown
# Backend — {NestJS|Fastify|Express|FastAPI|Django} ({Node|Python})

## Stack
- Framework: {…} · ODM/ORM: {Mongoose|Beanie|Prisma|Drizzle|SQLModel|SQLAlchemy|Django ORM} · DB: {…}
- Tooling: {pnpm + Biome/ESLint + Vitest + tsc | uv + Ruff + mypy + pytest}

## Structure
- {Module-based: `src/modules/<domain>/` — layered route/controller → service → repository. | Django: Django's app layout (one app per domain) — no `.claude/rules/` structure file.}
- Schemas: {`src/schemas/` (MongoDB) | ORM convention}. Validate at the edge ({dto/ class-validator | <domain>.validation.ts zod | dto.py Pydantic}).

## Rules
Conventions live in `.claude/rules/` (auto-loaded at launch).   ← omit this section for Django
```

Do NOT create an output-style file for the persona — the hook injects it; a user's own `outputStyle` (e.g. in `settings.local.json`) would silently replace a PmCamp style.

Root CLAUDE.md template (fill {placeholders} from Phase 2; OMIT any line for a stack that is None):
```markdown
# {Project Name}

## Stack
- Backend: {FastAPI|Django (Python) | NestJS|Fastify|Express (Node)} · {database} · {ODM/ORM}   ← omit if no backend
- Frontend: React + {Vite|Next.js} {+ state mgmt, e.g. Redux Toolkit, if used}   ← omit if no frontend
- Tooling: {pnpm|npm|yarn} · {uv|poetry|pip if Python BE}            ← keep only what exists
- Quality: {ruff+mypy+pytest (Python) | biome+tsc+vitest, or eslint+prettier for NestJS (Node)} · {eslint+prettier+vitest (FE)}   ← keep only what exists

## Model routing
- Tier: {Flagship|Premium|Balanced|Economy} — `.claude/settings.json` sets the PM `model` and the default subagent model via `env.CLAUDE_CODE_SUBAGENT_MODEL`; a dispatch that names its own `model` keeps it.
<!-- Why these tiers: Opus-class for planning, architecture, code review, hard debugging; Sonnet for build/test/refactor; Haiku only for bulk mechanical work, no judgment.
The env is the default for spawns that pass no model — not for built-in Explore/Plan, which inherit the PM's model unless PmCamp passes one (Explore → haiku, Plan → sonnet). Measured on Claude Code 2.1.289, a dispatch's own `model` wins: Superpowers picks per role (Haiku mechanical, Sonnet build, Opus final review); on Balanced/Economy that can exceed the tier.
Strict cost ceiling (opt-in, e.g. for Economy): add `"CLAUDE_CODE_SUBAGENT_MODEL_FORCE": "1"` to settings `env` — the env then wins over every dispatch.
Escape hatches: one-off session — `CLAUDE_CODE_SUBAGENT_MODEL=opus claude` (shell env beats settings env); personal — `.claude/settings.local.json` (git-ignored, higher precedence than the shared settings); `/model` switches the PM for a session.
Pinning: replace aliases with full IDs (e.g. `claude-opus-4-8`, `claude-sonnet-4-6`) in settings.json when reproducibility matters. -->

## Tool usage
<!-- English-only, graph before Grep, impact analysis and the key graph tools live in .claude/rules/core.md (loaded by every sub-agent). -->
- `docs/ARCHITECTURE.md` — module map (created once ≥2 domain modules exist); read it before cross-module or shared-code work. On-demand — never `@`-import it.
- {Memory line — fill from Phase 3: if claude-mem chosen → "claude-mem holds session history — query it, do NOT re-paste prior decisions." If another memory tool detected (agentmemory/mem0/etc.) → swap "claude-mem" for that tool's name. If memory was skipped → OMIT this line.}
- Fetching: WebFetch for public pages; agent-browser (if installed) for dynamic or auth-walled pages. A recurring fetch/parse pattern → a named tool under "## Dedicated tools".
- PDFs: `pdftotext`, not Read (Read loads PDFs as images) — unless the user asks to analyze their images/charts.
- Write the least code that works — reuse existing / stdlib / native before adding.
- {caveman line — ONLY if caveman was installed in Phase 3: "caveman is on-demand only (`/caveman [lite|full|ultra]`) — never compress PmCamp's user-facing messages." OMIT this line if caveman wasn't installed.}
<!-- ponytail enforces that minimalism at code-generation time (its own hooks inject the ladder). Modes: `/ponytail ultra` if it still over-builds; `/ponytail off` if it ever under-builds. karpathy-skills = engineering principles; ponytail = the operational minimalism layer — they layer, not duplicate. -->

## Dedicated tools
- {Project-specific fetch/parse tools go here, each linking to its skill or script. Orchestration lives in those files, not in this list.}

## Token discipline (large repo)
- Scope every task to a specific module/dir. NEVER "scan the whole repo".
- Before reading, state which files and why; read only what the graph flags in-scope. No bulk reads.
<!-- Keep this file ≤150 lines; let claude-mem hold history, not CLAUDE.md. -->

## PmCamp persona
@.claude/PmCamp.md
<!-- PmCamp.md is a stub: the persona (.claude/PmCamp.persona.md) is injected into the main session only, by the camp plugin's SessionStart hook. .claude/PmCamp*.md, camp's .claude/rules/ and .claude/camp/workflows/ are plugin copies — `/basecamp refresh` syncs them. Engineering principles come from andrej-karpathy-skills; the Superpowers meta-skill enforces brainstorm → plan → TDD → review. Do NOT restate either here. -->

## Project invariants
- {Fill per project — e.g. data integrity rules, security constraints, must-pass checks}

## Working agreements
<!-- Standing user preferences (format, workflow, do/don't). PmCamp adds one on the FIRST correction: `preference (YYYY-MM-DD)`, English. Hard cap 10. Agent mistakes go to Known pitfalls. -->

## Known pitfalls
<!-- Empty until a project-specific agent mistake recurs — PmCamp appends one line on the 2nd occurrence: symptom → do instead (YYYY-MM-DD). Hard cap 10. -->

## Forbidden zones
- {Dirs not to scan or edit — e.g. legacy/, generated/}
```
</phase_4_scaffold>

<phase_5_verify>
- Run `code-review-graph status` → confirm graph built AND auto-update hooks registered.
- Memory (conditional): if claude-mem was installed → confirm active for this project (`claude-mem status`). If another memory tool was detected in Phase 1 → confirm it's active instead. If memory was skipped → note "memory tool not configured".
- If a backend was scaffolded: confirm it RUNS — start it and hit `GET /health` (or run the generator's smoke test). Then per framework: NestJS / Fastify / Express / FastAPI → the connection/init module is wired, the module-based layout exists (`src/modules/health/`, schemas in the DB-aware location) and the relevant rule file(s) were copied into `.claude/rules/` (node.md / python.md / mongodb.md); Django → Django's app layout + the `/health` view + `DATABASES` reading `DATABASE_URL` (listed in `.env.example`) — no `src/modules/` check, no stack rule files. For MongoDB confirm `docker-compose.yml` + `MONGODB_URI` in `.env.example`.
- PmCamp: `.claude/PmCamp.md` (stub), `.claude/PmCamp.persona.md`, `.claude/rules/core.md` and every plugin workflow in `.claude/camp/workflows/` exist (the persona may be absent only if the user chose "Keep mine" at migration); copies written this run hash to their stamps — `✏️` files the user kept are reported, not failed; the hook run as in Phase 1 prints the persona (not `NOT injected`). It injects it from the next session on (camp ≥1.2.7 loaded — restart Claude Code after a plugin update).
- If Prettier is present: `npx prettier --file-info .claude/PmCamp.md` (plus any `--ignore-path` flags the lint-staged prettier command passes) must report `"ignored": true`, and every copy stamped this run must still hash to its stamp (Phase 1 check) — lint-staged's prettier run then skips the stamped copies.
- Model tier + spawn cost: confirm `.claude/settings.json` exists, is valid JSON, and contains the chosen tier's mapping (`model`, plus `env.CLAUDE_CODE_SUBAGENT_MODEL` for tiers that set it) and the Spawn-cost answers (`enableArtifact`, `env.PONYTAIL_SUBAGENT_MATCHER`, `autoMemoryEnabled` if asked; `.claude/settings.local.json` valid JSON if written). Then a LIVE check — file inspection is NOT enough (old reports of subagent model config being ignored, #5456, and VS Code-extension env quirks): spawn ONE general-purpose subagent WITHOUT a `model`, prompt "Without using any tools, list the exact names of every tool available to you, comma-separated." Confirm:
  - the model it actually ran on matches the tier's subagent model (the env default; a dispatch that names a model runs that model by design) — via the transcript's model field or the `/cost` per-model breakdown;
  - override chosen → its list has no `Skill` but keeps `ToolSearch` (and `mcp__…` names when an MCP server is configured); `enableArtifact: false` → no `Artifact`.
  On mismatch, report it plainly and point to CLAUDE.md's Model routing; do not silently pass. CAVEAT: settings are read and agent files loaded at session start (verified: an agent file written mid-session doesn't apply) — anything written THIS session isn't live yet: report the file checks, mark the live check ⏸️ pending restart, and tell the user to re-verify after restarting Claude Code. `autoMemoryEnabled: false` → after the restart, `/context`'s memory files no longer include `MEMORY.md`.
- Confirm Superpowers chain is complete (at least brainstorming + writing-plans present).
- Confirm andrej-karpathy-skills is active — engineering principles depend on it (they were intentionally NOT written into CLAUDE.md).
- If a design system was chosen: confirm `DESIGN.md` exists at the FE root and the FE CLAUDE.md points to it.
- ADOPT mode only: ORIENT before finishing — query the graph (overview tools per `.claude/rules/core.md`; never the `architecture_map` prompt) + read the main entry points to map the current architecture. If Phase 4 found an existing architecture doc, offer what the map adds to it as a diff (NEVER overwrite); otherwise, if the codebase has ≥2 domain modules, write it to `docs/ARCHITECTURE.md` in PmCamp's format (first line `Verified at <commit>`; module map, boundaries, data flow, key contracts, shared hotspots; links `.claude/rules/` + `docs/adr/`; English; ≤80 lines) — with fewer, skip it. Then write an initial `docs/STATUS.md` (keeping any backlog Memory consolidation already put there) — STATE ONLY (where things stand; no architecture) — so the first /kickcamp has grounding. Graph MCP not live yet (installed this session) → map from entry points + directory layout and say so. Do NOT invent state you didn't verify from the code.
- List every file created and every tool configured.
- Output: `🏕️ Basecamp ready ({GREENFIELD|ADOPT}). Stack: {summary of stacks + design system if any}. Next: drop a requirements doc in docs/requirements/ and run /kickcamp, or describe your first feature.`
</phase_5_verify>
