import { GAME_VERSIONS } from '@/lib/db';
import { featIndexRows } from '@/lib/pageData';
import { resolveVersion } from '@/lib/versions';
import ArchivedFeatPage from './ArchivedFeatPage';
import FeatPageClient from './FeatPageClient';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { archivedPageMetadata, generateAlternates } from '@/lib/metadata';
import { resources, toLanguage } from '@/lib/i18n-resources';

export async function generateMetadata(props: {
  params: Promise<{ lang: string; version: string }>;
}): Promise<Metadata> {
  const { lang: langParam, version } = await props.params;
  const lang = toLanguage(langParam);
  const pathname = `/${lang}/${version}/feats`;
  const resolved = await resolveVersion(version);

  if (resolved?.kind === 'archived') {
    return archivedPageMetadata(lang, pathname, resolved.label);
  }

  const canonicalPathname = version !== 'EA' ? `/${lang}/EA/feats` : pathname;
  const t = resources[lang].common;

  return {
    title: `${t.browseFeats} - ${t.title}`,
    description: resources[lang].pageMeta.feats.description,
    alternates: generateAlternates(lang, canonicalPathname),
  };
}

export function generateStaticParams() {
  const params = [];
  for (const lang of ['ja', 'en']) {
    for (const version of GAME_VERSIONS) {
      params.push({ lang, version });
    }
  }
  return params;
}

interface PageProps {
  params: Promise<{ version: string }>;
}

export default async function FeatPage({ params }: PageProps) {
  const { version } = await params;
  const resolved = await resolveVersion(version);

  if (!resolved) {
    notFound();
  }

  if (resolved.kind === 'archived') {
    return <ArchivedFeatPage entry={resolved.entry} />;
  }

  return (
    <FeatPageClient
      featRows={featIndexRows(resolved.key)}
      version={resolved.key}
    />
  );
}
