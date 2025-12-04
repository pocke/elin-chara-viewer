import type { Metadata } from 'next';

const BASE_URL = 'https://elin.pokke.me';

/**
 * Generate alternates metadata for hreflang tags
 * @param lang - Current language ('ja' or 'en')
 * @param pathname - Current pathname (e.g., '/ja/ea/charas')
 */
export function generateAlternates(
  lang: string,
  pathname: string
): Metadata['alternates'] {
  const otherLang = lang === 'ja' ? 'en' : 'ja';
  const otherPathname = pathname.replace(`/${lang}`, `/${otherLang}`);
  const jaPathname = lang === 'ja' ? pathname : otherPathname;
  const enPathname = lang === 'en' ? pathname : otherPathname;

  return {
    canonical: `${BASE_URL}${pathname}`,
    languages: {
      ja: `${BASE_URL}${jaPathname}`,
      en: `${BASE_URL}${enPathname}`,
      'x-default': `${BASE_URL}${jaPathname}`,
    },
  };
}
