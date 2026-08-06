import { all, GAME_VERSIONS } from '@/lib/db';
import { ElementSchema, elementByAlias, Element } from '@/lib/models/element';
import { archivedIds } from '@/lib/archive';
import { featDetailRows } from '@/lib/pageData';
import { resolveVersion } from '@/lib/versions';
import ArchivedFeatDetailPage from './ArchivedFeatDetailPage';
import FeatDetailClient from './FeatDetailClient';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { resources, Language } from '@/lib/i18n-resources';
import {
  archivedPageMetadata,
  generateAlternates,
  getCanonicalVersionForFeat,
} from '@/lib/metadata';

export const generateMetadata = async (props: {
  params: Promise<{ alias: string; lang: string; version: string }>;
}): Promise<Metadata> => {
  const params = await props.params;
  const decodedAlias = decodeURIComponent(params.alias);
  const resolved = await resolveVersion(params.version);

  if (!resolved) {
    return {};
  }

  if (resolved.kind === 'archived') {
    return archivedPageMetadata(
      params.lang,
      `/${params.lang}/${params.version}/feats/${params.alias}`,
      resolved.label
    );
  }

  const element = elementByAlias(resolved.key, decodedAlias);

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
    resolved.key,
    decodedAlias
  );
  const canonicalPathname =
    canonicalVersion !== resolved.key
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
  const resolved = await resolveVersion(params.version);

  if (!resolved) {
    notFound();
  }

  if (resolved.kind === 'archived') {
    // Checked here rather than in the client component so that a URL that
    // never existed answers 404 instead of filling the route cache with an
    // empty page for every alias that is asked for.
    const ids = await archivedIds(resolved.entry.slug);
    if (!ids.elements.includes(decodedAlias)) {
      notFound();
    }

    return (
      <ArchivedFeatDetailPage entry={resolved.entry} alias={decodedAlias} />
    );
  }

  const rows = featDetailRows(resolved.key, decodedAlias);

  if (!rows) {
    notFound();
  }

  return (
    <FeatDetailClient
      elementRow={rows.elementRow}
      raceRows={rows.raceRows}
      jobRows={rows.jobRows}
      charaRows={rows.charaRows}
      version={resolved.key}
    />
  );
}
