import path from "node:path";
import { loadCsv } from "@/lib/csvLoader";
import { allCharas, findCharaById } from "@/lib/chara";


export const generateStaticParams = async () => {
  return (await allCharas()).map(chara => ({ id: chara.id }));
}

export default async function CharaPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const chara = await findCharaById(params.id);
  return <div>
    <h1>{chara.name_JP}</h1>

    Chara ID: {chara.id}
    <br />
    Chara Name: {chara.name}
  </div>;
}
