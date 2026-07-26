'use client';

import { Alert, Box } from '@mui/material';
import ArchivedVersionProvider from '@/components/ArchivedVersionProvider';
import { ArchivedVersion } from '@/lib/archive';
import { ElementAttacks } from '@/lib/models/element';
import { charaDetailRow } from '@/lib/pageData';
import { useTranslation } from '@/lib/simple-i18n';
import CharaDetailClient from './CharaDetailClient';

interface ArchivedCharaDetailPageProps {
  entry: ArchivedVersion;
  baseId: string;
  variantElement: ElementAttacks | null;
}

function Content({
  version,
  baseId,
  variantElement,
}: {
  version: string;
  baseId: string;
  variantElement: ElementAttacks | null;
}) {
  const { t } = useTranslation();
  const charaRow = charaDetailRow(version, baseId);

  if (!charaRow) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">{t.common.notFound}</Alert>
      </Box>
    );
  }

  return (
    <CharaDetailClient
      charaRow={charaRow}
      variantElement={variantElement}
      version={version}
    />
  );
}

export default function ArchivedCharaDetailPage({
  entry,
  baseId,
  variantElement,
}: ArchivedCharaDetailPageProps) {
  return (
    <ArchivedVersionProvider
      slug={entry.slug}
      hasFeatModifier={entry.featModifier}
    >
      <Content
        version={entry.slug}
        baseId={baseId}
        variantElement={variantElement}
      />
    </ArchivedVersionProvider>
  );
}
