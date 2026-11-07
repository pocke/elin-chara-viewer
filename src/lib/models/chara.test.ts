import { beforeAll, describe, expect, it } from 'vitest';
import { all, registerVersionData } from '../db';
import { Chara, CharaRow, CharaSchema } from './chara';

const VERSION = 'test-chara';

const COLUMNS = {
  charas: [
    'id',
    '_id',
    'name_JP',
    'name',
    'aka_JP',
    'aka',
    'sort',
    '_idRenderData',
    'tiles',
    'LV',
    'quality',
    'race',
    'job',
    'tactics',
    'elements',
    'aiParam',
    'tag',
    'trait',
  ],
  elements: [
    'id',
    'alias',
    'name_JP',
    'name',
    'parentFactor',
    'lvFactor',
    'encFactor',
    'mtp',
    'LV',
    'chance',
    'value',
    'sort',
    'type',
    'eleP',
    'cooldown',
    'charge',
    'radius',
    'max',
    'partySkill',
  ],
  races: [
    'id',
    'name_JP',
    'name',
    'playable',
    'life',
    'mana',
    'vigor',
    'DV',
    'PV',
    'PDR',
    'EDR',
    'EP',
    'STR',
    'END',
    'DEX',
    'PER',
    'LER',
    'WIL',
    'MAG',
    'CHA',
    'SPD',
    'INT',
    'martial',
    'pen',
    'figure',
    'geneCap',
    'material',
    'corpse',
    'blood',
    'sex',
    'age',
    'height',
    'breeder',
    'food',
    'detail_JP',
    'detail',
  ],
  jobs: [
    'id',
    'name_JP',
    'name',
    'playable',
    'STR',
    'END',
    'DEX',
    'PER',
    'LER',
    'WIL',
    'MAG',
    'CHA',
    'SPD',
    'detail_JP',
    'detail',
  ],
  tactics: [
    'id',
    'name_JP',
    'name',
    'dist',
    'move',
    'movePC',
    'party',
    'taunt',
    'melee',
    'range',
    'spell',
    'heal',
    'summon',
    'buff',
    'debuff',
  ],
} as const;

type Table = keyof typeof COLUMNS;

// A column left out of a row is written as an empty cell, which the schemas
// read as 0 for numbers and '' for strings.
const csv = <T extends Table>(
  table: T,
  rows: Partial<Record<(typeof COLUMNS)[T][number], string>>[]
): string => {
  const quote = (cell: string) => `"${cell.replaceAll('"', '""')}"`;
  const columns: readonly (typeof COLUMNS)[T][number][] = COLUMNS[table];
  const lines = [
    columns,
    ...rows.map((row) => columns.map((column) => row[column] ?? '')),
  ];
  return lines.map((cells) => cells.map(quote).join(',')).join('\n');
};

const charaRow = (id: string): CharaRow => {
  const row = all(VERSION, 'charas', CharaSchema).find((r) => r.id === id);
  if (!row) throw new Error(`Test chara not found: ${id}`);
  return row;
};

const newChara = (id: string, overrides: Partial<CharaRow> = {}) =>
  new Chara(VERSION, { ...charaRow(id), ...overrides });

beforeAll(() => {
  registerVersionData(
    VERSION,
    {
      elements: csv('elements', [
        { id: '10', alias: 'STR', name_JP: '筋力', name: 'Strength' },
        { id: '11', alias: 'MAG', name_JP: '魔力', name: 'Magic' },
        { id: '12', alias: 'life', name_JP: '生命力', name: 'Life' },
        {
          id: '100',
          alias: 'featBrain',
          name_JP: '頭脳',
          name: 'Brain',
          type: 'Feat',
        },
        {
          id: '1001',
          alias: 'featGeneSlot',
          name_JP: '遺伝子スロット',
          name: 'Gene Slot',
          type: 'Feat',
        },
        {
          id: '1002',
          alias: 'featRoran',
          name_JP: 'ローラン',
          name: 'Roran',
          type: 'Feat',
        },
      ]),
      races: csv('races', [
        {
          id: 'norland',
          name_JP: 'ノーランド',
          name: 'Norland',
          life: '20',
          STR: '5',
          geneCap: '3',
          figure: '手|頭',
        },
        {
          id: 'cat',
          name_JP: '猫',
          name: 'Cat',
          life: '8',
          figure: '手|手|頭|体',
        },
      ]),
      jobs: csv('jobs', [
        { id: 'none', name_JP: 'なし', name: 'None' },
        { id: 'warrior', name_JP: '戦士', name: 'Warrior', STR: '2', MAG: '1' },
      ]),
      tactics: csv('tactics', [
        {
          id: 'predator',
          name_JP: '捕食者',
          name: 'Predator',
          dist: '1',
          move: '30',
        },
        {
          id: 'warrior',
          name_JP: '戦士',
          name: 'Warrior',
          dist: '3',
          move: '10',
        },
        {
          id: 'sniper',
          name_JP: '狙撃手',
          name: 'Sniper',
          dist: '8',
          move: '5',
        },
        {
          id: 'sage',
          name_JP: '賢者',
          name: 'Sage',
          dist: '5',
          move: '20',
        },
      ]),
      charas: csv('charas', [
        {
          id: 'hero',
          name_JP: '勇者',
          name: 'Hero',
          aka_JP: '伝説の',
          aka: 'Legendary',
          LV: '12',
          quality: '4',
          race: 'norland',
          job: 'warrior',
          elements: 'featBrain/3',
        },
        {
          id: 'tom',
          name_JP: 'トム',
          name: 'Tom',
          LV: '5',
          race: 'cat',
          job: '*r',
        },
        {
          id: 'archer',
          name_JP: '射手',
          name: 'Archer',
          LV: '7',
          race: 'norland',
          job: 'warrior',
          tactics: 'sniper',
          aiParam: '6,2',
        },
        {
          id: 'breeder',
          name_JP: '育種家',
          name: 'Breeder',
          LV: '3',
          race: 'norland',
          job: 'warrior',
          elements: 'featGeneSlot/2',
        },
        {
          id: 'roran',
          name_JP: 'ローラン',
          name: 'Roran',
          LV: '3',
          race: 'norland',
          job: 'warrior',
          elements: 'featRoran/1',
        },
        {
          id: 'sage',
          name_JP: '賢者',
          name: 'Sage',
          LV: '9',
          race: 'norland',
          job: 'warrior',
        },
        {
          id: 'blank',
          name_JP: '*r',
          name: '*r',
          LV: '1',
          quality: '4',
          race: 'cat',
        },
      ]),
    },
    { '100': { '11': 2 } }
  );
});

