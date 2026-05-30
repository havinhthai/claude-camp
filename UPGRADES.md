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
