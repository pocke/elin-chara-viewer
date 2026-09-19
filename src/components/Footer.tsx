'use client';
import { Box, Typography, Link as MuiLink } from '@mui/material';
import { useTranslation } from '../lib/simple-i18n';
import { HoverPrefetchLink as Link } from './HoverPrefetchLink';
import RelativeDate from './RelativeDate';

const REPOSITORY_URL = 'https://github.com/pocke/elin-chara-viewer';

const footerLinkSx = {
  color: 'text.secondary',
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
  },
} as const;

const Footer = () => {
  const { t, language } = useTranslation();

  const lastCommitDate = process.env.GIT_LAST_COMMIT_DATE;

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        py: 2,
        px: 2,
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[100]
            : theme.palette.grey[900],
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'center', sm: 'center' },
          gap: { xs: 1, sm: 0 },
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {lastCommitDate && (
            <>
              {t.footer.lastUpdated}: <RelativeDate date={lastCommitDate} />
            </>
          )}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <MuiLink
            href={REPOSITORY_URL}
            target="_blank"
            rel="noopener noreferrer"
            sx={footerLinkSx}
          >
            <Typography variant="body2">{t.footer.github}</Typography>
          </MuiLink>
          <MuiLink
            component={Link}
            href={`/${language}/sitemap`}
            sx={footerLinkSx}
          >
            <Typography variant="body2">{t.sitemap.title}</Typography>
          </MuiLink>
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;