describe('Chara', () => {
  describe('normalizedName', () => {
    it('brackets the name of a unique chara and prefixes its aka', () => {
      const hero = newChara('hero');

      expect(hero.normalizedName('ja')).toBe('伝説の 『勇者』');
      expect(hero.normalizedName('en')).toBe('Legendary 『Hero』');
    });

    it('returns the plain name for a chara of ordinary quality', () => {
      const tom = newChara('tom');

      expect(tom.normalizedName('ja')).toBe('トム');
      expect(tom.normalizedName('en')).toBe('Tom');
    });

    it('returns *r when the name is the random placeholder', () => {
      const blank = newChara('blank');

      expect(blank.normalizedName('ja')).toBe('*r');
      expect(blank.normalizedName('en')).toBe('*r');
    });

    it('throws for an unsupported locale', () => {
      expect(() => newChara('tom').normalizedName('fr')).toThrow(
        'Unsupported locale: fr'
      );
    });
  });

  describe('race and job', () => {
    it('resolves the race named by the race column', () => {
      const tom = newChara('tom');

      expect(tom.race.id).toBe('cat');
      expect(tom.race.name('ja')).toBe('猫');
      expect(tom.totalBodyParts()).toBe(4);
    });

    it('throws when the race does not exist', () => {
      expect(() => newChara('tom', { race: 'missing' })).toThrow(
        'Race "missing" not found for chara "tom"'
      );
    });

    it('resolves the job named by the job column', () => {
      expect(newChara('hero').job().name('en')).toBe('Warrior');
    });

    it('treats the random job placeholder *r as the none job', () => {
      expect(newChara('tom').job().id).toBe('none');
    });

    it('throws when the job does not exist', () => {
      expect(() => newChara('tom', { job: 'missing' }).job()).toThrow(
        'Job not found: missing'
      );
    });
  });

  describe('computed values', () => {
    it('reads a stat from the race', () => {
      expect(newChara('hero').life()).toBe(20);
      expect(newChara('tom').life()).toBe(8);
    });

    it('adds the powers from the race and the job', () => {
      expect(newChara('hero').getElementPower('STR')).toBe(7);
    });

    it('adds the power a feat passes down through the feat modifier', () => {
      // featBrain/3 passes 3 * 2 to MAG, and the warrior job adds 1.
      expect(newChara('hero').mag()).toBe(7);
    });

    it('returns 0 for an element the chara does not have', () => {
      expect(newChara('tom').mag()).toBe(0);
    });

    it('returns the gene slot of the race as both the actual and original value', () => {
      expect(newChara('hero').geneSlot()).toEqual([3, 3]);
    });

    it('adds the featGeneSlot power to the actual gene slot only', () => {
      expect(newChara('breeder').geneSlot()).toEqual([5, 3]);
    });

    it('subtracts twice the featRoran power from the actual gene slot only', () => {
      expect(newChara('roran').geneSlot()).toEqual([1, 3]);
    });

    it('returns the level column as is for a non-variant chara', () => {
      expect(newChara('hero').level()).toBe(12);
    });
  });

  describe('tactics', () => {
    it('uses the tactics named by the tactics column', () => {
      expect(newChara('archer').tactics().id).toBe('sniper');
    });

    it('falls back to the tactics named after the chara', () => {
      expect(newChara('sage').tactics().id).toBe('sage');
    });

    it('falls back to the tactics named after the job', () => {
      expect(newChara('hero').tactics().id).toBe('warrior');
    });

    it('falls back to predator when neither chara nor job has tactics', () => {
      expect(newChara('tom').tactics().id).toBe('predator');
    });

    it('prefers aiParam over the tactics row for distance and move frequency', () => {
      const archer = newChara('archer');

      expect(archer.tacticsDistance()).toBe(6);
      expect(archer.tacticsMoveFrequency()).toBe(2);
      expect(newChara('hero').tacticsDistance()).toBe(3);
      expect(newChara('hero').tacticsMoveFrequency()).toBe(10);
    });
  });
});
