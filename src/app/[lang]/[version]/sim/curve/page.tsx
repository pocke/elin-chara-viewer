import { GAME_VERSIONS } from '@/lib/db';
import CurveSimClient from './CurveSimClient';
import { Metadata } from 'next';
import { generateAlternates } from '@/lib/metadata';

export async function generateMetadata(props: {
  params: Promise<{ lang: string; version: string }>;
}): Promise<Metadata> {
  const { lang, version } = await props.params;
  const pathname = `/${lang}/${version}/sim/curve`;
  const canonicalPathname =
    version !== 'EA' ? `/${lang}/EA/sim/curve` : pathname;

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

interface CurveSimPageProps {
  params: Promise<{
    lang: string;
    version: string;
  }>;
}

export default async function CurveSimPage({ params }: CurveSimPageProps) {
  const { lang, version } = await params;

  return <CurveSimClient lang={lang} version={version} />;
}
