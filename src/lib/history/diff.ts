import {
  ChangeValue,
  HistoryField,
  RawChange,
  RawTable,
  RAW_TABLES,
  ValueChange,
} from './types';
import { CharaViewModel, PROVENANCE } from './viewModel';

export type RawRow = Record<string, unknown>;

export type RawRows = Record<RawTable, RawRow>;

const TACTICS_KEYS = [
  'id',
  'nameJa',
  'nameEn',
  'distance',
  'moveFrequency',
  'party',
  'taunt',
  'melee',
  'range',
  'spell',
  'heal',
  'summon',
  'buff',
  'debuff',
  'partyBuff',
] as const;

const same = (a: ChangeValue, b: ChangeValue): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

const abilityKey = (ability: {
  name: string;
  element: string | null;
}): string => `${ability.name}|${ability.element ?? ''}`;

export const diffViewModels = (
  prev: CharaViewModel,
  next: CharaViewModel
): ValueChange[] => {
  const changes: ValueChange[] = [];

  const push = (
    field: HistoryField,
    key: string | undefined,
    from: ChangeValue,
    to: ChangeValue
  ) => {
    if (same(from, to)) return;
    changes.push(
      key === undefined ? { field, from, to } : { field, key, from, to }
    );
  };

  push('name', 'ja', prev.name.ja, next.name.ja);
  push('name', 'en', prev.name.en, next.name.en);
  push('mainElement', undefined, prev.mainElement, next.mainElement);

  for (const field of ['race', 'job'] as const) {
    push(field, 'id', prev[field].id, next[field].id);
    push(field, 'nameJa', prev[field].nameJa, next[field].nameJa);
    push(field, 'nameEn', prev[field].nameEn, next[field].nameEn);
  }

  for (const key of TACTICS_KEYS) {
    push('tactics', key, prev.tactics[key], next.tactics[key]);
  }

  push('level', undefined, prev.level, next.level);
  push('geneSlot', 'actual', prev.geneSlot.actual, next.geneSlot.actual);
  push('geneSlot', 'orig', prev.geneSlot.orig, next.geneSlot.orig);

  const parts = new Set([
    ...Object.keys(prev.bodyParts),
    ...Object.keys(next.bodyParts),
  ]);
  for (const part of [...parts].sort()) {
    push(
      'bodyParts',
      part,
      prev.bodyParts[part] ?? null,
      next.bodyParts[part] ?? null
    );
  }

  const aliases = new Set([
    ...Object.keys(prev.elements),
    ...Object.keys(next.elements),
  ]);
  for (const alias of [...aliases].sort()) {
    push(
      'elements',
      alias,
      prev.elements[alias] ?? null,
      next.elements[alias] ?? null
    );
  }

  const prevAbilities = new Map(
    prev.abilities.map((ability) => [abilityKey(ability), ability])
  );
  const nextAbilities = new Map(
    next.abilities.map((ability) => [abilityKey(ability), ability])
  );
  for (const key of [
    ...new Set([...prevAbilities.keys(), ...nextAbilities.keys()]),
  ].sort()) {
    push(
      'abilities',
      key,
      prevAbilities.get(key) ?? null,
      nextAbilities.get(key) ?? null
    );
  }

  return changes;
};

const cell = (value: unknown): string | null =>
  value === null || value === undefined ? null : String(value);

/** Every field a set of changed raw columns can account for. */
const fieldsOf = (
  table: RawTable,
  columns: Iterable<string>
): Set<HistoryField> => {
  const fields = new Set<HistoryField>();
  for (const column of columns) {
    for (const field of PROVENANCE[table][column] ?? []) {
      fields.add(field);
    }
  }
  return fields;
};

export interface RawDiffOptions {
  /** Columns the game did not write before this version, per table. */
  newColumns: Partial<Record<RawTable, ReadonlySet<string>>>;
  /** Fields the derived section of this entry already reports. */
  changedFields: ReadonlySet<HistoryField>;
}

/**
 * The raw column changes the derived section does not already show. A column
 * that feeds a display group is left out when that group moved, and kept when
 * it did not -- a reordered `elements` string changes the column without
 * changing a single power, and that is only visible here.
 */
export const diffRawRows = (
  prev: RawRows,
  next: RawRows,
  options: RawDiffOptions
): RawChange[] => {
  const changes: RawChange[] = [];

  for (const table of RAW_TABLES) {
    const prevRow = prev[table];
    const nextRow = next[table];
    const swapped = prevRow.id !== nextRow.id;
    const newColumns = options.newColumns[table] ?? new Set<string>();

    const columns = [
      ...new Set([...Object.keys(prevRow), ...Object.keys(nextRow)]),
    ].filter((column) => column !== '__meta' && !newColumns.has(column));

    for (const column of columns.sort()) {
      const from = cell(prevRow[column]);
      const to = cell(nextRow[column]);
      if (from === to) continue;

      const fields = PROVENANCE[table][column];
      if (fields?.some((field) => options.changedFields.has(field))) continue;

      changes.push({
        table,
        column,
        from,
        to,
        ...(swapped ? { swapped } : {}),
      });
    }
  }

  return changes;
};

/**
 * Drops the derived changes a version fabricated by gaining a column. A build
 * that adds `geneCap` to races.csv gives every character a gene slot it always
 * had, and the schema's default makes that read as a change from zero.
 */
export const dropColumnIntroductionArtifacts = (
  changes: ValueChange[],
  prev: RawRows,
  next: RawRows,
  newColumns: Partial<Record<RawTable, ReadonlySet<string>>>
): ValueChange[] => {
  const fabricated = new Set<HistoryField>();
  const explained = new Set<HistoryField>();

  for (const table of RAW_TABLES) {
    const introduced = newColumns[table] ?? new Set<string>();
    for (const field of fieldsOf(table, introduced)) {
      fabricated.add(field);
    }

    const edited = Object.keys(next[table]).filter(
      (column) =>
        column !== '__meta' &&
        !introduced.has(column) &&
        cell(prev[table][column]) !== cell(next[table][column])
    );
    for (const field of fieldsOf(table, edited)) {
      explained.add(field);
    }
  }

  if (fabricated.size === 0) return changes;

  return changes.filter(
    (change) => !fabricated.has(change.field) || explained.has(change.field)
  );
};
