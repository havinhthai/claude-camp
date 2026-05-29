---
description: Python backend conventions (FastAPI) — module-based, layered, async, typed
---

# Python backend rules

Module-based, FastAPI idiom. Layered per domain: **router → service → repository**. `router.py` IS the handler — no separate controller. **No file prefix.**

## Directory structure
```
backend/
  src/
    main.py
    schemas/            <domain>.py       # Beanie Document = DB models, shared — MongoDB ONLY
    modules/<domain>/   router.py         # route + handler
                        service.py
                        repository.py
                        dto.py            # Pydantic request/response = validation
                        dependencies.py
                        exceptions.py     # optional
    core/               # pydantic-settings config, security
    common/
    db.py               # Beanie/Motor init
  tests/                # mirror src
  pyproject.toml
  .gitignore
```

## Naming (decided)
- `schemas/` = **DB models** (Beanie `Document`). `dto.py` = **validation** (Pydantic request/response). `router.py` = handler. NO file prefix.
- One concern per file. `modules/` starts empty except the `health` sample; feature modules arrive via `/kickcamp`.

## Schema location (DB-aware — important)
- **MongoDB + Beanie only** → shared `src/schemas/<domain>.py` (Beanie `Document`), all classes registered in `init_beanie(document_models=[...])` in `db.py`.
- **SQL ORMs keep their own convention** — do NOT force `src/schemas/`: SQLModel / SQLAlchemy → the project's models module.

## Tooling
- **uv** (single `pyproject.toml` source of truth) + **Ruff** + **mypy (strict)** + **pytest**.
- Type hints everywhere. **Async** handlers/services/repos. `init_beanie` is async — await it in app startup (FastAPI lifespan).
- Config via **pydantic-settings**; validate env at startup. **No hardcoded secrets.**

## Clean code
- Layered: `router.py` handles HTTP + validation only → `service.py` holds logic → `repository.py` owns data access. No DB calls in routers.
- Validate at the edge: `dto.py` Pydantic models for every request/response.
- Tests mirror source tree under `tests/`.
