#!/usr/bin/env node
// /basecamp refresh — opt-in CLAUDE.md cleanup. Proposes (default) or applies (--apply) changes to
// camp-authored lines that v1.2.7+ moved elsewhere, plus code-review-graph's appended tool guide.
// Only exact matches are touched (whitespace collapsed, backticks ignored); a camp line someone
// edited is listed, never changed; code fences, multi-line HTML comments and every other line are
// project text and are left alone.
// Usage: node claude-md-cleanup.js [path/to/CLAUDE.md] [--apply]
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CORE = '.claude/rules/core.md';
const PERSONA = 'the persona (.claude/PmCamp.persona.md)';
const COMMENT = 'HTML comment in place (0 tokens), as in the v1.2.7 template';
const WRITE_LEAST = '- Write the least code that works — reuse existing / stdlib / native before adding.';
// [camp wording, action, new home] — action: 'drop' | 'comment' | replacement text
const LINES = [
  ['## Model routing (policy — enforcement lives in `.claude/settings.json`)', '## Model routing', 'v1.2.7 template header'],
  ['- Why these tiers: Opus-class for planning, architecture, code review, hard debugging; Sonnet for build/test/refactor; Haiku only for bulk mechanical work, no judgment.', 'comment', COMMENT],
  ['- Escape hatches: one-off session — `CLAUDE_CODE_SUBAGENT_MODEL=opus claude` (shell env beats settings env); personal — `.claude/settings.local.json` (git-ignored, higher precedence than the shared settings); `/model` switches the PM for a session.', 'comment', COMMENT],
  ['- Pinning: replace aliases with full IDs (e.g. `claude-opus-4-8`, `claude-sonnet-4-6`) in settings.json when reproducibility matters.', 'comment', COMMENT],
  ['- **All code is English** — identifiers, comments, docstrings, log messages, commit messages — and so are agent-written repo docs (ARCHITECTURE, ADRs, STATUS, Known pitfalls). User-authored requirement docs stay as written. Vietnamese is used ONLY for PmCamp ↔ user communication — NEVER in code or agent-written artifacts.', 'drop', CORE],
  ['- **All code is English** — identifiers, comments, docstrings, log messages, commit messages. Vietnamese is used ONLY for PmCamp ↔ user communication — NEVER in code or artifacts.', 'drop', CORE],
  ["- ALWAYS use code-review-graph MCP tools BEFORE Grep/Glob/Read. The graph is faster, cheaper, and gives structural context (callers, dependents, test coverage). Before editing SHARED code (a function, type, schema, or API used elsewhere), query the graph for its dependents and run the impacted callers' tests — not only tests near the changed file.", 'drop', CORE],
  ['- ALWAYS use code-review-graph MCP tools BEFORE Grep/Glob/Read. The graph is faster, cheaper, and gives structural context (callers, dependents, test coverage).', 'drop', CORE],
  ['- Key graph tools — impact (before shared-code edits): `query_graph_tool` (`callers_of` / `importers_of` / `tests_for`), `get_impact_radius_tool` / `get_affected_flows_tool` with `changed_files` = the files you will edit (the default diffs `HEAD~1`); after edits: `detect_changes_tool`. Overview: `get_architecture_overview_tool` only if it has a `detail_level` parameter (code-review-graph ≥2.3.4), else `list_communities_tool` (`detail_level="minimal"`) + `get_surprising_connections_tool`; plus `get_hub_nodes_tool` / `get_bridge_nodes_tool`. Never the `architecture_map` prompt.', 'drop', CORE],
  ['- `.claude/PmCamp.md` + `.claude/rules/` are COPIES of claude-camp plugin files — after a plugin update, run `/basecamp refresh` to sync them (user-modified files are never overwritten without confirmation).', 'drop', PERSONA],
  ['- ponytail enforces minimalism at code-generation time — write the least code that works; reuse existing / stdlib / native before adding. Modes: `/ponytail ultra` (aggressive) if it still over-builds; `/ponytail off` to disable if it ever under-builds. Boundary: karpathy-skills = engineering principles (Simplicity First); ponytail = the operational, measured minimalism layer (ladder + review/audit/debt commands) — they layer, not duplicate.', WRITE_LEAST, 'v1.2.7 template line (ponytail note → its HTML comment)'],
  ['- Spawn a sub-agent to isolate context, parallelize independent work, or offload bulk mechanical tasks — it reads in its own context and returns a summary. Do NOT spawn when the parent needs the reasoning, when synthesis must hold things together, or when spawn overhead dominates. The parent owns the final output + cross-spawn synthesis.', 'drop', PERSONA],
  ['- Session hygiene: fresh session per milestone/feature — start from docs/STATUS.md; don\'t marathon one session past ~150k context. `/clear` when switching to unrelated work; `/compact` mid-task if context balloons. Don\'t leave background/parallel sessions running unattended — they share the same usage limit.', 'drop', PERSONA],
  ['- `/clear` between unrelated tasks; `/compact` once context passes ~50%. One task = one session.', 'drop', PERSONA + ' (Session hygiene)'],
  ['- Keep this file ≤150 lines; let claude-mem hold history, not CLAUDE.md.', 'comment', COMMENT],
  ['> Engineering principles come from andrej-karpathy-skills; the Superpowers meta-skill enforces the brainstorm → plan → TDD → review workflow. Do NOT restate either here.', 'comment', COMMENT],
];
// Stale model-tier claim inside a filled-in "- Tier:" line (v1.2.0–v1.2.7). Measured on Claude Code
// 2.1.289: the env is only the default; a dispatch's own `model` wins.
const PHRASES = [
  [' The env wins over per-invocation model params and agent-file frontmatter, so it catches every subagent.', ''],
  ['FORCES the subagent model', 'sets the default subagent model'],
  ["forces every subagent's model via", 'sets the default subagent model via'],
];
const STALE = /\bforc(es|ed|ing)?\b|catches every subagent/i;
const GRAPH = '<!-- code-review-graph MCP tools -->';
const GRAPH_STUB = [GRAPH,
  '<!-- Tool guide removed by /basecamp refresh: .claude/rules/core.md carries the key graph tools. This marker stays so `code-review-graph install` reports the block as edited instead of re-appending it. -->',
  '<!-- /code-review-graph MCP tools -->'];
