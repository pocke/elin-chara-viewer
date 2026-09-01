import { z } from 'zod';

// Raised only for a change the reader cannot be shown safely; a reader that
// does not know the version hides the history rather than guessing. Adding a
// field is not such a change, because every reader ignores what it does not
// know.
export const HISTORY_SCHEMA_VERSION = 1;

export const RAW_TABLES = ['charas', 'races', 'jobs', 'tactics'] as const;

export type RawTable = (typeof RAW_TABLES)[number];

// The groups the detail page is diffed in. Everything an element carries is one
// group, so a power change reads the same whether the page shows it under
// attributes, resistances or skills.
export const HISTORY_FIELDS = [
  'name',
  'mainElement',
  'race',
  'job',
  'tactics',
  'level',
  'geneSlot',
  'bodyParts',
  'elements',
  'abilities',
] as const;

export type HistoryField = (typeof HISTORY_FIELDS)[number];

export const AbilityValueSchema = z.object({
  name: z.string(),
  chance: z.number(),
  party: z.boolean(),
  element: z.string().nullable(),
});

export type AbilityValue = z.infer<typeof AbilityValueSchema>;

export const ChangeValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.number()),
  AbilityValueSchema,
]);

export type ChangeValue = z.infer<typeof ChangeValueSchema>;

export const ValueChangeSchema = z.object({
  field: z.enum(HISTORY_FIELDS),
  // Which member of the group changed: an element alias, a body part, a tactics
  // property. Absent for a group that holds a single value.
  key: z.string().optional(),
  from: ChangeValueSchema,
  to: ChangeValueSchema,
});

export type ValueChange = z.infer<typeof ValueChangeSchema>;

export const RawChangeSchema = z.object({
  table: z.enum(RAW_TABLES),
  column: z.string(),
  from: z.string().nullable(),
  to: z.string().nullable(),
  // The character pointed at a different row, rather than the row being edited.
  swapped: z.boolean().optional(),
});

export type RawChange = z.infer<typeof RawChangeSchema>;

export const HISTORY_ENTRY_KINDS = [
  // The oldest archived version. The character was not added there; that is
  // just where the record starts.
  'origin',
  'added',
  'removed',
  'changed',
  // The version holds the character but the viewer cannot compute it, because
  // the row points at a race or a job the version does not have.
  'unavailable',
] as const;

export type HistoryEntryKind = (typeof HISTORY_ENTRY_KINDS)[number];

export const HistoryEntrySchema = z.object({
  version: z.string(),
  slug: z.string(),
  channel: z.enum(['stable', 'nightly']),
  releaseDate: z.string(),
  kind: z.enum(HISTORY_ENTRY_KINDS),
  reason: z.string().optional(),
  changes: z.array(ValueChangeSchema).default([]),
  raw: z.array(RawChangeSchema).default([]),
});

export type HistoryEntry = z.infer<typeof HistoryEntrySchema>;

export const LocalizedNameSchema = z.object({
  ja: z.string(),
  en: z.string(),
});

export const CharaHistorySchema = z.object({
  schemaVersion: z.number(),
  key: z.string(),
  isVariant: z.boolean(),
  // The newest name each element alias was seen under. A page renders an alias
  // with the name its own version gives it and falls back here, so that one
  // alias reads as one name down the whole list even across a rename.
  names: z.record(z.string(), LocalizedNameSchema).default({}),
  // Newest first.
  entries: z.array(HistoryEntrySchema).default([]),
});

export type CharaHistory = z.infer<typeof CharaHistorySchema>;

export const AddedCharaSchema = z.object({
  key: z.string(),
  // As the version that gained it spelled the name, which is not always how a
  // later version spells it.
  ja: z.string(),
  en: z.string(),
});

export type AddedChara = z.infer<typeof AddedCharaSchema>;

// Which pages each version gained, so that the version list can say so without
// reading every history. A page that was already there when the archive starts
// is not a gain and is not in here.
export const AddedCharasSchema = z.object({
  schemaVersion: z.number(),
  versions: z.record(z.string(), z.array(AddedCharaSchema)).default({}),
});

export type AddedCharas = z.infer<typeof AddedCharasSchema>;
