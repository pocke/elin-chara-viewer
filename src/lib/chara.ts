import { z } from "zod";
import path from "path";
import { loadCsv } from "./csvLoader";

export const allCharas = async () => {
  return loadCsv(path.join(process.cwd(), "db/EA 23.173 Patch 1/charas.csv"), CharaSchema);
}

export const findCharaById = async (id: string) => {
  const charas = await allCharas();
  const chara = charas.find((chara) => chara.id === id);
  if (!chara) throw new Error(`Chara with ID ${id} not found`);

  return chara;
}

export const CharaSchema = z.object({
  id: z.string(),
  _id: z.coerce.number(),
  name_JP: z.string().optional(),
  name: z.string().optional(),
  aka_JP: z.string().optional(),
  aka: z.string().optional(),
  idActor: z.string().optional(),
  sort: z.coerce.number().optional(),
  size: z.string().optional(),
  _idRenderData: z.string().optional(),
  tiles: z.string().optional(),
  tiles_snow: z.string().optional(),
  colorMod: z.string().optional(),
  components: z.string().optional(),
  defMat: z.string().optional(),
  LV: z.coerce.number().optional(),
  chance: z.coerce.number().optional(),
  quality: z.coerce.number().optional(),
  hostility: z.string().optional(),
  biome: z.string().optional(),
  tag: z.string().optional(),
  trait: z.string().optional(),
  race: z.string().optional(),
  job: z.string().optional(),
  tactics: z.string().optional(),
  aiIdle: z.string().optional(),
  aiParam: z.string().optional(),
  actCombat: z.string().optional(),
  mainElement: z.string().optional(),
  elements: z.string().optional(),
  equip: z.string().optional(),
  loot: z.string().optional(),
  category: z.string().optional(),
  filter: z.string().optional(),
  gachaFilter: z.string().optional(),
  tone: z.string().optional(),
  actIdle: z.string().optional(),
  lightData: z.string().optional(),
  idExtra: z.string().optional(),
  bio: z.string().optional(),
  faith: z.string().optional(),
  works: z.string().optional(),
  hobbies: z.string().optional(),
  idText: z.string().optional(),
  moveAnime: z.string().optional(),
  factory: z.string().optional(),
  detail_JP: z.string().optional(),
  detail: z.string().optional(),
});

export type Chara = z.infer<typeof CharaSchema>;
