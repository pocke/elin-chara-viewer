import { all } from '@/lib/db';
import { Chara, CharaSchema } from '@/lib/models/chara';
import CharaPageClient from './CharaPageClient';

export function generateStaticParams() {
  return [
    { lang: 'ja', version: 'EA' },
    { lang: 'en', version: 'EA' },
  ];
}

export default function CharaPage() {
  const charaRows = all('charas', CharaSchema).filter((row) => !Chara.isIgnoredCharaId(row.id));

  return <CharaPageClient charaRows={charaRows} />;
}
