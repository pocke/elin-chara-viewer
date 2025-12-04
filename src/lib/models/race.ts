import { z } from 'zod';
import { Elementable } from '../elementable';
import { all, GameVersion } from '../db';

const figureMap = {
  手: 'hand',
  頭: 'head',
  体: 'torso',
  背: 'back',
  腰: 'waist',
  腕: 'arm',
  足: 'foot',
  首: 'neck',
  指: 'finger',
} as const;

export const RaceSchema = z.object({
  __meta: z.object({
    defaultSortKey: z.number(),
  }),
  id: z.string(),
  name_JP: z.string(),
  name: z.string(),
  playable: z.coerce.number(),
  tag: z.string().optional(),
  life: z.coerce.number(),
  mana: z.coerce.number(),
  vigor: z.coerce.number(),
  DV: z.coerce.number(),
  PV: z.coerce.number(),
  PDR: z.coerce.number(),
  EDR: z.coerce.number(),
  EP: z.coerce.number(),
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
  INT: z.coerce.number(),
  martial: z.coerce.number(),
  pen: z.coerce.number(),
  elements: z.string().optional(),
  skill: z.string().optional(),
  figure: z.string(),
  geneCap: z.coerce.number(),
  material: z.string(),
  corpse: z.string(),
  loot: z.string().optional(),
  blood: z.coerce.number(),
  meleeStyle: z.string().optional(),
  castStyle: z.string().optional(),
  EQ: z.string().optional(),
  sex: z.coerce.number(),
  age: z.string(),
  height: z.coerce.number(),
  breeder: z.coerce.number(),
  food: z.coerce.number(),
  fur: z.string().optional(),
  detail_JP: z.string(),
  detail: z.string(),
});

export type RaceRow = z.infer<typeof RaceSchema>;

// Cache: version -> id -> Race
const _racesMap: Map<GameVersion, Map<string, Race>> = new Map();
// Cache: version -> featAlias -> Race[]
const _racesByFeatMap: Map<GameVersion, Map<string, Race[]>> = new Map();

function getRacesMap(version: GameVersion): Map<string, Race> {
  if (!_racesMap.has(version)) {
    const races = all(version, 'races', RaceSchema);
    _racesMap.set(
      version,
      new Map(races.map((race) => [race.id, new Race(version, race)]))
    );
  }
  return _racesMap.get(version)!;
}

function getRacesByFeatMap(version: GameVersion): Map<string, Race[]> {
  if (!_racesByFeatMap.has(version)) {
    const featMap = new Map<string, Race[]>();
    const races = Array.from(getRacesMap(version).values());

    for (const race of races) {
      const feats = race.feats();
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
        featMap.get(alias)!.push(race);
      }
    }
    _racesByFeatMap.set(version, featMap);
  }
  return _racesByFeatMap.get(version)!;
}

export function raceById(version: GameVersion, id: string): Race | undefined {
  return getRacesMap(version).get(id);
}

export function racesByFeat(version: GameVersion, featAlias: string): Race[] {
  return getRacesByFeatMap(version).get(featAlias) ?? [];
}

export class Race {
  constructor(
    public version: GameVersion,
    public row: RaceRow
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

  elements() {
    return new Elementable(this.version, this.row).elements();
  }

  feats() {
    return new Elementable(this.version, this.row).feats();
  }

  negations() {
    return new Elementable(this.version, this.row).negations();
  }

  others() {
    return new Elementable(this.version, this.row).others();
  }

  figures() {
    const figures = {
      hand: 0,
      head: 0,
      torso: 0,
      back: 0,
      waist: 0,
      arm: 0,
      foot: 0,
      neck: 0,
      finger: 0,
    };

    this.row.figure.split('|').forEach((part) => {
      const key = figureMap[part as keyof typeof figureMap];
      if (key) {
        figures[key] += 1;
      }
    });
    return figures;
  }

  totalBodyParts() {
    return Object.values(this.figures()).reduce((sum, count) => sum + count, 0);
  }

  get life() {
    return this.row.life;
  }

  get mana() {
    return this.row.mana;
  }

  get speed() {
    return this.row.SPD;
  }

  get vigor() {
    return this.row.vigor;
  }

  get geneSlot() {
    return this.row.geneCap;
  }

  get dv() {
    return this.row.DV;
  }

  get pv() {
    return this.row.PV;
  }

  get pdr() {
    return this.row.PDR;
  }

  get edr() {
    return this.row.EDR;
  }

  get ep() {
    return this.row.EP;
  }
}
