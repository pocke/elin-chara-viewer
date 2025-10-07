import { Element, ElementRow, ElementSchema } from './element';
import { all } from '../db';

export type FeatRow = ElementRow;

export class Feat {
  private element: Element;
  private row: FeatRow;

  constructor(row: FeatRow) {
    this.row = row;
    this.element = new Element(row);
  }

  get id() {
    return this.element.id;
  }

  get alias() {
    return this.element.alias;
  }

  name(locale: string) {
    return this.element.name(locale);
  }

  textExtra(locale: string) {
    return this.element.textExtra(locale);
  }

  getGeneSlot(): number {
    return this.row.geneSlot;
  }

  getMax(): number {
    return this.row.max;
  }

  costs(): number[] {
    if (!this.row.cost) return [];
    return this.row.cost.split(',').map((c) => parseInt(c.trim(), 10));
  }

  // https://github.com/Elin-Modding-Resources/Elin-Decompiled/blob/862d04aa6ed431f8a78f8c33b8fa49d85e4e57bb/Elin/ElementContainer.cs#L628-L631
  canDropAsGene(): boolean {
    const costs = this.costs();
    return costs.length > 0 && costs[0] > 0 && this.row.geneSlot >= 0;
  }
}

export function allFeats(): Feat[] {
  const elements = all('elements', ElementSchema);
  return elements
    .filter((row) => row.type === 'Feat')
    .map((row) => new Feat(row));
}
