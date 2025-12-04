import { all, GAME_VERSIONS, GameVersion } from '@/lib/db';
import { Chara, CharaSchema } from '@/lib/models/chara';
import CharaPageClient from './CharaPageClient';
import { Metadata } from 'next';
import { generateAlternates } from '@/lib/metadata';

export async function generateMetadata(props: {
  params: Promise<{ lang: string; version: string }>;
}): Promise<Metadata> {
  const { lang, version } = await props.params;
  const pathname = `/${lang}/${version}/charas`;
  const canonicalPathname = version !== 'EA' ? `/${lang}/EA/charas` : pathname;

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

export default async function CharaPage({ params }: PageProps) {
  const { version } = await params;
  const gameVersion = version as GameVersion;

  const charaRows = all(gameVersion, 'charas', CharaSchema).filter(
    (row) => !Chara.isIgnoredCharaId(row.id)
  );

  return <CharaPageClient charaRows={charaRows} version={gameVersion} />;
}
