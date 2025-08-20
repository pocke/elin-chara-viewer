'use client';
import { Container, Typography, Box, Paper, Chip, Button, Divider } from '@mui/material';
import { Person as PersonIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Chara, type CharaRow } from '@/lib/chara';

interface CharaDetailClientProps {
  charaRow: CharaRow;
}

export default function CharaDetailClient({ charaRow }: CharaDetailClientProps) {
  const chara = new Chara(charaRow);
  const { t, i18n } = useTranslation('common');

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Button
          component={Link}
          href="/charas"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 3 }}
          variant="outlined"
        >
          {t('backToCharacters')}
        </Button>

        <Paper elevation={2} sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <PersonIcon sx={{ mr: 2, fontSize: 40 }} />
            <Box>
              <Typography variant="h3" component="h1" gutterBottom>
                {chara.normalizedName(i18n.language)}
              </Typography>
              <Chip 
                label={`${t('id')}: ${chara.id}`}
                variant="outlined"
                color="primary"
              />
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t('characterId')}
              </Typography>
              <Typography variant="body1">
                {chara.id}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}