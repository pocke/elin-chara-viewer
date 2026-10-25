import { CurrentVersion, GAME_VERSIONS } from '@/lib/db';
import { charaIndexRows } from '@/lib/pageData';
import CharaPageClient from './CharaPageClient';
import { Metadata } from 'next';
import { generateAlternates } from '@/lib/metadata';
import { resources, toLanguage } from '@/lib/i18n-resources';

export async function generateMetadata(props: {
  params: Promise<{ lang: string; version: string }>;
}): Promise<Metadata> {
  const { lang: langParam, version } = await props.params;
  const lang = toLanguage(langParam);
  const pathname = `/${lang}/${version}/charas`;
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
  params: Promise<{ version: CurrentVersion }>;
}

export default async function CharaPage({ params }: PageProps) {
  const { version } = await params;

  return (
    <CharaPageClient charaRows={charaIndexRows(version)} version={version} />
  );
}
