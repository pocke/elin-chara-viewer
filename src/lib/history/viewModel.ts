import { Chara } from '../models/chara';
import { AbilityValue, HistoryField, RawTable } from './types';

export interface EntityView {
  id: string;
  nameJa: string;
  nameEn: string;
}

export interface TacticsView extends EntityView {
  distance: number;
  moveFrequency: number;
  party: number;
  taunt: number;
  melee: number;
  range: number;
  spell: number;
  heal: number;
  summon: number;
  buff: number;
  debuff: number;
  partyBuff: boolean;
}

export interface CharaViewModel {
  name: { ja: string; en: string };
  mainElement: string | null;
  race: EntityView;
  job: EntityView;
  tactics: TacticsView;
  level: number;
  geneSlot: { actual: number; orig: number };
  bodyParts: Record<string, number>;
  // alias -> the powers that were merged into it, sorted so that reordering the
  // sources a character draws an element from is not a change.
  elements: Record<string, number[]>;
  abilities: AbilityValue[];
}

export const buildViewModel = (chara: Chara): CharaViewModel => {
  const [actualGeneSlot, origGeneSlot] = chara.geneSlot();
  const race = chara.race;
  const job = chara.job();
  const tactics = chara.tactics();

  const elements: Record<string, number[]> = {};
  for (const elementWithPower of chara.elements()) {
    elements[elementWithPower.element.alias] = [
      ...elementWithPower.powers,
    ].sort((a, b) => a - b);
  }

  return {
    name: {
      ja: chara.normalizedName('ja'),
      en: chara.normalizedName('en'),
    },
    mainElement: chara.mainElement?.alias ?? null,
    race: { id: race.id, nameJa: race.name('ja'), nameEn: race.name('en') },
    job: { id: job.id, nameJa: job.name('ja'), nameEn: job.name('en') },
    tactics: {
      id: tactics.id,
      nameJa: tactics.name('ja'),
      nameEn: tactics.name('en'),
      distance: chara.tacticsDistance(),
      moveFrequency: chara.tacticsMoveFrequency(),
      party: tactics.party,
      taunt: tactics.taunt,
      melee: tactics.melee,
      range: tactics.range,
      spell: tactics.spell,
      heal: tactics.heal,
      summon: tactics.summon,
      buff: tactics.buff,
      debuff: tactics.debuff,
      partyBuff: tactics.usesPartyBuff(),
    },
    level: chara.level(),
    geneSlot: { actual: actualGeneSlot, orig: origGeneSlot },
    bodyParts: { ...chara.bodyParts() },
    elements,
    abilities: chara.abilities().map((ability) => ({
      name: ability.name,
      chance: ability.chance,
      party: ability.party,
      element: ability.element,
    })),
  };
};

/** The names the history falls back to when a version no longer has an alias. */
export const collectElementNames = (
  chara: Chara
): Record<string, { ja: string; en: string }> => {
  const names: Record<string, { ja: string; en: string }> = {};

  for (const elementWithPower of chara.elements()) {
    const element = elementWithPower.element;
    names[element.alias] = { ja: element.name('ja'), en: element.name('en') };
  }

  if (chara.mainElement) {
    names[chara.mainElement.alias] = {
      ja: chara.mainElement.name('ja'),
      en: chara.mainElement.name('en'),
    };
  }

  return names;
};

/**
 * Which display groups each raw column feeds. A column that is absent here
 * belongs to no group, so its changes are only ever shown under the raw data
 * toggle. script/check-history-provenance.ts holds this to the models by
 * mutating one column at a time and watching what moves.
 */
export const PROVENANCE: Record<
  RawTable,
  Record<string, readonly HistoryField[]>
> = {
  charas: {
    // Tactics falls back to the row whose id matches the character's own.
    id: ['tactics'],
    name_JP: ['name'],
    name: ['name'],
    aka_JP: ['name'],
    aka: ['name'],
    quality: ['name'],
    trait: ['name'],
    LV: ['level'],
    race: ['race', 'elements', 'bodyParts', 'geneSlot'],
    job: ['job', 'elements', 'geneSlot', 'tactics'],
    tactics: ['tactics'],
    aiParam: ['tactics'],
    mainElement: ['mainElement', 'name', 'level', 'elements', 'abilities'],
    elements: ['elements', 'geneSlot'],
    actCombat: ['abilities'],
  },
  races: {
    id: ['race'],
    name_JP: ['race'],
    name: ['race'],
    elements: ['elements', 'geneSlot'],
    STR: ['elements'],
    END: ['elements'],
    DEX: ['elements'],
    PER: ['elements'],
    LER: ['elements'],
    WIL: ['elements'],
    MAG: ['elements'],
    CHA: ['elements'],
    SPD: ['elements'],
    life: ['elements'],
    mana: ['elements'],
    vigor: ['elements'],
    DV: ['elements'],
    PV: ['elements'],
    PDR: ['elements'],
    EDR: ['elements'],
    EP: ['elements'],
    martial: ['elements'],
    figure: ['bodyParts'],
    geneCap: ['geneSlot'],
  },
  jobs: {
    id: ['job'],
    name_JP: ['job'],
    name: ['job'],
    elements: ['elements', 'geneSlot'],
    STR: ['elements'],
    END: ['elements'],
    DEX: ['elements'],
    PER: ['elements'],
    LER: ['elements'],
    WIL: ['elements'],
    MAG: ['elements'],
    CHA: ['elements'],
    SPD: ['elements'],
  },
  tactics: {
    id: ['tactics'],
    name_JP: ['tactics'],
    name: ['tactics'],
    dist: ['tactics'],
    move: ['tactics'],
    party: ['tactics'],
    taunt: ['tactics'],
    melee: ['tactics'],
    range: ['tactics'],
    spell: ['tactics'],
    heal: ['tactics'],
    summon: ['tactics'],
    buff: ['tactics'],
    debuff: ['tactics'],
    tag: ['tactics'],
  },
};
