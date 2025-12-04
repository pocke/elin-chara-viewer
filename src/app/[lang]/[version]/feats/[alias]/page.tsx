import { all, GAME_VERSIONS, GameVersion } from '@/lib/db';
import { ElementSchema, elementByAlias, Element } from '@/lib/models/element';
import { CharaSchema, Chara } from '@/lib/models/chara';
import { racesByFeat } from '@/lib/models/race';
import { jobsByFeat } from '@/lib/models/job';
import FeatDetailClient from './FeatDetailClient';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { resources, Language } from '@/lib/i18n-resources';
import { generateAlternates, getCanonicalVersionForFeat } from '@/lib/metadata';

export const generateMetadata = async (props: {
  params: Promise<{ alias: string; lang: string; version: string }>;
}): Promise<Metadata> => {
  const params = await props.params;
  const decodedAlias = decodeURIComponent(params.alias);
  const gameVersion = params.version as GameVersion;

  const element = elementByAlias(gameVersion, decodedAlias);

  if (!element) {
    return {};
  }

  const featName = element.name(params.lang);
  const appTitle = resources[params.lang as Language].common.title;

  const textPhase = element.textPhase(params.lang) || '';
  const textExtra = element.textExtra(params.lang) || '';
  const subElements = element.subElements();
  const subElementText = subElements
    .map(
      (sub) =>
        `${sub.element.name(params.lang)} ${sub.coefficient > 0 ? '+' : ''}${sub.coefficient}`
    )
    .join(', ');

  const descriptionParts = [textPhase, textExtra, subElementText].filter(
    (part) => part
  );
  const description = descriptionParts.join('\n');

  const lang = params.lang as Language;
  const pathname = `/${lang}/${params.version}/feats/${params.alias}`;
  const canonicalVersion = getCanonicalVersionForFeat(
    gameVersion,
    decodedAlias
  );
  const canonicalPathname =
    canonicalVersion !== gameVersion
      ? `/${lang}/${canonicalVersion}/feats/${params.alias}`
      : pathname;

  return {
    title: `${featName} - ${appTitle}`,
    description: description || undefined,
    alternates: generateAlternates(lang, pathname, canonicalPathname),
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
      const elementRows = all(version, 'elements', ElementSchema);
      const featRows = elementRows.filter((row) => {
        const elm = new Element(version, row);
        if (!elm.isFeat()) return false;
        return !elm.tags().includes('hidden');
      });

      const aliases = featRows.map((row) => row.alias);

      for (const alias of aliases) {
        params.push({ lang, version, alias });
      }
    }
  }

  return params;
};

export default async function FeatPage(props: {
  params: Promise<{ alias: string; version: string }>;
}) {
  const params = await props.params;
  const decodedAlias = decodeURIComponent(params.alias);
  const gameVersion = params.version as GameVersion;

  const element = elementByAlias(gameVersion, decodedAlias);

  if (!element) {
    notFound();
  }

  // Find races with this feat
  const racesWithFeat = racesByFeat(gameVersion, decodedAlias);

  // Find jobs with this feat
  const jobsWithFeat = jobsByFeat(gameVersion, decodedAlias);

  // Find characters with this feat
  const charaRows = all(gameVersion, 'charas', CharaSchema);
  const charactersWithFeat = charaRows
    .filter((row) => !Chara.isIgnoredCharaId(row.id))
    .map((row) => new Chara(gameVersion, row))
    .filter((chara) => {
      const feats = chara.feats();
      return feats.some((f) => f.element.alias === decodedAlias);
    });

  return (
    <FeatDetailClient
      elementRow={element.row}
      raceRows={racesWithFeat.map((r) => r.row)}
      jobRows={jobsWithFeat.map((j) => j.row)}
      charaRows={charactersWithFeat.map((c) => c.row)}
      version={gameVersion}
    />
  );
}
