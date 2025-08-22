import { Element, elementByAlias } from './models/element';

export class Elementable {
  constructor(
    private row: { elements?: string },
    private mainElement?: Element | null
  ) {}

  elements() {
    const eles = this.row.elements;
    const mainElements = [];

    if (eles) {
      const elementsFromRow = eles.split(',').map((t) => {
        const [alias, power] = t.split('/');
        const powerInt = power ? parseInt(power, 10) : 1;
        const element = elementByAlias(alias);
        if (!element) {
          throw new Error(`Element not found: ${alias}`);
        }
        return { element, power: powerInt };
      });
      mainElements.push(...elementsFromRow);
    }

    if (this.mainElement) {
      mainElements.push({ element: this.mainElement, power: 1 });
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

  feats() {
    return this.elements().filter((elementWithPower) =>
      elementWithPower.element.alias.startsWith('feat')
    );
  }

  negations() {
    return this.elements().filter((elementWithPower) =>
      elementWithPower.element.alias.startsWith('negate')
    );
  }

  others() {
    return this.elements().filter(
      (elementWithPower) =>
        !elementWithPower.element.alias.startsWith('feat') &&
        !elementWithPower.element.alias.startsWith('negate') &&
        !elementWithPower.element.alias.startsWith('res')
    );
  }
}
