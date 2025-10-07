'use client';
import { Container, Typography, Box } from '@mui/material';
import { EmojiEvents as EmojiEventsIcon } from '@mui/icons-material';
import { useTranslation } from '@/lib/simple-i18n';
import { Suspense, useMemo } from 'react';
import { type FeatRow, Feat } from '@/lib/models/feat';
import DataGridFeatTable from './DataGridFeatTable';

interface FeatPageClientProps {
  featRows: FeatRow[];
}

export default function FeatPageClient({ featRows }: FeatPageClientProps) {
  const { t } = useTranslation();
  const feats = useMemo(() => featRows.map((row) => new Feat(row)), [featRows]);

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <EmojiEventsIcon sx={{ mr: 2, fontSize: 40 }} />
          <Typography variant="h3" component="h1">
            {t.common.feats}
          </Typography>
        </Box>

        <Suspense fallback={<div>{t.common.loading}...</div>}>
          <DataGridFeatTable feats={feats} />
        </Suspense>
      </Box>
    </Container>
  );
}
