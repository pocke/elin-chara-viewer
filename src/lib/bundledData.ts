import { FeatModifierJson, registerVersionData } from './db';

import eaCharasContent from '../../db/EA 23.338 Patch 2/charas.csv';
import eaElementsContent from '../../db/EA 23.338 Patch 2/elements.csv';
import eaRacesContent from '../../db/EA 23.338 Patch 2/races.csv';
import eaJobsContent from '../../db/EA 23.338 Patch 2/jobs.csv';
import eaTacticsContent from '../../db/EA 23.338 Patch 2/tactics.csv';

import nightlyCharasContent from '../../db/EA 23.342 Patch 1/charas.csv';
import nightlyElementsContent from '../../db/EA 23.342 Patch 1/elements.csv';
import nightlyRacesContent from '../../db/EA 23.342 Patch 1/races.csv';
import nightlyJobsContent from '../../db/EA 23.342 Patch 1/jobs.csv';
import nightlyTacticsContent from '../../db/EA 23.342 Patch 1/tactics.csv';

import featModifierEaJson from '../generated/featModifier.ea.json';
import featModifierNightlyJson from '../generated/featModifier.nightly.json';

registerVersionData(
  'EA',
  {
    charas: eaCharasContent,
    elements: eaElementsContent,
    races: eaRacesContent,
    jobs: eaJobsContent,
    tactics: eaTacticsContent,
  },
  featModifierEaJson as FeatModifierJson
);

registerVersionData(
  'Nightly',
  {
    charas: nightlyCharasContent,
    elements: nightlyElementsContent,
    races: nightlyRacesContent,
    jobs: nightlyJobsContent,
    tactics: nightlyTacticsContent,
  },
  featModifierNightlyJson as FeatModifierJson
);
