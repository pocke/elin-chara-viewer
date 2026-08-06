/**
 * Holds PROVENANCE to the models. The change history hides a raw column from
 * its raw-data section when the display group that column feeds has already
 * reported the change, so a column that feeds a group without saying so would
 * show the same change twice.
 *
 * Each column is set to a different value the game itself uses elsewhere in
 * that column, and whatever moves in the view model is what that column really
 * feeds. A column declared to feed a group it does not move is only reported,
 * not failed: mutating every row at once cannot reproduce every path, and the
 * tactics fallback through a character's own id is one it cannot reach.
 *
 * Usage: npx tsx script/check-history-provenance.ts [db-dir]
 */
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { all, registerVersionData } from '../src/lib/db';
import { Chara, CharaSchema } from '../src/lib/models/chara';
import { ElementAttacks } from '../src/lib/models/element';
import { JobSchema } from '../src/lib/models/job';
import { RaceSchema } from '../src/lib/models/race';
import { TacticsSchema } from '../src/lib/models/tactics';
import {
  HISTORY_FIELDS,
  HistoryField,
  RawTable,
  RAW_TABLES,
} from '../src/lib/history/types';
import {
  buildViewModel,
  CharaViewModel,
  PROVENANCE,
} from '../src/lib/history/viewModel';

// The row's own name. Replacing it points the character somewhere else instead
// of changing what it reads there, which is a different question.
const IDENTITY_COLUMNS = ['id'];

const VERSION = 'probe';

const dbDir = process.argv[2] ?? 'db';
const versionName = fs
  .readFileSync(path.join('versions', 'nightly'), 'utf8')
  .trim();

registerVersionData(
  VERSION,
  Object.fromEntries(
    ['charas', 'elements', 'races', 'jobs', 'tactics'].map((table) => [
      table,
      fs.readFileSync(path.join(dbDir, versionName, `${table}.csv`), 'utf8'),
    ])
  ),
  JSON.parse(fs.readFileSync('src/generated/featModifier.nightly.json', 'utf8'))
);

const SCHEMAS: Record<RawTable, z.ZodType<unknown>> = {
  charas: CharaSchema,
  races: RaceSchema,
  jobs: JobSchema,
  tactics: TacticsSchema,
};

const rowsOf = (table: RawTable): Record<string, unknown>[] =>
  all(VERSION, table, SCHEMAS[table]) as Record<string, unknown>[];

interface Sample {
  id: string;
  variant: ElementAttacks | null;
}

const charaRows = all(VERSION, 'charas', CharaSchema).filter(
  (row) => !Chara.isIgnoredCharaId(row.id)
);

// Every character, so that a column only one of them uses is still seen, plus a
// variant, whose level and name are computed from the element rather than read.
const variantSource = charaRows.find(
  (row) => (row.mainElement?.split(',').length ?? 0) >= 2
);
const samples: Sample[] = [
  ...charaRows.map((row) => ({ id: row.id, variant: null })),
  ...(variantSource
    ? [{ id: variantSource.id, variant: 'eleFire' as ElementAttacks }]
    : []),
];

const signatures = (model: CharaViewModel): Record<HistoryField, string> =>
  Object.fromEntries(
    HISTORY_FIELDS.map((field) => [field, JSON.stringify(model[field])])
  ) as Record<HistoryField, string>;

/** null where the models refuse to build, which a mutation can well cause. */
const measure = (): Map<string, Record<HistoryField, string>> => {
  const measured = new Map<string, Record<HistoryField, string>>();
  const byId = new Map(charaRows.map((row) => [row.id, row]));

  for (const sample of samples) {
    const row = byId.get(sample.id);
    if (!row) continue;
    try {
      measured.set(
        `${sample.id}|${sample.variant ?? ''}`,
        signatures(buildViewModel(new Chara(VERSION, row, sample.variant)))
      );
    } catch {
      // The mutation broke this character; another one still reports.
    }
  }

  return measured;
};

const baseline = measure();

const observe = (table: RawTable, column: string): Set<HistoryField> | null => {
  const rows = rowsOf(table);
  const distinct = [...new Set(rows.map((row) => JSON.stringify(row[column])))];
  if (distinct.length < 2) return null;

  const original = rows.map((row) => row[column]);
  try {
    for (const row of rows) {
      const mine = JSON.stringify(row[column]);
      const other = distinct.find((value) => value !== mine)!;
      row[column] = JSON.parse(other) as unknown;
    }

    const moved = new Set<HistoryField>();
    for (const [key, after] of measure()) {
      const before = baseline.get(key);
      if (!before) continue;
      for (const field of HISTORY_FIELDS) {
        if (before[field] !== after[field]) moved.add(field);
      }
    }
    return moved;
  } finally {
    rows.forEach((row, position) => {
      row[column] = original[position];
    });
  }
};

// The probe reaches the models by writing to the row objects all() hands out.
// Were it to hand out copies instead, nothing would move, every column would
// look inert, and this check would pass while proving nothing.
const CANARY: [RawTable, string, HistoryField] = ['charas', 'LV', 'level'];
const canary = observe(CANARY[0], CANARY[1]);
if (!canary?.has(CANARY[2])) {
  console.error(
    `${CANARY[0]}.${CANARY[1]} did not move ${CANARY[2]}; the probe is not reaching the models`
  );
  process.exit(1);
}

const missing: string[] = [];
const unmoved: string[] = [];
const unprobed: string[] = [];

for (const table of RAW_TABLES) {
  const columns = Object.keys(rowsOf(table)[0]).filter(
    (column) => column !== '__meta' && !IDENTITY_COLUMNS.includes(column)
  );

  for (const column of columns) {
    const declared = new Set(PROVENANCE[table][column] ?? []);
    const moved = observe(table, column);

    if (moved === null) {
      unprobed.push(`${table}.${column}`);
      continue;
    }

    for (const field of moved) {
      if (!declared.has(field)) {
        missing.push(`${table}.${column} moves ${field}`);
      }
    }
    for (const field of declared) {
      if (!moved.has(field)) {
        unmoved.push(`${table}.${column} declares ${field}`);
      }
    }
  }
}

if (unprobed.length > 0) {
  console.log(`Not probed, one value only: ${unprobed.join(', ')}`);
}
unmoved.forEach((report) => console.log(`Declared but not seen: ${report}`));
missing.forEach((report) => console.error(`Undeclared: ${report}`));

console.log(
  `Probed ${versionName}; ${missing.length === 0 ? 'PROVENANCE covers every column that moves' : `${missing.length} columns move a field they do not declare`}`
);
process.exit(missing.length === 0 ? 0 : 1);
