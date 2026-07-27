import { z } from 'zod';
import { ARCHIVE_BASE_URL } from '../archive';
import {
  CharaHistory,
  CharaHistorySchema,
  HISTORY_SCHEMA_VERSION,
} from './types';

export const charaHistoryUrl = (key: string): string =>
  `${ARCHIVE_BASE_URL}/history/charas/${encodeURIComponent(key)}.json`;

/** null where the archive has nothing this reader can show. */
export type CharaHistoryResult = CharaHistory | null;

const VersionedSchema = z.object({ schemaVersion: z.number() });

// Never evicted: a history covers every version, so the version switcher does
// not invalidate it.
const cache = new Map<string, Promise<CharaHistoryResult>>();

const load = async (key: string): Promise<CharaHistoryResult> => {
  const response = await fetch(charaHistoryUrl(key));

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(
      `Failed to fetch the history of ${key}: ${response.status}`
    );
  }

  // The archive and the deploy roll out independently, so a file written for a
  // newer reader can arrive first. Its version is read before the rest of it,
  // because the shape the rest is parsed against is the very thing that moved.
  const body: unknown = await response.json();
  if (VersionedSchema.parse(body).schemaVersion !== HISTORY_SCHEMA_VERSION) {
    return null;
  }

  return CharaHistorySchema.parse(body);
};

export const charaHistory = (key: string): Promise<CharaHistoryResult> => {
  const running = cache.get(key);
  if (running) {
    return running;
  }

  const loading = load(key).catch((error) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, loading);
  return loading;
};
