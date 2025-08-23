'use client';
import { Container, Typography, Box, Button, Paper } from '@mui/material';
import { Home as HomeIcon, Menu as MenuIcon } from '@mui/icons-material';
import { useTranslation } from '../../../lib/simple-i18n';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function VersionHome() {
  const { t } = useTranslation();
  const params = useParams();
  const lang = params.lang as string;
  const version = params.version as string;

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom align="center">
          {t.common.title} - {version}
        </Typography>
        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          align="center"
          color="text.secondary"
        >
          {t.common.welcome}
        </Typography>

        <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <HomeIcon sx={{ mr: 1 }} />
            <Typography variant="h6">{t.common.gettingStarted}</Typography>
          </Box>
          <Typography paragraph>{t.common.appDescription}</Typography>
          <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Link href={`/${lang}/${version}/charas`} passHref>
              <Button variant="contained" startIcon={<MenuIcon />}>
                {t.common.browseCharacters}
              </Button>
            </Link>
            <Button variant="outlined">{t.common.viewDocumentation}</Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
