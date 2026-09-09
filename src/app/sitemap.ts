import type { MetadataRoute } from 'next';
import {
  BASE_URL,
  getCanonicalVersionForChara,
  getCanonicalVersionForFeat,
} from '@/lib/metadata';
import { charaPageIds, featIndexRows } from '@/lib/pageData';

type Lang = 'ja' | 'en';
const LANGS: Lang[] = ['ja', 'en'];

type PathForLang = (lang: Lang) => string;

function toEntries(pathForLang: PathForLang): MetadataRoute.Sitemap {
  const jaPath = pathForLang('ja');
  const enPath = pathForLang('en');

  return LANGS.map((lang) => ({
    url: `${BASE_URL}${pathForLang(lang)}`,
    alternates: {
      languages: {
        ja: `${BASE_URL}${jaPath}`,
        en: `${BASE_URL}${enPath}`,
        'x-default': `${BASE_URL}${jaPath}`,
      },
    },
  }));
}

function assertUrlIsProperlyEncoded(url: string): void {
  const { pathname } = new URL(url);
  for (const segment of pathname.split('/')) {
    if (!segment) continue;

    let roundTripped: string;
    try {
      roundTripped = encodeURIComponent(decodeURIComponent(segment));
    } catch {
      throw new Error(`sitemap: unparsable URL segment in ${url}`);
    }
    if (roundTripped !== segment) {
      throw new Error(`sitemap: not encodeURIComponent-encoded: ${url}`);
    }
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths: PathForLang[] = [
    (lang) => `/${lang}`,
    (lang) => `/${lang}/EA/charas`,
    (lang) => `/${lang}/EA/feats`,
    (lang) => `/${lang}/EA/sim/curve`,
    (lang) => `/${lang}/EA/sim/resist`,
    (lang) => `/${lang}/EA/sources`,
  ];

  const eaCharaIds = charaPageIds('EA');
  const nightlyOnlyCharaIds = charaPageIds('Nightly').filter(
    (id) => getCanonicalVersionForChara('Nightly', id) === 'Nightly'
  );

  const eaFeatAliases = featIndexRows('EA').map((row) => row.alias);
  const nightlyOnlyFeatAliases = featIndexRows('Nightly')
    .map((row) => row.alias)
    .filter(
      (alias) => getCanonicalVersionForFeat('Nightly', alias) === 'Nightly'
    );

  const charaPaths: PathForLang[] = [
    ...eaCharaIds.map(
      (id): PathForLang =>
        (lang) =>
          `/${lang}/EA/charas/${encodeURIComponent(id)}`
    ),
    ...nightlyOnlyCharaIds.map(
      (id): PathForLang =>
        (lang) =>
          `/${lang}/Nightly/charas/${encodeURIComponent(id)}`
    ),
  ];

  const featPaths: PathForLang[] = [
    ...eaFeatAliases.map(
      (alias): PathForLang =>
        (lang) =>
          `/${lang}/EA/feats/${encodeURIComponent(alias)}`
    ),
    ...nightlyOnlyFeatAliases.map(
      (alias): PathForLang =>
        (lang) =>
          `/${lang}/Nightly/feats/${encodeURIComponent(alias)}`
    ),
  ];

  const entries = [...staticPaths, ...charaPaths, ...featPaths].flatMap(
    toEntries
  );

  const urls = entries.map((entry) => entry.url);
  if (new Set(urls).size !== urls.length) {
    throw new Error('sitemap: duplicate URL detected');
  }
  urls.forEach(assertUrlIsProperlyEncoded);

  return entries;
}
