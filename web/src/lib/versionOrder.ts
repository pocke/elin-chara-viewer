// Ordering here is by build number, not by text. Intl.Collator and
// localeCompare answer a different question -- how a locale orders strings --
// and agree with build-number order only by coincidence of the names in use.
const TOKENS = /\d+|\D+/g;

const isDigitRun = (token: string): boolean => {
  const code = token.charCodeAt(0);
  return code >= 0x30 && code <= 0x39;
};

// Number saturates to Infinity past 308 digits and drops low digits past 2^53.
const compareDigitRuns = (a: string, b: string): number => {
  const aDigits = a.replace(/^0+/, '');
  const bDigits = b.replace(/^0+/, '');
  if (aDigits.length !== bDigits.length) {
    return aDigits.length - bDigits.length;
  }
  return aDigits < bDigits ? -1 : aDigits > bDigits ? 1 : 0;
};

/**
 * Orders archived version names such as 'EA 23.11', 'EA 23.12 fix 1' and
 * 'EA 23.329 Patch 2'. 'EA 23.9' precedes 'EA 23.11', and a name precedes the
 * names that extend it, so 'EA 23.12' precedes 'EA 23.12 fix 1'. Distinct
 * names never compare equal.
 */
export const compareVersionNames = (a: string, b: string): number => {
  const aTokens = a.match(TOKENS) ?? [];
  const bTokens = b.match(TOKENS) ?? [];

  for (let i = 0; i < Math.min(aTokens.length, bTokens.length); i++) {
    const aToken = aTokens[i];
    const bToken = bTokens[i];

    if (isDigitRun(aToken) && isDigitRun(bToken)) {
      const diff = compareDigitRuns(aToken, bToken);
      if (diff !== 0) return diff;
      continue;
    }

    const aText = aToken.toLowerCase();
    const bText = bToken.toLowerCase();
    if (aText !== bText) return aText < bText ? -1 : 1;
  }

  if (aTokens.length !== bTokens.length) {
    return aTokens.length - bTokens.length;
  }
  return a < b ? -1 : a > b ? 1 : 0;
};
