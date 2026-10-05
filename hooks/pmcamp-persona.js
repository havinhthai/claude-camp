#!/usr/bin/env node
// SessionStart: inject the project's PmCamp persona into the MAIN session only —
// SessionStart context never reaches sub-agents. No persona file → no output.
// Silent on any error: a broken hook must never block session start.
const fs = require('fs');
const os = require('os');
const path = require('path');

// Claude Code swaps additionalContext longer than 10,000 (UTF-16 length) for a 2k-char
// preview + file path. Persona ≤ 9,500 keeps persona + header under that.
const MAX = 9500;

// From the launch dir up to the git root: sessions may start in a subdirectory.
// Never above $HOME, so a stray ~/.claude/PmCamp.persona.md can't leak into non-git projects.
function findPersona(dir) {
  try { dir = fs.realpathSync(dir); } catch {}
  for (dir = path.resolve(dir); dir !== os.homedir(); dir = path.dirname(dir)) {
    const file = path.join(dir, '.claude', 'PmCamp.persona.md');
    if (fs.existsSync(file)) return file;
    if (fs.existsSync(path.join(dir, '.git')) || path.dirname(dir) === dir) return null;
  }
  return null;
}

try {
  process.stdout.on('error', () => {}); // reader gone (timeout) → stay silent
  const file = findPersona(process.env.CLAUDE_PROJECT_DIR || process.cwd());
  const persona = file && fs.readFileSync(file, 'utf8').replace(/^﻿?<!-- claude-camp:.*-->\r?\n/, '');
  if (persona && persona.trim()) {
    const out = { hookSpecificOutput: { hookEventName: 'SessionStart' } };
    if (persona.length > MAX) {
      out.hookSpecificOutput.additionalContext = `You are PmCamp, this project's PM. Your persona was NOT injected: ${file} is ${persona.length} chars, over the ${MAX}-char hook limit. Read that file in full now, before anything else, and follow it. Warn the user it must be trimmed below ${MAX} chars.`;
      out.systemMessage = `camp: PmCamp persona is ${persona.length} chars (limit ${MAX}) — not injected; the PM will Read ${file}. Trim it.`;
    } else {
      out.hookSpecificOutput.additionalContext = `PmCamp persona — project instructions for this main session (camp plugin, from .claude/PmCamp.persona.md). They OVERRIDE default behavior; sub-agents never receive them.\n\n${persona}`;
    }
    process.stdout.write(JSON.stringify(out));
  }
} catch {}
