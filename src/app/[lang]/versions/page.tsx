import { Metadata } from 'next';
import { archiveIndex } from '@/lib/archive';
import { generateAlternates } from '@/lib/metadata';
import { currentVersionOf } from '@/lib/versions';
import VersionsPageClient, { VersionListEntry } from './VersionsPageClient';

// The archive is resolved at request time only, so that a build never
// depends on the archive host being reachable.
export const dynamic = 'force-dynamic';

export async function generateMetadata(props: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await props.params;
  const pathname = `/${lang}/versions`;

  return {
    alternates: generateAlternates(lang, pathname, pathname),
  };
}

export default async function VersionsPage() {
  const index = await archiveIndex();

  const archived = index.filter((entry) => !currentVersionOf(entry.version));

  const entries: VersionListEntry[] = archived
    .map((entry, i) => ({
      version: entry.version,
      slug: entry.slug,
      channel: entry.channel,
      date: entry.releaseDate,
      sameAsPrevious:
        i > 0 && archived[i - 1].contentHash === entry.contentHash,
    }))
    .reverse();

  return <VersionsPageClient entries={entries} />;
}
