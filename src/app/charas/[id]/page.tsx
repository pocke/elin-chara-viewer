import { all } from '@/lib/db';
import { Chara, CharaSchema } from '@/lib/models/chara';
import {
  Element as GameElement,
  ElementSchema,
  ElementAttacks,
} from '@/lib/models/element';
import CharaDetailClient from './CharaDetailClient';
import { Race, RaceSchema } from '@/lib/models/race';

export const generateStaticParams = () => {
  const charaRows = all('charas', CharaSchema);
  const racesRows = all('races', RaceSchema);
  const elements = all('elements', ElementSchema);
  const elementsMap = new Map(
    elements.map((element) => [element.alias, new GameElement(element)])
  );
  const elementsIdMap = new Map(
    elements.map((element) => [element.id, new GameElement(element)])
  );
  const racesMap = new Map(
    racesRows.map((race) => [
      race.id,
      new Race(race, elementsMap, elementsIdMap),
    ])
  );
  const baseCharas = charaRows.map(
    (row) => new Chara(row, racesMap, elementsMap, elementsIdMap)
  );

  // Generate IDs for base characters and their variants
  const ids = baseCharas.flatMap((chara) => {
    const variants = chara.variants(racesMap);
    return variants.length > 0
      ? variants.map((v) => ({ id: v.id }))
      : [{ id: chara.id }];
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

  const charaRows = all('charas', CharaSchema);
  const charaRow = charaRows.find((chara) => chara.id === baseId);

  if (!charaRow) {
    throw new Error(`Chara with ID ${baseId} not found`);
  }

  const racesRows = all('races', RaceSchema);
  const elements = all('elements', ElementSchema);
  const elementsMap = new Map(
    elements.map((element) => [element.alias, new GameElement(element)])
  );
  const elementsIdMap = new Map(
    elements.map((element) => [element.id, new GameElement(element)])
  );
  const racesMap = new Map(
    racesRows.map((race) => [
      race.id,
      new Race(race, elementsMap, elementsIdMap),
    ])
  );
  const chara = new Chara(
    charaRow,
    racesMap,
    elementsMap,
    elementsIdMap,
    variantElement as ElementAttacks | null
  );

  const raceRow = racesRows.find((r) => r.id === chara.race());
  if (!raceRow) {
    throw new Error(`Race with ID ${chara.race()} not found`);
  }

  return (
    <CharaDetailClient
      charaRow={charaRow}
      elements={elements}
      races={racesRows}
      race={raceRow}
      variantElement={variantElement as ElementAttacks | null}
    />
  );
}
