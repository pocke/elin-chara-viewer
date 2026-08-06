import { GAME_VERSIONS, isCurrentVersion } from '@/lib/db';
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

  // resistSimUtils hardcodes the current game's formulas.
  if (!isCurrentVersion(version)) {
    notFound();
  }

  const charaRows = charaIndexRows(version);

  return (
    <ResistSimClient charaRows={charaRows} lang={lang} version={version} />
  );
}
