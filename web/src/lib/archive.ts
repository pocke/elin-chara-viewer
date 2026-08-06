import { z } from 'zod';
import {
  FeatModifierJson,
  isVersionDataRegistered,
  registerVersionData,
} from './db';

// A checkout works without configuration by reading the archive repository on
// GitHub, which is not a host to serve readers from. NEXT_PUBLIC_VERCEL_ENV
// rather than VERCEL_ENV, because this module is in the client bundle too.
if (
  !process.env.NEXT_PUBLIC_ARCHIVE_BASE_URL &&
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
) {
  throw new Error('NEXT_PUBLIC_ARCHIVE_BASE_URL is required in production');
}

export const ARCHIVE_BASE_URL =
  process.env.NEXT_PUBLIC_ARCHIVE_BASE_URL ??
  'https://raw.githubusercontent.com/pocke/elin-chara-viewer-data/main';

// The tables the viewer reads. Versions archived before the exporter dumped
// every table have exactly these five.
export const REQUIRED_TABLES = [
  'charas',
  'elements',
  'races',
  'jobs',
  'tactics',
] as const;

export const ArchivedVersionSchema = z.object({
  version: z.string(),
  // Also used as a path segment against the archive host.
  slug: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9.-]*$/),
  channel: z.enum(['stable', 'nightly']),
  releaseDate: z.string(),
  // Also used as a DuckDB table name on the sources page.
  tables: z.array(z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/)),
  contentHash: z.string(),
  featModifier: z.boolean().default(false),
});

export type ArchivedVersion = z.infer<typeof ArchivedVersionSchema>;

export const ArchivedIdsSchema = z.object({
  charas: z.array(z.string()),
  elements: z.array(z.string()),
});

export type ArchivedIds = z.infer<typeof ArchivedIdsSchema>;

export const archiveVersionUrl = (slug: string): string =>
  `${ARCHIVE_BASE_URL}/v/${encodeURIComponent(slug)}`;

export const archiveCsvUrl = (slug: string, table: string): string =>
  `${archiveVersionUrl(slug)}/csv/${encodeURIComponent(table)}.csv`;

export const archiveIdsUrl = (slug: string): string =>
  `${archiveVersionUrl(slug)}/ids.json`;

const archiveFeatModifierUrl = (slug: string): string =>
  `${archiveVersionUrl(slug)}/featModifier.json`;

export const FeatModifierFileSchema = z.object({
  source: z.string().nullish(),
  modifiers: z.record(z.string(), z.record(z.string(), z.number())),
});

const fetchText = async (url: string, init?: RequestInit): Promise<string> => {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
};

// An archived version's files only change when the archive is rebuilt to
// correct them; the index gains an entry on every release.
const ARCHIVED_INIT: RequestInit = { next: { revalidate: 86400 } };
const INDEX_INIT: RequestInit = { next: { revalidate: 3600 } };

export const archiveIndex = async (): Promise<ArchivedVersion[]> => {
  const text = await fetchText(`${ARCHIVE_BASE_URL}/index.json`, INDEX_INIT);
  const entries: unknown[] = JSON.parse(text);

  // One malformed entry must not hide every other version, so entries are
  // validated one by one instead of as an array.
  return entries.flatMap((entry) => {
    const parsed = ArchivedVersionSchema.safeParse(entry);
    if (!parsed.success) {
      console.error('Skipping a malformed archive entry:', parsed.error.issues);
      return [];
    }
    return [parsed.data];
  });
};

export const archivedVersionBySlug = async (
  slug: string
): Promise<ArchivedVersion | undefined> =>
  (await archiveIndex()).find((entry) => entry.slug === slug);

export const archivedIds = async (slug: string): Promise<ArchivedIds> =>
  ArchivedIdsSchema.parse(
    JSON.parse(await fetchText(archiveIdsUrl(slug), ARCHIVED_INIT))
  );

const inFlight = new Map<string, Promise<void>>();

export const loadArchivedVersion = (
  slug: string,
  hasFeatModifier: boolean
): Promise<void> => {
  if (isVersionDataRegistered(slug)) {
    return Promise.resolve();
  }

  const running = inFlight.get(slug);
  if (running) {
    return running;
  }

  const load = fetchArchivedVersion(slug, hasFeatModifier).finally(() => {
    inFlight.delete(slug);
  });
  inFlight.set(slug, load);
  return load;
};

const fetchArchivedVersion = async (
  slug: string,
  hasFeatModifier: boolean
): Promise<void> => {
  const [csvContents, featModifier] = await Promise.all([
    Promise.all(
      REQUIRED_TABLES.map((table) =>
        fetchText(archiveCsvUrl(slug, table), ARCHIVED_INIT)
      )
    ),
    hasFeatModifier
      ? fetchText(archiveFeatModifierUrl(slug), ARCHIVED_INIT).then(
          (text) =>
            FeatModifierFileSchema.parse(JSON.parse(text))
              .modifiers as FeatModifierJson
        )
      : Promise.resolve({}),
  ]);

  registerVersionData(
    slug,
    Object.fromEntries(
      REQUIRED_TABLES.map((table, index) => [table, csvContents[index]])
    ),
    featModifier
  );
};
