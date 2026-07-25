import { GAME_VERSIONS, GameVersion, isCurrentVersion } from '@/lib/db';
import { charaIndexRows } from '@/lib/pageData';
import ResistSimClient from './ResistSimClient';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { generateAlternates } from '@/lib/metadata';

export async function generateMetadata(props: {
  params: Promise<{ lang: string; version: string }>;
}): Promise<Metadata> {
  const { lang, version } = await props.params;
  const pathname = `/${lang}/${version}/sim/resist`;
  const canonicalPathname =
    version !== 'EA' ? `/${lang}/EA/sim/resist` : pathname;

  return {
    alternates: generateAlternates(lang, pathname, canonicalPathname),
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
  const gameVersion = version as GameVersion;

  // resistSimUtils hardcodes the current game's formulas.
  if (!isCurrentVersion(gameVersion)) {
    notFound();
  }

  const charaRows = charaIndexRows(gameVersion);

  return (
    <ResistSimClient charaRows={charaRows} lang={lang} version={gameVersion} />
  );
}
