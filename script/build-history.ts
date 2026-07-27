/**
 * Computes the change history of every character page out of the archive and
 * writes it under history/charas/, so that a detail page can show what changed
 * without reading a single past version itself.
 *
 * Usage: npx tsx script/build-history.ts <archive-dir> [--allow-large-change]
 */
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { parse } from 'csv-parse/sync';
import {
  ArchivedVersion,
  ArchivedVersionSchema,
  FeatModifierFileSchema,
} from '../src/lib/archive';
import { all, FeatModifierJson, registerVersionData } from '../src/lib/db';
import { compareVersionNames } from '../src/lib/versionOrder';
import { Chara, CharaSchema } from '../src/lib/models/chara';
import {
  diffRawRows,
  dropColumnIntroductionArtifacts,
  diffViewModels,
  RawRows,
} from '../src/lib/history/diff';
import {
  CharaHistory,
  HistoryEntry,
  HistoryField,
  HISTORY_SCHEMA_VERSION,
  RawTable,
  RAW_TABLES,
} from '../src/lib/history/types';
import {
  buildViewModel,
  collectElementNames,
  CharaViewModel,
} from '../src/lib/history/viewModel';

const HistoryManifestSchema = z.object({
  schemaVersion: z.number(),
  versions: z.number(),
  keys: z.number(),
  entries: z.number(),
});

type HistoryManifest = z.infer<typeof HistoryManifestSchema>;

const TABLES = ['charas', 'elements', 'races', 'jobs', 'tactics'] as const;

// Columns the game started writing partway through, which the schemas fill in
// with a default for the versions that predate them. A column outside this list
// means the export changed in a way nobody has classified yet, and the run
// stops so that PROVENANCE can be brought up to date first.
//
// An elements column belongs here only once it is known not to reach
// CharaViewModel: dropColumnIntroductionArtifacts works off PROVENANCE, which
// covers the four tables the detail page prints, so it cannot undo what an
// elements column fabricates.
const KNOWN_NEW_COLUMNS: Partial<Record<(typeof TABLES)[number], string[]>> = {
  charas: ['recruitItems'],
  elements: ['geneSlot'],
  races: ['geneCap'],
};

const CHANGE_TOLERANCE = 0.25;

interface Computed {
  isVariant: boolean;
  model: CharaViewModel;
  raw: RawRows;
  names: Record<string, { ja: string; en: string }>;
}

interface KeyState {
  isVariant: boolean;
  present: boolean;
  model: CharaViewModel | null;
  raw: RawRows | null;
  names: Record<string, { ja: string; en: string }>;
  entries: HistoryEntry[];
}

const args = process.argv.slice(2);
const allowLargeChange = args.includes('--allow-large-change');
const archiveDir = args.find((arg) => !arg.startsWith('--')) ?? 'tmp/archive';

const historyDir = path.join(archiveDir, 'history');
const charasDir = path.join(historyDir, 'charas');

const versionDir = (slug: string) => path.join(archiveDir, 'v', slug);

const readTable = (slug: string, table: string): string =>
  fs.readFileSync(path.join(versionDir(slug), 'csv', `${table}.csv`), 'utf8');

const readHeader = (content: string): string[] =>
  (parse(content, { bom: true, to_line: 1 }) as string[][])[0] ?? [];

const readFeatModifier = (entry: ArchivedVersion): FeatModifierJson => {
  if (!entry.featModifier) return {};
  const file = FeatModifierFileSchema.parse(
    JSON.parse(
      fs.readFileSync(
        path.join(versionDir(entry.slug), 'featModifier.json'),
        'utf8'
      )
    )
  );
  return file.modifiers as FeatModifierJson;
};

const loadIndex = (): ArchivedVersion[] =>
  ArchivedVersionSchema.array()
    .parse(
      JSON.parse(fs.readFileSync(path.join(archiveDir, 'index.json'), 'utf8'))
    )
    .sort((a, b) => compareVersionNames(a.version, b.version));

