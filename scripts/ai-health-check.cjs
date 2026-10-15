/* eslint-disable no-console */
// Checks AI-instruction health: size budgets, agent/skill/instruction metadata, broken relative links and
// heading anchors, encoding, en/fr key parity.
// Usage: node scripts/ai-health-check.cjs  (from repo root)
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
let failures = 0;
const fail = (msg) => {
  failures += 1;
  console.error(`FAIL: ${msg}`);
};
const warn = (msg) => console.warn(`WARN: ${msg}`);

const readFrontmatter = (file) => (fs.readFileSync(file, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/) || [])[1];
const frontField = (front, key) => {
  const m = front.match(new RegExp(`^${key}:\\s*(['"]?)(.*?)\\1\\s*$`, 'm'));
  return m ? m[2] : undefined;
};

const rel = (p) => path.relative(root, p).split(path.sep).join('/');
const walk = (dir, filter, out = []) => {
  if (!fs.existsSync(dir)) return out;
  fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, filter, out);
    else if (filter(full)) out.push(full);
  });
  return out;
};

const budgets = [
  { file: '.github/copilot-instructions.md', maxLines: 250 },
  { file: 'AGENTS.md', maxLines: 80 },
];
budgets.forEach(({ file, maxLines }) => {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) return fail(`${file} missing`);
  const n = fs.readFileSync(p, 'utf8').split('\n').length;
  if (n > maxLines) fail(`${file} has ${n} lines (budget ${maxLines})`);
  return undefined;
});
walk(path.join(root, '.github/instructions'), (f) => f.endsWith('.md')).forEach((f) => {
  const n = fs.readFileSync(f, 'utf8').split('\n').length;
  if (n > 400) fail(`${rel(f)} has ${n} lines (budget 400)`);
});

