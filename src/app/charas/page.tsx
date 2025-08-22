import { all } from '@/lib/db';
import { CharaSchema } from '@/lib/models/chara';
import CharaPageClient from './CharaPageClient';

export default function CharaPage() {
  const charaRows = all('charas', CharaSchema);

  return <CharaPageClient charaRows={charaRows} />;
}
