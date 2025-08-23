import { all } from '@/lib/db';
import { CharaSchema } from '@/lib/models/chara';
import CharaPageClient from './CharaPageClient';

export function generateStaticParams() {
  return [
    { lang: 'ja', version: 'EA' },
    { lang: 'en', version: 'EA' },
  ];
}

export default function CharaPage() {
  const charaRows = all('charas', CharaSchema);

  return <CharaPageClient charaRows={charaRows} />;
}
