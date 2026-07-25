'use client';

import ArchivedVersionProvider from '@/components/ArchivedVersionProvider';
import { ArchivedVersion } from '@/lib/archive';
import { charaIndexRows } from '@/lib/pageData';
import CharaPageClient from './CharaPageClient';

// A child component, because props passed to children are evaluated before
// the provider renders and the version's CSVs are not registered yet then.
function Content({ version }: { version: string }) {
  return (
    <CharaPageClient charaRows={charaIndexRows(version)} version={version} />
  );
}

export default function ArchivedCharaPage({
  entry,
}: {
  entry: ArchivedVersion;
}) {
  return (
    <ArchivedVersionProvider
      slug={entry.slug}
      version={entry.version}
      hasFeatModifier={entry.featModifier}
    >
      <Content version={entry.slug} />
    </ArchivedVersionProvider>
  );
}
