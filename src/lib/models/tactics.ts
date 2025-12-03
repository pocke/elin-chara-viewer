import { z } from 'zod';
import { all, GameVersion } from '../db';

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

// Cache: version -> id -> Tactics
const _tacticsMap: Map<GameVersion, Map<string, Tactics>> = new Map();

function getTacticsMap(version: GameVersion): Map<string, Tactics> {
  if (!_tacticsMap.has(version)) {
    const tactics = all(version, 'tactics', TacticsSchema);
    _tacticsMap.set(
      version,
      new Map(
        tactics.map((tactic, index) => [
          tactic.id,
          new Tactics(version, tactic, index),
        ])
      )
    );
  }
  return _tacticsMap.get(version)!;
}

export function tacticsById(
  version: GameVersion,
  id: string
): Tactics | undefined {
  return getTacticsMap(version).get(id);
}

export class Tactics {
  constructor(
    public version: GameVersion,
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
