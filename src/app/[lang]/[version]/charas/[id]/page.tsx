import { all, GAME_VERSIONS, GameVersion } from '@/lib/db';
import { Chara, CharaSchema } from '@/lib/models/chara';
import { ElementAttacks, elementByAlias } from '@/lib/models/element';
import CharaDetailClient from './CharaDetailClient';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { resources, Language } from '@/lib/i18n-resources';

export const generateMetadata = async (props: {
  params: Promise<{ id: string; lang: string; version: string }>;
}): Promise<Metadata> => {
  const params = await props.params;
  const decodedId = decodeURIComponent(params.id);
  const [baseId, variantElement] = decodedId.split('---');
  const gameVersion = params.version as GameVersion;

  const charaRows = all(gameVersion, 'charas', CharaSchema);
  const charaRow = charaRows.find((chara) => chara.id === baseId);

  if (!charaRow) {
    return {};
  }

  const chara = new Chara(
    gameVersion,
    charaRow,
    variantElement as ElementAttacks | null
  );
  const lang = (
    params.lang === 'ja' || params.lang === 'en' ? params.lang : 'en'
  ) as Language;
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
      const element = elementByAlias(gameVersion, attr.alias)!;
      const displayName = element.name(lang);
      return `${displayName}${attr.value}`;
    })
    .join('/');

  const description = `${raceName}/${jobName}\n${primaryAttrsText}\n${t.life}${life}/${t.mana}${mana}/${t.speed}${speed}/${t.vigor}${vigor}`;

  return {
    title: `${charaName} - ${appTitle}`,
    description,
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
      const charaRows = all(version, 'charas', CharaSchema);
      const baseCharas = charaRows
        .filter((row) => !Chara.isIgnoredCharaId(row.id))
        .map((row) => new Chara(version, row));

      // Generate IDs for base characters and their variants
      const ids = baseCharas.flatMap((chara) => {
        const variants = chara.variants();
        return variants.length > 0 ? variants.map((v) => v.id) : [chara.id];
      });

      for (const id of ids) {
        params.push({ lang, version, id });
      }
    }
  }

  return params;
};

export default async function CharaPage(props: {
  params: Promise<{ id: string; version: string }>;
}) {
  const params = await props.params;
  const decodedId = decodeURIComponent(params.id);
  const gameVersion = params.version as GameVersion;

  // Parse variant element from ID (format: baseId#variantElement)
  const [baseId, variantElement] = decodedId.split('---');

  const charaRows = all(gameVersion, 'charas', CharaSchema);
  const charaRow = charaRows.find((chara) => chara.id === baseId);

  if (!charaRow) {
    notFound();
  }

  return (
    <CharaDetailClient
      charaRow={charaRow}
      variantElement={variantElement as ElementAttacks | null}
      version={gameVersion}
    />
  );
}
