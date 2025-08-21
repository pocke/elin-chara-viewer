import { all } from '@/lib/db';
import { CharaSchema } from '@/lib/models/chara';
import { ElementSchema } from '@/lib/models/element';
import { RaceSchema } from '@/lib/models/race';
import CharaPageClient from './CharaPageClient';

export default async function CharaPage() {
  const charas = await all('charas', CharaSchema);
  const elements = await all('elements', ElementSchema);
  const races = await all('races', RaceSchema);
  return <CharaPageClient charas={charas} elements={elements} races={races} />;
}
