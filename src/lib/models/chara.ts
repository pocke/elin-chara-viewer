import { z } from 'zod';
import { Elementable } from '../elementable';
import { Element, ElementAttacks, elementByAlias } from './element';
import { Race, raceById } from './race';

export const CharaSchema = z.object({
  __meta: z.object({
    defaultSortKey: z.number(),
  }),
  id: z.string(),
  _id: z.coerce.number(),
  name_JP: z.string(),
  name: z.string(),
  aka_JP: z.string().optional(),
  aka: z.string().optional(),
  idActor: z.string().optional(),
  sort: z.coerce.number(),
  size: z.string().optional(),
  _idRenderData: z.string(),
  tiles: z.string(),
  tiles_snow: z.string().optional(),
  colorMod: z.string().optional(),
  components: z.string().optional(),
  defMat: z.string().optional(),
  LV: z.coerce.number().optional(),
  chance: z.coerce.number().optional(),
  quality: z.coerce.number(),
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
  private raceObj: Race;
  private variantElement: Element | null;

  constructor(
    private row: CharaRow,
    variantElementAlias: ElementAttacks | null = null
  ) {
    const raceId = this.row.race ?? 'norland';
    const race = raceById(raceId);
    if (!race) throw new Error(`Race not found: ${raceId}`);
    this.raceObj = race;

    if (variantElementAlias) {
      const element = elementByAlias(variantElementAlias);
      if (!element)
        throw new Error(`Element not found: ${variantElementAlias}`);
      this.variantElement = element;
    } else {
      this.variantElement = null;
    }
  }

  get id() {
    return [this.row.id, this.variantElement?.alias]
      .filter((x) => x)
      .join('---');
  }

  get defaultSortKey() {
    return this.row.__meta.defaultSortKey;
  }

  normalizedName(locale: string) {
    let name: string;
    switch (locale) {
      case 'ja':
        name = this.normalizedNameJa();
        break;
      case 'en':
        name = this.normalizedNameEn();
        break;
      default:
        throw new Error(`Unsupported locale: ${locale}`);
    }

    if (name === '') {
      return '*r';
    }

    if (name.includes('#ele') && this.variantElement) {
      name = name
        .replace(/#ele(\d)/, (_, n) =>
          this.variantElement!.altName(parseInt(n, 10), locale)
        )
        .replace('#ele', () => this.variantElement!.altName(-1, locale));
    }
    return name;
  }

  elements() {
    return [
      ...new Elementable(this.row).elements(),
      ...this.raceObj.elements(),
    ];
  }

  feats() {
    return [...new Elementable(this.row).feats(), ...this.raceObj.feats()];
  }

  negations() {
    return [
      ...new Elementable(this.row).negations(),
      ...this.raceObj.negations(),
    ];
  }

  others() {
    return [
      ...new Elementable(this.row).others(),
      ...this.raceObj.others(),
    ];
  }

  abilities() {
    const actCombat = this.row.actCombat;
    if (!actCombat) return [];

    return actCombat.split(',').map((ability) => {
      const parts = ability.trim().split('/');
      const rawName = parts[0];
      const chance = parts[1] ? parseInt(parts[1], 10) : 100;
      const party = !!parts[2];

      // Parse name and element from rawName
      let name: string;
      let element: string | null;

      if (rawName.includes('_')) {
        const underscoreIndex = rawName.lastIndexOf('_');
        name = rawName.substring(0, underscoreIndex + 1);
        const elementPart = rawName.substring(underscoreIndex + 1);

        if (elementPart === '') {
          // If nothing after underscore, use variant element
          element = this.variantElement?.alias ?? null;
        } else {
          element = 'ele' + elementPart;
        }
      } else {
        name = rawName;
        element = null;
      }

      return { name, chance, party, element };
    });
  }

  race() {
    return this.row.race ?? 'norland';
  }

  life() {
    return this.raceObj.life + this.getElementPower('life');
  }

  mana() {
    return this.raceObj.mana + this.getElementPower('mana');
  }

  speed() {
    return this.raceObj.speed + this.getElementPower('SPD');
  }

  vigor() {
    return this.raceObj.vigor + this.getElementPower('vigor');
  }

  level() {
    const lv = this.row.LV ?? 1;
    if (this.variantElement) {
      return (lv * this.variantElement.elementPower) / 100;
    }
    return lv;
  }

  geneSlot() {
    const orig = this.raceObj.geneSlot;
    let actual = orig;
    const feats = this.feats();

    const ftRoran = feats.find((feat) => feat.element.alias === 'featRoran');
    if (ftRoran) {
      actual -= 2 * ftRoran.power;
    }

    const ftGeneSlot = feats.find(
      (feat) => feat.element.alias === 'featGeneSlot'
    );
    if (ftGeneSlot) {
      actual += ftGeneSlot.power;
    }

    return [actual, orig];
  }

  dv() {
    return this.raceObj.dv + this.getElementPower('DV');
  }

  pv() {
    return this.raceObj.pv + this.getElementPower('PV');
  }

  pdr() {
    return this.raceObj.pdr + this.getElementPower('PDR');
  }

  edr() {
    return this.raceObj.edr + this.getElementPower('EDR');
  }

  ep() {
    return this.raceObj.ep + this.getElementPower('EP');
  }

  variants() {
    if (this.variantElement) {
      return [];
    }
    if (!this.row.name?.match(/#ele/)) {
      return [];
    }

    const elms = this.row.mainElement?.split(',') ?? [];
    return elms.map((elm, index) => {
      const variantRow = {
        ...this.row,
        __meta: {
          ...this.row.__meta,
          defaultSortKey: this.row.__meta.defaultSortKey + (index + 1) * 0.01,
        },
      };
      return new Chara(variantRow, ('ele' + elm) as ElementAttacks);
    });
  }

  private normalizedNameJa() {
    const prefix =
      this.row.aka_JP && this.row.aka_JP !== '*r' ? this.row.aka_JP + ' ' : '';
    const suffix = this.row.name_JP !== '*r' ? this.row.name_JP : '';

    return prefix + this.bracket(suffix);
  }

  private normalizedNameEn() {
    const aka = this.row.aka && this.row.aka !== '*r' ? this.row.aka : '';
    const name = this.row.name !== '*r' ? this.row.name : '';
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

  getElementPower(alias: string): number {
    return this.elements()
      .filter((elementWithPower) => elementWithPower.element.alias === alias)
      .reduce((sum, elementWithPower) => sum + elementWithPower.power, 0);
  }
}

export const normalizedCharaName = (chara: CharaRow) => {
  const { name_JP, aka_JP } = chara;
  const prefix = aka_JP ?? '';
  const name = name_JP !== '*r' ? name_JP : '';

  return prefix + name;
};
