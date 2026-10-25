const fs = require('fs');
const path = require('path');

const MAX_FILES = 20000;
const outDir = path.join(__dirname, '..', 'out');

const prune = (dir) => {
  let removed = 0;
  let remaining = 0;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const result = prune(fullPath);
      removed += result.removed;
      remaining += result.remaining;
      if (fs.readdirSync(fullPath).length === 0) {
        fs.rmdirSync(fullPath);
      }
    } else if (/^__next\..*\.txt$/.test(entry.name)) {
      fs.rmSync(fullPath);
      removed += 1;
    } else {
      remaining += 1;
    }
  }

  return { removed, remaining };
};

const { removed, remaining } = prune(outDir);
console.log(`Removed ${removed} segment files; ${remaining} files remain.`);

if (remaining >= MAX_FILES) {
  console.error(
    `out/ has ${remaining} files, over the Cloudflare Workers Free limit of ${MAX_FILES} static assets per version.`
  );
  process.exit(1);
}
