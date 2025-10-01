import { all } from '@/lib/db';
import { Chara, CharaSchema } from '@/lib/models/chara';
import { ElementAttacks } from '@/lib/models/element';
import CharaDetailClient from './CharaDetailClient';
import { RaceSchema } from '@/lib/models/race';

export const generateStaticParams = () => {
  const charaRows = all('charas', CharaSchema);
  const baseCharas = charaRows.filter((row) => !Chara.isIgnoredCharaId(row.id)).map((row) => new Chara(row));

  // Generate IDs for base characters and their variants
  const ids = baseCharas.flatMap((chara) => {
    const variants = chara.variants();
    return variants.length > 0 ? variants.map((v) => v.id) : [chara.id];
  });

  // Generate combinations of lang, version, and id
  const params = [];
  for (const lang of ['ja', 'en']) {
    for (const version of ['EA']) {
      for (const id of ids) {
        params.push({ lang, version, id });
      }
    }
  }

  return params;
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

  const chara = new Chara(charaRow, variantElement as ElementAttacks | null);

  const raceRow = racesRows.find((r) => r.id === chara.raceId());
  if (!raceRow) {
    throw new Error(`Race with ID ${chara.raceId()} not found`);
  }

  return (
    <CharaDetailClient
      charaRow={charaRow}
      race={raceRow}
      variantElement={variantElement as ElementAttacks | null}
    />
  );
}
