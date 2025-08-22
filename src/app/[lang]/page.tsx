'use client';
import { Container, Typography, Box, Button, Paper } from '@mui/material';
import { Home as HomeIcon, Menu as MenuIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const { t } = useTranslation('common');
  const params = useParams();
  const lang = params.lang as string;

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom align="center">
          {t('title')}
        </Typography>
        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          align="center"
          color="text.secondary"
        >
          {t('welcome')}
        </Typography>

        <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <HomeIcon sx={{ mr: 1 }} />
            <Typography variant="h6">{t('gettingStarted')}</Typography>
          </Box>
          <Typography paragraph>{t('appDescription')}</Typography>
          <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Link href={`/${lang}/charas`} passHref>
              <Button variant="contained" startIcon={<MenuIcon />}>
                {t('browseCharacters')}
              </Button>
            </Link>
            <Button variant="outlined">{t('viewDocumentation')}</Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
