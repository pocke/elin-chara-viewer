'use client';
import { Box, Typography, Link as MuiLink } from '@mui/material';
import { useTranslation } from '../lib/simple-i18n';

const Footer = () => {
  const { t } = useTranslation();

  const lastCommitDate = process.env.GIT_LAST_COMMIT_DATE;
  const repositoryUrl = process.env.GIT_REPOSITORY_URL;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
              {t.footer.lastUpdated}: {formatDate(lastCommitDate)}
            </>
          )}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {repositoryUrl && (
            <MuiLink
              href={repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: 'text.secondary',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              <Typography variant="body2">{t.footer.github}</Typography>
            </MuiLink>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;
