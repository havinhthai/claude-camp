#!/usr/bin/env node
// /basecamp's cross-platform helper — one command line that works the same in bash, Git Bash,
// PowerShell and cmd. Run it at the project root:
//   node camp.js audit                         one row per plugin copy, persona size, Claude Code version
//   node camp.js copy <plugin file>... [--backup]   stamped copies (e.g. rules/core.md, workflows/readiness.md)
//   node camp.js memsize                       auto-memory MEMORY.md path + size
//   node camp.js version                       running Claude Code version vs camp's minimum
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { MAX, STAMP } = require('../hooks/pmcamp-persona');

const ROOT = path.resolve(__dirname, '..');
const MIN = '2.1.257'; // `fable` alias (Flagship tier) + CLAUDE_CODE_SUBAGENT_MODEL_FORCE
const FLOOR = '2.1.251'; // CLAUDE_CODE_SUBAGENT_MODEL became a default instead of an override
const ICON = { current: '✅ current', outdated: '⬆️ outdated', modified: '✏️ user-modified', missing: '❌ missing', migrate: '→ migrate', absent: '· not installed', own: "· user's own" };

const read = (f) => fs.readFileSync(f, 'utf8');
const pluginVersion = (root) => JSON.parse(read(path.join(root, '.claude-plugin', 'plugin.json'))).version;
const cmp = (a, b) => {
  const x = a.split('.').map(Number), y = b.split('.').map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) < (y[i] || 0) ? -1 : 1;
  return 0;
};

// Plugin source → project copy. The agent file keeps its stamp on line 2: frontmatter owns line 1.
function dest(src) {
  if (/^PmCamp(\.persona)?\.md$/.test(src) || /^rules\/[^/\\]+\.md$/.test(src)) return `.claude/${src}`;
  if (/^workflows\/[^/\\]+\.md$/.test(src)) return `.claude/camp/${src}`;
  if (src === 'project-agents/general-purpose.md') return '.claude/agents/general-purpose.md';
  throw new Error(`not a camp plugin file: ${src}`);
}
const isAgent = (src) => src.startsWith('project-agents/');
function sources(root) {
  const ls = (d) => fs.readdirSync(path.join(root, d)).filter((f) => f.endsWith('.md')).sort().map((f) => `${d}/${f}`);
  return ['PmCamp.md', 'PmCamp.persona.md', ...ls('rules'), ...ls('workflows'), 'project-agents/general-purpose.md'];
}

// Stamps hash LF text without a BOM, so CRLF (Windows) and LF checkouts of one file stamp alike.
// The audit also accepts a raw-bytes hash: copies stamped by camp ≤1.3.1's shell pipeline.
const norm = (s) => s.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 12);
const STAMP_LINE = /claude-camp: \S+ v(\d+(?:\.\d+)*) · sha256:([0-9a-f]{12})/;

function state(project, src, root, version) {
  const file = path.join(project, dest(src));
  // Always required: core.md, the stub, the persona, every workflow. Stack rules and the agent are opt-in.
  const required = !isAgent(src) && (!src.startsWith('rules/') || src === 'rules/core.md');
  if (!fs.existsSync(file)) return { state: required ? 'missing' : 'absent' };
  const lines = read(file).split('\n'); // each line keeps its own \r
  const at = isAgent(src) ? 1 : 0;
  const m = (lines[at] || '').match(STAMP_LINE);
  if (!m) return { state: isAgent(src) ? 'own' : 'modified', detail: 'no stamp' };
  const body = lines.filter((_, i) => i !== at).join('\n');
  if (sha(body) !== m[2] && sha(norm(body)) !== m[2]) return { state: 'modified', from: m[1], detail: `v${m[1]}, edited since` };
  if (cmp(m[1], version) < 0) return { state: 'outdated', from: m[1], detail: `v${m[1]} → v${version}, untouched` };
  return { state: 'current', from: m[1] };
}

// The language a pre-1.4.0 persona hard-coded ("- Plain Vietnamese, concise."), or null.
const pinnedLanguage = (text) => (text.match(/^- Plain (\p{L}+), concise\./mu) || [])[1] || null;

