import { parse } from 'csv-parse/sync';
import { z } from 'zod';

export function loadCsv<T>(content: string, schema: z.ZodType<T>) {
  const parsed = parse(content, {
    columns: true,
  }).map((row: unknown, index) => {
    const r = row as Record<string, string>;
    const ret: Record<string, unknown> = {
      ...r,
      __meta: { defaultSortKey: index },
    };

    // NOTE: piranha's id is "fish_ piranha" including a space.
    // Remove the space to avoid issues appearing a space in a URL component.
    if (r.id) {
      ret.id = r.id.replace(' ', '');
    }
    return ret;
  });
  return schema.array().parse(parsed);
}
