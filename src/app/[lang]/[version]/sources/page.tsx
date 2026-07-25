import { CurrentVersion, GAME_VERSIONS } from '@/lib/db';
import ArchivedVersionNotice from '@/components/ArchivedVersionNotice';
import { ARCHIVE_BASE_URL } from '@/lib/archive';
import { resolveVersion } from '@/lib/versions';
import SourcesPageClient from './SourcesPageClient';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { archivedPageMetadata, generateAlternates } from '@/lib/metadata';
import fs from 'fs';
import path from 'path';

const VERSION_TO_FOLDER: Record<CurrentVersion, string> = {
  EA: process.env.ELIN_EA_VERSION!,
  Nightly: process.env.ELIN_NIGHTLY_VERSION!,
};

export async function generateMetadata(props: {
  params: Promise<{ lang: string; version: string }>;
}): Promise<Metadata> {
  const { lang, version } = await props.params;
  const pathname = `/${lang}/${version}/sources`;
  const resolved = await resolveVersion(version);

  if (resolved?.kind === 'archived') {
    return archivedPageMetadata(lang, pathname, resolved.label);
  }

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
  const resolved = await resolveVersion(version);

  if (!resolved) {
    notFound();
  }

  if (resolved.kind === 'archived') {
    return (
      <>
        <ArchivedVersionNotice version={resolved.label} />
        <SourcesPageClient
          versionLabel={resolved.label}
          tableNames={resolved.entry.tables}
          csvBasePath={`${ARCHIVE_BASE_URL}/csv/${resolved.entry.slug}`}
        />
      </>
    );
  }

  const folder = VERSION_TO_FOLDER[resolved.key];
  const dbPath = path.join(process.cwd(), 'db', folder);
  const files = fs.readdirSync(dbPath);
  const tableNames = files
    .filter((file) => file.endsWith('.csv'))
    .map((file) => file.replace('.csv', ''));

  return (
    <SourcesPageClient
      versionLabel={resolved.label}
      tableNames={tableNames}
      csvBasePath={`/csv/${folder}`}
    />
  );
}
