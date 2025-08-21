export class Elementable {
  constructor(private row: { elements?: string }) {}

  elements() {
    const eles = this.row.elements;
    if (!eles) return [];

    return eles.split(',').map((t) => {
      const [alias, power] = t.split('/');
      const powerInt = power ? parseInt(power, 10) : 1;
      return { alias, power: powerInt };
    });
  }

  feats() {
    return this.elements().filter((element) =>
      element.alias.startsWith('feat')
    );
  }
}
