import { all, GAME_VERSIONS, GameVersion } from '@/lib/db';
import { Chara, CharaSchema } from '@/lib/models/chara';
import ResistSimClient from './ResistSimClient';

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

  const charaRows = all(gameVersion, 'charas', CharaSchema).filter(
    (row) => !Chara.isIgnoredCharaId(row.id)
  );

  return (
    <ResistSimClient
      charaRows={charaRows}
      lang={lang}
      version={gameVersion}
    />
  );
}