/** The columns each table gained at this version, against the one before it. */
const columnsGained = (
  previous: Map<string, string[]> | null,
  current: Map<string, string[]>
): Partial<Record<RawTable, ReadonlySet<string>>> => {
  const gained: Partial<Record<RawTable, ReadonlySet<string>>> = {};
  if (!previous) return gained;

  for (const table of TABLES) {
    const before = new Set(previous.get(table) ?? []);
    const after = current.get(table) ?? [];
    const added = after.filter((column) => !before.has(column));
    const lost = [...before].filter((column) => !after.includes(column));

    const known = KNOWN_NEW_COLUMNS[table] ?? [];
    const unknown = added.filter((column) => !known.includes(column));
    if (unknown.length > 0) {
      throw new Error(
        `${table}.csv gained ${unknown.join(', ')}; classify it in PROVENANCE and add it to KNOWN_NEW_COLUMNS`
      );
    }
    if (lost.length > 0) {
      throw new Error(
        `${table}.csv lost ${lost.join(', ')}; the schemas will fill it in with a default and every character will read as changed`
      );
    }

    if ((RAW_TABLES as readonly string[]).includes(table) && added.length > 0) {
      gained[table as RawTable] = new Set(added);
    }
  }

  return gained;
};

/** Every character page the version has, by the identifier its URL uses. */
const computeVersion = (
  slug: string
): { computed: Map<string, Computed>; failed: Map<string, string> } => {
  const computed = new Map<string, Computed>();
  const failed = new Map<string, string>();
  const seenIds = new Set<string>();

  for (const row of all(slug, 'charas', CharaSchema)) {
    if (Chara.isIgnoredCharaId(row.id)) continue;
    // One version ships the same id twice; the detail page takes the first row.
    if (seenIds.has(row.id)) continue;
    seenIds.add(row.id);

    try {
      const base = new Chara(slug, row);
      const variants = base.variants();
      for (const chara of variants.length > 0 ? variants : [base]) {
        computed.set(chara.id, {
          isVariant: variants.length > 0,
          model: buildViewModel(chara),
          raw: {
            charas: chara.row,
            races: chara.race.row,
            jobs: chara.job().row,
            tactics: chara.tactics().row,
          },
          names: collectElementNames(chara),
        });
      }
    } catch (error) {
      failed.set(
        row.id,
        error instanceof Error ? error.message.split('\n')[0] : String(error)
      );
    }
  }

  return { computed, failed };
};

const baseIdOf = (key: string): string => key.split('---')[0];

const index = loadIndex();
const states = new Map<string, KeyState>();
let headers: Map<string, string[]> | null = null;

index.forEach((entry, position) => {
  const tables = Object.fromEntries(
    TABLES.map((table) => [table, readTable(entry.slug, table)])
  );
  const currentHeaders = new Map(
    TABLES.map((table) => [table, readHeader(tables[table])])
  );
  const newColumns = columnsGained(headers, currentHeaders);
  headers = currentHeaders;

  registerVersionData(entry.slug, tables, readFeatModifier(entry));
  const { computed, failed } = computeVersion(entry.slug);

  const stamp = {
    version: entry.version,
    slug: entry.slug,
    channel: entry.channel,
    releaseDate: entry.releaseDate,
  };

  const ensureState = (key: string, isVariant: boolean): KeyState => {
    const known = states.get(key);
    if (known) return known;

    const state: KeyState = {
      isVariant,
      present: false,
      model: null,
      raw: null,
      names: {},
      entries: [],
    };
    states.set(key, state);
    return state;
  };

  for (const [key, item] of computed) {
    const state = ensureState(key, item.isVariant);
    Object.assign(state.names, item.names);

    if (!state.present || !state.model || !state.raw) {
      // No previous values to compare against, so the entry is a snapshot. The
      // character is only an addition when it was not here before: at the
      // oldest archived version, or after versions that could not be computed,
      // it was here all along and this is merely where its record starts.
      state.entries.push({
        ...stamp,
        kind: state.present || position === 0 ? 'origin' : 'added',
        changes: diffViewModels(null, item.model),
        raw: [],
      });
    } else {
      const changes = dropColumnIntroductionArtifacts(
        diffViewModels(state.model, item.model),
        state.raw,
        item.raw,
        newColumns
      );
      const raw = diffRawRows(state.raw, item.raw, {
        newColumns,
        changedFields: new Set<HistoryField>(
          changes.map((change) => change.field)
        ),
      });

      if (changes.length > 0 || raw.length > 0) {
        state.entries.push({ ...stamp, kind: 'changed', changes, raw });
      }
    }

    state.present = true;
    state.model = item.model;
    state.raw = item.raw;
  }

  // A row the version has but the viewer cannot follow. The character is here,
  // so this is not a removal, and the last version that did compute stays as
  // the point the next one is compared against.
  const unavailable = new Set<string>();
  for (const [id, reason] of failed) {
    const known = [...states.keys()].filter((key) => baseIdOf(key) === id);
    for (const key of known.length > 0 ? known : [id]) {
      if (computed.has(key)) continue;
      unavailable.add(key);
      const state = ensureState(key, key !== id);
      state.entries.push({
        ...stamp,
        kind: 'unavailable',
        reason,
        changes: [],
        raw: [],
      });
      state.present = true;
    }
  }

  for (const [key, state] of states) {
    if (!state.present || computed.has(key) || unavailable.has(key)) continue;

    state.entries.push({ ...stamp, kind: 'removed', changes: [], raw: [] });
    state.present = false;
    state.model = null;
    state.raw = null;
  }

  if ((position + 1) % 100 === 0 || position === index.length - 1) {
    console.log(`  ${position + 1}/${index.length} versions`);
  }
});

