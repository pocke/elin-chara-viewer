'use client';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { HoverPrefetchLink as Link } from '../../components/HoverPrefetchLink';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import theme from '../theme';
// The models call all() in the browser too, so the current versions have to
// be registered somewhere in the client graph; this layout wraps every page.
import '../../lib/bundledData';
import { GameVersion, isCurrentVersion } from '../../lib/db';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import VersionSwitcher from '../../components/VersionSwitcher';
import Footer from '../../components/Footer';
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  const pathParts = pathname.split('/');
  const pathVersion = pathParts.length >= 4 ? pathParts[2] : null;
  const currentVersion: GameVersion = pathVersion ?? 'EA';
  const isArchived = !isCurrentVersion(currentVersion);

  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open);
  };

  const menuItems = [
    {
      text: t.common.home,
      href: `/${language}`,
    },
    {
      text: t.common.browseCharacters,
      href: `/${language}/${currentVersion}/charas`,
    },
    {
      text: t.common.browseFeats,
      href: `/${language}/${currentVersion}/feats`,
    },
    ...(isArchived
      ? []
      : [
          {
            text: t.common.browseResistSim,
            href: `/${language}/${currentVersion}/sim/resist`,
          },
          {
            text: t.common.browseCurveSim,
            href: `/${language}/${currentVersion}/sim/curve`,
          },
        ]),
    {
      text: t.common.browseSources,
      href: `/${language}/${currentVersion}/sources`,
    },
    {
      text: t.common.pastVersions,
      href: `/${language}/versions`,
    },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <AppBar
        position="static"
        elevation={1}
        sx={{
          background: isArchived
            ? 'linear-gradient(to bottom right, #37474f 30%, #546e7a 70%, #546e7a)'
            : currentVersion === 'EA'
              ? 'linear-gradient(to bottom right, #0d47a1 30%, #1565c0 70%, #1565c0)'
              : 'linear-gradient(to bottom right, #0d47a1 30%, #061a3d 70%, #061a3d)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleDrawer(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}
          >
            <Link
              href={`/${language}`}
              style={{
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              {t.common.title}
            </Link>
          </Typography>
          <Box sx={{ flexGrow: 1, display: { xs: 'block', sm: 'none' } }} />
          <VersionSwitcher />
          <Box sx={{ ml: 1 }}>
            <LanguageSwitcher />
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={toggleDrawer(false)}
          onKeyDown={toggleDrawer(false)}
        >
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton component={Link} href={item.href}>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>
      <Footer />
    </Box>
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
