import { all } from '@/lib/db';
import { Chara, CharaSchema } from '@/lib/models/chara';
import { ElementSchema } from '@/lib/models/element';
import CharaDetailClient from './CharaDetailClient';
import { RaceSchema } from '@/lib/models/race';

export const generateStaticParams = async () => {
  return (await all('charas', CharaSchema)).map((charaRow) => ({
    id: charaRow.id,
  }));
};

export default async function CharaPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;

  const charaRows = await all('charas', CharaSchema);
  const charaRow = charaRows.find((chara) => chara.id === params.id);

  if (!charaRow) {
    throw new Error(`Chara with ID ${params.id} not found`);
  }

  const chara = new Chara(charaRow);

  const racesRows = await all('races', RaceSchema);
  const raceRow = racesRows.find((r) => r.id === chara.race());
  if (!raceRow) {
    throw new Error(`Race with ID ${chara.race()} not found`);
  }

  const elements = await all('elements', ElementSchema);

  return <CharaDetailClient charaRow={charaRow} elements={elements} race={raceRow} />;
}
