# Readiness check — PmCamp, before presenting milestones for confirmation

Once per requirements doc, after triage, before the user confirms milestones. Bounded lane: skip. Output in chat; fixes go into the requirements doc. Ask only what changes milestone boundaries, feasibility or acceptance criteria — per-feature design questions belong to Superpowers' brainstorming later.

Check, citing the doc section for each finding:
1. Coverage — every requirement maps to one milestone. List orphans (no milestone) and strays (milestone work no requirement asks for).
2. Acceptance criteria — every requirement has testable criteria ("works well" is not one). User-facing features also need, per surface: UI — each primary flow step by step as a real user walks it, UI states (empty / loading / error / validation feedback), responsive expectation (mobile + desktop) where relevant, conformance to `DESIGN.md` when the project has one; API — requests, responses and error cases; CLI — commands, exit codes, output; mobile — target platforms (iOS / Android). Missing → a gap to ask about; never invent the UX bar.
3. Dependencies and unknowns — external services, credentials, data, platform capabilities, other milestones. An unknown about what a platform or API can do gets a spike before the milestone that depends on it is built. Also how each criterion will be observed at close (milestone-close step 2 — e.g. iOS needs macOS + Xcode): no agent-usable tool here → tell the user now that those criteria close on their manual check.
4. Conflicts — with `docs/adr/` (titles first, open only the relevant ones) and the affected sections of `docs/ARCHITECTURE.md`. A conflict needs a new ADR or a doc change, never a silent override.

Verdict, one line, presented with the milestone plan: `READY`, or `GAPS: <n>` followed by numbered 🟡 questions. Never build on GAPS. The user may accept a gap explicitly; record it in the doc as an assumption, dated.
