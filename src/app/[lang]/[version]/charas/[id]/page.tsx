import { all } from '@/lib/db';
import { Chara, CharaSchema } from '@/lib/models/chara';
import { ElementAttacks } from '@/lib/models/element';
import CharaDetailClient from './CharaDetailClient';
import { Metadata } from 'next';
import { resources, Language } from '@/lib/i18n-resources';

export const generateMetadata = async (props: {
  params: Promise<{ id: string; lang: string }>;
}): Promise<Metadata> => {
  const params = await props.params;
  const decodedId = decodeURIComponent(params.id);
  const [baseId, variantElement] = decodedId.split('---');

  const charaRows = all('charas', CharaSchema);
  const charaRow = charaRows.find((chara) => chara.id === baseId);

  if (!charaRow) {
    throw new Error(`Chara with ID ${baseId} not found`);
  }

  const chara = new Chara(charaRow, variantElement as ElementAttacks | null);
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
  const description = `${raceName}/${jobName}\n${t.life}${life}/${t.mana}${mana}/${t.speed}${speed}/${t.vigor}${vigor}`;

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
  const charaRows = all('charas', CharaSchema);
  const baseCharas = charaRows
    .filter((row) => !Chara.isIgnoredCharaId(row.id))
    .map((row) => new Chara(row));

  // Generate IDs for base characters and their variants
  const ids = baseCharas.flatMap((chara) => {
    const variants = chara.variants();
    return variants.length > 0 ? variants.map((v) => v.id) : [chara.id];
  });

  // Generate combinations of lang, version, and id
  const params = [];
  for (const lang of ['ja', 'en']) {
    for (const version of ['EA']) {
      for (const id of ids) {
        params.push({ lang, version, id });
      }
    }
  }

  return params;
};

export default async function CharaPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const decodedId = decodeURIComponent(params.id);

  // Parse variant element from ID (format: baseId#variantElement)
  const [baseId, variantElement] = decodedId.split('---');

  const charaRows = all('charas', CharaSchema);
  const charaRow = charaRows.find((chara) => chara.id === baseId);

  if (!charaRow) {
    throw new Error(`Chara with ID ${baseId} not found`);
  }

  return (
    <CharaDetailClient
      charaRow={charaRow}
      variantElement={variantElement as ElementAttacks | null}
    />
  );
}
