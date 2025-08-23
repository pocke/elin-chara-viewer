import { z } from 'zod';
import { all } from '../db';

export const TacticsSchema = z.object({
  id: z.string(),
  name_JP: z.string(),
  name: z.string(),
  '***': z.string().optional(),
  dist: z.coerce.number(),
  move: z.coerce.number(),
  movePC: z.coerce.number(),
  party: z.coerce.number(),
  taunt: z.coerce.number(),
  melee: z.coerce.number(),
  range: z.coerce.number(),
  spell: z.coerce.number(),
  heal: z.coerce.number(),
  summon: z.coerce.number(),
  buff: z.coerce.number(),
  debuff: z.coerce.number(),
  tag: z.string().optional(),
  detail_JP: z.string().optional(),
  detail: z.string().optional(),
});

export type TacticsRow = z.infer<typeof TacticsSchema>;

let _tacticsMap: Map<string, Tactics> | null = null;

function getTacticsMap(): Map<string, Tactics> {
  if (!_tacticsMap) {
    const tactics = all('tactics', TacticsSchema);
    _tacticsMap = new Map(
      tactics.map((tactic, index) => [tactic.id, new Tactics(tactic, index)])
    );
  }
  return _tacticsMap;
}

export function tacticsById(id: string): Tactics | undefined {
  return getTacticsMap().get(id);
}

export class Tactics {
  constructor(
    private row: TacticsRow,
    private index: number
  ) {}

  get id() {
    return this.row.id;
  }

  get defaultSortKey() {
    return this.index;
  }

  name(locale: string): string {
    if (locale === 'ja') {
      return this.row.name_JP;
    }
    return this.row.name;
  }

  get distance() {
    return this.row.dist;
  }

  get moveFrequency() {
    return this.row.move;
  }
}
