# Backlog — việc cần nâng cấp (deferred)

> Hoãn lại để test bộ hiện tại (basecamp + kickcamp) trước.

## 1. PM notifications + remote control ⭐ (priority)

**Problem:** the VS Code terminal doesn't turn OSC sequences into OS notifications, so you miss it when the PM is waiting for input or has finished.

- **Recommended path — Anthropic Remote Control:** first-party push notifications, reply/approve from the Claude app, server mode with worktrees.
- **Telegram only if a Telegram group is a hard requirement:** evaluate Anthropic Channels first; Untether / CCGram only after that.
- **Phone vs desk:** phone = monitor / answer / approve direction; desk = verify, close milestones, risky approvals. Never yolo.
- **Superseded:** the earlier plan (`Notification` / `Stop` hooks → Telegram Bot API) — keep only as a no-app fallback: global, token in the shell profile, never committed, never inside `/basecamp`.

## 2. Template repo (chỉ khi cần)

Nếu sau này hội tụ về **một stack cố định** → cân nhắc tạo GitHub template repo cho skeleton tĩnh, `/basecamp` chỉ lo audit/install + phần biến thiên. Hiện stack còn linh hoạt nên giữ slash command.

## 3. Tách sub-agent theo evidence (two-strikes)

Khi pattern lặp ≥3 lần thì mới tách agent riêng (vd mobile-engineer, security-auditor, database-engineer). Không tách sớm.

## 4. Design system cho FE — awesome-design-md (VoltAgent) ✅ ĐÃ IMPLEMENT

> Đã tích hợp vào /basecamp: Phase 2 câu #7 (chỉ hỏi nếu có FE), Phase 4 fetch DESIGN.md + fallback None, Phase 5 verify.

**Cơ chế (đã xác nhận qua repo):** mỗi site = 1 file `DESIGN.md` markdown thuần (chuẩn Google Stitch) — color, typography, components, layout, do's/don'ts, responsive, agent prompt guide. Dùng = copy DESIGN.md vào project → agent đọc để build UI khớp. KHÔNG phải code/lib, chỉ là style guide.

**→ Đúng: user chọn option → tải `DESIGN.md` của site đó về source code.**

**Luồng trong /basecamp:**
- Phase 2 (CHỈ hỏi nếu có FE): "Design system? None (mặc định) / Apple / Coinbase / Notion / Claude / Clay"
- Nếu ≠ None → Phase 4 fetch:
  `https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/<site>/DESIGN.md`
  (site = apple | coinbase | notion | claude | clay)
- Đặt: FE-only → project root; FE+BE → `frontend/`
- Thêm dòng trỏ trong frontend/CLAUDE.md (hoặc root nếu FE-only): "Khi build UI, tuân theo DESIGN.md"
- BE-only → bỏ qua hẳn câu hỏi này

**Lưu ý:** repo MIT (~2k sao), design tokens là CSS công khai. Khi implement nhớ xử lý lỗi fetch (mạng/đường dẫn) — fallback None nếu tải fail.

## 5. Luồng cho dự án CÓ SẴN (brownfield) ✅ ĐÃ IMPLEMENT

> Đã thêm **ADOPT mode** vào /basecamp: Phase 1 auto-detect codebase sẵn (hoặc `/basecamp adopt`) → Phase 2 DETECT stack thay vì interview → Phase 4 strictly-additive (merge CLAUDE.md, không đè, không tạo cái đã có) → Phase 5 PM orient + viết STATUS.md đầu. Greenfield giữ nguyên.

Cũ: `/basecamp` + `/kickcamp` tối ưu greenfield. Giờ adopt audit code sẵn, build graph trên đó, sinh CLAUDE.md TỪ code, scaffold chỉ phần thiếu.

## 6. Memory layer — cân nhắc swap claude-mem → agentmemory (THEO DÕI)

**Trạng thái:** đang theo dõi, chưa làm. (rohitg00/agentmemory, ~11.6k sao, Apache-2.0)

**Kết luận sau khi research:**
- agentmemory KHÔNG giúp tiết kiệm token / nhanh hơn *đáng kể* so với claude-mem — cả hai đã giải quyết vấn đề token vs paste-all. Khác biệt token giữa hai cái là nhỏ.
- Thắng lợi thật của agentmemory = **chất lượng recall** (BM25+vector+graph, self-published 95.2% R@5) vs claude-mem FTS5 keyword (dễ miss semantic). Đúng nỗi lo "claude-mem lossy".
- **Giá phải trả:** nuôi 1 server nền local (iii-engine + worker, port 3111/3112/3113/49134), phải chạy suốt, 51 MCP tool (dùng `core` = 8). Ngược tinh thần gọn nhẹ.
- Số liệu agentmemory là **tự công bố**; claude-mem KHÔNG đo cùng benchmark → không phải head-to-head.

**Quyết định khi nào làm:** chỉ swap khi recall lossy của claude-mem **thực sự cản** — mà hiện đã có STATUS.md (explicit, không lossy) + code-review-graph (code) gánh phần lớn "nhớ đang ở đâu / cấu trúc". Memory plugin chỉ là 1/3 lớp continuity.

**Nếu làm:** pilot 1 project (có `import-jsonl` kéo transcript cũ + `demo`), chạy `core` mode, so recall vs claude-mem rồi mới quyết. Là SWAP, không chạy song song (double-capture).

**Ý tưởng liên quan (chưa chốt):** lệnh chọn memory backend ở `/basecamp` (detect → enable cái chọn + disable+stop cái kia → bảo restart). KHẢ THI nhưng: toggle plugin cần restart Claude Code, claude-mem tắt không sạch (bug worker/MCP), agentmemory cài nặng (engine/Docker + daemon) → cần graceful-degrade, không auto hoàn toàn.

## 7. Claude Code Agent Teams — chỉ cho feature song song thật (THEO DÕI)

**Trạng thái:** đang theo dõi, chưa dùng. (Agent Teams ship Feb 2026 cùng Opus 4.6, vẫn experimental — gated env flag, cần Claude Code v2.1.32+)

**Hiện dùng:** sub-agent (Task tool, qua Superpowers subagent-driven-development) — delegation, tuần tự, PM verify từng output. Đúng cho token-discipline + workflow milestone tuần tự. PmCamp ghi rõ "delegate to sub-agents".

**Agent Teams khác gì:** nhiều teammate độc lập, mỗi cái context window + Git worktree riêng, nói chuyện peer-to-peer qua mailbox + shared task list. Collaboration (squad phối hợp) thay vì delegation (intern báo cáo).

**Khi nào cân nhắc:** chỉ khi 1 feature có **≥2 luồng song song ĐỘC LẬP thật** — vd BE + FE dựng đồng thời cần coordinate realtime, hoặc parallel audit/exploration lớn. KHÔNG phải mặc định cho milestone tuần tự.

**Hại (so sub-agent):**
- Token cao — context nhân theo số teammate; claude-mem inject vào MỖI teammate → nhân nữa.
- Khó kiểm soát + verify tập trung (nhiều luồng tự chủ song song).
- Rủi ro conflict file → cần Git worktree cô lập.
- Experimental (chưa ổn định bằng) + lệch workflow tuần tự của Superpowers.