function rows(project, root = ROOT) {
  const version = pluginVersion(root);
  const all = sources(root).map((src) => ({ src, file: dest(src), ...state(project, src, root, version) }));
  const [stub, persona] = all;
  const stubText = stub.state !== 'missing' && norm(read(path.join(project, stub.file))).replace(STAMP, '');
  // Pre-v1.2.7 layout: .claude/PmCamp.md still holds the full persona and no persona file exists.
  if (persona.state === 'missing' && stubText && (!stub.from || cmp(stub.from, '1.2.7') < 0) && stubText.trim() !== norm(read(path.join(root, 'PmCamp.md'))).trim()) {
    stub.detail = stub.state === 'modified' ? 'edited or unstamped — ask before migrating' : 'untouched';
    stub.state = persona.state = 'migrate';
  }
  for (const r of [stub, persona]) {
    if (r.state === 'current' || r.state === 'missing') continue;
    const lang = pinnedLanguage(read(path.join(project, r.state === 'migrate' ? stub.file : r.file)));
    if (lang) r.language = lang;
  }
  const conventions = fs.existsSync(path.join(project, 'CLAUDE.md')) && /^- Conventions:/m.test(read(path.join(project, 'CLAUDE.md')));
  for (const r of all) if (r.state === 'absent' && r.src.startsWith('rules/')) r.detail = conventions ? 'declined (CLAUDE.md Conventions line)' : 'stack rule — copied only if Phase 4 picks it';
  return all.filter((r) => !(isAgent(r.src) && r.state === 'absent'));
}

function copy(project, src, { backup = false, root = ROOT } = {}) {
  const to = path.join(project, dest(src));
  if (fs.existsSync(to)) {
    const s = state(project, src, root, pluginVersion(root)).state;
    if ((s === 'modified' || s === 'own') && !backup) throw new Error(`${dest(src)} has local edits — not overwritten (re-run with --backup to keep them in ${dest(src)}.bak)`);
    if (backup) fs.copyFileSync(to, `${to}.bak`);
  }
  const text = norm(read(path.join(root, src)));
  const stamp = `claude-camp: ${path.basename(src)} v${pluginVersion(root)} · sha256:${sha(text)}`;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.writeFileSync(to, isAgent(src) ? text.replace(/^.*\n/, (l) => `${l}# ${stamp}\n`) : `<!-- ${stamp} -->\n${text}`);
  return dest(src);
}

// Claude Code keys auto-memory on the repo's main checkout (shared by worktrees and subdirectories).
function memsize(cwd = process.cwd(), env = process.env) {
  const config = env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
  const json = (f) => { try { return JSON.parse(read(f)); } catch { return {}; } };
  const settings = [path.join(config, 'settings.json'), path.join(cwd, '.claude', 'settings.json'), path.join(cwd, '.claude', 'settings.local.json')];
  const off = settings.filter((f) => json(f).autoMemoryEnabled === false);
  if (env.CLAUDE_CODE_DISABLE_AUTO_MEMORY === '1') off.push('CLAUDE_CODE_DISABLE_AUTO_MEMORY=1');
  const custom = [settings[0], settings[2]].map((f) => json(f).autoMemoryDirectory).filter(Boolean).pop();
  let repo = cwd;
  const g = spawnSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd, encoding: 'utf8' });
  if (g.status === 0 && path.basename(g.stdout.trim()) === '.git') repo = path.dirname(g.stdout.trim());
  const dir = custom ? custom.replace(/^~(?=$|[\\/])/, os.homedir()) : path.join(config, 'projects', repo.replace(/[^a-zA-Z0-9]/g, '-'), 'memory');
  const file = path.join(dir, 'MEMORY.md');
  const state = off.length ? `auto-memory OFF (${off.join(', ')})` : 'auto-memory on';
  if (!fs.existsSync(file)) return `${state} · no MEMORY.md at ${file}`;
  const n = read(file).length;
  return `${state} · ${file}: ${n} chars ≈ ${Math.round(n / 2)} tokens per spawn`;
}

