import { z } from 'zod';
import featModifierJson from '../../generated/featModifier.json';
import { all } from '../db';

export const ElementSchema = z.object({
  __meta: z.object({
    defaultSortKey: z.number(),
  }),
  id: z.string(),
  alias: z.string(),
  name_JP: z.string(),
  name: z.string(),
  altname_JP: z.string().optional(),
  altname: z.string().optional(),
  aliasParent: z.string().optional(),
  aliasRef: z.string().optional(),
  aliasMtp: z.string().optional(),
  parentFactor: z.coerce.number(),
  lvFactor: z.coerce.number(),
  encFactor: z.coerce.number(),
  encSlot: z.string().optional(),
  mtp: z.coerce.number(),
  LV: z.coerce.number(),
  chance: z.coerce.number(),
  value: z.coerce.number(),
  cost: z.string().optional(),
  geneSlot: z.coerce.number(),
  sort: z.coerce.number(),
  target: z.string().optional(),
  proc: z.string().optional(),
  type: z.string().optional(),
  group: z.string().optional(),
  category: z.string().optional(),
  categorySub: z.string().optional(),
  abilityType: z.string().optional(),
  tag: z.string().optional(),
  thing: z.string().optional(),
  eleP: z.coerce.number(),
  cooldown: z.coerce.number(),
  charge: z.coerce.number(),
  radius: z.coerce.number(),
  max: z.coerce.number(),
  req: z.string().optional(),
  idTrainer: z.string().optional(),
  partySkill: z.coerce.number(),
  tagTrainer: z.string().optional(),
  levelBonus_JP: z.string().optional(),
  levelBonus: z.string().optional(),
  foodEffect: z.string().optional(),
  '***': z.string().optional(),
  langAct: z.string().optional(),
  detail_JP: z.string().optional(),
  detail: z.string().optional(),
  textPhase_JP: z.string().optional(),
  textPhase: z.string().optional(),
  textExtra_JP: z.string().optional(),
  textExtra: z.string().optional(),
  textInc_JP: z.string().optional(),
  textInc: z.string().optional(),
  textDec_JP: z.string().optional(),
  textDec: z.string().optional(),
  textAlt_JP: z.string().optional(),
  textAlt: z.string().optional(),
  adjective_JP: z.string().optional(),
  adjective: z.string().optional(),
});

export type ElementRow = z.infer<typeof ElementSchema>;

export type ElementAttacks =
  | 'eleFire'
  | 'eleCold'
  | 'eleLightning'
  | 'eleDarkness'
  | 'eleMind'
  | 'elePoison'
  | 'eleNether'
  | 'eleSound'
  | 'eleNerve'
  | 'eleHoly'
  | 'eleChaos'
  | 'eleMagic'
  | 'eleEther'
  | 'eleAcid'
  | 'eleCut'
  | 'eleImpact'
  | 'eleVoid';

let _elementsMap: Map<string, Element> | null = null;
let _elementsIdMap: Map<string, Element> | null = null;

function getElementsMap(): Map<string, Element> {
  if (!_elementsMap) {
    const elements = all('elements', ElementSchema);
    _elementsMap = new Map(
      elements.map((element) => [element.alias, new Element(element)])
    );
  }
  return _elementsMap;
}

function getElementsIdMap(): Map<string, Element> {
  if (!_elementsIdMap) {
    const elements = all('elements', ElementSchema);
    _elementsIdMap = new Map(
      elements.map((element) => [element.id, new Element(element)])
    );
  }
  return _elementsIdMap;
}

// https://github.com/Elin-Modding-Resources/Elin-Decompiled/blob/72332a1390e68a8de62bca4acbd6ebbaab92257b/Elin/Chara.cs#L2041-L2086
const oppositeElementTable: Record<string, string> = {
  eleFire: 'eleCold',
  eleLightning: 'eleDarkness',
  eleNether: 'eleHoly',
  eleEther: 'eleImpact',
  eleMagic: 'eleVoid',
};
for (const [key, value] of Object.entries(oppositeElementTable)) {
  oppositeElementTable[value] = key;
}

export function elementByAlias(alias: string): Element | undefined {
  return getElementsMap().get(alias);
}

export function elementById(id: string): Element | undefined {
  return getElementsIdMap().get(id);
}

export function resistanceElements(): Element[] {
  const resistanceAliases = [
    'resFire',
    'resCold',
    'resLightning',
    'resDarkness',
    'resMind',
    'resPoison',
    'resNether',
    'resSound',
    'resNerve',
    'resChaos',
    'resHoly',
    'resMagic',
    'resEther',
    'resAcid',
    'resCut',
    'resImpact',
  ];

  return resistanceAliases.map((alias) => {
    const element = elementByAlias(alias);
    if (!element) throw new Error(`Element not found: ${alias}`);
    return element;
  });
}

/**
 * Get primary attribute elements (type=AttbMain and tag contains 'primary')
 */
