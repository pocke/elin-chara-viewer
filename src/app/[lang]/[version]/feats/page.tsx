import { all, GAME_VERSIONS, GameVersion } from '@/lib/db';
import { ElementSchema, Element } from '@/lib/models/element';
import FeatPageClient from './FeatPageClient';

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

  const featRows = all(gameVersion, 'elements', ElementSchema).filter((row) => {
    const element = new Element(gameVersion, row);
    if (!element.isFeat()) return false;

    const tags = element.tags();
    return !tags.includes('hidden');
  });

  return <FeatPageClient featRows={featRows} version={gameVersion} />;
}
