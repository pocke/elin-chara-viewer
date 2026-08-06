import './bundledData';
import { ArchivedVersion, archivedVersionBySlug } from './archive';
import { CurrentVersion, GameVersion, isCurrentVersion } from './db';

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

export type ResolvedVersion =
  | { kind: 'current'; key: CurrentVersion; label: string }
  | {
      kind: 'archived';
      key: GameVersion;
      label: string;
      entry: ArchivedVersion;
    };

/**
 * Resolves a [version] path segment. Current versions keep their names ('EA',
 * 'Nightly'); archived versions are addressed by slug ('EA-23.306-patch-1').
 * Returns null when the segment matches neither, so pages can call notFound().
 */
export const resolveVersion = async (
  param: string
): Promise<ResolvedVersion | null> => {
  if (isCurrentVersion(param)) {
    return { kind: 'current', key: param, label: param };
  }

  const entry = await archivedVersionBySlug(param);
  if (!entry) {
    return null;
  }

  const current = currentVersionOf(entry.version);
  if (current) {
    return { kind: 'current', key: current, label: current };
  }

  return { kind: 'archived', key: entry.slug, label: entry.version, entry };
};
