import path from "path";
import { loadCsv } from "./csvLoader";
import { z } from "zod";

export const all = async <T>(tableName: string, schema: z.ZodType<T>) => {
  const csvPath = path.join(process.cwd(), `db/EA 23.173 Patch 1/${tableName}.csv`);
  return loadCsv(csvPath, schema);
}