function claudeVersions(env = process.env) {
  const ask = (bin, shell) => {
    const r = spawnSync(bin, ['--version'], { encoding: 'utf8', shell, timeout: 15000 });
    return ((r.stdout || '').match(/\d+\.\d+\.\d+/) || [])[0] || null;
  };
  const onPath = ask('claude', process.platform === 'win32'); // npm installs claude.cmd
  return { running: (env.CLAUDE_CODE_EXECPATH && ask(env.CLAUDE_CODE_EXECPATH, false)) || onPath, onPath };
}
function versionLine({ running, onPath } = claudeVersions()) {
  if (!running) return '❔ Claude Code version unknown (no CLAUDE_CODE_EXECPATH, no `claude` on PATH)';
  const update = ' Update: `claude update`, or update the IDE extension.';
  let line = `✅ Claude Code ${running} (camp needs ≥${MIN})`;
  if (cmp(running, FLOOR) < 0) line = `⚠️ Claude Code ${running} < ${FLOOR}: CLAUDE_CODE_SUBAGENT_MODEL overrides every sub-agent's model (Superpowers' per-role picks included), and the Flagship tier's \`fable\` alias doesn't exist.${update}`;
  else if (cmp(running, MIN) < 0) line = `⚠️ Claude Code ${running} < ${MIN}: the Flagship tier's \`fable\` alias and CLAUDE_CODE_SUBAGENT_MODEL_FORCE don't exist yet.${update}`;
  if (onPath && onPath !== running) line += `\nℹ️ \`claude\` on PATH is ${onPath} — terminal sessions in this project run that version.`;
  return line;
}

function audit(project = process.cwd(), root = ROOT, versions = claudeVersions()) {
  const version = pluginVersion(root);
  const out = [`camp v${version} — plugin copies in ${project}`, '| Copy | State | Detail |', '|---|---|---|'];
  for (const r of rows(project, root)) {
    let detail = r.detail || '';
    if (r.language) detail += `${detail ? ' · ' : ''}hard-codes replies in ${r.language}`;
    if (isAgent(r.src) && r.state !== 'own') {
      const copied = (read(path.join(project, r.file)).match(/Claude Code (\d+(?:\.\d+)+)/) || [])[1];
      if (copied && versions.running && copied !== versions.running) detail += `${detail ? ' · ' : ''}role text from ${copied}, running ${versions.running}`;
    }
    out.push(`| ${r.file} | ${ICON[r.state]} | ${detail} |`);
  }
  const pf = path.join(project, '.claude', 'PmCamp.persona.md');
  if (fs.existsSync(pf)) {
    const n = read(pf).replace(STAMP, '').length;
    out.push(n > MAX ? `⚠️ Persona ${n} chars > ${MAX}: the hook won't inject it (the PM Reads it instead) — trim it.` : `✅ Persona ${n} / ${MAX} chars`);
  }
  out.push(versionLine(versions));
  return out.join('\n');
}

module.exports = { MIN, FLOOR, cmp, dest, sha, norm, rows, copy, memsize, versionLine, audit, pinnedLanguage };

if (require.main === module) {
  const [cmd, ...args] = process.argv.slice(2);
  const files = args.filter((a) => !a.startsWith('--'));
  try {
    if (cmd === 'audit') console.log(audit());
    else if (cmd === 'memsize') console.log(memsize());
    else if (cmd === 'version') console.log(versionLine());
    else if (cmd === 'copy' && files.length) {
      for (const f of files) {
        try { console.log(`Copied ${copy(process.cwd(), f, { backup: args.includes('--backup') })}`); }
        catch (e) { console.error(`camp: ${e.message}`); process.exitCode = 1; }
      }
    } else {
      console.error('usage: node camp.js audit | copy <plugin file>... [--backup] | memsize | version');
      process.exitCode = 2;
    }
  } catch (e) { console.error(`camp: ${e.message}`); process.exitCode = 1; }
}
