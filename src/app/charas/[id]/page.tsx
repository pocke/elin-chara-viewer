import { all } from '@/lib/db';
import { Chara, CharaSchema } from '@/lib/models/chara';
import { ElementSchema, ElementAttacks } from '@/lib/models/element';
import CharaDetailClient from './CharaDetailClient';
import { RaceSchema } from '@/lib/models/race';

export const generateStaticParams = async () => {
  const charaRows = await all('charas', CharaSchema);
  const baseCharas = charaRows.map((row) => new Chara(row));
  
  // Generate IDs for base characters and their variants
  const ids = baseCharas.flatMap((chara) => {
    const variants = chara.variants();
    return variants.length > 0 ? variants.map(v => ({ id: v.id })) : [{ id: chara.id }];
  });
  
  return ids;
};

export default async function CharaPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const decodedId = decodeURIComponent(params.id);
  
  // Parse variant element from ID (format: baseId#variantElement)
  const [baseId, variantElement] = decodedId.split('---');
  
  const charaRows = await all('charas', CharaSchema);
  const charaRow = charaRows.find((chara) => chara.id === baseId);

  if (!charaRow) {
    throw new Error(`Chara with ID ${baseId} not found`);
  }

  const chara = new Chara(charaRow, variantElement as ElementAttacks | null);

  const racesRows = await all('races', RaceSchema);
  const raceRow = racesRows.find((r) => r.id === chara.race());
  if (!raceRow) {
    throw new Error(`Race with ID ${chara.race()} not found`);
  }

  const elements = await all('elements', ElementSchema);

  return <CharaDetailClient charaRow={charaRow} elements={elements} race={raceRow} variantElement={variantElement as ElementAttacks | null} />;
}
