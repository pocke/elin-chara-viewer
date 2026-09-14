import { Box, Container, Paper, Typography } from '@mui/material';
import { Metadata } from 'next';
import { generateAlternates } from '@/lib/metadata';
import { Language, resources, toLanguage } from '@/lib/i18n-resources';
import { Element } from '@/lib/models/element';
import { charaPageEntries, featIndexRows } from '@/lib/pageData';

interface LinkEntry {
  href: string;
  label: string;
}

function staticLinks(lang: Language): LinkEntry[] {
  const t = resources[lang];

  return [
    { href: `/${lang}`, label: t.common.home },
    { href: `/${lang}/EA/charas`, label: t.common.browseCharacters },
    { href: `/${lang}/EA/feats`, label: t.common.browseFeats },
    { href: `/${lang}/EA/sim/resist`, label: t.resistSim.title },
    { href: `/${lang}/EA/sim/curve`, label: t.curveSim.title },
    { href: `/${lang}/EA/sources`, label: t.sources.title },
    { href: `/${lang}/versions`, label: t.common.pastVersionsTitle },
  ];
}

function charaLinks(lang: Language): LinkEntry[] {
  return charaPageEntries('EA').map(({ id, chara }) => ({
    href: `/${lang}/EA/charas/${encodeURIComponent(id)}`,
    label: chara.normalizedName(lang),
  }));
}

function featLinks(lang: Language): LinkEntry[] {
  return featIndexRows('EA').map((row) => {
    const element = new Element('EA', row);

    return {
      href: `/${lang}/EA/feats/${encodeURIComponent(row.alias)}`,
      label: element.name(lang),
    };
  });
}

export const generateStaticParams = () => {
  return [{ lang: 'ja' }, { lang: 'en' }];
};

export async function generateMetadata(props: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: langParam } = await props.params;
  const lang = toLanguage(langParam);
  const pathname = `/${lang}/sitemap`;
  const appTitle = resources[lang].common.title;
  const pageMeta = resources[lang].sitemap;

  return {
    title: `${pageMeta.title} - ${appTitle}`,
    description: pageMeta.description,
    alternates: generateAlternates(lang, pathname),
  };
}

const linkListSx = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 1.5,
  listStyle: 'none',
  m: 0,
  p: 0,
} as const;

export default async function SitemapPage(props: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: langParam } = await props.params;
  const lang = toLanguage(langParam);
  const pageMeta = resources[lang].sitemap;

  const pages = staticLinks(lang);
  const charas = charaLinks(lang);
  const feats = featLinks(lang);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {pageMeta.title}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {pageMeta.description}
        </Typography>

        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            {pageMeta.pagesHeading}
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 3 }}>
            {pages.map((link) => (
              <Box component="li" key={link.href} sx={{ mb: 0.5 }}>
                <a href={link.href}>{link.label}</a>
              </Box>
            ))}
          </Box>
        </Paper>

        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            {pageMeta.charasHeading}
          </Typography>
          <Box component="ul" sx={linkListSx}>
            {charas.map((link) => (
              <Box component="li" key={link.href}>
                <a href={link.href}>{link.label}</a>
              </Box>
            ))}
          </Box>
        </Paper>

        <Paper elevation={1} sx={{ p: 3 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            {pageMeta.featsHeading}
          </Typography>
          <Box component="ul" sx={linkListSx}>
            {feats.map((link) => (
              <Box component="li" key={link.href}>
                <a href={link.href}>{link.label}</a>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
