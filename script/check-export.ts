/**
 * Checks source CSVs for the ways ElinMiscMod's exporter is known to fail.
 * It reconstructs the column order by reading the IL of `CreateRow()`, so a
 * build it cannot read produces a plausible-looking file with the wrong
 * columns: `EA 23.306 Nightly` (0d23795) shipped a jobs.csv that started at
 * `domain` and had no `id` column at all.
 *
 * Usage: npx tsx script/check-export.ts <export-dir> [--baseline <dir>]
 *        npx tsx script/check-export.ts --archive [archive-dir]
 *
 * <export-dir> holds `<table>.csv`, as written into db/<version>. The baseline
 * must be a neighbouring version: comparing across a long stretch of releases
 * reports the game's own schema changes rather than export damage.
 */
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

type Finding = { level: 'error' | 'warn'; table: string; message: string };

const PLACEHOLDER = '***';

// Measured over every consecutive pair in the archive: rows grow by at most
// 2.0x and shrink by at most 1.02x, and the only tables small enough for a
// ratio to be meaningless have single digit row counts.
const MAX_GROWTH = 3;
const MAX_SHRINK = 0.8;
const MIN_ROWS_FOR_RATIO = 10;

const readCsv = (file: string): string[][] =>
  parse(fs.readFileSync(file, 'utf8'), {
    bom: true,
    relaxColumnCount: true,
  }) as string[][];

const tablesIn = (dir: string): string[] =>
  fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.csv'))
    .map((name) => path.basename(name, '.csv'))
    .sort();

const placeholders = (header: string[]): number =>
  header.filter((column) => column === PLACEHOLDER).length;

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message.split('\n')[0] : String(error);

/** Longest common subsequence of two headers, as the indices matched in each. */
function commonColumns(
  a: string[],
  b: string[]
): { inA: Set<number>; inB: Set<number> } {
  const length: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0)
  );
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      length[i][j] =
        a[i] === b[j]
          ? length[i + 1][j + 1] + 1
          : Math.max(length[i + 1][j], length[i][j + 1]);
    }
  }

  const inA = new Set<number>();
  const inB = new Set<number>();
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      inA.add(i);
      inB.add(j);
      i++;
      j++;
    } else if (length[i + 1][j] >= length[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }
  return { inA, inB };
}

function compareHeaders(
  table: string,
  header: string[],
  baselineHeader: string[]
): Finding[] {
  const { inA, inB } = commonColumns(header, baselineHeader);
  const gained = header.filter((_, i) => !inA.has(i));
  const lost = baselineHeader.filter((_, i) => !inB.has(i));
  if (gained.length === 0 && lost.length === 0) {
    return [];
  }

  // A placeholder marks a column the IL walk could not attribute, and is only
  // emitted below the highest column index the walk reached. Losing one means
  // it stopped short, which shifts every column after it.
  const lostPlaceholders = lost.filter((column) => column === PLACEHOLDER);
  if (lostPlaceholders.length > 0) {
    return [
      {
        level: 'error',
        table,
        message: `lost ${lostPlaceholders.length} ${PLACEHOLDER} column(s); columns after them have shifted`,
      },
    ];
  }

  const named = (columns: string[]) =>
    columns.filter((column) => column !== PLACEHOLDER);
  const namedGained = named(gained);
  const namedLost = named(lost);
  // EA 23.55 rearranged the elements sheet, moving eight columns without
  // changing their values, so a reordering is not on its own a sign of damage.
  const moved = namedGained.filter((column) => namedLost.includes(column));
  if (moved.length > 0) {
    return [
      {
        level: 'warn',
        table,
        message: `columns reordered: ${[...new Set(moved)].join(', ')}`,
      },
    ];
  }

  // A column the game itself dropped shifts everything after it exactly as a
  // lost placeholder does, and no version in the archive has ever dropped one.
  if (namedLost.length > 0) {
    return [
      {
        level: 'error',
        table,
        message: `lost column(s) ${namedLost.join(', ')}; columns after them have shifted`,
      },
    ];
  }

  if (namedGained.length === 0) {
    return [];
  }

  return [
    {
      level: 'warn',
      table,
      message: `columns added: ${namedGained.join(', ')}`,
    },
  ];
}

function checkTable(
  table: string,
  file: string,
  baselineFile: string | null
): Finding[] {
  if (fs.statSync(file).size === 0) {
    return [{ level: 'error', table, message: 'file is empty' }];
  }

  const rows = readCsv(file);
  const header = rows[0] ?? [];
  if (header.length === 0 || header.join('') === '') {
    return [{ level: 'error', table, message: 'no header' }];
  }

  const findings: Finding[] = [];
  const dataRows = rows.length - 1;
  if (dataRows <= 0) {
    findings.push({ level: 'error', table, message: 'no data rows' });
  }

  // Every table the exporter has ever produced starts at `id`; a different
  // first column means the IL walk lost the head of the row.
  if (header[0] !== 'id') {
    findings.push({
      level: 'error',
      table,
      message: `first column is ${JSON.stringify(header[0])}, expected "id"`,
    });
  }

  const ragged = rows.filter((row) => row.length !== header.length).length;
  if (ragged > 0) {
    findings.push({
      level: 'error',
      table,
      message: `${ragged} row(s) do not have ${header.length} columns`,
    });
  }

  if (baselineFile === null) {
    return findings;
  }

  // The checks above are the ones that catch a silently damaged export, so an
  // unreadable baseline must not take them down with it.
  try {
    if (fs.statSync(baselineFile).size === 0) {
      return findings;
    }

    const baseline = readCsv(baselineFile);
    const baselineHeader = baseline[0] ?? [];
    findings.push(...compareHeaders(table, header, baselineHeader));

    const gained = placeholders(header) - placeholders(baselineHeader);
    if (gained > 0) {
      findings.push({
        level: 'warn',
        table,
        message: `${gained} more ${PLACEHOLDER} column(s) than the baseline`,
      });
    }

    const baselineRows = baseline.length - 1;
    if (
      baselineRows >= MIN_ROWS_FOR_RATIO &&
      (dataRows > baselineRows * MAX_GROWTH ||
        dataRows < baselineRows * MAX_SHRINK)
    ) {
      findings.push({
        level: 'warn',
        table,
        message: `${dataRows} rows against ${baselineRows} in the baseline`,
      });
    }
  } catch (error) {
    findings.push({
      level: 'warn',
      table,
      message: `not compared: ${messageOf(error)}`,
    });
  }

  return findings;
}

