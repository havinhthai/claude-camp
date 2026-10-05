---
description: MongoDB data-modeling conventions — Mongoose (Node) / Beanie (Python)
---

# MongoDB rules

ODM by language: **Mongoose** (Node) · **Beanie** (Python). One schema per file in **`src/schemas/`** — location + registration per the backend rule file (`node.md` / `python.md`). **NestJS:** define with `@Schema()`/`@Prop()` + `SchemaFactory.createForClass`.

## Data modeling
- **Design for query patterns first** — model around how data is read, not normalized tables.
- **Embed vs reference by access pattern:** embed data read together and bounded in size; reference when shared, unbounded, or independently queried.
- **Index** every field used in query filters / sorts. Compound-index for multi-field queries.
- **Schema-level validation** — enforce required/types/enums at the schema (Mongoose validators / Beanie+Pydantic), not only at the app edge.
- **Soft-delete:** `deletedAt` field; never hard-delete by default; exclude soft-deleted in default queries.
- **Timestamps:** `createdAt` / `updatedAt` on every collection (Mongoose `{ timestamps: true }`; Beanie via fields/hooks).

## Connection + env
- `MONGODB_URI` (+ DB name) from `.env`, never hardcoded; connection wired into app startup (Mongoose `connect` in `db/` · Beanie `init_beanie` in `db.py`). Ship `.env.example` + a local MongoDB `docker-compose.yml`.
