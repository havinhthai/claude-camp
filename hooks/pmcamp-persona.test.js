// node --test hooks/pmcamp-persona.test.js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { MAX } = require('./pmcamp-persona');

const HOOK = path.join(__dirname, 'pmcamp-persona.js');

// A temp HOME holding the project; the hook runs as Claude Code runs it (stdout JSON, exit 0).
function fixture(files) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'camp-hook-'));
  for (const [rel, body] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(home, rel)), { recursive: true });
    fs.writeFileSync(path.join(home, rel), body);
  }
  return home;
}
function run(home, cwd, projectDir) {
  const env = { ...process.env, HOME: home, USERPROFILE: home };
  delete env.CLAUDE_PROJECT_DIR;
  if (projectDir) env.CLAUDE_PROJECT_DIR = projectDir;
  const out = execFileSync(process.execPath, [HOOK], { cwd, env, encoding: 'utf8' });
  return out ? JSON.parse(out) : null;
}

test('injects the persona with its stamp stripped (BOM + CRLF stamp line)', () => {
  const home = fixture({ 'p/.git/HEAD': '', 'p/.claude/PmCamp.persona.md': '\uFEFF<!-- claude-camp: PmCamp.persona.md v1.4.0 · sha256:abc -->\r\n# PmCamp\r\nbody\r\n' });
  const out = run(home, home, path.join(home, 'p'));
  const ctx = out.hookSpecificOutput.additionalContext;
  assert.strictEqual(out.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.ok(ctx.endsWith('\n\n# PmCamp\r\nbody\r\n'));
  assert.ok(!ctx.includes('claude-camp:'));
});

test('walks up from a subdirectory to the git root', () => {
  const home = fixture({ 'p/.git/HEAD': '', 'p/.claude/PmCamp.persona.md': '# PmCamp\n', 'p/src/deep/x.txt': '' });
  assert.ok(run(home, path.join(home, 'p/src/deep')).hookSpecificOutput.additionalContext.includes('# PmCamp'));
});

test('over the limit → not injected, PM told to Read it, user warned', () => {
  const home = fixture({ 'p/.git/HEAD': '', 'p/.claude/PmCamp.persona.md': 'x'.repeat(MAX + 1) });
  const out = run(home, home, path.join(home, 'p'));
  assert.match(out.hookSpecificOutput.additionalContext, /was NOT injected/);
  assert.match(out.systemMessage, new RegExp(`${MAX + 1} chars \\(limit ${MAX}\\)`));
});

test('silent without a persona, and never past the git root or HOME', () => {
  const home = fixture({ '.claude/PmCamp.persona.md': '# stray\n', 'p/.git/HEAD': '', 'loose/x.txt': '', 'p/.claude/PmCamp.md': 'stub' });
  assert.strictEqual(run(home, path.join(home, 'p')), null, 'stops at .git');
  assert.strictEqual(run(home, path.join(home, 'loose')), null, 'stops at HOME');
});
