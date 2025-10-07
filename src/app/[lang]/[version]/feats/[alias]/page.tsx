import { all } from '@/lib/db';
import { ElementSchema, elementByAlias, Element } from '@/lib/models/element';
import { CharaSchema, Chara } from '@/lib/models/chara';
import { RaceSchema, Race } from '@/lib/models/race';
import { JobSchema, Job } from '@/lib/models/job';
import FeatDetailClient from './FeatDetailClient';

export const generateStaticParams = () => {
  const elementRows = all('elements', ElementSchema);
  const featRows = elementRows.filter((row) => {
    const elm = new Element(row);
    if (!elm.isFeat()) return false;
    return !elm.tags().includes('hidden');
  });

  const aliases = featRows.map((row) => row.alias);

  // Generate combinations of lang, version, and alias
  const params = [];
  for (const lang of ['ja', 'en']) {
    for (const version of ['EA']) {
      for (const alias of aliases) {
        params.push({ lang, version, alias });
      }
    }
  }

  return params;
};

export default async function FeatPage(props: {
  params: Promise<{ alias: string }>;
}) {
  const params = await props.params;
  const decodedAlias = decodeURIComponent(params.alias);

  const element = elementByAlias(decodedAlias);

  if (!element) {
    throw new Error(`Feat with alias ${decodedAlias} not found`);
  }

  // Find races with this feat
  const raceRows = all('races', RaceSchema);
  const racesWithFeat = raceRows
    .map((row) => new Race(row))
    .filter((race) => {
      const feats = race.feats();
      return feats.some((f) => f.element.alias === decodedAlias);
    });

  // Find jobs with this feat
  const jobRows = all('jobs', JobSchema);
  const jobsWithFeat = jobRows
    .map((row) => new Job(row, 1))
    .filter((job) => {
      const feats = job.feats();
      return feats.some((f) => f.element.alias === decodedAlias);
    });

  // Find characters with this feat
  const charaRows = all('charas', CharaSchema);
  const charactersWithFeat = charaRows
    .filter((row) => !Chara.isIgnoredCharaId(row.id))
    .map((row) => new Chara(row))
    .filter((chara) => {
      const feats = chara.feats();
      return feats.some((f) => f.element.alias === decodedAlias);
    });

  return (
    <FeatDetailClient
      elementRow={element.row}
      racesWithFeat={racesWithFeat.map((r) => ({
        id: r.id,
        name_JP: r.name('ja'),
        name: r.name('en'),
      }))}
      jobsWithFeat={jobsWithFeat.map((j) => ({
        id: j.id,
        name_JP: j.name('ja'),
        name: j.name('en'),
      }))}
      charactersWithFeat={charactersWithFeat.map((c) => ({
        id: c.id,
        name_JP: c.normalizedName('ja'),
        name: c.normalizedName('en'),
      }))}
    />
  );
}
