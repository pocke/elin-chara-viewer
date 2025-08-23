'use client';
import { Container, Typography, Box, Button, Paper } from '@mui/material';
import { Home as HomeIcon, Menu as MenuIcon } from '@mui/icons-material';
import { useTranslation } from '../../lib/simple-i18n';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const { t } = useTranslation();
  const params = useParams();
  const lang = params.lang as string;

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom align="center">
          {t.common.title}
        </Typography>

        <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <HomeIcon sx={{ mr: 1 }} />
            <Typography variant="h6">{t.common.gettingStarted}</Typography>
          </Box>
          <Typography paragraph>{t.common.appDescription}</Typography>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Link href={`/${lang}/EA/charas`} passHref>
              <Button variant="contained" startIcon={<MenuIcon />}>
                {t.common.browseCharacters}
              </Button>
            </Link>
            <Button variant="outlined">{t.common.viewDocumentation}</Button>
          </Box>
        </Paper>

        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <HomeIcon sx={{ mr: 1 }} />
            <Typography variant="h6">{t.common.importantInfo}</Typography>
          </Box>
          <Typography paragraph>{t.common.versionInfo}</Typography>
          <Typography paragraph>{t.common.internalDataNotice}</Typography>
          <Typography paragraph>
            {t.common.bugReportPrefix}
            <Link
              href="https://github.com/pocke/elin-chara-viewer"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'inherit', textDecoration: 'underline' }}
            >
              {t.common.bugReportGitHub}
            </Link>
            {t.common.bugReportSuffix}
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}
