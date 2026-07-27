import { ARCHIVE_BASE_URL } from '../archive';
import {
  CharaHistory,
  CharaHistorySchema,
  HISTORY_SCHEMA_VERSION,
} from './types';

export const charaHistoryUrl = (key: string): string =>
  `${ARCHIVE_BASE_URL}/history/charas/${encodeURIComponent(key)}.json`;

// A history covers every version, so it is worth keeping across the version
// switcher rather than alongside the per-version data db.ts evicts.
const inFlight = new Map<string, Promise<CharaHistory | null>>();

const load = async (key: string): Promise<CharaHistory | null> => {
  const response = await fetch(charaHistoryUrl(key));

  // A character the generator has not reached yet, or one whose file the
  // archive never gained, has no history rather than a broken page.
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(
      `Failed to fetch the history of ${key}: ${response.status}`
    );
  }

  const history = CharaHistorySchema.parse(await response.json());

  // The archive and the deploy roll out independently, so a file written for a
  // newer reader can arrive first. Its entries cannot be trusted to mean what
  // this reader thinks they mean.
  if (history.schemaVersion !== HISTORY_SCHEMA_VERSION) {
    return null;
  }

  return history;
};

export const charaHistory = (key: string): Promise<CharaHistory | null> => {
  const running = inFlight.get(key);
  if (running) {
    return running;
  }

  const loading = load(key).catch((error) => {
    inFlight.delete(key);
    throw error;
  });
  inFlight.set(key, loading);
  return loading;
};
