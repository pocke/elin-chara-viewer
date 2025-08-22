import { all } from '@/lib/db';
import { CharaSchema } from '@/lib/models/chara';
import { ElementSchema } from '@/lib/models/element';
import { RaceSchema } from '@/lib/models/race';
import CharaPageClient from './CharaPageClient';

export default function CharaPage() {
  const charas = all('charas', CharaSchema);
  const elements = all('elements', ElementSchema);
  const races = all('races', RaceSchema);
  return <CharaPageClient charas={charas} elements={elements} races={races} />;
}
