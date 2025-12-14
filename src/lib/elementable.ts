import { GameVersion } from './db';
import { Element, elementByAlias } from './models/element';

export type ElementWithPower = { element: Element; power: number };

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
  const mainElements: ElementWithPower[] = [];

  if (eles) {
    const elementsFromRow = eles.split(',').map((t) => {
      const [alias, power] = t.split('/');
      const powerInt = power ? parseInt(power, 10) : 1;
      const element = elementByAlias(version, alias);
      if (!element) {
        throw new Error(`Element not found: ${alias}`);
      }
      return { element, power: powerInt };
    });
    mainElements.push(...elementsFromRow);
  }

  if (mainElement) {
    mainElements.push({ element: mainElement, power: 1 });
  }

  const allElements = [...mainElements];

  for (const elementWithPower of mainElements) {
    const subElements = elementWithPower.element.subElements();
    const subElementsWithPower = subElements.map((sub) => ({
      element: sub.element,
      power: Math.floor(elementWithPower.power * sub.coefficient),
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
 * Filter elements to get "others" (not feat, negation, ele*, res*)
 */
export function filterOthers(elements: ElementWithPower[]): ElementWithPower[] {
  return elements.filter(
    (elementWithPower) =>
      !elementWithPower.element.alias.startsWith('feat') &&
      !elementWithPower.element.alias.startsWith('negate') &&
      !elementWithPower.element.alias.startsWith('ele') &&
      !elementWithPower.element.alias.startsWith('res')
  );
}
