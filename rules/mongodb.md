---
description: MongoDB data-modeling conventions — Mongoose (Node) / Beanie (Python)
---

# MongoDB rules

ODM by language: **Mongoose** (Node) · **Beanie** (Python). One schema per file in **`src/schemas/`** (this centralized convention is **MongoDB-only** — SQL ORMs keep their own).

## Schema location
- Node (Mongoose): `src/schemas/<domain>.schema.ts`. **NestJS:** define with `@Schema()`/`@Prop()` + `SchemaFactory.createForClass`, register per module via `MongooseModule.forFeature([{ name, schema }])`; root connection `MongooseModule.forRootAsync` in `app.module.ts`.
- Python (Beanie): `src/schemas/<domain>.py` (Beanie `Document`), registered in `init_beanie(document_models=[...])`.
- SQL ORMs do NOT use `src/schemas/` — Prisma `prisma/schema.prisma`, Drizzle `src/db/schema.ts`, SQLModel/SQLAlchemy the models module.

## Data modeling
- **Design for query patterns first** — model around how data is read, not normalized tables.
- **Embed vs reference by access pattern:** embed data read together and bounded in size; reference when shared, unbounded, or independently queried.
- **Index** every field used in query filters / sorts. Compound-index for multi-field queries.
- **Schema-level validation** — enforce required/types/enums at the schema (Mongoose validators / Beanie+Pydantic), not only at the app edge.
- **Soft-delete:** `deletedAt` field; never hard-delete by default; exclude soft-deleted in default queries.
- **Timestamps:** `createdAt` / `updatedAt` on every collection (Mongoose `{ timestamps: true }`; Beanie via fields/hooks).
- **One schema per file** in `src/schemas/`.

## Connection + env
- Connection/init module wired into app startup (Mongoose `connect` in `db/`; Beanie `init_beanie` in `db.py`).
- `MONGODB_URI` (+ DB name) from `.env` — never hardcoded. Ship `.env.example` + a local MongoDB `docker-compose.yml`.
