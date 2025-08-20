import { all } from '@/lib/db';
import { CharaSchema } from '@/lib/chara';
import { ElementSchema, Element } from '@/lib/element';
import CharaDetailClient from './CharaDetailClient';

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

  const elements = await all('elements', ElementSchema);

  return <CharaDetailClient charaRow={charaRow} elements={elements} />;
}
