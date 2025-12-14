import { z } from 'zod';
import {
  ElementWithPower,
  parseElements,
  filterFeats,
  filterNegations,
  filterSkills,
  filterOthers,
} from '../elementable';
import { all, GameVersion } from '../db';

export const JobSchema = z.object({
  __meta: z.object({
    defaultSortKey: z.number(),
  }),
  id: z.string(),
  name_JP: z.string(),
  name: z.string(),
  playable: z.coerce.number(),
  STR: z.coerce.number(),
  END: z.coerce.number(),
  DEX: z.coerce.number(),
  PER: z.coerce.number(),
  LER: z.coerce.number(),
  WIL: z.coerce.number(),
  MAG: z.coerce.number(),
  CHA: z.coerce.number(),
  SPD: z.coerce.number(),
  '***': z.string().optional(),
  elements: z.string().optional(),
  weapon: z.string().optional(),
  equip: z.string().optional(),
  domain: z.string().optional(),
  detail_JP: z.string(),
  detail: z.string(),
});

export type JobRow = z.infer<typeof JobSchema>;

// Cache: version -> id -> Job
const _jobsMap: Map<GameVersion, Map<string, Job>> = new Map();
// Cache: version -> featAlias -> Job[]
const _jobsByFeatMap: Map<GameVersion, Map<string, Job[]>> = new Map();

function getJobsMap(version: GameVersion): Map<string, Job> {
  if (!_jobsMap.has(version)) {
    const jobs = all(version, 'jobs', JobSchema);
    _jobsMap.set(
      version,
      new Map(jobs.map((job) => [job.id, new Job(version, job)]))
    );
  }
  return _jobsMap.get(version)!;
}

function getJobsByFeatMap(version: GameVersion): Map<string, Job[]> {
  if (!_jobsByFeatMap.has(version)) {
    const featMap = new Map<string, Job[]>();
    const jobs = Array.from(getJobsMap(version).values());

    for (const job of jobs) {
      const feats = job.feats();
      const seenAliases = new Set<string>();
      for (const feat of feats) {
        const alias = feat.element.alias;
        if (seenAliases.has(alias)) {
          continue;
        }
        seenAliases.add(alias);
        if (!featMap.has(alias)) {
          featMap.set(alias, []);
        }
        featMap.get(alias)!.push(job);
      }
    }
    _jobsByFeatMap.set(version, featMap);
  }
  return _jobsByFeatMap.get(version)!;
}

export function jobById(version: GameVersion, id: string): Job | undefined {
  return getJobsMap(version).get(id);
}

export function jobsByFeat(version: GameVersion, featAlias: string): Job[] {
  return getJobsByFeatMap(version).get(featAlias) ?? [];
}

export class Job {
  constructor(
    public version: GameVersion,
    public row: JobRow
  ) {}

  get id() {
    return this.row.id;
  }

  get defaultSortKey() {
    return this.row.__meta.defaultSortKey;
  }

  name(locale: string) {
    switch (locale) {
      case 'ja':
        return this.row.name_JP;
      case 'en':
        return this.row.name;
      default:
        throw new Error(`Unsupported locale: ${locale}`);
    }
  }

  get mag() {
    return this.row.MAG;
  }

  get speed() {
    return this.row.SPD;
  }

  elements(): ElementWithPower[] {
    return parseElements(this.version, this.row);
  }

  feats(): ElementWithPower[] {
    return filterFeats(this.elements());
  }

  negations(): ElementWithPower[] {
    return filterNegations(this.elements());
  }

  skills(): ElementWithPower[] {
    return filterSkills(this.elements());
  }

  others(): ElementWithPower[] {
    return filterOthers(this.elements());
  }
}
