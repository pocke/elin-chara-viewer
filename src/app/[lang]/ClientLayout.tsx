'use client';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import theme from '../theme';
import '../../lib/i18n';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

interface ClientLayoutProps {
  children: React.ReactNode;
  lang: string;
}

export default function ClientLayout({ children, lang }: ClientLayoutProps) {
  const { t, i18n } = useTranslation('common');

  useEffect(() => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);

  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppBar position="static" elevation={1}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {t('title')}
            </Typography>
            <LanguageSwitcher />
          </Toolbar>
        </AppBar>
        <Box component="main">{children}</Box>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
