'use client';
import { Container, Typography, Box } from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { type CharaRow } from '@/lib/chara';
import CharaTable from './CharaTable';

interface CharaPageClientProps {
  charas: CharaRow[];
}

export default function CharaPageClient({ charas }: CharaPageClientProps) {
  const { t } = useTranslation('common');

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PersonIcon sx={{ mr: 2, fontSize: 40 }} />
          <Typography variant="h3" component="h1">
            {t('allCharacters')}
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('charactersCount', { count: charas.length })}
        </Typography>

        <CharaTable charas={charas} />
      </Box>
    </Container>
  );
}
