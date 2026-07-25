import { all, GAME_VERSIONS } from '@/lib/db';
import { Chara, CharaSchema } from '@/lib/models/chara';
import { ElementAttacks, elementByAlias } from '@/lib/models/element';
import { archivedIds } from '@/lib/archive';
import { charaDetailRow } from '@/lib/pageData';
import { resolveVersion } from '@/lib/versions';
import ArchivedCharaDetailPage from './ArchivedCharaDetailPage';
import CharaDetailClient from './CharaDetailClient';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { resources, Language } from '@/lib/i18n-resources';
import {
  archivedPageMetadata,
  generateAlternates,
  getCanonicalVersionForChara,
} from '@/lib/metadata';

export const generateMetadata = async (props: {
  params: Promise<{ id: string; lang: string; version: string }>;
}): Promise<Metadata> => {
  const params = await props.params;
  const decodedId = decodeURIComponent(params.id);
  const [baseId, variantElement] = decodedId.split('---');
  const resolved = await resolveVersion(params.version);

  if (!resolved) {
    return {};
  }

  if (resolved.kind === 'archived') {
    return archivedPageMetadata(
      params.lang,
      `/${params.lang}/${params.version}/charas/${params.id}`,
      resolved.label
    );
  }

  const charaRow = charaDetailRow(resolved.key, baseId);

  if (!charaRow) {
    return {};
  }

  const chara = new Chara(
    resolved.key,
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
      const element = elementByAlias(resolved.key, attr.alias)!;
      const displayName = element.name(lang);
      return `${displayName}${attr.value}`;
    })
    .join('/');

  const description = `${raceName}/${jobName}\n${primaryAttrsText}\n${t.life}${life}/${t.mana}${mana}/${t.speed}${speed}/${t.vigor}${vigor}`;

  const pathname = `/${lang}/${params.version}/charas/${params.id}`;
  const canonicalVersion = getCanonicalVersionForChara(resolved.key, decodedId);
  const canonicalPathname =
    canonicalVersion !== resolved.key
      ? `/${lang}/${canonicalVersion}/charas/${params.id}`
      : pathname;

  return {
    title: `${charaName} - ${appTitle}`,
    description,
    alternates: generateAlternates(lang, pathname, canonicalPathname),
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
  const resolved = await resolveVersion(params.version);

  if (!resolved) {
    notFound();
  }

  // Parse variant element from ID (format: baseId#variantElement)
  const [baseId, variantElement] = decodedId.split('---');

  if (resolved.kind === 'archived') {
    // Checked here rather than in the client component so that a URL that
    // never existed answers 404 instead of filling the route cache with an
    // empty page for every identifier that is asked for.
    const ids = await archivedIds(resolved.entry.slug);
    if (!ids.charas.includes(baseId)) {
      notFound();
    }

    return (
      <ArchivedCharaDetailPage
        entry={resolved.entry}
        baseId={baseId}
        variantElement={variantElement as ElementAttacks | null}
      />
    );
  }

  const charaRow = charaDetailRow(resolved.key, baseId);

  if (!charaRow) {
    notFound();
  }

  return (
    <CharaDetailClient
      charaRow={charaRow}
      variantElement={variantElement as ElementAttacks | null}
      version={resolved.key}
    />
  );
}
