import { all } from '@/lib/db';
import { CharaSchema } from '@/lib/models/chara';
import { ElementSchema } from '@/lib/models/element';
import CharaPageClient from './CharaPageClient';

export default async function CharaPage() {
  const charas = await all('charas', CharaSchema);
  const elements = await all('elements', ElementSchema);
  return <CharaPageClient charas={charas} elements={elements} />;
}
