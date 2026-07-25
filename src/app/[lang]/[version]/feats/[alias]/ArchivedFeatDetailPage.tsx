'use client';

import { Alert, Box } from '@mui/material';
import ArchivedVersionProvider from '@/components/ArchivedVersionProvider';
import { ArchivedVersion } from '@/lib/archive';
import { featDetailRows } from '@/lib/pageData';
import { useTranslation } from '@/lib/simple-i18n';
import FeatDetailClient from './FeatDetailClient';

interface ArchivedFeatDetailPageProps {
  entry: ArchivedVersion;
  alias: string;
}

function Content({ version, alias }: { version: string; alias: string }) {
  const { t } = useTranslation();
  const rows = featDetailRows(version, alias);

  if (!rows) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">{t.common.notFound}</Alert>
      </Box>
    );
  }

  return (
    <FeatDetailClient
      elementRow={rows.elementRow}
      raceRows={rows.raceRows}
      jobRows={rows.jobRows}
      charaRows={rows.charaRows}
      version={version}
    />
  );
}

export default function ArchivedFeatDetailPage({
  entry,
  alias,
}: ArchivedFeatDetailPageProps) {
  return (
    <ArchivedVersionProvider
      slug={entry.slug}
      version={entry.version}
      hasFeatModifier={entry.featModifier}
    >
      <Content version={entry.slug} alias={alias} />
    </ArchivedVersionProvider>
  );
}
