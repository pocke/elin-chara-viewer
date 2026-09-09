import type { MetadataRoute } from 'next';
import { Language } from '@/lib/i18n-resources';
import {
  BASE_URL,
  getCanonicalVersionForChara,
  getCanonicalVersionForFeat,
} from '@/lib/metadata';
import { charaPageIds, featIndexRows } from '@/lib/pageData';

const LANGS: Language[] = ['ja', 'en'];

// A suffix is the part of the pathname after /<lang>, shared by every
// language's URL for that page (e.g. '/EA/charas/bit---eleFire', or '' for
// the home page).
function toEntries(suffix: string): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    LANGS.map((lang) => [lang, `${BASE_URL}/${lang}${suffix}`])
  );

  return LANGS.map((lang) => ({
    url: languages[lang],
    alternates: {
      languages: { ...languages, 'x-default': languages.ja },
    },
  }));
}

function assertProperlyEncoded(pathname: string): void {
  for (const segment of pathname.split('/')) {
    if (!segment) continue;

    let roundTripped: string;
    try {
      roundTripped = encodeURIComponent(decodeURIComponent(segment));
    } catch {
      throw new Error(`sitemap: unparsable URL segment in ${pathname}`);
    }
    if (roundTripped !== segment) {
      throw new Error(`sitemap: not encodeURIComponent-encoded: ${pathname}`);
    }
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticSuffixes = [
    '',
    '/EA/charas',
    '/EA/feats',
    '/EA/sim/curve',
    '/EA/sim/resist',
    '/EA/sources',
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

  const charaSuffixes = [
    ...eaCharaIds.map((id) => `/EA/charas/${encodeURIComponent(id)}`),
    ...nightlyOnlyCharaIds.map(
      (id) => `/Nightly/charas/${encodeURIComponent(id)}`
    ),
  ];

  const featSuffixes = [
    ...eaFeatAliases.map((alias) => `/EA/feats/${encodeURIComponent(alias)}`),
    ...nightlyOnlyFeatAliases.map(
      (alias) => `/Nightly/feats/${encodeURIComponent(alias)}`
    ),
  ];

  const entries = [
    ...staticSuffixes,
    ...charaSuffixes,
    ...featSuffixes,
  ].flatMap(toEntries);

  const urls = entries.map((entry) => entry.url);
  if (new Set(urls).size !== urls.length) {
    throw new Error('sitemap: duplicate URL detected');
  }

  // Checked pre-`new URL()` pathnames rather than `new URL(url).pathname`:
  // the WHATWG URL parser percent-encodes spaces and other reserved
  // characters on the way in, so by the time a raw, unencoded segment
  // reaches `.pathname` it no longer looks unencoded.
  for (const entry of entries) {
    assertProperlyEncoded(entry.url.slice(BASE_URL.length));
    for (const href of Object.values(entry.alternates!.languages!)) {
      assertProperlyEncoded((href as string).slice(BASE_URL.length));
    }
  }

  return entries;
}
