import { z } from 'zod';
import { Elementable } from '../elementable';
import { all } from '../db';

export const JobSchema = z.object({
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

let _jobsMap: Map<string, Job> | null = null;
let _jobsByFeatMap: Map<string, Job[]> | null = null;

function getJobsMap(): Map<string, Job> {
  if (!_jobsMap) {
    const jobs = all('jobs', JobSchema);
    _jobsMap = new Map(jobs.map((job, index) => [job.id, new Job(job, index)]));
  }
  return _jobsMap;
}

function getJobsByFeatMap(): Map<string, Job[]> {
  if (!_jobsByFeatMap) {
    _jobsByFeatMap = new Map();
    const jobs = Array.from(getJobsMap().values());

    for (const job of jobs) {
      const feats = job.feats();
      const seenAliases = new Set<string>();
      for (const feat of feats) {
        const alias = feat.element.alias;
        if (seenAliases.has(alias)) {
          continue;
        }
        seenAliases.add(alias);
        if (!_jobsByFeatMap.has(alias)) {
          _jobsByFeatMap.set(alias, []);
        }
        _jobsByFeatMap.get(alias)!.push(job);
      }
    }
  }
  return _jobsByFeatMap;
}

export function jobById(id: string): Job | undefined {
  return getJobsMap().get(id);
}

export function jobsByFeat(featAlias: string): Job[] {
  return getJobsByFeatMap().get(featAlias) ?? [];
}

export class Job {
  constructor(
    public row: JobRow,
    private index: number
  ) {}

  get id() {
    return this.row.id;
  }

  get defaultSortKey() {
    return this.index;
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

  elements() {
    return new Elementable(this.row).elements();
  }

  feats() {
    return new Elementable(this.row).feats();
  }

  negations() {
    return new Elementable(this.row).negations();
  }

  others() {
    return new Elementable(this.row).others();
  }
}
