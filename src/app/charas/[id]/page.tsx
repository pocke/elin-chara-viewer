import { allCharas } from "@/lib/db";
import CharaDetailClient from './CharaDetailClient';

export const generateStaticParams = async () => {
  return (await allCharas()).map(charaRow => ({ id: charaRow.id }));
}

export default async function CharaPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const charaRows = await allCharas();
  const charaRow = charaRows.find((chara) => chara.id === params.id);
  
  if (!charaRow) {
    throw new Error(`Chara with ID ${params.id} not found`);
  }
  
  return <CharaDetailClient charaRow={charaRow} />;
}
