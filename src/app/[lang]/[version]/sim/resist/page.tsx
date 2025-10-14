import { all } from '@/lib/db';
import { Chara, CharaSchema } from '@/lib/models/chara';
import ResistSimClient from './ResistSimClient';

export function generateStaticParams() {
  return [
    { lang: 'ja', version: 'EA' },
    { lang: 'en', version: 'EA' },
  ];
}

interface ResistSimPageProps {
  params: Promise<{
    lang: string;
    version: string;
  }>;
}

export default async function ResistSimPage({ params }: ResistSimPageProps) {
  const { lang, version } = await params;

  const charaRows = all('charas', CharaSchema).filter(
    (row) => !Chara.isIgnoredCharaId(row.id)
  );

  return (
    <ResistSimClient charaRows={charaRows} lang={lang} version={version} />
  );
}
