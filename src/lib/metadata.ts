import type { Metadata } from 'next';
import { all, GameVersion } from './db';
import { CharaSchema, Chara } from './models/chara';
import { allFeats } from './models/feat';

const BASE_URL = 'https://elin.pocke.me';

// Cache for EA IDs (computed once at build time)
let eaCharaIdsCache: Set<string> | null = null;
let eaFeatAliasesCache: Set<string> | null = null;

function getEACharaIds(): Set<string> {
  if (!eaCharaIdsCache) {
    const charaRows = all('EA', 'charas', CharaSchema);
    // Include variant IDs as well
    const ids: string[] = [];
    charaRows
      .filter((row) => !Chara.isIgnoredCharaId(row.id))
      .forEach((row) => {
        const chara = new Chara('EA', row);
        const variants = chara.variants();
        if (variants.length > 0) {
          variants.forEach((v) => ids.push(v.id));
        } else {
          ids.push(row.id);
        }
      });
    eaCharaIdsCache = new Set(ids);
  }
  return eaCharaIdsCache;
}

function getEAFeatAliases(): Set<string> {
  if (!eaFeatAliasesCache) {
    const feats = allFeats('EA');
    eaFeatAliasesCache = new Set(feats.map((feat) => feat.alias));
  }
  return eaFeatAliasesCache;
}

/**
 * Get canonical version for a chara page.
 * If current version is Nightly and EA has the same chara, returns 'EA'.
 * Otherwise returns the current version.
 */
export function getCanonicalVersionForChara(
  currentVersion: GameVersion,
  charaId: string
): GameVersion {
  if (currentVersion === 'EA') return 'EA';
  return getEACharaIds().has(charaId) ? 'EA' : 'Nightly';
}

/**
 * Get canonical version for a feat page.
 * If current version is Nightly and EA has the same feat, returns 'EA'.
 * Otherwise returns the current version.
 */
export function getCanonicalVersionForFeat(
  currentVersion: GameVersion,
  featAlias: string
): GameVersion {
  if (currentVersion === 'EA') return 'EA';
  return getEAFeatAliases().has(featAlias) ? 'EA' : 'Nightly';
}

/**
 * Generate alternates metadata for hreflang tags
 * @param lang - Current language ('ja' or 'en')
 * @param pathname - Current pathname (e.g., '/ja/ea/charas')
 * @param canonicalPathname - Canonical pathname (use same as pathname if no cross-version canonical)
 */
export function generateAlternates(
  lang: string,
  pathname: string,
  canonicalPathname: string
): Metadata['alternates'] {
  const otherLang = lang === 'ja' ? 'en' : 'ja';
  const otherPathname = pathname.replace(`/${lang}`, `/${otherLang}`);
  const jaPathname = lang === 'ja' ? pathname : otherPathname;
  const enPathname = lang === 'en' ? pathname : otherPathname;

  return {
    canonical: `${BASE_URL}${canonicalPathname}`,
    languages: {
      ja: `${BASE_URL}${jaPathname}`,
      en: `${BASE_URL}${enPathname}`,
      'x-default': `${BASE_URL}${jaPathname}`,
    },
  };
}
