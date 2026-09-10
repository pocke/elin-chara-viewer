import type { Metadata } from 'next';
import { resources } from './i18n-resources';
import { CurrentVersion } from './db';
import { allFeats } from './models/feat';
import { charaPageIds } from './pageData';

export const BASE_URL = 'https://elin.pocke.me';

// Cache for EA IDs (computed once at build time)
let eaCharaIdsCache: Set<string> | null = null;
let eaFeatAliasesCache: Set<string> | null = null;

function getEACharaIds(): Set<string> {
  if (!eaCharaIdsCache) {
    eaCharaIdsCache = new Set(charaPageIds('EA'));
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
  currentVersion: CurrentVersion,
  charaId: string
): CurrentVersion {
  if (currentVersion === 'EA') return 'EA';
  return getEACharaIds().has(charaId) ? 'EA' : 'Nightly';
}

/**
 * Get canonical version for a feat page.
 * If current version is Nightly and EA has the same feat, returns 'EA'.
 * Otherwise returns the current version.
 */
export function getCanonicalVersionForFeat(
  currentVersion: CurrentVersion,
  featAlias: string
): CurrentVersion {
  if (currentVersion === 'EA') return 'EA';
  return getEAFeatAliases().has(featAlias) ? 'EA' : 'Nightly';
}

export function archivedPageMetadata(
  lang: string,
  pathname: string,
  version: string
): Metadata {
  const appTitle = resources[lang === 'ja' ? 'ja' : 'en'].common.title;

  return {
    title: `${version} - ${appTitle}`,
    robots: { index: false, follow: false },
    alternates: generateAlternates(lang, pathname),
  };
}

/**
 * Generate alternates metadata for hreflang tags
 * @param lang - Current language ('ja' or 'en')
 * @param canonicalPathname - Canonical pathname (use same as pathname if no cross-version canonical)
 */
export function generateAlternates(
  lang: string,
  canonicalPathname: string
): Metadata['alternates'] {
  const otherLang = lang === 'ja' ? 'en' : 'ja';
  const otherPathname = canonicalPathname.replace(`/${lang}`, `/${otherLang}`);
  const jaPathname = lang === 'ja' ? canonicalPathname : otherPathname;
  const enPathname = lang === 'en' ? canonicalPathname : otherPathname;

  return {
    canonical: `${BASE_URL}${canonicalPathname}`,
    languages: {
      ja: `${BASE_URL}${jaPathname}`,
      en: `${BASE_URL}${enPathname}`,
      'x-default': `${BASE_URL}${jaPathname}`,
    },
  };
}
