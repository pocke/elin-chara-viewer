import { GAME_VERSIONS } from '@/lib/db';
import { charaIndexRows } from '@/lib/pageData';
import { resolveVersion } from '@/lib/versions';
import ArchivedCharaPage from './ArchivedCharaPage';
import CharaPageClient from './CharaPageClient';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { archivedPageMetadata, generateAlternates } from '@/lib/metadata';
import { resources, toLanguage } from '@/lib/i18n-resources';

export async function generateMetadata(props: {
  params: Promise<{ lang: string; version: string }>;
}): Promise<Metadata> {
  const { lang: langParam, version } = await props.params;
  const lang = toLanguage(langParam);
  const pathname = `/${lang}/${version}/charas`;
  const resolved = await resolveVersion(version);

  if (resolved?.kind === 'archived') {
    return archivedPageMetadata(lang, pathname, resolved.label);
  }

  const canonicalPathname = version !== 'EA' ? `/${lang}/EA/charas` : pathname;
  const t = resources[lang].common;

  return {
    title: `${t.browseCharacters} - ${t.title}`,
    description: resources[lang].pageMeta.charas.description,
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

export default async function CharaPage({ params }: PageProps) {
  const { version } = await params;
  const resolved = await resolveVersion(version);

  if (!resolved) {
    notFound();
  }

  if (resolved.kind === 'archived') {
    return <ArchivedCharaPage entry={resolved.entry} />;
  }

  return (
    <CharaPageClient
      charaRows={charaIndexRows(resolved.key)}
      version={resolved.key}
    />
  );
}
