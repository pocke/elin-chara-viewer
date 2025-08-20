import { allCharas, normalizedCharaName } from "@/lib/chara";

export default async function CharaPage(props: { params: {} }) {
  const charas = await allCharas();
  return <div>
    <h1>All Charas</h1>

    <ul>
      {charas.map(chara => (
        <li key={chara.id}>
          <a href={`/charas/${chara.id}`}>{normalizedCharaName(chara)}</a>
        </li>
      ))}
    </ul>
  </div>;
}
