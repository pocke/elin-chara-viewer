import { z } from 'zod';
import { Elementable } from '../elementable';

const figureMap = {
  手: 'hand',
  頭: 'head',
  胴: 'torso',
  背中: 'back',
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
  name_JP: z.string().optional(),
  name: z.string().optional(),
  playable: z.coerce.number().optional(),
  tag: z.string().optional(),
  life: z.coerce.number().optional(),
  mana: z.coerce.number().optional(),
  vigor: z.coerce.number().optional(),
  DV: z.coerce.number().optional(),
  PV: z.coerce.number().optional(),
  PDR: z.coerce.number().optional(),
  EDR: z.coerce.number().optional(),
  EP: z.coerce.number().optional(),
  STR: z.coerce.number().optional(),
  END: z.coerce.number().optional(),
  DEX: z.coerce.number().optional(),
  PER: z.coerce.number().optional(),
  LER: z.coerce.number().optional(),
  WIL: z.coerce.number().optional(),
  MAG: z.coerce.number().optional(),
  CHA: z.coerce.number().optional(),
  SPD: z.coerce.number().optional(),
  '***': z.string().optional(),
  INT: z.coerce.number().optional(),
  martial: z.coerce.number().optional(),
  pen: z.coerce.number().optional(),
  elements: z.string().optional(),
  skill: z.string().optional(),
  figure: z.string(),
  geneCap: z.coerce.number().optional(),
  material: z.string().optional(),
  corpse: z.string().optional(),
  loot: z.string().optional(),
  blood: z.coerce.number().optional(),
  meleeStyle: z.string().optional(),
  castStyle: z.string().optional(),
  EQ: z.string().optional(),
  sex: z.coerce.number().optional(),
  age: z.string().optional(),
  height: z.coerce.number().optional(),
  breeder: z.coerce.number().optional(),
  food: z.coerce.number().optional(),
  fur: z.string().optional(),
  detail_JP: z.string().optional(),
  detail: z.string().optional(),
});

export type RaceRow = z.infer<typeof RaceSchema>;

export class Race {
  constructor(private row: RaceRow) {}

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
    return new Elementable(this.row).elements();
  }

  feats() {
    return new Elementable(this.row).feats();
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
    return this.row.life ?? 0;
  }

  get mana() {
    return this.row.mana ?? 0;
  }

  get speed() {
    return this.row.SPD ?? 0;
  }

  get vigor() {
    return this.row.vigor ?? 100;
  }
}
