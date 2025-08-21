import path from 'path';
import { loadCsv } from './csvLoader';
import { z } from 'zod';

const cache = new Map<string, unknown[]>();

export const all = async <T>(tableName: string, schema: z.ZodType<T>) => {
  if (cache.has(tableName)) {
    return cache.get(tableName) as T[];
  }

  const csvPath = path.join(
    process.cwd(),
    `db/EA 23.173 Patch 1/${tableName}.csv`
  );
  const result = await loadCsv(csvPath, schema);
  cache.set(tableName, result);
  return result;
};
