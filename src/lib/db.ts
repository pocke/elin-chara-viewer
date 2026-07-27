import { loadCsv } from './csvLoader';
import { z } from 'zod';

// A version key is either a current version ('EA' / 'Nightly') or an archived
// version's slug ('EA-23.306-patch-1').
export type GameVersion = string;

export const GAME_VERSIONS = ['EA', 'Nightly'] as const;

export type CurrentVersion = (typeof GAME_VERSIONS)[number];

export const isCurrentVersion = (
  version: GameVersion
): version is CurrentVersion =>
  (GAME_VERSIONS as readonly string[]).includes(version);

export type FeatModifierJson = Record<string, Record<string, number>>;

// A table's content is dropped once it has been parsed.
const csvContentMap = new Map<GameVersion, Record<string, string>>();
const registeredVersions = new Set<GameVersion>();
const featModifierMap = new Map<GameVersion, FeatModifierJson>();

// Cache: version:tableName -> data
const cache = new Map<string, unknown[]>();

// An archived version costs around 0.5MB of CSV plus the parsed rows, and a
// session that walks the version list would otherwise keep every one it opened.
const MAX_RETAINED_VERSIONS = 3;
const retained: GameVersion[] = [];

const forgetHandlers = new Set<(version: GameVersion) => void>();

/**
 * Registers a cache keyed by version. The models build objects that hold the
 * rows they were parsed from, so dropping the rows here frees nothing until
 * those go too, and MAX_RETAINED_VERSIONS would not bound anything.
 */
export const onVersionForgotten = (
  handler: (version: GameVersion) => void
): void => {
  forgetHandlers.add(handler);
};

const forget = (version: GameVersion) => {
  const retainedAt = retained.indexOf(version);
  if (retainedAt >= 0) {
    retained.splice(retainedAt, 1);
  }
  csvContentMap.delete(version);
  featModifierMap.delete(version);
  registeredVersions.delete(version);
  for (const key of cache.keys()) {
    if (key.startsWith(`${version}:`)) {
      cache.delete(key);
    }
  }
  forgetHandlers.forEach((handler) => handler(version));
};

export const registerVersionData = (
  version: GameVersion,
  tables: Record<string, string>,
  featModifier: FeatModifierJson
) => {
  forget(version);
  csvContentMap.set(version, { ...tables });
  featModifierMap.set(version, featModifier);
  registeredVersions.add(version);

  if (isCurrentVersion(version)) {
    return;
  }

  retained.push(version);
  while (retained.length > MAX_RETAINED_VERSIONS) {
    forget(retained.shift()!);
  }
};

export const isVersionDataRegistered = (version: GameVersion): boolean =>
  registeredVersions.has(version);

export const featModifierFor = (version: GameVersion): FeatModifierJson =>
  featModifierMap.get(version) ?? {};

export const all = <T>(
  version: GameVersion,
  tableName: string,
  schema: z.ZodType<T>
): T[] => {
  const cacheKey = `${version}:${tableName}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey) as T[];
  }

  const versionContent = csvContentMap.get(version);
  if (!versionContent) {
    throw new Error(`Version ${version} not found`);
  }

  const content = versionContent[tableName];
  if (!content) {
    throw new Error(`Table ${tableName} not found for version ${version}`);
  }

  const result = loadCsv(content, schema);
  cache.set(cacheKey, result);
  delete versionContent[tableName];
  return result;
};
