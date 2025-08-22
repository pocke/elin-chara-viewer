import { elementByAlias } from './models/element';

export class Elementable {
  constructor(private row: { elements?: string }) {}

  elements() {
    const eles = this.row.elements;
    if (!eles) return [];

    const mainElements = eles.split(',').map((t) => {
      const [alias, power] = t.split('/');
      const powerInt = power ? parseInt(power, 10) : 1;
      const element = elementByAlias(alias);
      if (!element) {
        throw new Error(`Element not found: ${alias}`);
      }
      return { element, power: powerInt };
    });

    const allElements = [...mainElements];

    for (const elementWithPower of mainElements) {
      const subElements = elementWithPower.element.subElements(
        elementWithPower.power
      );
      allElements.push(...subElements);
    }

    return allElements;
  }

  feats() {
    return this.elements().filter((elementWithPower) =>
      elementWithPower.element.alias.startsWith('feat')
    );
  }
}
