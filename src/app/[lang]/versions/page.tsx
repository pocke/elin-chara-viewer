import { Metadata } from 'next';
import { archiveAddedCharas, archiveIndex } from '@/lib/archive';
import { AddedChara } from '@/lib/history/types';
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
    robots: { index: false, follow: false },
    alternates: generateAlternates(lang, pathname, pathname),
  };
}

export default async function VersionsPage() {
  const [index, added] = await Promise.all([
    archiveIndex(),
    // A version list that cannot say what a version added is still a version
    // list, so this is not worth failing the page over.
    archiveAddedCharas().catch((error): Record<string, AddedChara[]> => {
      console.error(error);
      return {};
    }),
  ]);

  const entries: VersionListEntry[] = index
    .filter((entry) => !currentVersionOf(entry.version))
    .map((entry) => ({
      version: entry.version,
      slug: entry.slug,
      channel: entry.channel,
      date: entry.releaseDate,
      added: added[entry.slug] ?? [],
    }));

  return <VersionsPageClient entries={entries} />;
}
