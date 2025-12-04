import { GAME_VERSIONS, GameVersion } from '@/lib/db';
import FeatPageClient from './FeatPageClient';
import { Metadata } from 'next';
import { generateAlternates } from '@/lib/metadata';
import { allFeats } from '@/lib/models/feat';

export async function generateMetadata(props: {
  params: Promise<{ lang: string; version: string }>;
}): Promise<Metadata> {
  const { lang, version } = await props.params;
  const pathname = `/${lang}/${version}/feats`;
  const canonicalPathname = version !== 'EA' ? `/${lang}/EA/feats` : pathname;

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

interface PageProps {
  params: Promise<{ version: string }>;
}

export default async function FeatPage({ params }: PageProps) {
  const { version } = await params;
  const gameVersion = version as GameVersion;

  const feats = allFeats(gameVersion);
  const featRows = feats.map((feat) => feat.row);

  return <FeatPageClient featRows={featRows} version={gameVersion} />;
}