**Nếu thử:** bật env flag, dùng worktree cô lập, pair **cmux `claude-teams`** để visualize + notification, watch token sát. PmCamp có thể mở rộng để spawn teammate cho ca song song — nhưng là upgrade riêng, giữ sub-agent làm mặc định.

**Tóm:** Teams = đổi token + phức tạp lấy tốc độ song song. Đáng khi việc thực sự song song; còn lại sub-agent thắng chi phí + kiểm soát.

## 8. Node.js backend + MongoDB + module-based scaffolds ✅ v1.1.0

Added Node backends (**NestJS ★ / Fastify / Express**) + **MongoDB** alongside the existing Python (FastAPI/Django) + SQL stacks.

- **Phase 2 menu:** backend split into Python (A FastAPI ★, B Django) and Node (C NestJS ★, D Fastify, E Express); DB gains MongoDB; guard (FE & BE not both None) kept.
- **Scaffolds via official generators, then overlaid** with our module-based structure — NestJS `nest new`, Vite, `create-next-app`, Fastify CLI; FastAPI/Express scaffolded manually (no standard generator). Idempotent + graceful-degrade (blocked generator → manual command, ⏸️ pending, continue).
- **Module-based layout:** `src/modules/<domain>/` layered route/controller → service → repository; `<domain>.` prefix on Node files, no prefix on Python (FastAPI idiom — `router.py` is the handler, `dto.py` validates). One runnable `health` module ships so the app runs immediately.
- **DB-aware schema location:** shared `src/schemas/` is **MongoDB only** (Mongoose `*.schema.ts` / Beanie `*.py`); SQL ORMs keep their own convention (Prisma `schema.prisma`, Drizzle `src/db/schema.ts`, SQLModel/SQLAlchemy models module). NestJS registers schemas per module via `MongooseModule.forFeature`.
- **Conventions shipped as bundled rules** — `rules/{node,python,mongodb}.md`, copied into the project's `.claude/rules/` during Phase 4 (node.md if Node BE, python.md if Python BE, mongodb.md if DB = MongoDB), same pattern as PmCamp.md.
- **ODM:** Mongoose (Node) / Beanie (Python). **DB local dev:** `.env.example` `MONGODB_URI` + connection/init module wired into startup + `docker-compose.yml` with local Mongo.
- **Tooling:** Node = TS + pnpm + Biome + Vitest; Python = uv + Ruff + mypy + pytest. **Biome decision:** NestJS keeps its shipped ESLint + Prettier (Biome's `useImportType` rewrites DI value-imports to `import type` and breaks decorator metadata at runtime); Biome is the default for Fastify/Express.
- **Docs:** multi-level `backend/CLAUDE.md` referencing `.claude/rules/<stack>.md`; CI gains one job per chosen stack.

## 9. Interactive stack picker ✅ v1.1.1

Phase 2 now uses Claude Code's **AskUserQuestion** tool for a clickable, conditional stack picker instead of typed letter codes.

- **Entry:** one question — *Use default* / *Customize step-by-step* / *Describe my project*.
- **Chained dependent popups:** each step's options depend on prior answers (Backend Python/Node → framework follow-up; DB only if backend ≠ None; Python tool only if Python backend; design system only if frontend ≠ None).
- **Multi-select Change:** confirmation offers *Yes, build* / *Change something* → multi-select picker re-asks only the chosen fields, then re-confirms.
- **Split design-system list:** 6 choices exceed the 4-option cap → *None* / *Choose one* → Apple / Coinbase / Notion / *More…* → Claude / Clay.
- **Argument + letter-code bypass:** `/basecamp vite nestjs mongo` or legacy `1A 2C 3D` skip all popups → straight to confirmation; ADOPT mode shows the detected stack in one confirm question.
- **Typed-flow fallback:** if AskUserQuestion is unavailable, the same conditional structure runs as a typed conversational flow.
- **Unchanged:** available options, ★ defaults, auto-resolved layout/ORM/quality, and the entire scaffold (Phases 3-5).

## 10. Model-tier enforcement + session hygiene ✅ v1.2.0

Per-project model-tier presets, ~~ENFORCED~~ set via committed `.claude/settings.json` — not just CLAUDE.md guidance (v1.2.8: the env is the default, not a force — see Why).

- **Why:** CLAUDE.md "Model routing" was policy only — subagents default to INHERIT the session model, so an expensive session model (e.g. fable) leaked into every subagent. ~~Verified resolution order: env > per-invocation model param > agent-file frontmatter > inherit~~ — **corrected in v1.2.8** (measured on Claude Code 2.1.289): the env is only the default for spawns that pass no `model`; a dispatch's own `model` wins, and so does a built-in agent's `model: "inherit"` (Explore, Plan). `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` restores "env wins everywhere" — opt-in only (#25).
- **Phase 2:** new "Model tier" picker step (with the tooling step, 4 options): **Flagship** (fable PM · sonnet subagents) / **Premium ★** (opus PM · sonnet subagents) / **Balanced** (sonnet PM · sonnet subagents) / **Economy** (sonnet PM · haiku subagents — haiku weak for real impl). Default-stack entry locks Premium; "Describe my project" recommends a tier; argument bypass accepts `flagship`/`premium`/`balanced`/`economy` words; confirmation summary shows the tier. The "Change something" picker was folded to 4 groups (Stack · Tooling / Model tier · Design · Start over) — the old 6-item list exceeded AskUserQuestion's 4-option cap.
- **Phase 4:** writes the tier to `.claude/settings.json` (alias-based: `model` + `env.CLAUDE_CODE_SUBAGENT_MODEL`), committed. MERGE-never-clobber; differing existing values → AskUserQuestion (Keep existing · Apply tier); matching values silent (idempotent). ADOPT gets the same merge behavior. `.gitignore` gains `.claude/settings.local.json`.
- **CLAUDE.md routing demoted to policy doc:** states the enforcement mechanics + escape hatches (shell env `CLAUDE_CODE_SUBAGENT_MODEL=opus claude` beats settings env; `.claude/settings.local.json` personal override; `/model` for the PM) + pinning full IDs for reproducibility. Intent guidance (Opus = plan/review/debug, Sonnet = build, Haiku = mechanical) kept as the "why".
- ~~**Known trade-off (accepted):** the env also flattens per-invocation tier selection by the PM; escape hatches documented instead.~~ No longer true on 2.1.289 (see Why): per-dispatch picks — Superpowers' Haiku / Sonnet / Opus by role — survive. That fits Premium and Flagship; on Balanced or Economy an Opus final review exceeds the tier.
- **Phase 5:** verifies settings.json validity AND does a LIVE check — spawn one trivial subagent, confirm its actual model matches the tier (transcript/`/cost`); file inspection alone insufficient (#5456 reports + VS Code env quirks). Just-written settings → ⏸️ pending restart.
- **Session hygiene** (root CLAUDE.md template + PmCamp "State & continuity"): fresh session per milestone/feature starting from `docs/STATUS.md`, no marathons past ~150k context; `/clear` on unrelated work, `/compact` mid-task if context balloons; no unattended background/parallel sessions (shared limit).

## 11. ponytail minimalism plugin ✅ v1.2.1

Added [ponytail](https://github.com/DietrichGebert/ponytail) to the curated global toolkit — enforces YAGNI-ladder minimalism at code-generation time (reuse > stdlib > native > dep > one line > minimum), safety-preserving ("lazy, not negligent" — never trims validation, security, or accessibility).

- **Audit + install:** Phase 1 detects it alongside Superpowers / karpathy / claude-mem / code-review-graph / caveman / Matt Pocock / rtk / agent-browser; Phase 3 default-installs like Superpowers via `/plugin marketplace add DietrichGebert/ponytail` + `/plugin install ponytail@ponytail` (NOT opt-in). Ships two tiny Node.js lifecycle hooks (needs `node` on PATH; degrades gracefully if absent) and writes an optional `statusLine` entry to `~/.claude/settings.json` (bundled cleanup script). Default mode is **full** — not forced. Graceful-degrade: blocked install → manual command + ⏸️ pending + continue.
- **CLAUDE.md tool-usage:** one line stating ponytail enforces minimalism at code-gen; modes `/ponytail ultra` (aggressive) and `/ponytail off` (disable if it ever under-builds); explicit boundary vs karpathy — **karpathy-skills = engineering principles (Simplicity First); ponytail = the operational, measured minimalism layer (ladder + review/audit/debt commands)**. They layer, not duplicate.
- **PmCamp Verification:** at milestone close, run `/ponytail-review` on the milestone diff as an anti-over-engineering check — surface the delete-list if any. Non-blocking (prompt to trim, not a gate); complements the existing tests / git / acceptance verification.
- **README:** linked bullet under "What /basecamp sets up".

## 12. UI/UX + user-flow verification in PmCamp ✅ v1.2.2

**Problem:** sub-agents wrote tests, tests passed, milestone reported done — but nobody ran the actual product; user-facing features shipped with missing UI states and bare UX. Fixed at three levels (PmCamp.md + the fallback template in basecamp SKILL.md, kept in sync):

- **Spec (Intake → milestones):** acceptance criteria for any user-facing feature MUST include the primary user flows step by step, UI states (empty/loading/error/validation), responsive expectation where relevant, and `DESIGN.md` conformance when the project has one. Doc lacks these → requirement gap (existing ask flow); never invent the UX bar silently. Rationale: ponytail minimizes code FOR THE SPEC — an unstated UX bar makes "minimum" bare; raise the bar in the spec, not with vague "make it nicer" prompts.
- **Delegation (Execution):** task specs handed to sub-agents carry flows + UI states + design reference — not just functional behavior.
- **Verification:** milestones with a user-facing surface — passing tests is NOT sufficient. The PM builds & runs the app (doesn't build/render = NOT done), walks each primary flow end-to-end like a real user, checks UI states / console errors / `DESIGN.md`; uses agent-browser if installed (token-efficient), else degrades gracefully — outputs a concrete manual walkthrough checklist for the user instead of silently skipping. Evidence = which flows were walked and what was observed, not just test counts. BE-only milestones keep the existing verification unchanged. Recurring critical flows may graduate into automated E2E tests once they stabilize (evidence-based, not by default).

## 13. Refresh check for project-local copies ✅ v1.2.3

**Problem:** basecamp copies `PmCamp.md` + `rules/*.md` into the project's `.claude/`, and idempotent re-runs SKIP them ("already exists") — so when the plugin ships a new persona (e.g. the v1.2.2 UX verification layer), existing projects run the OLD copy forever. Plugin-loaded skills update automatically; project-copied files did not.

- **Version-stamped copies:** every copy gets a one-line first-line stamp `<!-- claude-camp: <file> v<X> · sha256:<12-hex> -->` (HTML comment — invisible to rendering, harmless to the `@.claude/PmCamp.md` import). Version from plugin.json; hash of the plugin source bytes → distinguishes "stale but untouched" from "user-modified" (`tail -n +2 | shasum -a 256` vs the stamp).
- **Phase 1 drift audit:** per copy, one audit-table row: `✅ current` · `⬆️ outdated` (older version, hash matches — untouched) · `✏️ user-modified` (hash mismatch or no stamp) · `❌ missing`.
- **Phase 4 non-destructive refresh** (GREENFIELD re-runs AND ADOPT): current → silent skip; outdated + untouched → refresh with notice ("Updated .claude/PmCamp.md → v<new>"); user-modified or unprovable → AskUserQuestion "Keep mine ★ · Show diff · Overwrite (back up to .bak)" — never overwrite without explicit confirmation, files sharing a state batched into one question; missing → copy fresh. Fallback-template writes stay unstamped → treated as user-modified later (safe default).
- **`/basecamp refresh` shortcut:** runs ONLY the drift audit + refresh step — no interview, no installs, no scaffold. Documented in the README commands table and the CLAUDE.md template (Tool usage).

## 14. English-only code + pre-change impact analysis ✅ v1.2.4

**Problem:** two recurring failure modes. (a) Vietnamese leaking into identifiers / comments / commits made code unreadable for external reviewers and lint tooling. (b) Sub-agents wrote & passed local tests, milestone reported done — then an unrelated caller broke in the next milestone; TDD proved the change, but nobody had checked *who else used that shared function/schema*.

- **English-only code (rules + CLAUDE.md tool-usage):** one rule in `rules/node.md` + `rules/python.md` and one line in the root CLAUDE.md template — "All code is English (identifiers, comments, docstrings, log messages, commit messages). Vietnamese is used ONLY for PmCamp ↔ user communication — NEVER in code or artifacts." Present even before rules load (in the template).
- **Pre-change impact analysis (PmCamp Execution + Verification):** before a sub-agent edits SHARED / interface code (function, type, schema, API used elsewhere), it MUST query code-review-graph for its dependents and verify the IMPACTED callers' tests — not only tests near the changed file. Rationale in the persona: sub-agent local context misses global regressions; graph-based impact analysis cuts regressions ~70% (TDAD 2026); TDD ALONE does NOT prevent cross-feature regressions — impact analysis is the missing piece; token-cheap (query the prebuilt graph, don't re-read the repo).
- **Rules mirror:** `rules/{node,python}.md` carry the matching one-line convention ("query code-review-graph for dependents before changing shared code; verify impacted tests"); `rules/mongodb.md` adds it as **Change discipline** for shared schemas.
- **Overview + decisions reinforced (PmCamp State & continuity):** at every handover / milestone close, update `docs/STATUS.md` AND record any non-trivial decision as an ADR in `docs/adr/`. Both stay concise + on-demand — never always-loaded.
- **Canonical + fallback in sync:** `PmCamp.md` and the fallback PmCamp template in `skills/basecamp/SKILL.md` updated together (differ only in inline backticks per existing convention).
- **Constraints held:** existing verification (tests / git / acceptance / product walkthrough) unchanged; idempotent; graceful-degrade if the graph is unavailable; other phases untouched.

## 15. ARCHITECTURE.md + Known pitfalls + Superpowers-aware lanes ✅ v1.2.5

**Problem:** "fix A, break B" persisted because agents had no project-level overview — the template's Stack/Structure sections and `rules/` describe generic conventions, not this project's modules, boundaries, or contracts (ADOPT even parked "current architecture" in STATUS.md, contradicting its state-only role). Project-specific agent mistakes kept recurring with nowhere durable to record them (projects invented ad-hoc `pm_rules.md`), and PmCamp's milestone ceremony applied even to one-file fixes.

- **Probe first:** in two basecamp projects a general-purpose subagent quoted project-only lines from root CLAUDE.md and `.claude/rules/python.md` verbatim with zero tool calls; an Explore control answered NOT IN CONTEXT. → v1.2.4 rules DO reach implementers; no delegation-spec change needed.
- **`docs/ARCHITECTURE.md` (PmCamp + template pointer + ADOPT):** on-demand module map — module map, boundaries, data flow, key contracts, shared hotspots; links rules + ADRs, never restates them; first line `Verified at <commit>`; English; ~80 lines; never `@`-imported. Read before cross-module / shared-code work alongside the graph impact query; created at ≥2 domain modules; updated at milestone close only when boundaries/contracts changed (cue: changed communities, new coupling, new hub/bridge nodes). GREENFIELD creates nothing. ADOPT detects an existing doc (`architecture*` at depth ≤3 via an rtk-safe `find | grep -v`, or a `## Architecture` heading) → pointer tagged "(user-owned)" + ORIENT's additions offered as a diff; otherwise ORIENT drafts it (≥2 domain modules only — same threshold as PmCamp). STATUS.md stays state-only. At runtime too, a pre-existing doc without the `Verified at` line stays user-owned — PmCamp proposes diffs, never moves / renames / rewrites / translates it (review experiments showed PmCamp otherwise taking such docs over).
- **Bounded graph queries (measured):** on code-review-graph ≤2.3.3, `get_architecture_overview_tool` returns every community member + cross-community edge — 463k chars on a 1.8k-node graph, 863k on 5.5k nodes — vs ~1k for `list_communities_tool` (minimal) and ~7k for hub+bridge or `get_surprising_connections_tool`. 2.3.4+ (what `uvx` MCP servers run) bounds it with a `minimal` default, so the rule keys on the tool schema: use it only if it has a `detail_level` parameter, else `list_communities_tool` (minimal) + `get_surprising_connections_tool`; hub/bridge nodes either way; never the `architecture_map` MCP prompt (its tool calls carry invalid arguments). The rule lives once, in the template's Tool usage — PmCamp just points there ("overview tools: see CLAUDE.md Tool usage"); existing projects keep code-review-graph's appended guide.
- **Known pitfalls (template + PmCamp):** empty `## Known pitfalls` right after Project invariants — `symptom → do instead (YYYY-MM-DD)`, hard cap 10. PmCamp appends on the 2nd occurrence; a mistake that breaks an EXISTING rule gets a proposed mechanical check (lint / hook / CI) instead of another sentence (English-only checks: identifiers + comments, never string literals / i18n / UI copy); full → graduate to a check or drop the oldest non-recurring entry. PmCamp creates the section in older projects (refresh never touches CLAUDE.md).
- **Superpowers-aware lanes (PmCamp, one line):** a task Superpowers classifies as Bounded skips PmCamp's milestone breakdown/confirmation + `/ponytail-review`, and the ADR unless a non-trivial decision was made. Tests, impact analysis, verification, and the user-facing product walkthrough are never skipped; Superpowers' own stages are never overridden. Phase 1 checks Superpowers ≥6.3.0 at user + project scope (6.2.0 has no Spike/Bounded/Architectural classification) → warn + print the `claude plugin update` command; project pins are never auto-changed.
- **English artifacts clarified (rules + template):** agent-written repo docs (ARCHITECTURE, ADRs, STATUS, Known pitfalls) are English; user-authored requirement docs stay as written; talking to the user stays Vietnamese.
- **Graph instructions:** `code-review-graph install … --no-instructions` (needs ≥2.3.0) drops the ~40-line tool guide it appended to CLAUDE.md (duplicating the template); one template line now names the key impact + overview tools, with `changed_files` = the files about to change for the pre-edit impact tools (their default diffs `HEAD~1`). MCP server, hooks, and graph skills still install. Existing installs are unaffected — their appended section stays until removed by hand.
- **Impact queries at full detail (PmCamp):** the graph's generated skills say `detail_level="minimal"` on all calls, which lists only 5 callers/tests — PmCamp's mandatory impact check now says full detail, and if the result is saved to a file, jq it — don't drop to minimal. Headless test with that skill loaded: guarded runs queried dependents at full detail first (2/2), HEAD runs started at 5-of-50 (0/2); when the full result overflowed to a file the guarded runs fell back to minimal + Grep — the jq clause closes that gap.
- **Audit hardening:** the plugin-copy audit/refresh covers only `.claude/rules/` files whose names exist in the plugin's `rules/` — user-added rule files are never flagged.
- **Canonical + fallback in sync:** `PmCamp.md` and the fallback PmCamp template in `skills/basecamp/SKILL.md` updated together (differ only in bold + inline backticks per existing convention).
- **Constraints held:** no verification weakened; idempotent; graceful-degrade (graph MCP not live → ORIENT maps from entry points; Superpowers version unreadable → `❔ unknown`); other phases untouched.

## 16. Full-repo review fixes ✅ v1.2.6

**Problem:** a full-repo review found fixes, no new features: Prettier silently broke refresh stamps; FastAPI conventions (`python.md`, SQLModel, Beanie-specific `mongodb.md`) were applied to Django, and our module structure to adopted codebases with their own layout; the graph-guide note invited older projects to lose their tool names; `/kickcamp` restated a partial verification list; and the embedded fallback PmCamp doubled every persona edit.

- **Probe (drives v1.2.7, nothing changed yet):** general-purpose subagents receive PmCamp through CLAUDE.md's `@.claude/PmCamp.md` import — a project-only line quoted verbatim in 2/2 projects with zero tool calls; an Explore control answered NOT IN CONTEXT. One subagent concluded it *was* PmCamp and must not write feature code. On those (older-PmCamp) projects a subagent starts with ~12k chars of project memory (CLAUDE.md + PmCamp + rules).
- **Prettier vs refresh stamps:** whenever Prettier is in the scaffold (FE, NestJS, or setup-pre-commit's `"*": "prettier --ignore-unknown --write"` lint-staged rule) — or detected in ADOPT — `.claude/` goes into `.prettierignore` before any commit runs the hook, and Phase 5 checks `npx prettier --file-info .claude/PmCamp.md` (with the lint-staged command's `--ignore-path` flags, if any) → `"ignored": true`, plus that copies stamped this run still hash to their stamp. Verified: without it Prettier rewrites a stamped copy (false `✏️ user-modified` on every refresh); with it a real lint-staged 15 run skips `.claude/` while still formatting other files. Existing projects: `/basecamp refresh` doesn't touch `.prettierignore` / `.gitignore` — re-run `/basecamp` (ADOPT appends both) or add `.claude/` and `.claude/**/*.bak` by hand.
- **Django:** `python.md` is FastAPI-only (description + heading say so) and is copied only for FastAPI. Django keeps its app layout with no structure rule file, gets a `GET /health` view routed in `urls.py`, and Phase 5 checks it per framework. ADOPT detects Django (`manage.py` / `django` dependency) and the argument bypass (`django`, `2B`) lands on the same handling. Django + SQL resolves to the Django ORM (never SQLModel/SQLAlchemy): `DATABASES` reads `DATABASE_URL` (in `.env.example`), no separate connection module. Django + MongoDB is never picked — the Database step drops MongoDB for Django (PostgreSQL ★ · SQLite · Other), and a guard re-asks if arguments, a description, or a typed answer produce the pair; ADOPT keeps a detected pair but copies no `mongodb.md` (Beanie-specific) and notes that on CLAUDE.md's Backend line. With no stack rule files, Django skips ADOPT's Conventions question. Known gap: Django projects created earlier still refresh `python.md` (and `mongodb.md` if they used MongoDB) until removed by hand.
- **ADOPT doesn't impose structure:** before copying node/python/mongodb rules, ADOPT compares the detected layout with ours; on a mismatch it asks once ("Conventions": Follow existing ★ · Adopt claude-camp structure). Follow existing → no stack rule files plus a one-line `Conventions:` record in CLAUDE.md; refresh never reports declined rules as missing and never copies stack rules ahead of the question. A made choice is never re-asked (`Conventions:` line = Follow existing; rule copies already present = Adopt). Existing code is never restructured.
- **Graph-guide note:** delete code-review-graph's appended CLAUDE.md section only after copying the template's "Key graph tools" line in — PmCamp points to CLAUDE.md for the tool names.
- **/kickcamp:** verification defers to PmCamp's Verification section in full (impacted-caller tests, product walkthrough); the no-persona fallback adds a product walkthrough for UI work and treats claude-mem as optional.
- **Wording:** PmCamp says "shared state snapshot" and "claude-mem (if installed)"; the template's Token discipline drops the Session-hygiene bullet PmCamp already carries verbatim.
- **.gitignore:** `.claude/**/*.bak` (refresh backups) in the template and ADOPT's append list.
- **README:** claude-mem marked opt-in, `git-guardrails-claude-code`, License link → `./LICENSE`.
- **Embedded fallback PmCamp removed:** the plugin is the only distribution channel; an unresolvable `${CLAUDE_PLUGIN_ROOT}` now means warn, skip, and print the stamped copy command — PmCamp and rule files alike, only for missing/outdated copies (never over a user-modified one), with source file + version from the `camp@…` entry of `claude plugin list --json`. SKILL.md: 378 → 324 lines.
- **Constraints held:** no behaviour change beyond these items; idempotent (declined rules stay declined; `.prettierignore` / `.gitignore` are appended, never rewritten); graceful-degrade.

## 17. Remote-mode PmCamp + tiered permission allowlist (backlog)

When the user works from the phone (see #1): PmCamp asks text questions only and never closes a user-facing milestone remotely. Pair it with a tiered permission allowlist.

## 18. Harness hardening (backlog)

Permission deny/ask rules plus PostToolUse lint hooks.

## 19. Release versioning (backlog)

Conventional Commits + release-please, one product version. Open question: GitLab-hosted projects.

## 20. taste-skill + frontend.md conventions (when FE work starts)

taste-skill as a design-system option, and a `frontend.md` conventions file — both only once real FE work starts.

## 21. sober analyzer + Strix (optional)

sober as an optional CI gate; Strix as an optional pre-launch pentest.

## 22. Session-zombie check (backlog)

Add to session hygiene: check for leftover sessions (`ps`) and reload VS Code.

## 23. PmCamp token diet ✅ v1.2.7

Done in #24. The "≈5k tokens on Node+Mongo" estimate here was characters ÷ 4. Measured, a v1.2.6 Node+Mongo sub-agent carried **7,608 tokens** of project memory: camp's markdown runs ≈2.5 chars/token on Opus/Sonnet 5.5, not 4, so every earlier ÷4 figure was ~1.6× too low.

## 24. Main-session-only PmCamp + core rules + diet ✅ v1.2.7

**Problem:** sub-agents loaded the whole persona through CLAUDE.md's `@.claude/PmCamp.md` import — 3/3 probed general-purpose sub-agents answered "I am PmCamp… I don't write the code myself" — paying ~3.2k tokens per spawn for a role they must not play. And projects set up before v1.2.4 never got the English-only and impact-analysis rules to their sub-agents: refresh never touches CLAUDE.md, and with the persona main-only, `.claude/rules/` is the one channel that reaches them.

- **Persona via plugin `SessionStart` hook:** `hooks/hooks.json` (matchers `startup|resume|clear|compact`) runs `hooks/pmcamp-persona.js` with node, like ponytail's hooks (no POSIX shell syntax, so it ports to Windows). It walks from `$CLAUDE_PROJECT_DIR` up to the git root for `.claude/PmCamp.persona.md`. No file → no output. Found → JSON `hookSpecificOutput.additionalContext` (stamp line stripped, one-line header). Silent on any error (EPIPE included); never walks above `$HOME`; strips a BOM; skips an empty persona; resolves a symlinked project dir. ~40 ms.
  - Over 9,500 characters → not injected. Claude Code replaces an `additionalContext` longer than 10,000 (UTF-16 `.length`, per the binary) with a 2k-char preview plus a file path. The limit applies to the parsed context, not raw stdout (a 12,106-byte stdout carrying 9,671 chars arrived intact). The hook measures the persona the same way, so persona + header stays ≤ 9,671. Instead of the persona, the PM gets a short instruction to Read the file and the user gets a `systemMessage`.
  - Resume: Claude Code skips re-adding identical hook context (measured on 2.1.289 and 2.1.220), so the script needs no guard.
- **Stub + migration:** `.claude/PmCamp.md` is a 288-char stub (main session: Read the persona if it isn't in context; sub-agents: ignore it). Root CLAUDE.md is untouched — its import now loads the stub. Plugin files mirror the project copies 1:1 (`PmCamp.md` = stub, `PmCamp.persona.md` = persona); both are stamped, audited, and refreshed. Refresh migrates pre-v1.2.7 layouts (persona file missing, PmCamp.md stamped older than 1.2.7 or unstamped): untouched → stamped persona first, then the stub; edited → AskUserQuestion "Migrate (keep your edits)" (`mv`, bytes unchanged) · "Keep mine" · "Show diff". `/kickcamp` Reads the persona before intake if it isn't in context.
- **`rules/core.md`** — every project, any stack, never gated by ADOPT's Conventions question: English-only, graph before Grep, impact analysis before shared-code edits (full detail; jq a saved result), key graph tools. Removed from the template, `node.md`, `python.md`, `mongodb.md`. Refresh adds it to existing projects as `❌ missing`.
- **Diet (every rule kept):**
  - Template Model routing → one line; the why, escape hatches, and pinning sit in an HTML comment in the same CLAUDE.md. HTML comments and rules frontmatter are stripped before injection (0 tokens — verified for CLAUDE.md and `.claude/rules/`).
  - PM-only lines (spawn policy, plugin-copy note) moved into the persona; the ponytail note, "≤150 lines", and the karpathy/Superpowers note became HTML comments.
  - Persona: rationale-only sentences dropped — their why already lives here (#12 UX bar, #14 TDAD) — and self-repeats merged (impact, architecture, STATUS). 8,632 → 7,574 chars.
  - Rules lose duplicates and scaffold-time notes (`modules/ starts empty…`; NestJS-Biome workaround → HTML comment; `mongodb.md` defers schema location to the backend rule file). Loaded chars: node 3,163 → 2,281 · python 2,674 → 1,927 · mongodb 2,072 → 1,249; core.md 1,384.
- **Plugin root:** an unresolved `${CLAUDE_PLUGIN_ROOT}` → a node one-liner reads `~/.claude/plugins/installed_plugins.json` (enabled entries only; this repo's project scope first, then user; `installPath` must exist) and basecamp copies + stamps from there. It prints the manual command only when nothing resolves.
- **Phase 1 audit:** caveman — checks what is ACTIVE (registered hooks and their scripts, `statusLine` target, user CLAUDE.md rules, `caveman-shrink` MCP); always-on → warn + uninstall / `--minimal`; dangling references reported. Browser — Playwright MCP and agent-browser both present → reported; agent-browser stays the walkthrough default, Playwright the fallback (PmCamp's walkthrough line says so). Persona size is checked by running the hook itself (a C-locale `wc -m` counts bytes and disagreed by ~70).
- **Measured** — first-request input tokens of project memory (Opus 5.5 main · Sonnet 5.5 sub-agent), tools pinned and skills off so only memory differs, empty-project baseline subtracted in the same batch. Main includes the hook-injected persona (2,832 tokens). Unpinned totals were unusable: Claude Code's built-in Artifact tool alone varied 54.8k–78.9k chars between sessions.

  | Project | Sub-agent v1.2.6 → v1.2.7 | Main v1.2.6 → v1.2.7 |
  |---|---|---|
  | FastAPI (new) | 6,315 → 2,456 (−61%) | 6,320 → 5,288 |
  | NestJS + SQL (new) | 6,605 → 2,745 (−58%) | 6,607 → 5,574 |
  | NestJS + MongoDB (new) | 7,608 → 3,414 (−55%) | 7,614 → 6,247 |
  | FE-only (new) | 5,135 → 1,546 (−70%) | 5,138 → 4,376 |
  | Django (new) | 5,144 → 1,555 (−70%) | 5,146 → 4,384 |
  | socialcamp (refresh only) | 7,464 → 5,202 (−30%) | 7,583 → 8,150 (+567: core.md adds rules its pre-v1.2.4 CLAUDE.md lacked) |
- **Verified (Claude Code 2.1.289, the VS Code extension's binary):** canary at the persona's first and last line — main sees both, the sub-agent sees none and answers as an implementer; hooks off → main Reads the persona and answers as PmCamp; `/compact` re-injects once (one copy afterwards); start in a subdirectory → injected; 9,500-char persona → intact; 9,600 → Read instruction + warning. Migration on copies of socialcamp: untouched → exactly 3 files changed (stub, persona, core.md; 3,288 others byte-identical); edited → persona byte-identical to the user's file. Old @import vs new hook, 3-turn `/kickcamp` on a change to a function two modules share (4 runs per arm over two rounds, real code-review-graph MCP): no difference. In 8/8 the PM wrote no code itself, `callers_of` + `tests_for` ran before the first edit of the shared function, and the PM re-ran the suite itself. With git allowed (round 2), every turn 1 raised the 70% clearance discount the cap would change as a 🟡 decision, and every final report cited the real commit hashes. In round 1, a global rtk hook rewrote `git` past the headless allowlist and all 4 PMs refused to call the milestone done without a commit.
- **Known gaps:** the hook needs `node` on PATH (Phase 1 checks it; without it every session start shows a hook error and the stub makes the PM Read the persona); teammates without the camp plugin get only the stub, which points them to the persona file; `/clear` wasn't probed (headless can't send it — same hook path as startup); the hook hasn't run on Windows; projects that only refresh keep their old CLAUDE.md lines (re-run `/basecamp` to merge the slimmer template).

## 25. Per-spawn cost outside camp's files ✅ v1.2.8

**Problem:** after v1.2.7, camp's own files were ~14% of what a spawn loads. On a socialcamp copy (Claude Code 2.1.289, MCP off), a sub-agent's first request was 50–54k tokens and the main session's 62–65k. The rest came from the Artifact tool, a 97-skill listing, Claude Code's auto-memory, ponytail's sub-agent hook, and camp lines that refresh never removed from older `CLAUDE.md` files.

- **Artifact** — `enableArtifact: false` in `.claude/settings.json` (basecamp asks once: Off ★ · Keep). The definition changes between sessions: 54.8k / 78.9k / 82.2k / 89.5k chars, measured as 11.3k–18.8k tokens per spawn in main and every sub-agent. `permissions.deny` removes it too, but leaves the 3 `artifact-*` bundled skills listed. Project and local settings can only turn it off, so "Keep" writes `true` to record the answer.
- **Skill listing** — capped at context window × 4 × `skillListingBudgetFraction` (0.01): 29.9k chars on Opus/Sonnet 5.5, 8.9k on Haiku; 40.9k uncapped. Above the cap, removing skills does nothing — truncated descriptions refill the budget.
  - **`general-purpose` override:** `.claude/agents/general-purpose.md`, copied from `project-agents/` with a line-2 YAML stamp (frontmatter must start on line 1). It holds the built-in role text verbatim, plus `disallowedTools: Skill`; the frontmatter records the Claude Code version the text came from. A project agent named `general-purpose` shadows the built-in one, and that's what Superpowers dispatches (all 7 of its templates). Measured: −11.8k tokens per sub-agent. ToolSearch and MCP stay, and model choice is unchanged. Verified on the stamped copy: no `model` → env default, `haiku` → Haiku, `opus` → Opus.
  - **Why it's safe:** none of Superpowers' sub-agent prompts uses a skill. Across 297 real sub-agent transcripts on the dev machine, 1 called Skill — a PM delegating `/ponytail-review` at milestone close — so the persona now hands sub-agents a skill's `SKILL.md` path to Read instead. socialcamp/scrumcamp/hobyhunt kept no real sub-agent transcripts (pruned), and claude-mem's tool log never records Skill calls.
  - **claude.ai-synced skills:** `syncClaudeAiSkills: false` saves 3.4k tokens, and only works in `.claude/settings.local.json` (or user settings, which hide them in every project and move them to `.trash` — so camp never sets that).
  - **mattpocock-skills:** project-disable + standalone `improve-codebase-architecture` saves another ~1k once the listing is under its cap.
  - **`skillOverrides` doesn't apply to plugin skills** (the code returns "on" for `source === "plugin"`). `disableBundledSkills` / `workflow-authoring: off` make the main Workflow tool grow 9k → 43k chars (+6.3k tokens), so Phase 1 warns about them.
- **Memory** — auto-memory's `MEMORY.md` reaches every sub-agent: socialcamp's 12.3k chars cost 7.3k tokens per sub-agent and 8.1k in main (with its instructions). claude-mem costs main only (a 9.8k-char startup block plus its listing entries); agentmemory was a third system, a user-scope MCP server in `~/.claude.json`, which Phase 1 didn't check.
  - Phase 1 now sizes `MEMORY.md` and flags 2+ systems.
  - Phase 4 recommends claude-mem + `autoMemoryEnabled: false`, after a one-time migration shown as a diff: feedback → `## Working agreements`, backlog → STATUS, case law → `docs/notes/` or ADRs. MEMORY.md files are never deleted.
  - The template gains an empty `## Working agreements`. The persona records a standing preference there on its FIRST correction; Known pitfalls stay two-strikes, for agent mistakes.
- **ponytail** — `env.PONYTAIL_SUBAGENT_MATCHER: "^general-purpose$"` by default. Its 5.2k-char ruleset (1.9k tokens) still reaches general-purpose implementers and reviewers, and skips Explore, Plan and other types (verified). Levels lite/full/ultra are all ~5.2k chars. A never-matching regex is documented only.
- **Old `CLAUDE.md`** — opt-in refresh step running `scripts/claude-md-cleanup.js`.
  - It matches a curated list of 16 lines from the template's history, exactly (whitespace and backticks ignored), plus the stale "env catches every subagent" phrases in `- Tier:` lines.
  - Edited camp lines are listed and left alone, and so is anything inside code fences or multi-line HTML comments; each line keeps its own line ending. It prints `SKIP` until core.md + the persona exist. Rationale lines become in-place HTML comments, so they cost 0 tokens and nothing is lost. `--apply` backs up to `.claude/CLAUDE.md.bak` first.
  - code-review-graph's guide becomes a marker-only stub — only on an exact match of one of the 7 CLAUDE.md guides crg 2.3.9 still recognizes (line count + hash), so text a user put after an old guide (which has no end marker) survives; any other block under the marker is listed as edited. Verified on 2.3.9: its `install` then reports `conflict` and leaves the file byte-identical, instead of re-appending ~2.3k chars.
  - Measured loaded text: socialcamp −1,759 chars, scrumcamp −1,957.
- **Model tiers, corrected** — `CLAUDE_CODE_SUBAGENT_MODEL` is the default, not a force (see #10). Superpowers names a model on its implementer, task-review, re-review and final-review dispatches; its spec, plan and standalone code reviewers pass none and take the env. No template passes `inherit`. Their per-role picks fit Premium and Flagship; on Balanced or Economy an Opus final review exceeds the tier (`_FORCE` caps it). `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` is documented as an opt-in strict ceiling (verified: asked for Haiku, the PM passed no `model` and the sub-agent ran the env's Sonnet).
- **Measured** (first request; MCP off; sub-agent general-purpose on Sonnet 5.5; Artifact variant per session):

  | Project | Sub-agent v1.2.7 → v1.2.8 | Main v1.2.7 → v1.2.8 |
  |---|---|---|
  | socialcamp (refresh, every opt-in applied, 5 simulated Working agreements lines) | 50,265 / 54,231 → 14,179 (−72% / −74%) | 62,291 / 64,994 → 31,806–31,894 (−49% / −51%) |
  | FastAPI (new) | 43,332 / 44,592 → 12,218 (−72% / −73%) | 55,355 → 29,845–29,933 (−46%) |

  The persona hook is unaffected: in every run main had the persona and the sub-agent didn't. Auto-memory off: no `MEMORY.md` in main or sub. Persona 7,645 → 8,478 chars (limit 9,500; measured at 8,330, before the Explore/Plan model line).
- **Known gaps:**
  - Agent files and settings load at session start (verified: a file written mid-session didn't apply), so Phase 5's live check is ⏸️ until a restart.
  - The override's role text must be re-copied when Claude Code changes its built-in prompt; Phase 1 shows the recorded version against `claude --version`.
  - Built-in Explore and Plan declare `model: "inherit"`, which beats the env. Explore ran on the PM's Opus (it is capped at Opus); Plan isn't capped, so it inherits Fable under Flagship. Superpowers never dispatches them; the PM may — so the persona now says "pass `model` on every dispatch (Explore → `haiku`, Plan → `sonnet`)". That is an instruction, not enforcement. If the leak is still observed, the fallback is project overrides `.claude/agents/Explore.md` / `Plan.md` with a fixed `model` — the same mechanism and the same role-text drift caveat as the general-purpose override.
  - The standalone `improve-codebase-architecture` install wasn't simulated (+≈340 chars to main's listing).
  - The user-level `syncClaudeAiSkills` switch wasn't run: it would trash the dev machine's synced skills.

## 26. `python.md` reads as Beanie-first (backlog)

On socialcamp, refresh's agent called the plugin `python.md` "written for MongoDB" (its tree shows `schemas/` + `db.py # Beanie/Motor init`) and recommended keeping the project's SQLModel copy. Split the tree's Mongo-only lines visually, or show the SQL layout first.

## 27. PmCamp gates — readiness + milestone close ✅ v1.3.0

**Problem:** borrow BMAD's gates as ideas (no install, no text) without adding ceremony or per-spawn tokens. Evidence from socialcamp, scrumcamp and hobyhunt (git, docs, 2 real PM transcripts):
- 8 milestones reported done, then reopened. Example: socialcamp's wizard passed 1,048 tests while its fixtures matched the bug.
- 5 gaps found only mid-build. scrumcamp M4.1 listed "verify by smoke" as a risk, never ran it, and lost ~3.5h.
- 4 guesses stated as fact.
- 3 mid-milestone requirement changes, all handled well without a gate.
- socialcamp already hand-writes sign-off records (6 × 4–10 KB) beside 243 docs — so no new docs folder.

**Overlap with Superpowers 6.4.1** (dropped or shrunk accordingly):
- **Already covered:**
  - brainstorming: spec self-review — placeholders, contradictions, scope, ambiguity.
  - writing-plans: spec → task coverage.
  - subagent-driven-development: task-vs-task conflict scan, per-task spec review, final whole-branch review, "Rulings I made".
  - verification-before-completion: "Requirements met → line-by-line checklist".
- **Not covered:**
  - a whole-doc requirement → milestone map;
  - unknowns that need a spike before building;
  - ADR / `ARCHITECTURE.md` conflicts;
  - a visible criterion → evidence table with a verdict and an explicit waiver;
  - a record of first strikes across fresh sessions;
  - labels on diagnoses.
- **Idea → requirements doc:** brainstorming already does this end to end.

**What shipped:**
- **Readiness** (`workflows/readiness.md`, 1.6k chars). Runs once per requirements doc, after triage and before milestones are presented. It checks:
  - coverage: orphans and strays;
  - acceptance criteria, with the user-facing list moved out of the persona;
  - dependencies and unknowns, with a spike for platform-capability unknowns;
  - ADR / `ARCHITECTURE.md` conflicts.

  The verdict is `READY` or `GAPS: n` plus 🟡 questions, delivered in chat. It asks only questions that change milestone boundaries or feasibility; per-feature questions stay with brainstorming.
- **Milestone close** (`workflows/milestone-close.md`, 4.1k chars). Runs before declaring a milestone done, and before Superpowers' merge menu so the user gets one turn for both:
  - verify;
  - walk the product (the browser how-to moved out of the persona);
  - trace, `| Criterion | Evidence | Status |`:
    - a unit test alone never makes a user-facing criterion ✅;
    - a defect hit inside a criterion's own flow marks it ⚠️/❌, not a side note.
  - verdict `PASS` / `CONCERNS` / `FAIL` / `WAIVED`, the first that applies in the order FAIL → CONCERNS → WAIVED → PASS; on FAIL the merge menu waits; the close's doc edits are committed on the branch before the menu;
    - a criterion PmCamp couldn't observe stays ⏳ → `CONCERNS` until the user confirms; never `PASS` from the checklist alone;
    - `WAIVED` needs the user's own words, recorded next to the criterion.
  - record: `STATUS.md` gets one `M<n>: <verdict> (date)` line under its prune rule; an ADR if needed; no new files besides `ARCHITECTURE.md`;
  - the `ARCHITECTURE.md` upkeep and `/ponytail-review`, moved out of the persona;
  - retro: at most 3 lines under the requirements doc's `## Retro`. Earlier lines are read first, so a repeat reaches Known pitfalls even across fresh sessions.
- **Persona:**
  - triggers at concrete moments ("Before presenting them for confirmation, Read …", "Before declaring a milestone done — and before Superpowers' merge menu — Read …");
  - the walkthrough ACTION stays in the persona, only the how-to moved;
  - evidence labels ✅ / 🔎 / ❓ — never present 🔎/❓ as ✅;
  - correct-course: impact on milestones / ADRs / `ARCHITECTURE.md` / tests + 2–3 options; the user decides; then the doc and `STATUS.md` are updated.
  - **Lanes:** Bounded skips readiness and closes with an evidence line instead of the table. Tests, impact analysis, verification, evidence labels and the walkthrough never skip.
- **/kickcamp** names both files at the same moments. A missing file → ask for `/basecamp refresh` and verify per the persona meanwhile.
- **Delivery:** stamped project copies in `.claude/camp/workflows/`, tracked by the copy audit like `rules/`. Refresh writes them as `❌ missing` in existing projects.

**Delivery choice, measured** (socialcamp copy, Claude Code 2.1.289, 3 draft gates):

| | Main | Sub-agent (override on) | Override declined | PM can use |
|---|---|---|---|---|
| plugin dir, path from the hook | +123 tokens (256-char line) | 0 | 0 | Read of `~/.claude/plugins/cache/…` prompts; `Read(~/.claude/plugins/cache/*/camp/**)` in allow fixes it |
| `.claude/camp/workflows/` ★ | 0 — not auto-loaded | 0 | 0 | Read, no prompt |
| model-invocable skills | +278 (+727 listing chars) | 0 | +727 chars per spawn | yes |
| skills with `disable-model-invocation` | 0 | 0 | 0 | no — "cannot be used with Skill tool … do not replicate this skill's workflow" |

Project copies also keep the persona and the gates in step: both change only on refresh.

**Measured tokens** (first request, MCP and claude-mem off, committed fixtures, 2 reps, identical):

| Project | Main v1.2.8 → v1.3.0 | Sub-agent |
|---|---|---|
| socialcamp copy | 29,172 → 28,884 (−288) | 14,178 → 14,177 |
| FastAPI (new) | 27,208 → 26,919 (−289) | 12,214 → 12,212 |

The persona went 8,479 → 7,533 chars (UTF-16, as the hook counts) — 948 fewer in the hook output, about 3.3 chars per token. A close adds one ~1.2k-token read in the session that runs it.

**Behavioural probes** (headless, PmCamp on Opus, Vietnamese prompts, a stdlib notes app with a requirements doc, an ADR and 4 criteria):

| Probe | Read the file | Outcome | Cost · time |
|---|---|---|---|
| `/camp:kickcamp` readiness | ✅ | `GAPS: 3` — M3 conflicts with ADR 0001 (no network), M2 lacks criteria, M1 lacks error states; Drive-API option gets a spike; numbered 🟡 questions | $0.36 · 54s |
| close, agent-browser | ✅ | table from curl + agent-browser, `CONCERNS`, `STATUS` line, Retro line, ponytail-review run, `ARCHITECTURE.md` correctly skipped (1 module) | $0.73 · 152s |
| close, Playwright found instead | ✅ | AC3 ⚠️ (empty state missing after deleting the last note) → `FAIL`; asks for the user's own words to waive | $0.75 · 199s |
| close after `/compact`, no browser used | ✅ | persona re-injected after the compact; AC4 (JS delete without reload) ⏳ + 5-step manual checklist → `CONCERNS`, never `PASS` | $0.98 · 133s |
| Bounded task | ✅ | no table, no verdict; tests + agent-browser walkthrough; 4 evidence bullets rather than one line; caught the requirements doc still quoting the old text | $0.48 · 92s |
| close ×2 after adding "a defect inside a criterion's own flow marks it ⚠️/❌" | ✅ | both now score the empty-state bug against AC3: one sends a sub-agent to fix it and re-walks → `CONCERNS` (R1 body question), the other → `FAIL` and asks to fix or waive | $2.39 · 312s / $0.83 · 184s |
| "finish branch m1" — unmerged, with the empty-state bug (final file, after review) | ✅ | no FAIL + menu: a sub-agent fixes the bug first, re-walk, then the close docs are committed on `m1`, then the verdict (`CONCERNS` — agent-browser couldn't reach localhost here, so AC4 ⏳ + a manual checklist) is presented together with Superpowers' merge menu | $1.13 · 310s |
| `/camp:basecamp refresh` on a v1.2.8 socialcamp copy | — | both workflows `❌ missing` → added and stamped v1.3.0 (body hash = stamp); untouched copies ⬆️ → v1.3.0; opt-in steps already decided; cleanup `CLEAN`. A second refresh: everything ✅ current, no file changed | $0.75 · 92s / $0.62 · 63s |
| diagnosis | — | ✅ only on the reproduced cause (5/5 runs + the commit diff); "sometimes" → 🔎; NFS risks → ❓; no 🔎/❓ shown as ✅ | $0.35 · 40s |

**Known gaps:**
- The merge-menu probe on a clean branch (no bug) was cut off by a session restart and not re-run; the buggy-branch probe covered the order: gate → fix → commit → verdict + menu.
- agent-browser failed to open localhost (`ERR_ADDRESS_INVALID`) in two runs on this machine; the PM fell back to Playwright or to ⏳ + a manual checklist as designed.
- The probes ran in parallel and the PMs picked the same port (8799) despite `PORT`. Two runs hit each other's server; both noticed and re-ran on a free port. This is a harness artifact, not a camp issue.
- Bounded closes still list a few evidence bullets rather than one line.
- On-demand files rely on the PM following the trigger — 6/6 here, but only one model and one fixture.
- Deferred: drafting a requirements doc from a rough idea. brainstorming ends by invoking writing-plans, so /kickcamp would have to stop it after the spec. `docs/qa/` not added.
