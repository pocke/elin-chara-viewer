'use client';

import ArchivedVersionProvider from '@/components/ArchivedVersionProvider';
import { ArchivedVersion } from '@/lib/archive';
import { featIndexRows } from '@/lib/pageData';
import FeatPageClient from './FeatPageClient';

// A child component, because props passed to children are evaluated before
// the provider renders and the version's CSVs are not registered yet then.
function Content({ version }: { version: string }) {
  return <FeatPageClient featRows={featIndexRows(version)} version={version} />;
}

export default function ArchivedFeatPage({
  entry,
}: {
  entry: ArchivedVersion;
}) {
  return (
    <ArchivedVersionProvider
      slug={entry.slug}
      hasFeatModifier={entry.featModifier}
    >
      <Content version={entry.slug} />
    </ArchivedVersionProvider>
  );
}
