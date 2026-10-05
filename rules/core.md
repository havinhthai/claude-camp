---
description: Core rules for every task and sub-agent, any stack — English-only, graph before Grep, impact analysis before shared-code edits
---

# Core rules

- **All code is English** — identifiers (incl. file names), comments, docstrings, log messages, commit messages — and so are agent-written repo docs (ARCHITECTURE, ADRs, STATUS, Known pitfalls). User-authored requirement docs stay as written. Vietnamese is used ONLY for talking to the user — NEVER in code or agent-written artifacts.
- ALWAYS use code-review-graph MCP tools BEFORE Grep/Glob/Read — they give structural context (callers, dependents, test coverage).
- **Impact analysis before editing shared code** (a function, type, schema, or API used elsewhere): first query the graph for its dependents at full detail — `detail_level="minimal"` lists only 5; if the result is saved to a file, jq it, don't drop to minimal — then run the IMPACTED callers' tests, not only tests near the changed file.
- Key graph tools — impact (before shared-code edits): `query_graph_tool` (`callers_of` / `importers_of` / `tests_for`), `get_impact_radius_tool` / `get_affected_flows_tool` with `changed_files` = the files you will edit (the default diffs `HEAD~1`); after edits: `detect_changes_tool`. Overview: `get_architecture_overview_tool` only if it has a `detail_level` parameter (code-review-graph ≥2.3.4), else `list_communities_tool` (`detail_level="minimal"`) + `get_surprising_connections_tool`; plus `get_hub_nodes_tool` / `get_bridge_nodes_tool`. Never the `architecture_map` prompt.
