'use client';
import { Container, Typography, Box, Button, Paper } from '@mui/material';
import {
  Home as HomeIcon,
  Menu as MenuIcon,
  Apps as AppsIcon,
} from '@mui/icons-material';
import { useTranslation } from '../../lib/simple-i18n';
import { HoverPrefetchLink as Link } from '../../components/HoverPrefetchLink';

export default function HomeClient() {
  const { t, language } = useTranslation();

  const features = [
    {
      heading: t.common.browseCharacters,
      description: t.pageMeta.charas.description,
      href: `/${language}/EA/charas`,
    },
    {
      heading: t.common.browseFeats,
      description: t.pageMeta.feats.description,
      href: `/${language}/EA/feats`,
    },
    {
      heading: t.resistSim.title,
      description: t.resistSim.description,
      href: `/${language}/EA/sim/resist`,
    },
    {
      heading: t.curveSim.title,
      description: t.curveSim.description,
      href: `/${language}/EA/sim/curve`,
    },
    {
      heading: t.sources.title,
      description: t.sources.description,
      href: `/${language}/EA/sources`,
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom align="center">
          {t.common.title}
        </Typography>

        <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <HomeIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component="h2">
              {t.common.gettingStarted}
            </Typography>
          </Box>
          <Typography paragraph>{t.common.appDescription}</Typography>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Link href={`/${language}/EA/charas`} passHref>
              <Button variant="contained" startIcon={<MenuIcon />}>
                {t.common.browseCharacters}
              </Button>
            </Link>
            <Link href={`/${language}/EA/feats`} passHref>
              <Button variant="contained" startIcon={<MenuIcon />}>
                {t.common.browseFeats}
              </Button>
            </Link>
          </Box>
        </Paper>

        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AppsIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component="h2">
              {t.common.features}
            </Typography>
          </Box>
          <Box
            component="ul"
            role="list"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              listStyle: 'none',
              p: 0,
              m: 0,
            }}
          >
            {features.map((feature) => (
              <Box component="li" key={feature.href}>
                <Link
                  href={feature.href}
                  style={{ color: 'inherit', textDecoration: 'underline' }}
                >
                  <Typography
                    variant="subtitle1"
                    component="h3"
                    sx={{ fontWeight: 'bold' }}
                  >
                    {feature.heading}
                  </Typography>
                </Link>
                <Typography component="p" sx={{ mt: 0.5 }}>
                  {feature.description}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <HomeIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component="h2">
              {t.common.importantInfo}
            </Typography>
          </Box>
          <Typography paragraph>
            {t.common.versionInfo
              .replace('{{eaVersion}}', process.env.ELIN_EA_VERSION!)
              .replace('{{nightlyVersion}}', process.env.ELIN_NIGHTLY_VERSION!)}
          </Typography>
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
