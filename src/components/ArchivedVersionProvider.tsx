'use client';

import { Alert, Box, CircularProgress } from '@mui/material';
import { ReactNode, useEffect, useState } from 'react';
import ArchivedVersionNotice from '@/components/ArchivedVersionNotice';
import { loadArchivedVersion } from '@/lib/archive';
import { isVersionDataRegistered } from '@/lib/db';
import { useTranslation } from '@/lib/simple-i18n';

interface ArchivedVersionProviderProps {
  slug: string;
  version: string;
  hasFeatModifier: boolean;
  children: ReactNode;
}

/**
 * Archived versions are not bundled, so their CSVs are fetched in the browser
 * and registered before the page renders. The data is immutable, so a version
 * loaded once stays available for the rest of the session.
 */
export default function ArchivedVersionProvider({
  slug,
  version,
  hasFeatModifier,
  children,
}: ArchivedVersionProviderProps) {
  const { t } = useTranslation();
  // The slug is kept in the state so that switching versions shows the loader
  // again without resetting state from inside the effect.
  const [loadedSlug, setLoadedSlug] = useState<string | null>(() =>
    isVersionDataRegistered(slug) ? slug : null
  );
  const [failedSlug, setFailedSlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadArchivedVersion(slug, hasFeatModifier)
      .then(() => {
        if (!cancelled) setLoadedSlug(slug);
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setFailedSlug(slug);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, hasFeatModifier]);

  const ready = loadedSlug === slug;
  const failed = failedSlug === slug;

  return (
    <>
      <ArchivedVersionNotice version={version} />
      {failed && (
        <Box sx={{ p: 3 }}>
          <Alert severity="error">{t.common.archivedVersionLoadFailed}</Alert>
        </Box>
      )}
      {!failed && !ready && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '50vh',
          }}
        >
          <CircularProgress />
        </Box>
      )}
      {!failed && ready && children}
    </>
  );
}
