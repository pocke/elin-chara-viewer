import { all } from '@/lib/db';
import { CharaSchema } from '@/lib/models/chara';
import CharaPageClient from './CharaPageClient';

export default async function CharaPage() {
  const charas = await all('charas', CharaSchema);
  return <CharaPageClient charas={charas} />;
}
