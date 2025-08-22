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

export class Element {
  constructor(private row: ElementRow) {}

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

  subElements() {
    const modifiers =
      featModifierJson[this.row.id as keyof typeof featModifierJson];
    if (!modifiers) {
      return [];
    }

    return Object.entries(modifiers).map(([childId, coefficient]) => {
      const childElement = elementById(childId);
      if (!childElement) {
        throw new Error(`Child element not found: ${childId}`);
      }

      return {
        element: childElement,
        coefficient,
      };
    });
  }
}
