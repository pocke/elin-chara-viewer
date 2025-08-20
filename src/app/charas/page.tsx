import { allCharas } from "@/lib/charaDb";
import CharaPageClient from './CharaPageClient';

export default async function CharaPage() {
  const charas = await allCharas();
  return <CharaPageClient charas={charas} />;
}
