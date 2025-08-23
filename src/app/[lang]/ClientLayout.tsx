'use client';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import Link from 'next/link';
import theme from '../theme';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import {
  LanguageProvider,
  useTranslation,
  Language,
} from '../../lib/simple-i18n';

interface ClientLayoutProps {
  children: React.ReactNode;
  lang: string;
}

function ClientLayoutInner({ children }: { children: React.ReactNode }) {
  const { t, language } = useTranslation();

  return (
    <>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <Link
              href={`/${language}`}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                display: 'block',
                width: '100%',
              }}
            >
              {t.common.title}
            </Link>
          </Typography>
          <LanguageSwitcher />
        </Toolbar>
      </AppBar>
      <Box component="main">{children}</Box>
    </>
  );
}

export default function ClientLayout({ children, lang }: ClientLayoutProps) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LanguageProvider initialLanguage={lang as Language}>
          <ClientLayoutInner>{children}</ClientLayoutInner>
        </LanguageProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
