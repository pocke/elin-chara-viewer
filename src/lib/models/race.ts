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
import { elementByAlias, elementById } from './element';

// Common skill element IDs that all races have (from SourceRace.cs OnInit)
// These are set to 1 for all races in the game
const COMMON_RACE_SKILL_IDS = [
  '261',
  '225',
  '255',
  '220',
  '250',
  '101',
  '102',
  '103',
  '107',
  '106',
  '110',
  '111',
  '104',
  '109',
  '108',
  '123',
  '122',
  '120',
  '150',
  '301',
  '306',
];

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

  private commonSkillElements(): ElementWithPower[] {
    const result: ElementWithPower[] = [];
    for (const id of COMMON_RACE_SKILL_IDS) {
      const element = elementById(this.version, id);
      if (element) {
        result.push({ element, powers: [1] });
      }
    }
    return result;
  }

  private attributeElements(): ElementWithPower[] {
    const attrs = [
      'STR',
      'END',
      'DEX',
      'PER',
      'LER',
      'WIL',
      'MAG',
      'CHA',
      'SPD',
    ] as const;
    const result: ElementWithPower[] = [];
    for (const attr of attrs) {
      const value = this.row[attr];
      if (value !== 0) {
        const element = elementByAlias(this.version, attr);
        if (!element) {
          throw new Error(`Element not found: ${attr}`);
        }
        result.push({ element, powers: [value] });
      }
    }
    return result;
  }

  private statElements(): ElementWithPower[] {
    const stats = [
      { alias: 'life', value: this.row.life },
      { alias: 'mana', value: this.row.mana },
      { alias: 'vigor', value: this.row.vigor },
      { alias: 'DV', value: this.row.DV },
      { alias: 'PV', value: this.row.PV },
      { alias: 'PDR', value: this.row.PDR },
      { alias: 'EDR', value: this.row.EDR },
      { alias: 'evasionPerfect', value: this.row.EP },
      { alias: 'martial', value: this.row.martial },
    ];
    const result: ElementWithPower[] = [];
    for (const { alias, value } of stats) {
      if (value !== 0) {
        const element = elementByAlias(this.version, alias);
        if (!element) {
          throw new Error(`Element not found: ${alias}`);
        }
        result.push({ element, powers: [value] });
      }
    }
    return result;
  }

  elements(): ElementWithPower[] {
    return [
      ...parseElements(this.version, this.row),
      ...this.commonSkillElements(),
      ...this.attributeElements(),
      ...this.statElements(),
    ];
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

  get geneSlot() {
    return this.row.geneCap;
  }
}
