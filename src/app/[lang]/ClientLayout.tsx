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
import Link from 'next/link';
import { useState } from 'react';
import theme from '../theme';
import LanguageSwitcher from '../../components/LanguageSwitcher';
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

  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open);
  };

  const menuItems = [
    {
      text: t.common.browseCharacters,
      href: `/${language}/EA/charas`,
    },
    {
      text: t.common.browseFeats,
      href: `/${language}/EA/feats`,
    },
    {
      text: t.common.browseResistSim,
      href: `/${language}/EA/sim/resist`,
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
      <AppBar position="static" elevation={1}>
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
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
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
          <LanguageSwitcher />
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
