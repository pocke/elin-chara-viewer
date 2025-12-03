import { redirect } from 'next/navigation';
import { GAME_VERSIONS } from '@/lib/db';

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
  const { lang } = await params;
  redirect(`/${lang}`);
}
