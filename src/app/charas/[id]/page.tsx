import { all } from '@/lib/db';
import { CharaSchema } from '@/lib/chara';
import { ElementSchema } from '@/lib/element';
import CharaDetailClient from './CharaDetailClient';

export const generateStaticParams = async () => {
  return (await all('charas', CharaSchema)).map((charaRow) => ({
    id: encodeURIComponent(charaRow.id),
  }));
};

export default async function CharaPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;

  // NOTE: piranha's id is "fish_ piranha" including a space.
  // So we need to decode the ID before looking it up.
  const decodedId = decodeURIComponent(params.id);
  const charaRows = await all('charas', CharaSchema);
  const charaRow = charaRows.find((chara) => chara.id === decodedId);

  if (!charaRow) {
    throw new Error(`Chara with ID ${decodedId} not found`);
  }

  const elements = await all('elements', ElementSchema);

  return <CharaDetailClient charaRow={charaRow} elements={elements} />;
}
