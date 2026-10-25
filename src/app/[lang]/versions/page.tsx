import { Metadata } from 'next';
import { generateAlternates } from '@/lib/metadata';
import VersionsPageClient from './VersionsPageClient';

export async function generateMetadata(props: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await props.params;
  const pathname = `/${lang}/versions`;

  return {
    robots: { index: false, follow: false },
    alternates: generateAlternates(lang, pathname),
  };
}

export default function VersionsPage() {
  return <VersionsPageClient />;
}
