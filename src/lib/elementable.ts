import { elementsMap } from './models/element';

export class Elementable {
  constructor(private row: { elements?: string }) {}

  elements() {
    const eles = this.row.elements;
    if (!eles) return [];

    const mainElements = eles.split(',').map((t) => {
      const [alias, power] = t.split('/');
      const powerInt = power ? parseInt(power, 10) : 1;
      return { alias, power: powerInt };
    });

    const allElements = [...mainElements];

    for (const element of mainElements) {
      const elementInstance = elementsMap().get(element.alias);
      if (elementInstance) {
        const subElements = elementInstance.subElements(element.power);
        allElements.push(
          ...subElements.map((sub) => ({
            alias: sub.element.alias,
            power: sub.power,
          }))
        );
      }
    }

    return allElements;
  }

  feats() {
    return this.elements().filter((element) =>
      element.alias.startsWith('feat')
    );
  }
}
