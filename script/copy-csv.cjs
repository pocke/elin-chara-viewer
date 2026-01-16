const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, '..', 'db');
const publicCsvDir = path.join(__dirname, '..', 'public', 'csv');

if (fs.existsSync(publicCsvDir)) {
  fs.rmSync(publicCsvDir, { recursive: true });
}
fs.mkdirSync(publicCsvDir, { recursive: true });

const versionDirs = fs
  .readdirSync(dbDir)
  .filter((name) => fs.statSync(path.join(dbDir, name)).isDirectory());

for (const versionDir of versionDirs) {
  const srcDir = path.join(dbDir, versionDir);
  const destDir = path.join(publicCsvDir, versionDir);

  fs.mkdirSync(destDir, { recursive: true });

  const csvFiles = fs
    .readdirSync(srcDir)
    .filter((file) => file.endsWith('.csv'));

  for (const csvFile of csvFiles) {
    fs.copyFileSync(path.join(srcDir, csvFile), path.join(destDir, csvFile));
  }

  console.log(`Copied ${csvFiles.length} CSV files to ${destDir}`);
}

console.log('CSV copy complete!');
