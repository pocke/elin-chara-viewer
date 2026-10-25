import { CurrentVersion, GAME_VERSIONS } from '@/lib/db';
import SourcesPageClient from './SourcesPageClient';
import { Metadata } from 'next';
import { generateAlternates } from '@/lib/metadata';
import { resources, toLanguage } from '@/lib/i18n-resources';
import fs from 'fs';
import path from 'path';

const VERSION_TO_FOLDER: Record<CurrentVersion, string> = {
  EA: process.env.ELIN_EA_VERSION!,
  Nightly: process.env.ELIN_NIGHTLY_VERSION!,
};

export async function generateMetadata(props: {
  params: Promise<{ lang: string; version: string }>;
}): Promise<Metadata> {
  const { lang: langParam, version } = await props.params;
  const lang = toLanguage(langParam);
  const pathname = `/${lang}/${version}/sources`;
  const canonicalPathname = version !== 'EA' ? `/${lang}/EA/sources` : pathname;
  const appTitle = resources[lang].common.title;
  const pageMeta = resources[lang].sources;

  return {
    title: `${pageMeta.title} - ${appTitle}`,
    description: pageMeta.description,
    alternates: generateAlternates(lang, canonicalPathname),
  };
}

export function generateStaticParams() {
  const params = [];
  for (const lang of ['ja', 'en']) {
    for (const version of GAME_VERSIONS) {
      params.push({ lang, version });
    }
  }
  return params;
}

interface PageProps {
  params: Promise<{ lang: string; version: CurrentVersion }>;
}

export default async function SourcesPage({ params }: PageProps) {
  const { version } = await params;

  const folder = VERSION_TO_FOLDER[version];
  const dbPath = path.join(process.cwd(), 'db', folder);
  const files = fs.readdirSync(dbPath);
  const tableNames = files
    .filter((file) => file.endsWith('.csv'))
    .map((file) => file.replace('.csv', ''));

  return (
    <SourcesPageClient
      versionLabel={version}
      tableNames={tableNames}
      csvBasePath={`/csv/${folder}`}
    />
  );
}
