import path from "path";
import { loadCsv } from "./csvLoader";
import { CharaSchema } from "./chara";

export const allCharas = async () => {
  return loadCsv(path.join(process.cwd(), "db/EA 23.173 Patch 1/charas.csv"), CharaSchema);
}
