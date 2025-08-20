import { z } from 'zod';

export const CharaSchema = z.object({
  __meta: z.object({
    defaultSortKey: z.number(),
  }),
  id: z.string(),
  _id: z.coerce.number(),
  name_JP: z.string().optional(),
  name: z.string().optional(),
  aka_JP: z.string().optional(),
  aka: z.string().optional(),
  idActor: z.string().optional(),
  sort: z.coerce.number().optional(),
  size: z.string().optional(),
  _idRenderData: z.string().optional(),
  tiles: z.string().optional(),
  tiles_snow: z.string().optional(),
  colorMod: z.string().optional(),
  components: z.string().optional(),
  defMat: z.string().optional(),
  LV: z.coerce.number().optional(),
  chance: z.coerce.number().optional(),
  quality: z.coerce.number().optional(),
  hostility: z.string().optional(),
  biome: z.string().optional(),
  tag: z.string().optional(),
  trait: z.string().optional(),
  race: z.string().optional(),
  job: z.string().optional(),
  tactics: z.string().optional(),
  aiIdle: z.string().optional(),
  aiParam: z.string().optional(),
  actCombat: z.string().optional(),
  mainElement: z.string().optional(),
  elements: z.string().optional(),
  equip: z.string().optional(),
  loot: z.string().optional(),
  category: z.string().optional(),
  filter: z.string().optional(),
  gachaFilter: z.string().optional(),
  tone: z.string().optional(),
  actIdle: z.string().optional(),
  lightData: z.string().optional(),
  idExtra: z.string().optional(),
  bio: z.string().optional(),
  faith: z.string().optional(),
  works: z.string().optional(),
  hobbies: z.string().optional(),
  idText: z.string().optional(),
  moveAnime: z.string().optional(),
  factory: z.string().optional(),
  detail_JP: z.string().optional(),
  detail: z.string().optional(),
});

export type CharaRow = z.infer<typeof CharaSchema>;

export class Chara {
  constructor(private row: CharaRow) {}

  get id() {
    return this.row.id;
  }

  get defaultSortKey() {
    return this.row.__meta.defaultSortKey;
  }

  normalizedName(locale: string) {
    switch (locale) {
      case 'ja':
        return this.normalizedNameJa();
      case 'en':
        return this.normalizedNameEn();
      default:
        throw new Error(`Unsupported locale: ${locale}`);
    }
  }

  elements() {
    const eles = this.row.elements;
    if (!eles) return [];

    return eles.split(',').map((t) => {
      const [alias, power] = t.split('/');
      const powerInt = power ? parseInt(power, 10) : 1;
      return { alias, power: powerInt };
    });
  }

  feats() {
    return this.elements().filter((element) =>
      element.alias.startsWith('feat')
    );
  }

  private normalizedNameJa() {
    const prefix =
      this.row.aka_JP && this.row.aka_JP !== '*r' ? this.row.aka_JP + ' ' : '';
    const suffix =
      this.row.name_JP && this.row.name_JP !== '*r' ? this.row.name_JP : '';

    return prefix + this.bracket(suffix);
  }

  private normalizedNameEn() {
    const aka = this.row.aka && this.row.aka !== '*r' ? this.row.aka : '';
    const name = this.row.name && this.row.name !== '*r' ? this.row.name : '';
    return (aka + ' ' + this.bracket(name)).trim();
  }

  private bracket(name: string): string {
    if (!name) return name;

    if (this.row.quality === 4) {
      return `『${name}』`;
    } else if (this.row.quality === 3) {
      return `《${name}》`;
    }

    return name;
  }
}

export const normalizedCharaName = (chara: CharaRow) => {
  const { name_JP, aka_JP } = chara;
  const prefix = aka_JP ?? '';
  const name = name_JP && name_JP !== '*r' ? name_JP : '';

  return prefix + name;
};