// A name that needs escaping would be stored escaped and asked for escaped
// again, and R2 would answer 404 for a file that is right there.
const fileName = (key: string) => {
  if (encodeURIComponent(key) !== key) {
    throw new Error(`${key} cannot be a file name as it stands`);
  }
  return `${key}.json`;
};

const histories = [...states].map(([key, state]): CharaHistory => {
  return {
    schemaVersion: HISTORY_SCHEMA_VERSION,
    key,
    isVariant: state.isVariant,
    names: Object.fromEntries(
      Object.keys(state.names)
        .sort()
        .map((alias) => [alias, state.names[alias]])
    ),
    entries: [...state.entries].reverse(),
  };
});

const manifestPath = path.join(historyDir, 'manifest.json');
const previous: HistoryManifest | null = fs.existsSync(manifestPath)
  ? HistoryManifestSchema.parse(
      JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    )
  : null;

const manifest: HistoryManifest = {
  schemaVersion: HISTORY_SCHEMA_VERSION,
  versions: index.length,
  keys: histories.length,
  entries: histories.reduce(
    (total, history) => total + history.entries.length,
    0
  ),
};

const existing = fs.existsSync(charasDir) ? fs.readdirSync(charasDir) : [];
const wanted = new Set(histories.map((history) => fileName(history.key)));
const lost = existing
  .filter((file) => !wanted.has(file))
  .map((file) => file.replace(/\.json$/, ''));

// Checked before anything is written, so that a run which stops here leaves
// what is already on disk -- including the manifest it is comparing against --
// exactly as it found it. Writing first would let a second run pass by
// comparing the damage to itself.
if (previous && !allowLargeChange) {
  const drift =
    previous.entries === 0
      ? 0
      : Math.abs(manifest.entries - previous.entries) / previous.entries;

  const problems = [
    lost.length > 0
      ? `${lost.length} pages lost: ${lost.slice(0, 5).join(', ')}`
      : null,
    drift > CHANGE_TOLERANCE
      ? `entry count moved from ${previous.entries} to ${manifest.entries}`
      : null,
  ].filter((problem) => problem !== null);

  if (problems.length > 0) {
    problems.forEach((problem) => console.error(problem));
    console.error('Pass --allow-large-change if this is what you meant.');
    process.exit(1);
  }
}

fs.mkdirSync(charasDir, { recursive: true });
for (const file of existing.filter((name) => !wanted.has(name))) {
  fs.rmSync(path.join(charasDir, file));
}
for (const history of histories) {
  fs.writeFileSync(
    path.join(charasDir, fileName(history.key)),
    `${JSON.stringify(history)}\n`
  );
}
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(
  `Wrote ${manifest.keys} histories (${manifest.entries} entries) from ${manifest.versions} versions`
);
