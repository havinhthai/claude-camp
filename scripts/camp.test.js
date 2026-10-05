// node --test scripts/camp.test.js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const camp = require('./camp');

const tmp = (p) => fs.mkdtempSync(path.join(os.tmpdir(), p));
const put = (root, rel, body) => { fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true }); fs.writeFileSync(path.join(root, rel), body); };
const get = (root, rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const PERSONA_OLD = '# PmCamp\n- Plain Vietnamese, concise. Surface decisions and tradeoffs clearly.\n';

// A fake plugin root; eol '\r\n' mimics a Windows checkout of the plugin.
function plugin(version, eol = '\n') {
  const root = tmp('camp-root-');
  const files = {
    '.claude-plugin/plugin.json': JSON.stringify({ version }),
    'PmCamp.md': 'Stub: read .claude/PmCamp.persona.md.\n',
    'PmCamp.persona.md': '# PmCamp\n- Talk to the user in their language.\n',
    'rules/core.md': '# Core\n- English only.\n',
    'rules/node.md': '# Node\n',
    'workflows/readiness.md': '# Readiness\n',
    'project-agents/general-purpose.md': '---\nname: general-purpose\n# Role text copied from Claude Code 2.1.289.\n---\nYou are an agent.\n',
  };
  for (const [rel, body] of Object.entries(files)) put(root, rel, body.replace(/\n/g, eol));
  return root;
}
const REQUIRED = ['PmCamp.md', 'PmCamp.persona.md', 'rules/core.md', 'workflows/readiness.md'];
const states = (project, root) => Object.fromEntries(camp.rows(project, root).map((r) => [r.file, r.state]));

test('copy then audit: every copy current, LF, agent stamp on line 2', () => {
  const root = plugin('1.4.0'), project = tmp('camp-p-');
  for (const f of [...REQUIRED, 'project-agents/general-purpose.md']) camp.copy(project, f, { root });
  assert.deepStrictEqual(states(project, root), {
    '.claude/PmCamp.md': 'current', '.claude/PmCamp.persona.md': 'current', '.claude/rules/core.md': 'current',
    '.claude/rules/node.md': 'absent', '.claude/camp/workflows/readiness.md': 'current', '.claude/agents/general-purpose.md': 'current',
  });
  const agent = get(project, '.claude/agents/general-purpose.md').split('\n');
  assert.strictEqual(agent[0], '---');
  assert.match(agent[1], /^# claude-camp: general-purpose\.md v1\.4\.0 · sha256:[0-9a-f]{12}$/);
  assert.match(get(project, '.claude/rules/core.md'), /^<!-- claude-camp: core\.md v1\.4\.0 · sha256:[0-9a-f]{12} -->\n# Core\n/);
  const report = camp.audit(project, root, { running: '2.1.230', onPath: null });
  assert.match(report, /role text from 2\.1\.289, running 2\.1\.230/);
  assert.match(report, /✅ Persona \d+ \/ 9500 chars/);
});

test('CRLF never flips a copy to user-modified', () => {
  const lf = plugin('1.4.0'), crlf = plugin('1.4.0', '\r\n');
  const a = tmp('camp-p-'), b = tmp('camp-p-');
  camp.copy(a, 'rules/core.md', { root: lf });
  camp.copy(b, 'rules/core.md', { root: crlf });
  assert.strictEqual(get(a, '.claude/rules/core.md'), get(b, '.claude/rules/core.md'), 'Windows and macOS plugin checkouts stamp alike');
  // the committed copy checked out with CRLF (core.autocrlf=true)
  put(a, '.claude/rules/core.md', get(a, '.claude/rules/core.md').replace(/\n/g, '\r\n'));
  assert.strictEqual(states(a, lf)['.claude/rules/core.md'], 'current');
  // camp ≤1.3.1's shell pipeline stamped raw bytes of a CRLF plugin source
  const src = get(crlf, 'rules/core.md');
  put(b, '.claude/rules/core.md', `<!-- claude-camp: core.md v1.3.1 · sha256:${camp.sha(src)} -->\r\n${src}`);
  assert.strictEqual(states(b, lf)['.claude/rules/core.md'], 'outdated');
});

test('outdated, edited, unstamped, user-owned agent, missing', () => {
  const old = plugin('1.3.1'), root = plugin('1.4.0'), project = tmp('camp-p-');
  for (const f of ['PmCamp.md', 'PmCamp.persona.md', 'rules/core.md']) camp.copy(project, f, { root: old });
  put(project, '.claude/PmCamp.persona.md', get(project, '.claude/PmCamp.persona.md') + '- my edit\n');
  put(project, '.claude/rules/node.md', '# Node, no stamp\n');
  put(project, '.claude/agents/general-purpose.md', '---\nname: general-purpose\n---\nmine\n');
  const rows = Object.fromEntries(camp.rows(project, root).map((r) => [r.file, r]));
  assert.strictEqual(rows['.claude/PmCamp.md'].state, 'outdated');
  assert.strictEqual(rows['.claude/PmCamp.persona.md'].state, 'modified');
  assert.strictEqual(rows['.claude/rules/core.md'].detail, 'v1.3.1 → v1.4.0, untouched');
  assert.strictEqual(rows['.claude/rules/node.md'].detail, 'no stamp');
  assert.strictEqual(rows['.claude/agents/general-purpose.md'].state, 'own');
  assert.strictEqual(rows['.claude/camp/workflows/readiness.md'].state, 'missing');
});

test('pre-1.2.7 layout migrates both rows and names the language it hard-coded', () => {
  const root = plugin('1.4.0'), legacy = tmp('camp-p-'), modern = tmp('camp-p-');
  put(legacy, '.claude/PmCamp.md', `<!-- claude-camp: PmCamp.md v1.2.6 · sha256:${camp.sha(PERSONA_OLD)} -->\n${PERSONA_OLD}`);
  const rows = camp.rows(legacy, root);
  assert.deepStrictEqual(rows.slice(0, 2).map((r) => [r.state, r.language]), [['migrate', 'Vietnamese'], ['migrate', 'Vietnamese']]);
  camp.copy(modern, 'PmCamp.md', { root });
  assert.deepStrictEqual(camp.rows(modern, root).slice(0, 2).map((r) => r.state), ['current', 'missing'], 'a stub is not a legacy persona');
  put(modern, '.claude/PmCamp.persona.md', PERSONA_OLD);
  assert.strictEqual(camp.rows(modern, root)[1].language, 'Vietnamese');
  assert.strictEqual(camp.pinnedLanguage('- Talk to the user in their language.'), null);
});

test('copy keeps local edits unless --backup', () => {
  const root = plugin('1.4.0'), project = tmp('camp-p-');
  put(project, '.claude/rules/core.md', '# my core\n');
  assert.throws(() => camp.copy(project, 'rules/core.md', { root }), /has local edits/);
  assert.strictEqual(get(project, '.claude/rules/core.md'), '# my core\n');
  camp.copy(project, 'rules/core.md', { root, backup: true });
  assert.strictEqual(get(project, '.claude/rules/core.md.bak'), '# my core\n');
  assert.strictEqual(states(project, root)['.claude/rules/core.md'], 'current');
  assert.throws(() => camp.copy(project, '../etc/passwd', { root }), /not a camp plugin file/);
});

test('version thresholds', () => {
  assert.match(camp.versionLine({ running: '2.1.289', onPath: '2.1.289' }), /^✅ Claude Code 2\.1\.289 \(camp needs ≥2\.1\.257\)$/);
  assert.match(camp.versionLine({ running: '2.1.255', onPath: null }), /^⚠️ .*< 2\.1\.257: .*fable/);
  assert.match(camp.versionLine({ running: '2.1.220', onPath: null }), /^⚠️ .*< 2\.1\.251: CLAUDE_CODE_SUBAGENT_MODEL overrides/);
  assert.match(camp.versionLine({ running: '2.1.289', onPath: '2.1.220' }), /\nℹ️ `claude` on PATH is 2\.1\.220/);
  assert.match(camp.versionLine({ running: null, onPath: null }), /^❔/);
  assert.strictEqual(camp.cmp('2.1.257', '2.1.26'), 1);
});

test('memsize honors CLAUDE_CONFIG_DIR and autoMemoryEnabled', () => {
  const config = tmp('camp-cfg-'), project = tmp('camp-p-');
  const file = path.join(config, 'projects', project.replace(/[^a-zA-Z0-9]/g, '-'), 'memory', 'MEMORY.md');
  assert.match(camp.memsize(project, { CLAUDE_CONFIG_DIR: config }), /^auto-memory on · no MEMORY\.md at /);
  put(path.dirname(file), 'MEMORY.md', 'abcd');
  assert.match(camp.memsize(project, { CLAUDE_CONFIG_DIR: config }), /: 4 chars ≈ 2 tokens per spawn$/);
  put(project, '.claude/settings.json', '{"autoMemoryEnabled": false}');
  assert.match(camp.memsize(project, { CLAUDE_CONFIG_DIR: config }), /^auto-memory OFF \(/);
});
