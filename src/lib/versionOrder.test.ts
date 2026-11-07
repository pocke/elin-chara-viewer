import { describe, expect, it } from 'vitest';
import { compareVersionNames } from './versionOrder';

const expectAntisymmetric = (a: string, b: string): void => {
  const sum =
    Math.sign(compareVersionNames(a, b)) +
    Math.sign(compareVersionNames(b, a)) +
    0;
  expect({ a, b, sum }).toEqual({ a, b, sum: 0 });
};

describe('compareVersionNames', () => {
  describe('orders the earlier name before the later one', () => {
    it.each([
      ['EA 23.9', 'EA 23.11'],
      ['EA 23.99', 'EA 23.100'],
      ['EA 23.12', 'EA 23.12 fix 1'],
      ['EA 23.12 fix 1', 'EA 23.12 fix 2'],
      ['EA 23.329', 'EA 23.329 Patch 2'],
      ['EA 23.329 Patch 2', 'EA 23.329 Patch 10'],
      ['EA 23.329 Patch 10', 'EA 23.330'],
      ['EA 22.99', 'EA 23.1'],
    ])('%s < %s', (earlier, later) => {
      expect(compareVersionNames(earlier, later)).toBeLessThan(0);
      expect(compareVersionNames(later, earlier)).toBeGreaterThan(0);
    });
  });

  it('compares text runs case-insensitively', () => {
    expect(
      compareVersionNames('EA 23.12 Zeta', 'EA 23.12 alpha')
    ).toBeGreaterThan(0);
    expect(
      compareVersionNames('EA 23.12 FIX 2', 'EA 23.12 fix 1')
    ).toBeGreaterThan(0);
  });

  describe('compares digit runs beyond Number precision exactly', () => {
    const nines = '9'.repeat(309);

    it.each([
      ['EA 9007199254740992 b', 'EA 9007199254740993 a'],
      [`EA ${nines}1 b`, `EA ${nines}2 a`],
    ])('%s < %s', (earlier, later) => {
      expect(compareVersionNames(earlier, later)).toBeLessThan(0);
      expect(compareVersionNames(later, earlier)).toBeGreaterThan(0);
    });
  });

  describe('never reports distinct names as equal', () => {
    it.each([
      ['EA 23.12 Fix 1', 'EA 23.12 fix 1'],
      ['EA 23.09', 'EA 23.9'],
      ['EA 23.009', 'EA 23.09'],
    ])('%s and %s', (a, b) => {
      expect(compareVersionNames(a, b)).not.toBe(0);
      expectAntisymmetric(a, b);
    });

    it('orders a name that differs only by case by its raw string', () => {
      expect(
        compareVersionNames('EA 23.12 Fix 1', 'EA 23.12 fix 1')
      ).toBeLessThan(0);
      expect(
        compareVersionNames('EA 23.12 fix 1', 'EA 23.12 Fix 1')
      ).toBeGreaterThan(0);
    });

    it('orders a leading-zero name before the same number without zeros', () => {
      expect(compareVersionNames('EA 23.09', 'EA 23.9')).toBeLessThan(0);
      expect(compareVersionNames('EA 23.9', 'EA 23.09')).toBeGreaterThan(0);
    });

    it('still orders a leading-zero name by its number first', () => {
      expect(compareVersionNames('EA 23.09', 'EA 23.10')).toBeLessThan(0);
      expect(compareVersionNames('EA 23.010', 'EA 23.11')).toBeLessThan(0);
      expect(compareVersionNames('EA 23.11', 'EA 23.010')).toBeGreaterThan(0);
    });
  });

  it('returns 0 for identical names', () => {
    expect(compareVersionNames('EA 23.12 fix 1', 'EA 23.12 fix 1')).toBe(0);
    expect(compareVersionNames('', '')).toBe(0);
  });

  describe('is antisymmetric for every pair of names', () => {
    const names = [
      'EA 23.9',
      'EA 23.09',
      'EA 23.11',
      'EA 23.12',
      'EA 23.12 fix 1',
      'EA 23.12 Fix 1',
      'EA 23.329 Patch 2',
      'EA 23.329 Patch 10',
      'Nightly',
    ];
    const pairs = names.flatMap((a, i) =>
      names.slice(i + 1).map((b): [string, string] => [a, b])
    );

    it.each(pairs)('%s and %s', expectAntisymmetric);
  });

  it('sorts a shuffled list into build order', () => {
    const shuffled = [
      'EA 23.329 Patch 2',
      'EA 23.11',
      'EA 23.100',
      'EA 23.12 fix 1',
      'EA 23.329',
      'EA 23.9',
      'EA 23.12',
    ];
    expect([...shuffled].sort(compareVersionNames)).toEqual([
      'EA 23.9',
      'EA 23.11',
      'EA 23.12',
      'EA 23.12 fix 1',
      'EA 23.100',
      'EA 23.329',
      'EA 23.329 Patch 2',
    ]);
  });
});
