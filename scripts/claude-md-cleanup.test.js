// node --test scripts/
const test = require('node:test');
const assert = require('node:assert');
const { cleanup, GRAPH_STUB } = require('./claude-md-cleanup');

// code-review-graph's generated guide as appended to scrumcamp's CLAUDE.md (a pre-end-marker version)
const GUIDE = "<!-- code-review-graph MCP tools -->\n## MCP Tools: code-review-graph\n\n**IMPORTANT: This project has a knowledge graph. ALWAYS use the\ncode-review-graph MCP tools BEFORE using Grep/Glob/Read to explore\nthe codebase.** The graph is faster, cheaper (fewer tokens), and gives\nyou structural context (callers, dependents, test coverage) that file\nscanning cannot.\n\n### When to use graph tools FIRST\n\n- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep\n- **Understanding impact**: `get_impact_radius` instead of manually tracing imports\n- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files\n- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for\n- **Architecture questions**: `get_architecture_overview` + `list_communities`\n\nFall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.\n\n### Key Tools\n\n| Tool | Use when |\n| ------ | ---------- |\n| `detect_changes` | Reviewing code changes — gives risk-scored analysis |\n| `get_review_context` | Need source snippets for review — token-efficient |\n| `get_impact_radius` | Understanding blast radius of a change |\n| `get_affected_flows` | Finding which execution paths are impacted |\n| `query_graph` | Tracing callers, callees, imports, tests, dependencies |\n| `semantic_search_nodes` | Finding functions/classes by name or keyword |\n| `get_architecture_overview` | Understanding high-level codebase structure |\n| `refactor_tool` | Planning renames, finding dead code |\n\n### Workflow\n\n1. The graph auto-updates on file changes (via hooks).\n2. Use `detect_changes` for code review.\n3. Use `get_affected_flows` to understand impact.\n4. Use `query_graph` pattern=\"tests_for\" to check coverage.";
const FAKE_GUIDE = '<!-- code-review-graph MCP tools -->\n## MCP Tools: code-review-graph\n- hand-edited guide';
const ALWAYS = '- ALWAYS use code-review-graph MCP tools BEFORE Grep/Glob/Read. The graph is faster, cheaper, and gives structural context (callers, dependents, test coverage).';

test('touches only exact camp lines and is idempotent', () => {
  const before = [
    '# Demo',
    '## Model routing (policy — enforcement lives in `.claude/settings.json`)',
    '- Tier: **Premium** — `.claude/settings.json` sets the PM model (`model: opus`) and FORCES the subagent model (`env.CLAUDE_CODE_SUBAGENT_MODEL: sonnet`). The env wins over per-invocation model params and agent-file frontmatter, so it catches every subagent.',
    '- Pinning: replace aliases with full IDs (e.g. `claude-opus-4-8`, `claude-sonnet-4-6`) in `settings.json` when reproducibility matters.',
    '',
    ALWAYS.replace('tools BEFORE', 'tools  BEFORE'),
    '',
    '- ALWAYS use code-review-graph MCP tools BEFORE Grep/Glob/Read. The graph (197 nodes) is faster.',
    '- Project rule that camp never wrote.',
    '',
  ].join('\n');
  const { result, changes, edited } = cleanup(before);
  const lines = result.split('\n');
  assert.ok(lines.includes('## Model routing'));
  assert.ok(lines.includes('<!-- Pinning: replace aliases with full IDs (e.g. `claude-opus-4-8`, `claude-sonnet-4-6`) in `settings.json` when reproducibility matters. -->'));
  assert.ok(lines.includes('- Tier: **Premium** — `.claude/settings.json` sets the PM model (`model: opus`) and sets the default subagent model (`env.CLAUDE_CODE_SUBAGENT_MODEL: sonnet`).'));
  assert.ok(!result.includes('test coverage).'), 'exact line (extra space) dropped → core.md');
  assert.ok(!result.includes('\n\n\n'), 'no double blank where the line was');
  assert.ok(lines.includes('- ALWAYS use code-review-graph MCP tools BEFORE Grep/Glob/Read. The graph (197 nodes) is faster.'));
  assert.deepStrictEqual(edited.map((e) => e.at), [8]);
  assert.ok(lines.includes('- Project rule that camp never wrote.'));
  assert.strictEqual(changes.length, 4);
  assert.strictEqual(cleanup(result).changes.length, 0);
});

test('only an exact generated guide is stubbed; anything after it survives', () => {
  const t = ['# X', GUIDE, '### My project notes', '- never touch prod DB', ''].join('\n');
  const { result } = cleanup(t);
  assert.strictEqual(result, ['# X', ...GRAPH_STUB, '### My project notes', '- never touch prod DB', ''].join('\n'));
  const edited = cleanup(['# X', FAKE_GUIDE].join('\n'));
  assert.strictEqual(edited.changes.length, 0);
  assert.strictEqual(edited.edited.length, 1);
  assert.strictEqual(cleanup(result).changes.length, 0);
});

test('code fences, multi-line comments, line endings and the ponytail line are respected', () => {
  const ponytail = '- ponytail enforces minimalism at code-generation time — write the least code that works; reuse existing / stdlib / native before adding. Modes: `/ponytail ultra` (aggressive) if it still over-builds; `/ponytail off` to disable if it ever under-builds. Boundary: karpathy-skills = engineering principles (Simplicity First); ponytail = the operational, measured minimalism layer (ladder + review/audit/debt commands) — they layer, not duplicate.';
  const t = ['```', ALWAYS, '```', '<!-- note', ALWAYS, '-->', '- Write the least code that works — reuse existing / stdlib / native before adding.\r', ponytail + '\r', '- Keep this file ≤150 lines; let claude-mem hold history, not CLAUDE.md.\r', 'end'].join('\n');
  const { result, changes } = cleanup(t);
  assert.strictEqual(result.split(ALWAYS).length, 3, 'fenced and commented copies untouched');
  assert.ok(!result.includes('ponytail enforces'), 'ponytail line dropped, not duplicated');
  assert.ok(result.includes('<!-- Keep this file ≤150 lines; let claude-mem hold history, not CLAUDE.md. -->\r\nend'), 'CRLF kept per line');
  assert.strictEqual(changes.length, 2);
});
