'use client';
import { Container, Typography, Box } from '@mui/material';
import { EmojiEvents as EmojiEventsIcon } from '@mui/icons-material';
import { useTranslation } from '@/lib/simple-i18n';
import { Suspense, useMemo, useState } from 'react';
import { type FeatRow, Feat } from '@/lib/models/feat';
import { GameVersion } from '@/lib/db';
import DataGridFeatTable from './DataGridFeatTable';
import FeatSearchBar from './FeatSearchBar';

interface FeatPageClientProps {
  featRows: FeatRow[];
  version: GameVersion;
}

export default function FeatPageClient({
  featRows,
  version,
}: FeatPageClientProps) {
  const { t, language } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const feats = useMemo(
    () => featRows.map((row) => new Feat(version, row)),
    [featRows, version]
  );

  const filteredFeats = useMemo(() => {
    if (!searchQuery) return feats;

    const lowerQuery = searchQuery.toLowerCase();
    return feats.filter((feat) => {
      const featName = feat.name(language).toLowerCase();
      return featName.includes(lowerQuery);
    });
  }, [feats, searchQuery, language]);

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <EmojiEventsIcon sx={{ mr: 2, fontSize: 40 }} />
          <Typography variant="h3" component="h1">
            {t.common.feats}
          </Typography>
        </Box>

        <FeatSearchBar
          initialSearchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <Suspense fallback={<div>{t.common.loading}...</div>}>
          <DataGridFeatTable feats={filteredFeats} version={version} />
        </Suspense>
      </Box>
    </Container>
  );
}