// code-review-graph's generated CLAUDE.md guides — every version its 2.3.9 release still recognizes
// (_legacy_instructions + the current one): [line count, sha256/16 of the lines joined with \n].
// Only an exact match is replaced; any other block under the marker was edited and stays.
const GUIDES = [[45, '40cad57e96ce0de2'], [38, '6f1da005fdbcea61'], [38, '89d6e0ea65c5a54f'], [38, '73795531870c88bd'],
  [38, '054fd9e752380f39'], [34, 'b220c3e45cbc56a2'], [30, 'e610956505314fb1']];

const norm = (s) => s.replace(/`/g, '').replace(/\s+/g, ' ').trim();
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
const REG = new Map(LINES.map(([t, action, home]) => [norm(t), { action, home }]));
const short = (s, n = 100) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

function cleanup(text) {
  const raw = text.split('\n'); // each line keeps its own \r, so mixed endings survive
  const body = raw.map((l) => l.replace(/\r$/, ''));
  const cr = (k) => (raw[k].endsWith('\r') ? '\r' : '');
  const hasWriteLeast = body.some((l) => norm(l) === norm(WRITE_LEAST));
  const changes = [];
  const edited = [];
  const out = [];
  let fence = false;
  let comment = false;
  for (let i = 0; i < body.length; i++) {
    const b = body[i];
    if (comment) { if (b.includes('-->')) comment = false; out.push(raw[i]); continue; }
    if (/^\s*(```|~~~)/.test(b)) fence = !fence;
    if (fence || /^\s*(```|~~~)/.test(b)) { out.push(raw[i]); continue; }
    if (b.trim() === GRAPH) {
      const guide = GUIDES.find(([n, h]) => sha(body.slice(i, i + n).join('\n')) === h);
      if (guide) {
        changes.push({ at: i + 1, to: i + guide[0], old: `code-review-graph's generated tool guide (${guide[0]} lines, exact match)`, now: 'marker-only stub (0 tokens)', home: CORE + '; the marker stops `code-review-graph install` re-appending it' });
        out.push(...GRAPH_STUB.map((l) => l + cr(i)));
        i += guide[0] - 1;
      } else if (body.slice(i, i + 3).join('\n') === GRAPH_STUB.join('\n')) {
        out.push(...raw.slice(i, i + 3));
        i += 2;
      } else {
        edited.push({ at: i + 1, line: 'code-review-graph block that matches no generated version (edited?)' });
        out.push(raw[i]);
      }
      continue;
    }
    const open = b.lastIndexOf('<!--');
    if (open >= 0 && !b.slice(open).includes('-->')) { comment = true; out.push(raw[i]); continue; }
    const n = norm(b);
    const hit = REG.get(n);
    if (hit) {
      const drop = hit.action === 'drop' || (hit.action === WRITE_LEAST && hasWriteLeast);
      const now = drop ? null : hit.action === 'comment' ? `<!-- ${b.trim().replace(/^[-*>]\s*/, '')} -->` : hit.action;
      changes.push({ at: i + 1, old: b, now, home: drop && hit.action === WRITE_LEAST ? 'already in this file as "Write the least code that works"' : hit.home });
      if (now !== null) out.push(now + cr(i));
      else if (out.length && !out[out.length - 1].trim() && i + 1 < body.length && !body[i + 1].trim()) i++; // no double blank
    } else if (/^- Tier:/.test(b.trim())) {
      const now = PHRASES.reduce((s, [p, r]) => s.split(p).join(r), b);
      if (now !== b) {
        changes.push({ at: i + 1, old: b, now, home: 'stale claim fixed (Claude Code 2.1.289: a dispatch\'s own model wins over the env)' });
        out.push(now + cr(i));
      } else out.push(raw[i]);
      if (STALE.test(now)) edited.push({ at: i + 1, line: b });
    } else {
      if (n.length > 40 && [...REG.keys()].some((k) => k.slice(0, 40) === n.slice(0, 40))) edited.push({ at: i + 1, line: b });
      out.push(raw[i]);
    }
  }
  return { result: out.join('\n'), changes, edited };
}

