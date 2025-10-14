// Resistance simulation utilities

export interface AttackElement {
  element: string; // Element alias (e.g., "eleFire")
  isSword: boolean;
  isFeatElder: boolean;
  isFeatZodiac: boolean;
}

/**
 * Calculate the effective resistance level after applying attack modifiers
 *
 * @param baseResistance - The base resistance value (numeric)
 * @param attackElement - The attack element configuration
 * @returns The effective resistance level (can be negative if weakness)
 */
export function calculateEffectiveResistance(
  baseResistance: number,
  attackElement: AttackElement
): number {
  // Convert resistance value to levels (5 = 1 level, cap at 20 = 4 levels)
  const cappedResistance = Math.min(baseResistance, 20);
  const resistanceLevel = Math.floor(cappedResistance / 5);

  // Apply penetration from modifiers
  let penetration = 0;
  if (attackElement.isSword) {
    penetration += 2;
  }
  if (attackElement.isFeatElder) {
    penetration += 1;
  }
  if (attackElement.isFeatZodiac) {
    penetration += 1;
  }

  // Apply penetration
  // If base resistance was negative, keep it negative
  // Otherwise, reduce by penetration but don't go below 0
  if (baseResistance < 0) {
    return resistanceLevel;
  } else {
    return Math.max(0, resistanceLevel - penetration);
  }
}

/**
 * Get the resistance element alias from an attack element alias
 * e.g., "eleFire" -> "resFire"
 *
 * @param attackElementAlias - The attack element alias (e.g., "eleFire")
 * @returns The resistance element alias (e.g., "resFire")
 */
export function getResistanceAlias(attackElementAlias: string): string {
  if (attackElementAlias.startsWith('ele')) {
    return 'res' + attackElementAlias.substring(3);
  }
  return attackElementAlias;
}