// Agents: explicit name matching the file, and a description starting with the role tag so the picker shows the purpose.
walk(path.join(root, '.github/agents'), (f) => f.endsWith('.agent.md')).forEach((f) => {
  const front = (fs.readFileSync(f, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/) || [])[1];
  if (!front) return fail(`${rel(f)}: missing frontmatter`);
  const name = (front.match(/^name:\s*["']?([^"'\r\n]+)/m) || [])[1];
  const expected = path.basename(f, '.agent.md');
  if (name !== expected) fail(`${rel(f)}: name must be "${expected}" (found "${name ?? ''}")`);
  const desc = (front.match(/^description:\s*["']?(.*)$/m) || [])[1] ?? '';
  if (!/^\[(Workflow|Specialist)\] Use when: /.test(desc)) {
    fail(`${rel(f)}: description must start with "[Workflow] Use when: " or "[Specialist] Use when: "`);
  }
  const suffixRole = /(?:Expert|Explorer|Reviewer|Architect)$/.test(name)
    ? 'Specialist'
    : /(?:Creator|Review|Update)$/.test(name)
      ? 'Workflow'
      : undefined;
  if (suffixRole && !desc.startsWith(`[${suffixRole}]`)) {
    fail(`${rel(f)}: name suffix indicates ${suffixRole}, but description has a different role`);
  }
  const text = fs.readFileSync(f, 'utf8');
  if (!/Knowledge upkeep/.test(text)) fail(`${rel(f)}: missing "Knowledge upkeep" line (see AGENTS.md)`);
  // Agents hold the workflow only; reference material belongs in .github/ai/*.md (read on demand).
  const lines = text.split('\n').length;
  if (lines > 300) fail(`${rel(f)} has ${lines} lines (budget 300) — move reference material to .github/ai/`);
  return undefined;
});

const aiFiles = [
  path.join(root, 'AGENTS.md'),
  path.join(root, '.github/copilot-instructions.md'),
  path.join(root, 'docs/programming/using-ai.md'),
  ...walk(path.join(root, '.github'), (f) => f.endsWith('.md') && !f.includes(`${path.sep}ISSUE_TEMPLATE`)),
  ...walk(path.join(root, '.github/ai'), (f) => f.endsWith('.md')),
];
// Section links route agents into public docs, so a renamed heading must fail just like a missing file.
// Anchors follow GitHub's heading slugs (what agents and GitHub resolve); the published docs site may differ
// for headings with unusual punctuation.
const slugify = (heading) => {
  let plainHeading = heading;
  let previousHeading;
  // Removing a tag can expose another tag in malformed nested markup; normalize to a fixed point.
  do {
    previousHeading = plainHeading;
    plainHeading = plainHeading.replace(/<[^>]+>/g, '');
  } while (plainHeading !== previousHeading);
  return plainHeading
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/ /g, '-');
};
const anchorCache = new Map();
const getAnchors = (file) => {
  if (anchorCache.has(file)) return anchorCache.get(file);
  const anchors = new Set();
  const seen = new Map();
  let inFence = false;
  fs.readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .forEach((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        inFence = !inFence;
        return;
      }
      if (inFence) return;
      for (const m of line.matchAll(/<a\s+(?:id|name)=["']([^"']+)["']/gi)) anchors.add(m[1]);
      const heading = line.match(/^#{1,6}\s+(.+?)(?:\s+#+)?\s*$/);
      if (!heading) return;
      const base = slugify(heading[1]);
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      anchors.add(count ? `${base}-${count}` : base);
    });
  anchorCache.set(file, anchors);
  return anchors;
};
// Links inside code samples are examples, not navigation.
const stripCode = (text) => text.replace(/^[ \t]*(```|~~~)[^\n]*\n[\s\S]*?^[ \t]*\1/gm, '').replace(/`[^`\n]*`/g, '');

[...new Set(aiFiles)].forEach((f) => {
  const text = fs.readFileSync(f, 'utf8');
  // Double-encoded UTF-8 (e.g. "â€”" instead of "—") from a wrong-codepage save.
  if (/â€|â†|Ã©|Ã¨/.test(text)) fail(`${rel(f)}: mojibake detected (file re-saved with the wrong encoding)`);
  for (const m of stripCode(text).matchAll(/\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g)) {
    const link = m[1];
    // Skip external URLs, site-absolute paths and template placeholders such as rt-NN.
    if (/^[a-z][a-z0-9+.-]*:/i.test(link) || link.startsWith('/') || /NN|rt-NN/.test(link)) continue;
    const [linkPath, anchor] = link.split('#');
    const target = linkPath ? path.resolve(path.dirname(f), decodeURI(linkPath)) : f;
    if (!fs.existsSync(target)) {
      fail(`${rel(f)}: broken link ${link}`);
      continue;
    }
    if (anchor && target.endsWith('.md') && !getAnchors(target).has(decodeURIComponent(anchor))) {
      fail(`${rel(f)}: broken anchor ${link} (no matching heading in ${rel(target)})`);
    }
  }
});

// Skills: discovery depends on the name matching the folder and a "Use when" description; registration keeps
// the entry points and developer guide in sync.
const agentsText = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
const usingAiPath = path.join(root, 'docs/programming/using-ai.md');
const usingAiText = fs.existsSync(usingAiPath) ? fs.readFileSync(usingAiPath, 'utf8') : '';
walk(path.join(root, '.github/skills'), (f) => path.basename(f) === 'SKILL.md').forEach((f) => {
  const folder = path.basename(path.dirname(f));
  const front = readFrontmatter(f);
  if (!front) return fail(`${rel(f)}: missing frontmatter`);
  const name = frontField(front, 'name');
  if (name !== folder) fail(`${rel(f)}: name must be "${folder}" (found "${name ?? ''}")`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(folder) || folder.length > 64) {
    fail(`${rel(f)}: skill folder must be lowercase-hyphenated and at most 64 characters`);
  }
  const desc = frontField(front, 'description') ?? '';
  if (!/^Use when\b/.test(desc)) fail(`${rel(f)}: description must start with "Use when"`);
  if (desc.length > 1024) fail(`${rel(f)}: description has ${desc.length} characters (max 1024)`);
  if (!new RegExp(`\\b${folder}\\b`).test(agentsText)) fail(`${rel(f)}: skill "${folder}" is not listed in AGENTS.md`);
  if (!usingAiText.includes(`\`/${folder}\``)) fail(`${rel(f)}: skill "/${folder}" is not listed in docs/programming/using-ai.md`);
  return undefined;
});

// Scoped instructions: applyTo decides when they load. "**" loads them on every request (defeats targeted
// context); a glob that matches nothing means the instruction never loads.
const skipDirs = new Set(['node_modules', '.git', 'dist']);
const skipPaths = new Set(['common/temp', 'packages/geoview-core/public/builds']);
let repoFiles;
const listRepoFiles = (dir = root, out = []) => {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!skipDirs.has(e.name) && !skipPaths.has(rel(full))) listRepoFiles(full, out);
    } else out.push(rel(full));
  });
  return out;
};
const splitTopLevel = (value) => {
  const parts = [];
  let depth = 0;
  let current = '';
  [...value].forEach((c) => {
    if (c === '{') depth += 1;
    if (c === '}') depth -= 1;
    if (c === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else current += c;
  });
  if (current.trim()) parts.push(current.trim());
  return parts;
};
const globToRegExp = (glob) => {
  let re = '';
  let depth = 0;
  for (let i = 0; i < glob.length; i += 1) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') {
      if (glob[i + 2] === '/') {
        re += '(?:.*/)?';
        i += 2;
      } else {
        re += '.*';
        i += 1;
      }
    } else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else if (c === '{') {
      depth += 1;
      re += '(?:';
    } else if (c === '}') {
      depth -= 1;
      re += ')';
    } else if (c === ',' && depth > 0) re += '|';
    else re += c.replace(/[.+^$()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
};
walk(path.join(root, '.github/instructions'), (f) => f.endsWith('.instructions.md')).forEach((f) => {
  const front = readFrontmatter(f);
  if (!front) return fail(`${rel(f)}: missing frontmatter`);
  if (!frontField(front, 'description')) fail(`${rel(f)}: missing description`);
  const applyTo = frontField(front, 'applyTo');
  if (!applyTo) return fail(`${rel(f)}: missing applyTo`);
  splitTopLevel(applyTo).forEach((glob) => {
    if (glob === '**' || glob === '**/*') {
      fail(`${rel(f)}: applyTo "${glob}" loads on every request; use a specific glob`);
      return;
    }
    repoFiles ??= listRepoFiles();
    const re = globToRegExp(glob);
    if (!repoFiles.some((file) => re.test(file))) warn(`${rel(f)}: applyTo glob "${glob}" matches no files`);
  });
  return undefined;
});

const flatten = (obj, prefix = '', out = []) => {
  Object.entries(obj).forEach(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') flatten(v, key, out);
    else out.push(key);
  });
  return out;
};
const localesDir = path.join(root, 'packages/geoview-core/public/locales');
const enFile = path.join(localesDir, 'en/translation.json');
const frFile = path.join(localesDir, 'fr/translation.json');
if (fs.existsSync(enFile) && fs.existsSync(frFile)) {
  const en = new Set(flatten(JSON.parse(fs.readFileSync(enFile, 'utf8'))));
  const fr = new Set(flatten(JSON.parse(fs.readFileSync(frFile, 'utf8'))));
  [...en].filter((k) => !fr.has(k)).forEach((k) => fail(`i18n key missing in fr: ${k}`));
  [...fr].filter((k) => !en.has(k)).forEach((k) => fail(`i18n key missing in en: ${k}`));
}

if (failures) {
  console.error(`${failures} problem(s) found`);
  process.exit(1);
}
console.log('AI health check passed');