function main() {
  const args = process.argv.slice(2);
  const file = path.resolve(args.find((a) => !a.startsWith('--')) || 'CLAUDE.md');
  const root = path.dirname(file);
  if (!fs.existsSync(file)) {
    console.log(`SKIP: ${file} doesn't exist — the cleanup only reads the root CLAUDE.md.`);
    return;
  }
  if (!fs.existsSync(path.join(root, CORE)) || !fs.existsSync(path.join(root, '.claude/PmCamp.persona.md'))) {
    console.log(`SKIP: ${CORE} and .claude/PmCamp.persona.md must exist first (run the plugin-copy refresh) — these lines are still the only copy.`);
    return;
  }
  const text = fs.readFileSync(file, 'utf8');
  const { result, changes, edited } = cleanup(text);
  if (!changes.length) {
    console.log('CLEAN: no superseded camp lines.');
  } else {
    console.log(`${path.basename(file)} cleanup — camp-authored lines superseded by v1.2.7+ (nothing else is touched):`);
    for (const c of changes) {
      const at = c.to ? `L${c.at}–${c.to}` : `L${c.at}`;
      console.log(`  ${at.padEnd(9)}- ${short(c.old)}`);
      if (c.now) console.log(`  ${''.padEnd(9)}+ ${short(c.now)}`);
      console.log(`  ${''.padEnd(9)}  → ${c.home}`);
    }
    const loaded = (s) => s.replace(/<!--[\s\S]*?-->/g, '').length; // Claude Code strips HTML comments
    const [a, b] = [loaded(text), loaded(result)];
    console.log(`Loaded text ${a} → ${b} chars (${a >= b ? '−' : '+'}${Math.abs(a - b)}, ~${Math.round(Math.abs(a - b) / 2.5)} tokens per spawn: main session + every sub-agent).`);
  }
  if (edited.length) {
    console.log('Edited camp lines — left alone (they differ from camp\'s wording):');
    for (const e of edited) console.log(`  L${String(e.at).padEnd(7)}${short(e.line)}`);
  }
  if (args.includes('--apply') && changes.length) {
    const bak = path.join(root, '.claude', path.basename(file) + '.bak');
    fs.copyFileSync(file, bak);
    fs.writeFileSync(file, result);
    console.log(`APPLIED: ${changes.length} change(s) written to ${path.basename(file)}. Backup: .claude/${path.basename(bak)} (undo: mv .claude/${path.basename(bak)} ${path.basename(file)}).`);
  }
}

if (require.main === module) main();
module.exports = { cleanup, GRAPH_STUB };
