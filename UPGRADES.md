# Backlog — việc cần nâng cấp (deferred)

> Hoãn lại để test bộ hiện tại (basecamp + kickcamp) trước.

## 1. Thông báo Telegram cho PM ⭐ (ưu tiên)

**Vấn đề:** VS Code terminal không tự convert OSC → OS notification, nên không nhận được khi PM cần hỏi / xong task.

**Giải pháp — 2 mức:**

- **Mức 1 — one-way (nhận thông báo), ~3 phút.** Hook trong `~/.claude/settings.json`:
  - `Notification` hook (fire khi PM chờ input) + `Stop` hook (fire khi xong lượt) → curl Telegram Bot API.
  - Setup: @BotFather `/newbot` → `BOT_TOKEN`; nhắn bot rồi `getUpdates` → `chat.id`.
  - Token để trong shell profile, **KHÔNG commit**.
- **Mức 2 — two-way (trả lời từ điện thoại).** Đúng giấc mơ "PM ping → tap trả lời trên phone":
  - Plugin Telegram **chính thức của Anthropic** (khuyến nghị), hoặc
  - **CCGram** (bên thứ ba) — nút inline approve/deny + trả lời AskUserQuestion từ phone, chạy mọi terminal.

**Lộ trình:** Mức 1 xác nhận chạy → lên Mức 2.
**Lưu ý:** Stop hook fire mỗi lần dừng (không chỉ khi xong hẳn) → có thể dư ping; nếu phiền chỉ dùng Notification.
**Phạm vi:** global một lần, KHÔNG nhét vào `/basecamp` (chứa secret).

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

Per-project model-tier presets, ENFORCED via committed `.claude/settings.json` — not just CLAUDE.md guidance.

- **Why:** CLAUDE.md "Model routing" was policy only — subagents default to INHERIT the session model, so an expensive session model (e.g. fable) leaked into every subagent. Verified resolution order: `CLAUDE_CODE_SUBAGENT_MODEL` env > per-invocation model param > agent-file frontmatter > inherit → a per-project settings env is the only layer that catches ALL subagents (incl. Superpowers' general-purpose dispatches).
- **Phase 2:** new "Model tier" picker step (with the tooling step, 4 options): **Flagship** (fable PM · sonnet subagents) / **Premium ★** (opus PM · sonnet subagents) / **Balanced** (sonnet PM · sonnet subagents) / **Economy** (sonnet PM · haiku subagents — haiku weak for real impl). Default-stack entry locks Premium; "Describe my project" recommends a tier; argument bypass accepts `flagship`/`premium`/`balanced`/`economy` words; confirmation summary shows the tier. The "Change something" picker was folded to 4 groups (Stack · Tooling / Model tier · Design · Start over) — the old 6-item list exceeded AskUserQuestion's 4-option cap.
- **Phase 4:** writes the tier to `.claude/settings.json` (alias-based: `model` + `env.CLAUDE_CODE_SUBAGENT_MODEL`), committed. MERGE-never-clobber; differing existing values → AskUserQuestion (Keep existing · Apply tier); matching values silent (idempotent). ADOPT gets the same merge behavior. `.gitignore` gains `.claude/settings.local.json`.
- **CLAUDE.md routing demoted to policy doc:** states the enforcement mechanics + escape hatches (shell env `CLAUDE_CODE_SUBAGENT_MODEL=opus claude` beats settings env; `.claude/settings.local.json` personal override; `/model` for the PM) + pinning full IDs for reproducibility. Intent guidance (Opus = plan/review/debug, Sonnet = build, Haiku = mechanical) kept as the "why".
- **Known trade-off (accepted):** the env also flattens per-invocation tier selection by the PM; escape hatches documented instead.
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