function checkExport(dir: string, baselineDir: string | null): Finding[] {
  const findings: Finding[] = [];
  const tables = tablesIn(dir);
  if (tables.length === 0) {
    return [{ level: 'error', table: '-', message: `no CSV files in ${dir}` }];
  }

  let baseline = baselineDir;
  if (baseline !== null) {
    try {
      const baselineTables = tablesIn(baseline);
      const missing = baselineTables.filter((table) => !tables.includes(table));
      const added = tables.filter((table) => !baselineTables.includes(table));
      if (missing.length > 0 || added.length > 0) {
        findings.push({
          level: 'warn',
          table: '-',
          message: `tables changed: -[${missing.join(', ')}] +[${added.join(', ')}]`,
        });
      }
    } catch (error) {
      findings.push({
        level: 'warn',
        table: '-',
        message: `baseline not read: ${messageOf(error)}`,
      });
      baseline = null;
    }
  }

  for (const table of tables) {
    const baselineFile =
      baseline === null ? null : path.join(baseline, `${table}.csv`);
    findings.push(
      ...checkTable(
        table,
        path.join(dir, `${table}.csv`),
        baselineFile !== null && fs.existsSync(baselineFile)
          ? baselineFile
          : null
      )
    );
  }
  return findings;
}

type ArchiveEntry = { version: string; slug: string; releaseDate: string };

const report = (prefix: string, findings: Finding[]): number => {
  for (const finding of findings) {
    console.error(
      `${finding.level}: ${prefix}${finding.table}: ${finding.message}`
    );
  }
  return findings.filter((finding) => finding.level === 'error').length;
};

function checkArchive(archiveDir: string): number {
  const indexFile = path.join(archiveDir, 'index.json');
  let index: ArchiveEntry[];
  try {
    index = JSON.parse(fs.readFileSync(indexFile, 'utf8')) as ArchiveEntry[];
  } catch (error) {
    throw new Error(`${indexFile}: ${messageOf(error)}`);
  }
  if (!Array.isArray(index)) {
    throw new Error(`${indexFile} is not an array`);
  }

  // Same-day releases are ordered by their names: "EA 23.306" sorts before
  // "EA 23.306 Patch 1", which is the order they shipped in.
  const ordered = [...index].sort(
    (a, b) =>
      a.releaseDate.localeCompare(b.releaseDate) ||
      a.version.localeCompare(b.version, undefined, { numeric: true })
  );

  let errors = 0;
  ordered.forEach((entry, i) => {
    const previous = ordered[i - 1];
    try {
      const findings = checkExport(
        path.join(archiveDir, 'v', entry.slug, 'csv'),
        previous === undefined
          ? null
          : path.join(archiveDir, 'v', previous.slug, 'csv')
      );
      errors += report(`${entry.version}: `, findings);
    } catch (error) {
      errors += report(`${entry.version}: `, [
        { level: 'error', table: '-', message: messageOf(error) },
      ]);
    }
  });

  console.log(
    `Checked ${ordered.length} versions; ${errors === 0 ? 'no errors' : `${errors} errors`}`
  );
  return errors === 0 ? 0 : 1;
}

const USAGE = [
  'Usage: npx tsx script/check-export.ts <export-dir> [--baseline <dir>]',
  '       npx tsx script/check-export.ts --archive [archive-dir]',
].join('\n');

function main(args: string[]): number {
  if (args[0] === '--archive') {
    return checkArchive(args[1] ?? 'tmp/archive');
  }

  const dir = args[0];
  if (dir === undefined || dir.startsWith('--')) {
    console.error(USAGE);
    return 1;
  }

  let baselineDir: string | null = null;
  const flag = args.indexOf('--baseline');
  if (flag !== -1) {
    const value = args[flag + 1];
    if (value === undefined || value.startsWith('--')) {
      console.error('--baseline needs a directory');
      return 1;
    }
    baselineDir = value;
  }

  const errors = report('', checkExport(dir, baselineDir));
  console.log(
    `Checked ${dir}; ${errors === 0 ? 'no errors' : `${errors} errors`}`
  );
  return errors === 0 ? 0 : 1;
}

try {
  process.exit(main(process.argv.slice(2)));
} catch (error) {
  console.error(messageOf(error));
  process.exit(1);
}
