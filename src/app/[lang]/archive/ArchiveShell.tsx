'use client';

import { Alert, Box, CircularProgress } from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArchivedVersion,
  archivedVersionBySlug,
  archiveVersionUrl,
} from '@/lib/archive';
import { ElementAttacks } from '@/lib/models/element';
import { useTranslation } from '@/lib/simple-i18n';
import { currentVersionOf } from '@/lib/versions';
import ArchivedCharaPage from '../[version]/charas/ArchivedCharaPage';
import ArchivedCharaDetailPage from '../[version]/charas/[id]/ArchivedCharaDetailPage';
import ArchivedFeatPage from '../[version]/feats/ArchivedFeatPage';
import ArchivedFeatDetailPage from '../[version]/feats/[alias]/ArchivedFeatDetailPage';
import SourcesPageClient from '../[version]/sources/SourcesPageClient';

export type ArchiveScreen =
  | 'charas'
  | 'charaDetail'
  | 'feats'
  | 'featDetail'
  | 'sources';

type Resolution =
  | { slug: string; status: 'found'; entry: ArchivedVersion }
  | { slug: string; status: 'missing' }
  | { slug: string; status: 'failed' };

function Message({
  severity,
  children,
}: {
  severity: 'warning' | 'error';
  children: string;
}) {
  return (
    <Box sx={{ p: 3 }}>
      <Alert severity={severity}>{children}</Alert>
    </Box>
  );
}

export default function ArchiveShell({ screen }: { screen: ArchiveScreen }) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [resolution, setResolution] = useState<Resolution | null>(null);

  // The shell is served for /<lang>/<slug>/<screen>[/<id>] through a
  // rewrite, so the real URL is read from the pathname.
  const [, lang, slug, , rawId] = pathname.split('/');

  useEffect(() => {
    let cancelled = false;

    archivedVersionBySlug(slug)
      .then((entry) => {
        if (cancelled) return;
        if (!entry) {
          setResolution({ slug, status: 'missing' });
          return;
        }

        const current = currentVersionOf(entry.version);
        if (current) {
          const rest = pathname.split('/').slice(3).join('/');
          router.replace(`/${lang}/${current}/${rest}`);
          return;
        }

        setResolution({ slug, status: 'found', entry });
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setResolution({ slug, status: 'failed' });
      });

    return () => {
      cancelled = true;
    };
  }, [slug, lang, pathname, router]);

  if (!resolution || resolution.slug !== slug) {
    return (
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
    );
  }

  if (resolution.status === 'failed') {
    return <Message severity="error">{t.common.versionListLoadFailed}</Message>;
  }

  if (resolution.status === 'missing') {
    return <Message severity="warning">{t.common.notFound}</Message>;
  }

  const { entry } = resolution;
  const id = rawId === undefined ? '' : decodeURIComponent(rawId);

  switch (screen) {
    case 'charas':
      return <ArchivedCharaPage entry={entry} />;
    case 'charaDetail': {
      const [baseId, variantElement] = id.split('---');
      return (
        <ArchivedCharaDetailPage
          entry={entry}
          baseId={baseId}
          variantElement={variantElement as ElementAttacks | null}
        />
      );
    }
    case 'feats':
      return <ArchivedFeatPage entry={entry} />;
    case 'featDetail':
      return <ArchivedFeatDetailPage entry={entry} alias={id} />;
    case 'sources':
      return (
        <SourcesPageClient
          versionLabel={entry.version}
          tableNames={entry.tables}
          csvBasePath={`${archiveVersionUrl(entry.slug)}/csv`}
        />
      );
  }
}
