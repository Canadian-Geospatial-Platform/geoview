// Minimal eslint-plugin-import resolver (interface v2) for the `@/` alias and relative imports, used by import/no-cycle.
// Bare package specifiers (react, ol, geoview-core, ...) are reported as external (path: null) and therefore ignored.
const fs = require('fs');
const path = require('path');

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

function isFile(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function resolveFile(basePath) {
  if (isFile(basePath)) return basePath;
  const candidates = [...EXTENSIONS.map((ext) => `${basePath}${ext}`), ...EXTENSIONS.map((ext) => path.join(basePath, `index${ext}`))];
  return candidates.find(isFile);
}

function getSrcRoot(file) {
  const match = /^(.*[\\/]packages[\\/][^\\/]+[\\/]src)[\\/]/.exec(file);
  return match ? match[1] : undefined;
}

exports.interfaceVersion = 2;

exports.resolve = (source, file) => {
  let basePath;
  if (source.startsWith('@/')) {
    const srcRoot = getSrcRoot(file);
    if (!srcRoot) return { found: false };
    basePath = path.join(srcRoot, source.slice(2));
  } else if (source.startsWith('.') || path.isAbsolute(source)) {
    basePath = path.resolve(path.dirname(file), source);
  } else {
    return { found: true, path: null };
  }

  const resolved = resolveFile(basePath);
  return resolved ? { found: true, path: resolved } : { found: false };
};
