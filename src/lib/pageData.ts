import './bundledData';
import { all, GameVersion } from './db';
import { Chara, CharaRow, CharaSchema } from './models/chara';
import { ElementRow, elementByAlias } from './models/element';
import { allFeats } from './models/feat';
import { JobRow, jobsByFeat } from './models/job';
import { RaceRow, racesByFeat } from './models/race';

export const charaIndexRows = (version: GameVersion): CharaRow[] =>
  all(version, 'charas', CharaSchema).filter(
    (row) => !Chara.isIgnoredCharaId(row.id)
  );

export const charaDetailRow = (
  version: GameVersion,
  baseId: string
): CharaRow | undefined =>
  all(version, 'charas', CharaSchema).find((chara) => chara.id === baseId);

export const featIndexRows = (version: GameVersion): ElementRow[] =>
  allFeats(version).map((feat) => feat.row);

export interface FeatDetailRows {
  elementRow: ElementRow;
  raceRows: RaceRow[];
  jobRows: JobRow[];
  charaRows: CharaRow[];
}

export const featDetailRows = (
  version: GameVersion,
  alias: string
): FeatDetailRows | undefined => {
  const element = elementByAlias(version, alias);
  if (!element) {
    return undefined;
  }

  const charaRows = all(version, 'charas', CharaSchema)
    .filter((row) => !Chara.isIgnoredCharaId(row.id))
    .map((row) => new Chara(version, row))
    .filter((chara) => chara.feats().some((f) => f.element.alias === alias))
    .map((chara) => chara.row);

  return {
    elementRow: element.row,
    raceRows: racesByFeat(version, alias).map((race) => race.row),
    jobRows: jobsByFeat(version, alias).map((job) => job.row),
    charaRows,
  };
};
