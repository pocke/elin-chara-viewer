import { GAME_VERSIONS, isCurrentVersion } from '@/lib/db';
import { charaIndexRows } from '@/lib/pageData';
import ResistSimClient from './ResistSimClient';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { generateAlternates } from '@/lib/metadata';
import { resources, toLanguage } from '@/lib/i18n-resources';

export async function generateMetadata(props: {
  params: Promise<{ lang: string; version: string }>;
}): Promise<Metadata> {
  const { lang: langParam, version } = await props.params;
  const lang = toLanguage(langParam);
  const pathname = `/${lang}/${version}/sim/resist`;
  const canonicalPathname =
    version !== 'EA' ? `/${lang}/EA/sim/resist` : pathname;
  const appTitle = resources[lang].common.title;
  const pageMeta = resources[lang].resistSim;

  return {
    title: `${pageMeta.title} - ${appTitle}`,
    description: pageMeta.description,
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

interface ResistSimPageProps {
  params: Promise<{
    lang: string;
    version: string;
  }>;
}

export default async function ResistSimPage({ params }: ResistSimPageProps) {
  const { lang, version } = await params;

  // resistSimUtils hardcodes the current game's formulas.
  if (!isCurrentVersion(version)) {
    notFound();
  }

  const charaRows = charaIndexRows(version);

  return (
    <ResistSimClient charaRows={charaRows} lang={lang} version={version} />
  );
}
