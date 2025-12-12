'use client';
import { Container, Typography, Box } from '@mui/material';
import { EmojiEvents as EmojiEventsIcon } from '@mui/icons-material';
import { useTranslation } from '@/lib/simple-i18n';
import { Suspense, useMemo, useState } from 'react';
import { type FeatRow, Feat } from '@/lib/models/feat';
import { GameVersion } from '@/lib/db';
import DataGridFeatTable from './DataGridFeatTable';
import FeatSearchBar from './FeatSearchBar';
import { normalizeForSearch } from '@/lib/searchUtils';

interface FeatPageClientProps {
  featRows: FeatRow[];
  version: GameVersion;
}

export default function FeatPageClient({
  featRows,
  version,
}: FeatPageClientProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const feats = useMemo(
    () => featRows.map((row) => new Feat(version, row)),
    [featRows, version]
  );

  const filteredFeats = useMemo(() => {
    if (!searchQuery) return feats;

    const normalizedQuery = normalizeForSearch(searchQuery);
    return feats.filter((feat) => {
      // Search both Japanese and English names
      const nameJa = normalizeForSearch(feat.name('ja'));
      const nameEn = normalizeForSearch(feat.name('en'));
      return (
        nameJa.includes(normalizedQuery) || nameEn.includes(normalizedQuery)
      );
    });
  }, [feats, searchQuery]);

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
