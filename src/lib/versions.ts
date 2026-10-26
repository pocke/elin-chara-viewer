import './bundledData';
import { CurrentVersion } from './db';

// The archive holds the versions that are currently shipped too, and those are
// served from the bundle rather than fetched. A promoted nightly is named by
// both files, so EA is set last and wins.
const CURRENT_VERSION_NAMES = new Map<string, CurrentVersion>([
  [process.env.ELIN_NIGHTLY_VERSION ?? '', 'Nightly'],
  [process.env.ELIN_EA_VERSION ?? '', 'EA'],
]);

export const currentVersionOf = (
  version: string
): CurrentVersion | undefined =>
  version ? CURRENT_VERSION_NAMES.get(version) : undefined;

/** What the game calls a version the build ships, such as 'EA 23.330'. */
export const currentVersionName = (version: CurrentVersion): string =>
  version === 'EA'
    ? (process.env.ELIN_EA_VERSION ?? version)
    : (process.env.ELIN_NIGHTLY_VERSION ?? version);
