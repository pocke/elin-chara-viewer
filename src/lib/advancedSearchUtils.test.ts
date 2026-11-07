import { describe, expect, it } from 'vitest';
import {
  deserializeAdvancedSearch,
  serializeAdvancedSearch,
} from './advancedSearchUtils';
import { isConditionGroup } from './advancedSearchTypes';
import type {
  AdvancedSearchState,
  SearchConditionOrGroup,
} from './advancedSearchTypes';

const stripIds = (node: SearchConditionOrGroup): unknown => {
  if (isConditionGroup(node)) {
    return {
      type: node.type,
      logic: node.logic,
      conditions: node.conditions.map(stripIds),
    };
  }
  return { field: node.field, operator: node.operator, value: node.value };
};

const roundtrip = (state: AdvancedSearchState) => {
  const decoded = deserializeAdvancedSearch(serializeAdvancedSearch(state));
  expect(decoded).not.toBeNull();
  return {
    logic: decoded!.logic,
    conditions: decoded!.conditions.map(stripIds),
  };
};

describe('serializeAdvancedSearch / deserializeAdvancedSearch', () => {
  it('roundtrips a single condition', () => {
    const state: AdvancedSearchState = {
      enabled: true,
      logic: 'AND',
      conditions: [{ id: 'a', field: 'life', operator: '>=', value: 100 }],
    };

    expect(roundtrip(state)).toEqual({
      logic: 'AND',
      conditions: [{ field: 'life', operator: '>=', value: 100 }],
    });
  });

  it('roundtrips nested groups with AND and OR', () => {
    const state: AdvancedSearchState = {
      enabled: true,
      logic: 'OR',
      conditions: [
        { id: 'a', field: 'name', operator: 'contains', value: 'putit' },
        {
          id: 'g1',
          type: 'group',
          logic: 'AND',
          conditions: [
            { id: 'b', field: 'speed', operator: '>', value: 50 },
            {
              id: 'g2',
              type: 'group',
              logic: 'OR',
              conditions: [
                { id: 'c', field: 'race', operator: 'equals', value: 'cat' },
                { id: 'd', field: 'job', operator: 'not_empty', value: '' },
              ],
            },
          ],
        },
      ],
    };

    expect(roundtrip(state)).toEqual({
      logic: 'OR',
      conditions: [
        { field: 'name', operator: 'contains', value: 'putit' },
        {
          type: 'group',
          logic: 'AND',
          conditions: [
            { field: 'speed', operator: '>', value: 50 },
            {
              type: 'group',
              logic: 'OR',
              conditions: [
                { field: 'race', operator: 'equals', value: 'cat' },
                { field: 'job', operator: 'not_empty', value: '' },
              ],
            },
          ],
        },
      ],
    });
  });

  it('roundtrips multibyte text', () => {
    const state: AdvancedSearchState = {
      enabled: true,
      logic: 'AND',
      conditions: [
        { id: 'a', field: 'name', operator: 'contains', value: '猫' },
      ],
    };

    expect(roundtrip(state).conditions).toEqual([
      { field: 'name', operator: 'contains', value: '猫' },
    ]);
  });

  it('roundtrips a range value', () => {
    const state: AdvancedSearchState = {
      enabled: true,
      logic: 'AND',
      conditions: [
        { id: 'a', field: 'life', operator: 'between', value: [10, 200] },
      ],
    };

    expect(roundtrip(state).conditions).toEqual([
      { field: 'life', operator: 'between', value: [10, 200] },
    ]);
  });

  it('assigns a distinct id to every deserialized condition and group', () => {
    const decoded = deserializeAdvancedSearch(
      serializeAdvancedSearch({
        enabled: true,
        logic: 'AND',
        conditions: [
          { id: 'a', field: 'life', operator: '>=', value: 1 },
          {
            id: 'g',
            type: 'group',
            logic: 'OR',
            conditions: [{ id: 'b', field: 'mana', operator: '>=', value: 1 }],
          },
        ],
      })
    );

    const [condition, group] = decoded!.conditions;
    const nested = isConditionGroup(group) ? group.conditions[0] : null;
    const ids = [condition.id, group.id, nested?.id];
    expect(new Set(ids).size).toBe(3);
    expect(ids).not.toContain(undefined);
  });

  it('serializes empty conditions to an empty string', () => {
    expect(
      serializeAdvancedSearch({ enabled: true, logic: 'AND', conditions: [] })
    ).toBe('');
  });

  it('always deserializes with enabled true because enabled is not encoded', () => {
    const decoded = deserializeAdvancedSearch(
      serializeAdvancedSearch({
        enabled: false,
        logic: 'AND',
        conditions: [{ id: 'a', field: 'life', operator: '>=', value: 100 }],
      })
    );

    expect(decoded?.enabled).toBe(true);
  });

  describe('the URL format', () => {
    // `adv` is read from URLs people have shared, so the encoding must not change.
    const goldenJson =
      '{"l":"AND","c":[{"f":"life","o":">=","v":100},{"f":"speed","o":"between","v":[10,200]},{"t":"g","l":"OR","c":[{"f":"race","o":"equals","v":"cat"}]}]}';

    const goldenState: AdvancedSearchState = {
      enabled: true,
      logic: 'AND',
      conditions: [
        { id: 'a', field: 'life', operator: '>=', value: 100 },
        { id: 'b', field: 'speed', operator: 'between', value: [10, 200] },
        {
          id: 'g',
          type: 'group',
          logic: 'OR',
          conditions: [
            { id: 'c', field: 'race', operator: 'equals', value: 'cat' },
          ],
        },
      ],
    };

    it('serializes to the compact JSON, URI-encoded and base64-encoded', () => {
      expect(serializeAdvancedSearch(goldenState)).toBe(
        btoa(encodeURIComponent(goldenJson))
      );
    });

    it('deserializes a parameter in that format', () => {
      const decoded = deserializeAdvancedSearch(
        btoa(encodeURIComponent(goldenJson))
      );

      expect(decoded?.logic).toBe('AND');
      expect(decoded?.conditions.map(stripIds)).toEqual([
        { field: 'life', operator: '>=', value: 100 },
        { field: 'speed', operator: 'between', value: [10, 200] },
        {
          type: 'group',
          logic: 'OR',
          conditions: [{ field: 'race', operator: 'equals', value: 'cat' }],
        },
      ]);
    });
  });

  describe('deserializeAdvancedSearch returns null when the parameter cannot be decoded', () => {
    it.each([
      ['an empty string', ''],
      ['a string that is not base64', 'not-base64!!'],
      ['base64 of a malformed percent-encoding', btoa('%')],
      ['base64 of a non-JSON string', btoa('not json')],
      ['base64 of JSON that has no condition list', btoa('{}')],
    ])('%s', (_label, input) => {
      expect(deserializeAdvancedSearch(input)).toBeNull();
    });
  });
});
