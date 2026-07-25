import './bundledData';
import { ArchivedVersion, archivedVersionBySlug } from './archive';
import { CurrentVersion, GameVersion, isCurrentVersion } from './db';

// The archive is rebuilt from the whole history, so it also holds the versions
// that are currently shipped. Those are served from the bundle instead, or the
// same data would be delivered twice under two URLs, the archived one carrying
// a banner saying it differs from the current data.
// A promoted nightly is named by both files; EA is set last so that it wins.
const CURRENT_VERSION_NAMES = new Map<string, CurrentVersion>([
  [process.env.ELIN_NIGHTLY_VERSION ?? '', 'Nightly'],
  [process.env.ELIN_EA_VERSION ?? '', 'EA'],
]);

export const currentVersionOf = (
  version: string
): CurrentVersion | undefined =>
  version ? CURRENT_VERSION_NAMES.get(version) : undefined;

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
 * 'Nightly'); archived versions are addressed by slug ('23.306-patch-1').
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
