'use client';
import { Container, Typography, Box } from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { useTranslation } from '@/lib/simple-i18n';
import { useMemo, Suspense } from 'react';
import { type CharaRow, Chara } from '@/lib/models/chara';
import { GameVersion } from '@/lib/db';
import DataGridCharaTable from './DataGridCharaTable';

interface CharaPageClientProps {
  charaRows: CharaRow[];
  version: GameVersion;
}

export default function CharaPageClient({
  charaRows,
  version,
}: CharaPageClientProps) {
  const charas = useMemo(
    () => charaRows.map((row) => new Chara(version, row)),
    [charaRows, version]
  );
  const { t } = useTranslation();

  // Expand characters with variants (memoized for performance)
  const allCharas = useMemo(() => {
    return charas.flatMap((chara) => {
      const variants = chara.variants();
      return variants.length > 0 ? variants : [chara];
    });
  }, [charas]);

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PersonIcon sx={{ mr: 2, fontSize: 40 }} />
          <Typography variant="h3" component="h1">
            {t.common.allCharacters}
          </Typography>
        </Box>

        <Suspense fallback={<div>{t.common.loading}...</div>}>
          <DataGridCharaTable charas={allCharas} version={version} />
        </Suspense>
      </Box>
    </Container>
  );
}
