/**
 * Parses every archived version with the schemas the app uses, so that a
 * version the viewer cannot read is found before it is served.
 *
 * Usage: npm run check:archive -- <archive-dir>
 */
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { ArchivedIdsSchema, ArchivedVersionSchema } from '../src/lib/archive';
import { all, registerVersionData } from '../src/lib/db';
import { CharaSchema } from '../src/lib/models/chara';
import { ElementSchema } from '../src/lib/models/element';
import { RaceSchema } from '../src/lib/models/race';
import { JobSchema } from '../src/lib/models/job';
import { TacticsSchema } from '../src/lib/models/tactics';

const SCHEMAS: Record<string, z.ZodType<unknown>> = {
  charas: CharaSchema,
  elements: ElementSchema,
  races: RaceSchema,
  jobs: JobSchema,
  tactics: TacticsSchema,
};

// No default: the archive lives outside web/, so it reaches the container
// only through a mount the caller names.
const archiveDir = process.argv[2];
if (!archiveDir) {
  console.error('usage: check:archive -- <archive-dir>');
  process.exit(1);
}
const index = ArchivedVersionSchema.array().parse(
  JSON.parse(fs.readFileSync(path.join(archiveDir, 'index.json'), 'utf8'))
);

const versionDir = (slug: string) => path.join(archiveDir, 'v', slug);

const failures: string[] = [];

for (const entry of index) {
  try {
    const tables = Object.fromEntries(
      Object.keys(SCHEMAS).map((table) => [
        table,
        fs.readFileSync(
          path.join(versionDir(entry.slug), 'csv', `${table}.csv`),
          'utf8'
        ),
      ])
    );
    registerVersionData(entry.slug, tables, {});

    for (const [table, schema] of Object.entries(SCHEMAS)) {
      const rows = all(entry.slug, table, schema);
      if (rows.length === 0) {
        throw new Error(`${table}: no rows`);
      }
    }

    ArchivedIdsSchema.parse(
      JSON.parse(
        fs.readFileSync(path.join(versionDir(entry.slug), 'ids.json'), 'utf8')
      )
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message.split('\n')[0] : String(error);
    failures.push(`${entry.version}: ${message}`);
  }
}

failures.forEach((failure) => console.error(failure));
console.log(
  `Checked ${index.length} versions; ${failures.length === 0 ? 'all parsed' : `${failures.length} failed`}`
);
process.exit(failures.length === 0 ? 0 : 1);
