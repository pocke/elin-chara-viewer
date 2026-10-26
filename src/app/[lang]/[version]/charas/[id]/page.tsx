import { CurrentVersion, GAME_VERSIONS } from '@/lib/db';
import { Chara } from '@/lib/models/chara';
import { ElementAttacks, elementByAlias } from '@/lib/models/element';
import { charaDetailRow, charaPageIds } from '@/lib/pageData';
import { currentVersionName } from '@/lib/versions';
import CharaDetailClient from './CharaDetailClient';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { resources, toLanguage } from '@/lib/i18n-resources';
import {
  generateAlternates,
  getCanonicalVersionForChara,
} from '@/lib/metadata';

export const generateMetadata = async (props: {
  params: Promise<{ id: string; lang: string; version: CurrentVersion }>;
}): Promise<Metadata> => {
  const params = await props.params;
  const decodedId = decodeURIComponent(params.id);
  const [baseId, variantElement] = decodedId.split('---');
  const version = params.version;

  const charaRow = charaDetailRow(version, baseId);

  if (!charaRow) {
    return {};
  }

  const chara = new Chara(
    version,
    charaRow,
    variantElement as ElementAttacks | null
  );
  const lang = toLanguage(params.lang);
  const charaName = chara.normalizedName(lang);
  const appTitle = resources[lang].common.title;

  const raceName = chara.race.name(lang);
  const jobName = chara.job().name(lang);
  const life = chara.life();
  const mana = chara.mana();
  const speed = chara.speed();
  const vigor = chara.vigor();

  const t = resources[lang].common;

  // Get primary attributes
  const primaryAttributes = chara.primaryAttributes();
  const primaryAttrsText = primaryAttributes
    .map((attr) => {
      const element = elementByAlias(version, attr.alias)!;
      const displayName = element.name(lang);
      return `${displayName}${attr.value}`;
    })
    .join('/');

  const description = `${raceName}/${jobName}\n${primaryAttrsText}\n${t.life}${life}/${t.mana}${mana}/${t.speed}${speed}/${t.vigor}${vigor}`;

  const canonicalVersion = getCanonicalVersionForChara(version, decodedId);
  // params.id may carry extra ---segments past the variant element (e.g.
  // bit---eleFire---junk); chara.id always collapses back to the real id
  // (base, or base---element), so building the canonical path from it
  // folds those extra-segment URLs onto their real counterpart instead of
  // each being its own self-canonical duplicate.
  const canonicalPathname = `/${lang}/${canonicalVersion}/charas/${encodeURIComponent(chara.id)}`;
  // charaDetailRow finds a row by plain id, so /charas/<baseId> (no
  // ---element suffix) 200s and duplicates /charas/<baseId>---<element>
  // even though generateStaticParams never emits it and nothing links to it.
  const isUnlinkedVariantBase = chara.variants().length > 0;

  return {
    title: `${charaName} - ${appTitle}`,
    description,
    alternates: generateAlternates(lang, canonicalPathname),
    robots: isUnlinkedVariantBase ? { index: false, follow: true } : undefined,
    openGraph: {
      title: `${charaName} - ${appTitle}`,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${charaName} - ${appTitle}`,
      description,
    },
  };
};

export const generateStaticParams = () => {
  const params = [];

  for (const lang of ['ja', 'en']) {
    for (const version of GAME_VERSIONS) {
      for (const id of charaPageIds(version)) {
        params.push({ lang, version, id });
      }
    }
  }

  return params;
};

export default async function CharaPage(props: {
  params: Promise<{ id: string; version: CurrentVersion }>;
}) {
  const params = await props.params;
  const decodedId = decodeURIComponent(params.id);
  const version = params.version;

  // Parse variant element from ID (format: baseId#variantElement)
  const [baseId, variantElement] = decodedId.split('---');

  const charaRow = charaDetailRow(version, baseId);

  if (!charaRow) {
    notFound();
  }

  return (
    <CharaDetailClient
      charaRow={charaRow}
      variantElement={variantElement as ElementAttacks | null}
      version={version}
      versionName={currentVersionName(version)}
    />
  );
}
