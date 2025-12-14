import { GameVersion } from './db';
import { Element, elementByAlias } from './models/element';

export type ElementWithPower = { element: Element; powers: number[] };

/**
 * Get total power from ElementWithPower.
 */
export function totalPower(ewp: ElementWithPower): number {
  return ewp.powers.reduce((sum, p) => sum + p, 0);
}

/**
 * Calculate base potential for a skill element.
 * Formula: 100 + (sum of powers excluding 1s) * 10
 * Powers of 1 indicate "existence only" and don't contribute to the bonus.
 */
export function calcBasePotential(elementWithPower: ElementWithPower): number {
  const power = elementWithPower.powers
    .filter((p) => p !== 1)
    .reduce((sum, p) => sum + p, 0);
  return 100 + power * 10;
}

/**
 * Merge multiple ElementWithPower arrays, combining powers for same Elements.
 */
export function mergeElements(
  ...arrays: ElementWithPower[][]
): ElementWithPower[] {
  const map = new Map<string, ElementWithPower>();

  for (const arr of arrays) {
    for (const ewp of arr) {
      const key = ewp.element.alias;
      const existing = map.get(key);
      if (existing) {
        existing.powers.push(...ewp.powers);
      } else {
        map.set(key, { element: ewp.element, powers: [...ewp.powers] });
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Parse elements column string and return array of ElementWithPower.
 * Also expands sub-elements from each element.
 */
export function parseElements(
  version: GameVersion,
  row: { elements?: string },
  mainElement?: Element | null
): ElementWithPower[] {
  const eles = row.elements;
  const elms: ElementWithPower[] = [];

  if (eles) {
    const elementsFromRow = eles.split(',').map((t) => {
      const [alias, power] = t.split('/');
      const powerInt = power ? parseInt(power, 10) : 1;
      const element = elementByAlias(version, alias);
      if (!element) {
        throw new Error(`Element not found: ${alias}`);
      }
      return { element, powers: [powerInt] };
    });
    elms.push(...elementsFromRow);
  }

  if (mainElement) {
    elms.push({ element: mainElement, powers: [1] });
  }

  const allElements = [...elms];

  for (const elementWithPower of elms) {
    const subElements = elementWithPower.element.subElements();
    const subElementsWithPower = subElements.map((sub) => ({
      element: sub.element,
      powers: [Math.floor(totalPower(elementWithPower) * sub.coefficient)],
    }));
    allElements.push(...subElementsWithPower);
  }

  return allElements;
}

/**
 * Filter elements to get only feats
 */
export function filterFeats(elements: ElementWithPower[]): ElementWithPower[] {
  return elements.filter((elementWithPower) =>
    elementWithPower.element.isFeat()
  );
}

/**
 * Filter elements to get only negations
 */
export function filterNegations(
  elements: ElementWithPower[]
): ElementWithPower[] {
  return elements.filter((elementWithPower) =>
    elementWithPower.element.alias.startsWith('negate')
  );
}

/**
 * Filter elements to get only skills (category === 'skill')
 */
export function filterSkills(elements: ElementWithPower[]): ElementWithPower[] {
  return elements.filter(
    (elementWithPower) => elementWithPower.element.row.category === 'skill'
  );
}

/**
 * Get sort key for a skill element.
 * Returns [parentSort, elementId] tuple for sorting.
 */
export function skillSortKey(element: Element): [number, number] {
  const parentSort = element.parent()?.row.sort ?? 0;
  const id = parseInt(element.id, 10);
  return [parentSort, id];
}

/**
 * Sort skills by parent's sort column, then by element's id.
 */
export function sortSkills(elements: ElementWithPower[]): ElementWithPower[] {
  return [...elements].sort((a, b) => {
    const [aParent, aId] = skillSortKey(a.element);
    const [bParent, bId] = skillSortKey(b.element);
    return aParent - bParent || aId - bId;
  });
}

/**
 * Filter elements to get general skills (category === 'skill' and categorySub is not craft/combat/weapon)
 */
export function filterGeneralSkills(
  elements: ElementWithPower[]
): ElementWithPower[] {
  return filterSkills(elements).filter(
    (elementWithPower) =>
      !['craft', 'combat', 'weapon'].includes(
        elementWithPower.element.row.categorySub ?? ''
      )
  );
}

/**
 * Filter elements to get craft skills (category === 'skill' and categorySub === 'craft')
 */
export function filterCraftSkills(
  elements: ElementWithPower[]
): ElementWithPower[] {
  return filterSkills(elements).filter(
    (elementWithPower) => elementWithPower.element.row.categorySub === 'craft'
  );
}

/**
 * Filter elements to get combat skills (category === 'skill' and categorySub === 'combat')
 */
export function filterCombatSkills(
  elements: ElementWithPower[]
): ElementWithPower[] {
  return filterSkills(elements).filter(
    (elementWithPower) => elementWithPower.element.row.categorySub === 'combat'
  );
}

/**
 * Filter elements to get weapon skills (category === 'skill' and categorySub === 'weapon')
 */
export function filterWeaponSkills(
  elements: ElementWithPower[]
): ElementWithPower[] {
  return filterSkills(elements).filter(
    (elementWithPower) => elementWithPower.element.row.categorySub === 'weapon'
  );
}

/**
 * Filter elements to get "others" (not feat, negation, ele*, res*, skill)
 */
export function filterOthers(elements: ElementWithPower[]): ElementWithPower[] {
  return elements.filter(
    (elementWithPower) =>
      !elementWithPower.element.alias.startsWith('feat') &&
      !elementWithPower.element.alias.startsWith('negate') &&
      !elementWithPower.element.alias.startsWith('ele') &&
      !elementWithPower.element.alias.startsWith('res') &&
      elementWithPower.element.row.category !== 'skill'
  );
}
