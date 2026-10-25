import { CurrentVersion, GAME_VERSIONS } from '@/lib/db';
import { elementByAlias } from '@/lib/models/element';
import { featDetailRows, featIndexRows } from '@/lib/pageData';
import FeatDetailClient from './FeatDetailClient';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { resources, toLanguage } from '@/lib/i18n-resources';
import { generateAlternates, getCanonicalVersionForFeat } from '@/lib/metadata';

export const generateMetadata = async (props: {
  params: Promise<{ alias: string; lang: string; version: CurrentVersion }>;
}): Promise<Metadata> => {
  const params = await props.params;
  const decodedAlias = decodeURIComponent(params.alias);
  const version = params.version;

  const element = elementByAlias(version, decodedAlias);

  if (!element) {
    return {};
  }

  const lang = toLanguage(params.lang);
  const featName = element.name(lang);
  const appTitle = resources[lang].common.title;

  const textPhase = element.textPhase(lang) || '';
  const textExtra = element.textExtra(lang) || '';
  const subElements = element.subElements();
  const subElementText = subElements
    .map(
      (sub) =>
        `${sub.element.name(lang)} ${sub.coefficient > 0 ? '+' : ''}${sub.coefficient}`
    )
    .join(', ');

  const descriptionParts = [textPhase, textExtra, subElementText].filter(
    (part) => part
  );
  const description = descriptionParts.join('\n');

  const canonicalVersion = getCanonicalVersionForFeat(version, decodedAlias);
  const canonicalPathname = `/${lang}/${canonicalVersion}/feats/${params.alias}`;

  return {
    title: `${featName} - ${appTitle}`,
    description: description || undefined,
    alternates: generateAlternates(lang, canonicalPathname),
    openGraph: {
      title: `${featName} - ${appTitle}`,
      description: description || undefined,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${featName} - ${appTitle}`,
      description: description || undefined,
    },
  };
};

export const generateStaticParams = () => {
  const params = [];

  for (const lang of ['ja', 'en']) {
    for (const version of GAME_VERSIONS) {
      for (const row of featIndexRows(version)) {
        params.push({ lang, version, alias: row.alias });
      }
    }
  }

  return params;
};

export default async function FeatPage(props: {
  params: Promise<{ alias: string; version: CurrentVersion }>;
}) {
  const params = await props.params;
  const decodedAlias = decodeURIComponent(params.alias);
  const version = params.version;

  const rows = featDetailRows(version, decodedAlias);

  if (!rows) {
    notFound();
  }

  return (
    <FeatDetailClient
      elementRow={rows.elementRow}
      raceRows={rows.raceRows}
      jobRows={rows.jobRows}
      charaRows={rows.charaRows}
      version={version}
    />
  );
}