export function primaryAttributes(): Element[] {
  return all('elements', ElementSchema)
    .filter(
      (row) =>
        row.type === 'AttbMain' && row.tag?.split(',').includes('primary')
    )
    .map((row) => new Element(row));
}

export function attackElements(): Element[] {
  return all('elements', ElementSchema)
    .filter((row) => row.alias.startsWith('ele'))
    .filter((row) => row.chance > 0)
    .map((row) => new Element(row));
}

export class Element {
  constructor(public row: ElementRow) {}

  get id() {
    return this.row.id;
  }

  get alias() {
    return this.row.alias;
  }

  get defaultSortKey() {
    return this.row.__meta.defaultSortKey;
  }

  get elementPower() {
    return this.row.eleP ?? 100;
  }

  /**
   * Get the parent element by aliasParent
   */
  parent(): Element | undefined {
    if (!this.row.aliasParent) return undefined;
    return elementByAlias(this.row.aliasParent);
  }

  name(locale: string) {
    return locale === 'ja' ? this.row.name_JP : this.row.name;
  }

  altName(n: number, locale: string) {
    const names = (
      locale === 'ja' ? this.row.altname_JP : this.row.altname
    )?.split(',');
    if (!names) throw new Error('No alt names found');

    if (n < 0) {
      return locale === 'ja' ? this.row.name_JP : this.row.name;
    }
    return names[n - 2];
  }

  abilityName(element: Element | null, locale: string) {
    if (element) {
      const elmName = element.altName(2, locale);
      return locale === 'ja'
        ? `${elmName}の${this.row.name_JP}`
        : `${elmName} ${this.row.name}`;
    } else {
      return locale === 'ja' ? this.row.name_JP : this.row.name;
    }
  }

  detail(locale: string) {
    return locale === 'ja' ? this.row.detail_JP : this.row.detail;
  }

  textPhase(locale: string) {
    return locale === 'ja' ? this.row.textPhase_JP : this.row.textPhase;
  }

  textExtra(locale: string) {
    return locale === 'ja' ? this.row.textExtra_JP : this.row.textExtra;
  }

  isFeat() {
    return this.row.type === 'Feat' && this.row.categorySub !== 'god';
  }

  getColor() {
    const elementColors: Record<string, string> = {
      eleFire: '#ff4500',
      eleCold: '#0000ff',
      eleLightning: '#ffff00',
      eleDarkness: '#000000',
      eleMind: '#ff69b4',
      elePoison: '#00ff00',
      eleNether: '#191970',
      eleSound: '#f0e68c',
      eleNerve: '#808000',
      eleHoly: '#bbbbff',
      eleChaos: '#ff00ff',
      eleMagic: '#0000cd',
      eleEther: '#00bfff',
      eleAcid: '#2e8b57',
      eleCut: '#ff0000',
      eleImpact: '#666666',
      eleVoid: '#666666',

      resFire: '#ff4500',
      resCold: '#0000ff',
      resLightning: '#ffff00',
      resDarkness: '#000000',
      resMind: '#ff69b4',
      resPoison: '#00ff00',
      resNether: '#191970',
      resSound: '#f0e68c',
      resNerve: '#808000',
      resHoly: '#bbbbff',
      resChaos: '#ff00ff',
      resMagic: '#0000cd',
      resEther: '#00bfff',
      resAcid: '#2e8b57',
      resCut: '#ff0000',
      resImpact: '#666666',
    };

    return elementColors[this.row.alias] || '#666666';
  }

  tags() {
    return this.row.tag?.split(',') ?? [];
  }

  subElements() {
    const modifiers =
      featModifierJson[this.row.id as keyof typeof featModifierJson];
    const result = [];

    if (modifiers) {
      result.push(
        ...Object.entries(modifiers).map(([childId, coefficient]) => {
          const childElement = elementById(childId);
          if (!childElement) {
            throw new Error(`Child element not found: ${childId}`);
          }

          return {
            element: childElement,
            coefficient,
          };
        })
      );
    }

    // If this element's alias starts with 'ele', add aliasRef element and its opposite
    if (this.row.alias.startsWith('ele')) {
      if (this.row.aliasRef) {
        const refElement = elementByAlias(this.row.aliasRef);
        if (refElement) {
          result.push({
            element: refElement,
            coefficient: 20,
          });
        }
      }

      // Add opposite element
      const oppositeAlias = oppositeElementTable[this.row.alias];
      if (oppositeAlias) {
        const oppositeElement = elementByAlias(oppositeAlias);
        if (oppositeElement && oppositeElement.row.aliasRef) {
          const oppositeRefElement = elementByAlias(
            oppositeElement.row.aliasRef
          );
          if (oppositeRefElement) {
            result.push({
              element: oppositeRefElement,
              coefficient: -10,
            });
          }
        }
      }
    }

    return result;
  }
}
