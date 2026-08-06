import { notFound, redirect } from 'next/navigation';
import { GAME_VERSIONS } from '@/lib/db';
import { resolveVersion } from '@/lib/versions';

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

export default async function VersionHome({ params }: PageProps) {
  const { lang, version } = await params;
  const resolved = await resolveVersion(version);

  if (!resolved) {
    notFound();
  }

  if (resolved.kind === 'archived') {
    redirect(`/${lang}/${resolved.entry.slug}/charas`);
  }

  redirect(`/${lang}`);
}
