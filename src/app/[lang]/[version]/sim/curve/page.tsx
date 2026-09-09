import { GAME_VERSIONS, isCurrentVersion } from '@/lib/db';
import CurveSimClient from './CurveSimClient';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { generateAlternates } from '@/lib/metadata';
import { resources, Language } from '@/lib/i18n-resources';

export async function generateMetadata(props: {
  params: Promise<{ lang: string; version: string }>;
}): Promise<Metadata> {
  const { lang: langParam, version } = await props.params;
  const lang = (
    langParam === 'ja' || langParam === 'en' ? langParam : 'en'
  ) as Language;
  const pathname = `/${lang}/${version}/sim/curve`;
  const canonicalPathname =
    version !== 'EA' ? `/${lang}/EA/sim/curve` : pathname;
  const appTitle = resources[lang].common.title;
  const pageMeta = resources[lang].curveSim;

  return {
    title: `${pageMeta.title} - ${appTitle}`,
    description: pageMeta.description,
    alternates: generateAlternates(lang, canonicalPathname),
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

  // curveUtils hardcodes the current game's formulas.
  if (!isCurrentVersion(version)) {
    notFound();
  }

  return <CurveSimClient lang={lang} version={version} />;
}
