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
}

export function allFeats(): Feat[] {
  const elements = all('elements', ElementSchema);
  return elements
    .filter((row) => row.type === 'Feat')
    .map((row) => new Feat(row));
}
