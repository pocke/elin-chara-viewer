import { GAME_VERSIONS, GameVersion } from '@/lib/db';
import SourcesPageClient from './SourcesPageClient';
import { Metadata } from 'next';
import { generateAlternates } from '@/lib/metadata';
import fs from 'fs';
import path from 'path';

const VERSION_TO_FOLDER: Record<GameVersion, string> = {
  EA: process.env.ELIN_EA_VERSION!,
  Nightly: process.env.ELIN_NIGHTLY_VERSION!,
};

export async function generateMetadata(props: {
  params: Promise<{ lang: string; version: string }>;
}): Promise<Metadata> {
  const { lang, version } = await props.params;
  const pathname = `/${lang}/${version}/sources`;
  const canonicalPathname = version !== 'EA' ? `/${lang}/EA/sources` : pathname;

  return {
    alternates: generateAlternates(lang, pathname, canonicalPathname),
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
  params: Promise<{ lang: string; version: string }>;
}

export default async function SourcesPage({ params }: PageProps) {
  const { version } = await params;
  const gameVersion = version as GameVersion;

  const folder = VERSION_TO_FOLDER[gameVersion];
  const dbPath = path.join(process.cwd(), 'db', folder);
  const files = fs.readdirSync(dbPath);
  const tableNames = files
    .filter((file) => file.endsWith('.csv'))
    .map((file) => file.replace('.csv', ''));

  return (
    <SourcesPageClient
      version={gameVersion}
      tableNames={tableNames}
      csvBasePath={`/csv/${folder}`}
    />
  );
}
