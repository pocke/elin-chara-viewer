import { loadCsv } from './csvLoader';
import { z } from 'zod';

// Import CSV files for EA version
import eaCharasContent from '../../db/EA 23.252 Patch 2/charas.csv';
import eaElementsContent from '../../db/EA 23.252 Patch 2/elements.csv';
import eaRacesContent from '../../db/EA 23.252 Patch 2/races.csv';
import eaJobsContent from '../../db/EA 23.252 Patch 2/jobs.csv';
import eaTacticsContent from '../../db/EA 23.252 Patch 2/tactics.csv';

// Import CSV files for Nightly version (currently using EA data as placeholder)
import nightlyCharasContent from '../../db/EA 23.255 Patch 3/charas.csv';
import nightlyElementsContent from '../../db/EA 23.255 Patch 3/elements.csv';
import nightlyRacesContent from '../../db/EA 23.255 Patch 3/races.csv';
import nightlyJobsContent from '../../db/EA 23.255 Patch 3/jobs.csv';
import nightlyTacticsContent from '../../db/EA 23.255 Patch 3/tactics.csv';

export type GameVersion = 'EA' | 'Nightly';

export const GAME_VERSIONS: GameVersion[] = ['EA', 'Nightly'];

// Map version -> table name -> CSV content
const csvContentMap: Record<GameVersion, Record<string, string>> = {
  EA: {
    charas: eaCharasContent,
    elements: eaElementsContent,
    races: eaRacesContent,
    jobs: eaJobsContent,
    tactics: eaTacticsContent,
  },
  Nightly: {
    charas: nightlyCharasContent,
    elements: nightlyElementsContent,
    races: nightlyRacesContent,
    jobs: nightlyJobsContent,
    tactics: nightlyTacticsContent,
  },
};

// Cache: version:tableName -> data
const cache = new Map<string, unknown[]>();

export const all = <T>(
  version: GameVersion,
  tableName: string,
  schema: z.ZodType<T>
): T[] => {
  const cacheKey = `${version}:${tableName}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey) as T[];
  }

  const versionContent = csvContentMap[version];
  if (!versionContent) {
    throw new Error(`Version ${version} not found`);
  }

  const content = versionContent[tableName];
  if (!content) {
    throw new Error(`Table ${tableName} not found for version ${version}`);
  }

  const result = loadCsv(content, schema);
  cache.set(cacheKey, result);
  return result;
};
