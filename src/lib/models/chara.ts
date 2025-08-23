import { z } from 'zod';
import { Elementable } from '../elementable';
import { Element, ElementAttacks, elementByAlias } from './element';
import { Race, raceById } from './race';
import { jobById } from './job';
import { Tactics, tacticsById } from './tactics';

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
  public race: Race;
  public mainElement: Element | null = null;
  private isVariant: boolean = false;

  // Memoization cache for expensive computations
  private _memoCache = new Map<string, unknown>();

  private memoize<T>(key: string, factory: () => T): T {
    if (!this._memoCache.has(key)) {
      this._memoCache.set(key, factory());
    }
    return this._memoCache.get(key) as T;
  }

  constructor(
    private row: CharaRow,
    variantElementAlias: ElementAttacks | null = null
  ) {
    const raceId = this.row.race ?? 'norland';
    const race = raceById(raceId);
    if (!race) throw new Error(`Race not found: ${raceId}`);
    this.race = race;

    if (variantElementAlias) {
      const element = elementByAlias(variantElementAlias);
      if (!element)
        throw new Error(`Element not found: ${variantElementAlias}`);
      this.mainElement = element;
      this.isVariant = true;
    } else {
      // Parse mainElement from row.mainElement column
      if (this.row.mainElement) {
        const mainElementAlias = this.row.mainElement.split('/')[0];
        if (mainElementAlias) {
          const element = elementByAlias('ele' + mainElementAlias);
          this.mainElement = element || null;
        }
      }
    }
  }

  get id() {
    return [this.row.id, this.isVariant ? this.mainElement?.alias : null]
      .filter((x) => x)
      .join('---');
  }

  get defaultSortKey() {
    return this.row.__meta.defaultSortKey;
  }

  normalizedName(locale: string) {
    return this.memoize(`normalizedName:${locale}`, () => {
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

      if (this.mainElement) {
        if (name.includes('#ele')) {
          name = name
            .replace(/#ele(\d)/, (_, n) =>
              this.mainElement!.altName(parseInt(n, 10), locale)
            )
            .replace('#ele', () => this.mainElement!.altName(-1, locale));
        } else if (this.isVariant) {
          name = `${name} (${this.mainElement.altName(-1, locale)})`;
        }
      }
      return name;
    });
  }

  elements() {
    return this.memoize('elements', () => [
      ...new Elementable(this.row, this.mainElement).elements(),
      ...this.race.elements(),
      ...this.job().elements(),
    ]);
  }

  feats() {
    return this.memoize('feats', () => [
      ...new Elementable(this.row, this.mainElement).feats(),
      ...this.race.feats(),
      ...this.job().feats(),
    ]);
  }

  negations() {
    return this.memoize('negations', () => [
      ...new Elementable(this.row, this.mainElement).negations(),
      ...this.race.negations(),
      ...this.job().negations(),
    ]);
  }

  others() {
    return this.memoize('others', () => [
      ...new Elementable(this.row, this.mainElement).others(),
      ...this.race.others(),
      ...this.job().others(),
    ]);
  }

  abilities() {
    return this.memoize('abilities', () => {
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
            element = this.mainElement?.alias ?? null;
          } else {
            element = 'ele' + elementPart;
          }
        } else {
          name = rawName;
          element = null;
        }

        return { name, chance, party, element };
      });
    });
  }

  raceId() {
    return this.row.race ?? 'norland';
  }

  job() {
    return this.memoize('job', () => {
      let jobId = this.row.job ?? 'none';
      if (jobId === '*r') {
        jobId = 'none';
      }
      const job = jobById(jobId);
      if (!job) throw new Error(`Job not found: ${jobId}`);
      return job;
    });
  }

  life() {
    return this.memoize(
      'life',
      () => this.race.life + this.getElementPower('life')
    );
  }

  mana() {
    return this.memoize(
      'mana',
      () => this.race.mana + this.getElementPower('mana')
    );
  }

  speed() {
    return this.memoize(
      'speed',
      () => this.race.speed + this.getElementPower('SPD') + this.job().speed
    );
  }

  vigor() {
    return this.memoize(
      'vigor',
      () => this.race.vigor + this.getElementPower('vigor')
    );
  }

  level() {
    return this.memoize('level', () => {
      const lv = this.row.LV ?? 1;
      if (this.mainElement && this.isVariant) {
        return Math.floor((lv * this.mainElement.elementPower) / 100);
      }
      return lv;
    });
  }

  geneSlot() {
    return this.memoize('geneSlot', () => {
      const orig = this.race.geneSlot;
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
    });
  }

  dv() {
    return this.memoize('dv', () => this.race.dv + this.getElementPower('DV'));
  }

  pv() {
    return this.memoize('pv', () => this.race.pv + this.getElementPower('PV'));
  }

  pdr() {
    return this.memoize(
      'pdr',
      () => this.race.pdr + this.getElementPower('PDR')
    );
  }

  edr() {
    return this.memoize(
      'edr',
      () => this.race.edr + this.getElementPower('EDR')
    );
  }

  ep() {
    return this.memoize('ep', () => this.race.ep + this.getElementPower('EP'));
  }

  variants() {
    return this.memoize('variants', () => {
      if (this.isVariant) {
        return [];
      }
      const mainElements = this.row.mainElement?.split(',') ?? [];
      if (mainElements.length < 2) {
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
    });
  }

  isHidden() {
    if (this.tags().includes('noRandomProduct')) {
      return true;
    }
    const hiddenCharaIds = [
      'nerun',
      'ancient_golem',
      'mirage',
      'ehekatl',
      'elin',
      'itz',
      'jure',
      'kumiromi',
      'lulwy',
      'mani',
      'opatos',
    ];
    if (hiddenCharaIds.includes(this.row.id)) {
      return true;
    }
    return false;
  }

  tags() {
    return this.row.tag?.split(',') ?? [];
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
    } else if (
      this.row.trait &&
      ['Adventurer', 'AdventurerBacker'].includes(this.row.trait)
    ) {
      return `「${name}」`;
    }

    return name;
  }

  getElementPower(alias: string): number {
    return this.memoize(`getElementPower:${alias}`, () =>
      this.elements()
        .filter((elementWithPower) => elementWithPower.element.alias === alias)
        .reduce((sum, elementWithPower) => sum + elementWithPower.power, 0)
    );
  }

  bodyParts() {
    return this.memoize('bodyParts', () => this.race.figures());
  }

  totalBodyParts() {
    return this.memoize('totalBodyParts', () => this.race.totalBodyParts());
  }

  mag() {
    return this.memoize(
      'mag',
      () => this.getElementPower('MAG') + this.job().mag
    );
  }

  // https://github.com/Elin-Modding-Resources/Elin-Decompiled/blob/72332a1390e68a8de62bca4acbd6ebbaab92257b/Elin/Tactics.cs#L180-L181
  tactics(): Tactics {
    return this.memoize('tactics', () => {
      if (this.row.tactics) {
        const tactics = tacticsById(this.row.tactics);
        if (tactics) {
          return tactics;
        }
      }

      const characterTactics = tacticsById(this.row.id);
      if (characterTactics) {
        return characterTactics;
      }

      const job = this.job();
      const jobTactics = tacticsById(job.id);
      if (jobTactics) {
        return jobTactics;
      }

      const predatorTactics = tacticsById('predator');
      if (predatorTactics) {
        return predatorTactics;
      }

      throw new Error(`No tactics found for character ${this.row.id}`);
    });
  }

  tacticsDistance(): number {
    return this.memoize('tacticsDistance', () => {
      // aiParamがあれば最初の値を使用
      if (this.row.aiParam) {
        const params = this.row.aiParam.split(',');
        if (params.length > 0) {
          const distance = parseInt(params[0], 10);
          if (!isNaN(distance)) {
            return distance;
          }
        }
      }

      // aiParamがない場合は基本のtacticsから取得
      return this.tactics().distance;
    });
  }

  tacticsMoveFrequency(): number {
    return this.memoize('tacticsMoveFrequency', () => {
      // aiParamがあれば2番目の値を使用
      if (this.row.aiParam) {
        const params = this.row.aiParam.split(',');
        if (params.length > 1) {
          const moveFreq = parseInt(params[1], 10);
          if (!isNaN(moveFreq)) {
            return moveFreq;
          }
        }
      }

      // aiParamがない場合は基本のtacticsから取得
      return this.tactics().moveFrequency;
    });
  }
}
