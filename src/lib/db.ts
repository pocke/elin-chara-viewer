import { loadCsv } from './csvLoader';
import { z } from 'zod';

// Import only CSV files that are not ignored in .gitignore
import charasContent from '../../db/EA 23.229 Patch 4/charas.csv';
import elementsContent from '../../db/EA 23.229 Patch 4/elements.csv';
import racesContent from '../../db/EA 23.229 Patch 4/races.csv';
import jobsContent from '../../db/EA 23.229 Patch 4/jobs.csv';
import tacticsContent from '../../db/EA 23.229 Patch 4/tactics.csv';

// Map table names to their CSV content
const csvContentMap: Record<string, string> = {
  charas: charasContent,
  elements: elementsContent,
  races: racesContent,
  jobs: jobsContent,
  tactics: tacticsContent,
};

const cache = new Map<string, unknown[]>();

export const all = <T>(tableName: string, schema: z.ZodType<T>): T[] => {
  if (cache.has(tableName)) {
    return cache.get(tableName) as T[];
  }

  const content = csvContentMap[tableName];
  if (!content) {
    throw new Error(`Table ${tableName} not found`);
  }

  const result = loadCsv(content, schema);
  cache.set(tableName, result);
  return result;
};
