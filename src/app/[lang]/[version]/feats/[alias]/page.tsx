import { all } from '@/lib/db';
import { ElementSchema, elementByAlias, Element } from '@/lib/models/element';
import { CharaSchema, Chara } from '@/lib/models/chara';
import { racesByFeat } from '@/lib/models/race';
import { jobsByFeat } from '@/lib/models/job';
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
  const racesWithFeat = racesByFeat(decodedAlias);

  // Find jobs with this feat
  const jobsWithFeat = jobsByFeat(decodedAlias);

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
      raceRows={racesWithFeat.map((r) => r.row)}
      jobRows={jobsWithFeat.map((j) => j.row)}
      charaRows={charactersWithFeat.map((c) => c.row)}
    />
  );
}
