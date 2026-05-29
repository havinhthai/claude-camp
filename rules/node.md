---
description: Node backend conventions (NestJS / Fastify / Express) — module-based, layered, TS strict
---

# Node backend rules

Module-based. Layered per domain: **controller/route → service → repository**. Validate at the edge, keep modules small, no business logic in routes.

## Directory structure

**NestJS (default):**
```
backend/src/
  main.ts, app.module.ts
  schemas/            <domain>.schema.ts   # Mongoose @Schema, shared — MongoDB ONLY
  modules/<domain>/   <domain>.module.ts, <domain>.controller.ts, <domain>.service.ts,
                      <domain>.repository.ts, dto/        # class-validator DTOs
  common/, config/, db/   # connection lives in db/
```
**Fastify / Express:**
```
backend/src/
  index.ts, app.ts
  schemas/            <domain>.schema.ts   # Mongoose schema+model, shared — MongoDB ONLY
  modules/<domain>/   <domain>.routes.ts, <domain>.controller.ts, <domain>.service.ts,
                      <domain>.repository.ts, <domain>.validation.ts (zod / JSON schema),
                      <domain>.middleware.ts (optional)
  middlewares/, config/, lib/, db/   # connection lives in db/
```

## File naming
- `<domain>.` prefix on every module file (`user.controller.ts`, `user.service.ts`, `user.repository.ts`).
- One concern per file. `modules/` starts empty except the `health` sample; feature modules arrive via `/kickcamp`.

## Schema location (DB-aware — important)
- **MongoDB + Mongoose only** → shared `src/schemas/<domain>.schema.ts`. NestJS: register per module via `MongooseModule.forFeature([{ name, schema }])` in `<domain>.module.ts`; root connection via `MongooseModule.forRootAsync` in `app.module.ts`.
- **SQL ORMs keep their own convention** — do NOT force `src/schemas/`: Prisma → `prisma/schema.prisma`; Drizzle → `src/db/schema.ts`.

## Tooling
- TypeScript **strict**, **pnpm**, **Vitest**. Scripts: `dev` / `build` / `typecheck` / `test` / `lint`.
- **Linter/formatter:** Biome for **Fastify/Express**. **NestJS keeps ESLint + Prettier** (Nest default) — Biome's `useImportType` rewrites DI value-imports to `import type` and breaks decorator metadata at runtime. (If Biome is forced on NestJS: disable `lint/style/useImportType` and set `verbatimModuleSyntax: true`.)
- Logging: **Pino**. Validate env at startup. Centralized error handling. **No hardcoded secrets** — read from env.

## Clean code
- Layered: controller/route handles HTTP only → service holds logic → repository owns data access. No DB calls in controllers.
- Validate at the edge: NestJS `dto/` (class-validator); Fastify/Express `<domain>.validation.ts` (zod / JSON schema).
- Tests mirror source tree.
