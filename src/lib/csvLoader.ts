import { readFile } from 'node:fs/promises';
import { parse } from 'csv-parse/sync';
import { z } from 'zod';

export async function loadCsv<T>(filePath: string, schema: z.ZodType<T>) {
  const content = await readFile(filePath, 'utf-8');

  const parsed = parse(content, {
    columns: true,
  }).map((row, index) => ({...(row as any), __meta: { defaultSortKey: index }}));
  return schema.array().parse(parsed);
}
