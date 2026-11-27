import { beforeAll, describe, expect, it } from 'vitest';
import { registerVersionData } from '../db';
import { toCsv } from '../testing/csv';
import { attackElementsWithResistance, resistanceElements } from './element';

const VERSION = 'test-element';
const VERSION_WITHOUT_CAT = 'test-element-without-cat';
const VERSION_WITHOUT_FIRE = 'test-element-without-fire';

const COLUMNS = [
  'id',
  'alias',
  'name_JP',
  'name',
  'aliasParent',
  'aliasRef',
  'parentFactor',
  'lvFactor',
  'encFactor',
  'mtp',
  'LV',
  'chance',
  'value',
  'sort',
  'eleP',
  'cooldown',
  'charge',
  'radius',
  'max',
  'partySkill',
] as const;

type ElementCsvRow = Partial<Record<(typeof COLUMNS)[number], string>>;

const csv = (rows: ElementCsvRow[]): string => toCsv(COLUMNS, rows);

const RESISTANCE_NAMES = [
  'Fire',
  'Cold',
  'Lightning',
  'Darkness',
  'Mind',
  'Poison',
  'Nether',
  'Sound',
  'Nerve',
  'Chaos',
  'Holy',
  'Magic',
  'Ether',
  'Acid',
  'Cut',
  'Impact',
];

const elementPair = (
  name: string,
  eleId: number,
  resId: number,
  chance: string
): ElementCsvRow[] => [
  {
    id: String(eleId),
    alias: `ele${name}`,
    name_JP: name,
    name,
    aliasRef: `res${name}`,
    chance,
  },
  {
    id: String(resId),
    alias: `res${name}`,
    name_JP: name,
    name,
    aliasParent: `ele${name}`,
  },
];

const elementRows = (names: string[], withCat: boolean): ElementCsvRow[] => [
  ...names.flatMap((name, i) => elementPair(name, 910 + i, 950 + i, '100')),
  {
    id: '926',
    alias: 'eleVoid',
    name_JP: '無',
    name: 'Void',
    aliasRef: 'resDamage',
    chance: '0',
  },
  {
    id: '971',
    alias: 'resDamage',
    name_JP: 'ダメージ耐性',
    name: 'Damage',
    aliasParent: 'eleVoid',
  },
  ...(withCat ? elementPair('Cat', 927, 973, '0') : []),
];

beforeAll(() => {
  registerVersionData(
    VERSION,
    { elements: csv(elementRows(RESISTANCE_NAMES, true)) },
    {}
  );
  registerVersionData(
    VERSION_WITHOUT_CAT,
    { elements: csv(elementRows(RESISTANCE_NAMES, false)) },
    {}
  );
  registerVersionData(
    VERSION_WITHOUT_FIRE,
    {
      elements: csv(
        elementRows(
          RESISTANCE_NAMES.filter((name) => name !== 'Fire'),
          true
        )
      ),
    },
    {}
  );
});

describe('resistanceElements', () => {
  it('includes the cat resistance', () => {
    const aliases = resistanceElements(VERSION).map((e) => e.alias);

    expect(aliases).toContain('resCat');
  });

  it('omits the cat resistance from a version that predates it', () => {
    const aliases = resistanceElements(VERSION_WITHOUT_CAT).map((e) => e.alias);

    expect(aliases).toHaveLength(RESISTANCE_NAMES.length);
    expect(aliases).not.toContain('resCat');
  });

  it('throws when a resistance other than the cat one is missing', () => {
    expect(() => resistanceElements(VERSION_WITHOUT_FIRE)).toThrow(
      'Element not found: resFire'
    );
  });
});

describe('attackElementsWithResistance', () => {
  it('returns the attack element of each resistance, including cat with chance 0', () => {
    const aliases = attackElementsWithResistance(VERSION).map((e) => e.alias);
    const expected = resistanceElements(VERSION).map((e) =>
      e.alias.replace(/^res/, 'ele')
    );

    expect(aliases).toEqual(expected);
    expect(aliases).toContain('eleCat');
  });

  it('excludes the void element, which has no resistance of its own', () => {
    const aliases = attackElementsWithResistance(VERSION).map((e) => e.alias);

    expect(aliases).not.toContain('eleVoid');
  });

  it('omits the cat element from a version that predates it', () => {
    const aliases = attackElementsWithResistance(VERSION_WITHOUT_CAT).map(
      (e) => e.alias
    );

    expect(aliases).toHaveLength(RESISTANCE_NAMES.length);
    expect(aliases).not.toContain('eleCat');
  });
});
