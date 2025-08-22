import { z } from 'zod';
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

function getJobsMap(): Map<string, Job> {
  if (!_jobsMap) {
    const jobs = all('jobs', JobSchema);
    _jobsMap = new Map(jobs.map((job, index) => [job.id, new Job(job, index)]));
  }
  return _jobsMap;
}

export function jobById(id: string): Job | undefined {
  return getJobsMap().get(id);
}

export class Job {
  constructor(
    private row: JobRow,
    private index: number
  ) {}

  get id() {
    return this.row.id;
  }

  get defaultSortKey() {
    return this.index;
  }
}
